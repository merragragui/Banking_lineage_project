#!/usr/bin/env python3
"""
Moteur d'analyse d'impact basé sur le lineage Apache Atlas.

Usage :
    python impact_analysis.py comptes
    python impact_analysis.py comptes --direction BOTH
    python impact_analysis.py comptes --host http://localhost:21000 --user admin --password admin

Principe :
1. On cherche l'entité Atlas de type 'rdbms_table' correspondant au nom de table donné.
2. On appelle l'API de lineage Atlas (/api/atlas/v2/lineage/{guid}) pour récupérer
   tout le graphe en aval (direction OUTPUT = "qu'est-ce qui dépend de cette table ?").
3. On parcourt ce graphe (BFS) pour produire un rapport lisible : quelles tables et
   quels traitements (process) seraient impactés, et à quelle distance (niveau).
"""

import argparse
import sys
from collections import deque

import requests
from requests.auth import HTTPBasicAuth

DEFAULT_HOST = "http://localhost:21000"
DEFAULT_USER = "admin"
DEFAULT_PASSWORD = "admin"
TYPE_NAME = "rdbms_table"


def get_entity_by_name(host, auth, table_name):
    """Recherche une entité rdbms_table par son attribut 'name' (recherche exacte)."""
    url = f"{host}/api/atlas/v2/search/attribute"
    params = {
        "typeName": TYPE_NAME,
        "attrName": "name",
        "attrValuePrefix": table_name,
    }
    resp = requests.get(url, params=params, auth=auth, timeout=15)
    resp.raise_for_status()
    data = resp.json()

    entities = data.get("entities", [])
    # on garde uniquement les correspondances exactes sur le nom
    matches = [e for e in entities if e.get("attributes", {}).get("name") == table_name]

    if not matches:
        return None
    if len(matches) > 1:
        print(f"Attention : {len(matches)} entités trouvées pour '{table_name}', "
              f"utilisation de la première (guid={matches[0]['guid']}).", file=sys.stderr)
    return matches[0]


def get_lineage(host, auth, guid, direction="OUTPUT", depth=0):
    """Appelle l'API de lineage Atlas pour un GUID donné."""
    url = f"{host}/api/atlas/v2/lineage/{guid}"
    params = {"direction": direction, "depth": depth}
    resp = requests.get(url, params=params, auth=auth, timeout=15)
    resp.raise_for_status()
    return resp.json()


def build_impact_report(lineage_data, base_guid):
    """
    Parcourt le graphe de lineage (BFS) à partir de base_guid pour calculer
    le niveau (distance) de chaque entité impactée.
    Retourne une liste de dicts triés par niveau : {name, type, level}
    """
    guid_entity_map = lineage_data.get("guidEntityMap", {})
    relations = lineage_data.get("relations", [])

    # graphe d'adjacence : from_guid -> [to_guid, ...]
    adjacency = {}
    for rel in relations:
        src = rel.get("fromEntityId")
        dst = rel.get("toEntityId")
        adjacency.setdefault(src, []).append(dst)

    visited = {base_guid: 0}
    queue = deque([base_guid])
    order = []

    while queue:
        current = queue.popleft()
        level = visited[current]
        if current != base_guid:
            order.append((current, level))
        for neighbor in adjacency.get(current, []):
            if neighbor not in visited:
                visited[neighbor] = level + 1
                queue.append(neighbor)

    report = []
    for guid, level in order:
        entity = guid_entity_map.get(guid, {})
        type_name = entity.get("typeName", "?")
        name = entity.get("attributes", {}).get("name") or entity.get("displayText", guid)
        kind = "Traitement" if "process" in type_name.lower() else "Table"
        report.append({"name": name, "type": type_name, "kind": kind, "level": level})

    report.sort(key=lambda r: (r["level"], r["kind"], r["name"]))
    return report


def print_report(table_name, direction, report):
    print(f"\n=== Analyse d'impact — table de départ : '{table_name}' (direction={direction}) ===\n")

    if not report:
        print("Aucune entité en aval/amont trouvée : cette table n'a pas (ou plus) de lineage sortant.")
        return

    current_level = None
    for item in report:
        if item["level"] != current_level:
            current_level = item["level"]
            print(f"\n--- Niveau {current_level} ---")
        print(f"  [{item['kind']:10}] {item['name']}  (type Atlas: {item['type']})")

    tables_impactees = [r for r in report if r["kind"] == "Table"]
    print(f"\nRésumé : {len(tables_impactees)} table(s) potentiellement impactée(s) "
          f"si '{table_name}' est modifiée.\n")


def main():
    parser = argparse.ArgumentParser(description="Analyse d'impact via le lineage Apache Atlas")
    parser.add_argument("table", help="Nom de la table de départ (ex: comptes)")
    parser.add_argument("--direction", default="OUTPUT", choices=["OUTPUT", "INPUT", "BOTH"],
                         help="OUTPUT = impact en aval (par défaut), INPUT = origine en amont, BOTH = les deux")
    parser.add_argument("--host", default=DEFAULT_HOST, help="URL du serveur Atlas")
    parser.add_argument("--user", default=DEFAULT_USER, help="Utilisateur Atlas")
    parser.add_argument("--password", default=DEFAULT_PASSWORD, help="Mot de passe Atlas")
    parser.add_argument("--depth", type=int, default=0, help="Profondeur du lineage (0 = illimité)")
    args = parser.parse_args()

    auth = HTTPBasicAuth(args.user, args.password)

    try:
        entity = get_entity_by_name(args.host, auth, args.table)
    except requests.exceptions.ConnectionError:
        print(f"Erreur : impossible de joindre Atlas sur {args.host}. "
              f"Vérifie que le conteneur apache-atlas tourne bien.", file=sys.stderr)
        sys.exit(1)
    except requests.exceptions.HTTPError as e:
        print(f"Erreur HTTP lors de la recherche de l'entité : {e}", file=sys.stderr)
        sys.exit(1)

    if entity is None:
        print(f"Erreur : aucune table '{args.table}' de type '{TYPE_NAME}' trouvée dans Atlas.", file=sys.stderr)
        sys.exit(1)

    guid = entity["guid"]

    try:
        lineage_data = get_lineage(args.host, auth, guid, direction=args.direction, depth=args.depth)
    except requests.exceptions.HTTPError as e:
        print(f"Erreur HTTP lors de la récupération du lineage : {e}", file=sys.stderr)
        sys.exit(1)

    report = build_impact_report(lineage_data, guid)
    print_report(args.table, args.direction, report)


if __name__ == "__main__":
    main()
