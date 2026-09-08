#!/usr/bin/env python3
"""
Ajoute une description métier à chaque table rdbms_table dans Atlas,
via l'API PUT partial-update d'entité.

Usage :
    python add_descriptions.py
    python add_descriptions.py --host http://localhost:21000 --user admin --password admin
"""

import argparse
import sys

import requests
from requests.auth import HTTPBasicAuth

DEFAULT_HOST = "http://localhost:21000"
DEFAULT_USER = "admin"
DEFAULT_PASSWORD = "admin"
TYPE_NAME = "rdbms_table"

# Descriptions métier associées à chaque table du cas d'usage pilote
DESCRIPTIONS = {
    "clients": "Référentiel des clients de la banque : identité, coordonnées et date de création du profil.",
    "agences": "Référentiel des agences bancaires physiques, avec leur ville de rattachement.",
    "comptes": "Comptes bancaires détenus par les clients, rattachés à une agence, avec leur solde courant.",
    "transactions": "Historique brut des transactions bancaires (virements, retraits, dépôts, paiements) entre comptes.",
    "transactions_suspectes": "Résultat du moteur de détection de risque : transactions identifiées comme suspectes, avec score de risque et motif.",
    "reporting_mensuel": "Agrégat mensuel des transactions par agence, utilisé pour le pilotage et le reporting.",
}


def get_entity_by_name(host, auth, table_name):
    url = f"{host}/api/atlas/v2/search/attribute"
    params = {"typeName": TYPE_NAME, "attrName": "name", "attrValuePrefix": table_name}
    resp = requests.get(url, params=params, auth=auth, timeout=15)
    resp.raise_for_status()
    entities = resp.json().get("entities", [])
    matches = [e for e in entities if e.get("attributes", {}).get("name") == table_name]
    return matches[0] if matches else None


def update_description(host, auth, guid, description):
    """
    Met à jour uniquement l'attribut 'description' via l'API Atlas dédiée
    à la mise à jour d'un attribut unique (évite d'avoir à renvoyer
    l'entité complète, qui provoque souvent des erreurs 400).
    """
    import json as _json
    url = f"{host}/api/atlas/v2/entity/guid/{guid}"
    params = {"name": "description"}
    headers = {"Content-Type": "application/json"}
    # Le corps attendu est la valeur JSON brute (une simple chaîne encodée en JSON)
    resp = requests.put(url, params=params, data=_json.dumps(description),
                         headers=headers, auth=auth, timeout=15)
    if not resp.ok:
        print(f"    (détail erreur : {resp.text[:300]})", file=sys.stderr)
    resp.raise_for_status()


def main():
    parser = argparse.ArgumentParser(description="Ajoute les descriptions manquantes sur les tables Atlas")
    parser.add_argument("--host", default=DEFAULT_HOST)
    parser.add_argument("--user", default=DEFAULT_USER)
    parser.add_argument("--password", default=DEFAULT_PASSWORD)
    args = parser.parse_args()

    auth = HTTPBasicAuth(args.user, args.password)

    print("Mise à jour des descriptions...\n")
    for table_name, description in DESCRIPTIONS.items():
        entity = get_entity_by_name(args.host, auth, table_name)
        if entity is None:
            print(f"  [IGNORÉ] '{table_name}' introuvable dans Atlas.")
            continue

        try:
            update_description(args.host, auth, entity["guid"], description)
            print(f"  [OK] {table_name} -> description ajoutée.")
        except requests.exceptions.HTTPError as e:
            print(f"  [ERREUR] {table_name} : {e}", file=sys.stderr)

    print("\nTerminé. Relance coverage_indicators.py pour vérifier le nouveau score.")


if __name__ == "__main__":
    main()
