#!/usr/bin/env python3
"""
Indicateurs de couverture et de complétude du lineage Apache Atlas.

Usage :
    python coverage_indicators.py
    python coverage_indicators.py --host http://localhost:21000 --user admin --password admin

Ce script mesure :
1. COUVERTURE : sur les tables attendues (le périmètre réel du projet),
   combien sont effectivement enregistrées dans Atlas ?
2. COMPLÉTUDE LINEAGE : parmi les tables enregistrées, combien ont
   au moins un lien de lineage (entrant ou sortant) ? Une table "isolée"
   (sans lineage) est considérée comme incomplète.
3. COMPLÉTUDE DESCRIPTION : parmi les tables enregistrées, combien
   ont une description renseignée dans Atlas ?
"""

import argparse
import sys

import requests
from requests.auth import HTTPBasicAuth

DEFAULT_HOST = "http://localhost:21000"
DEFAULT_USER = "admin"
DEFAULT_PASSWORD = "admin"
TYPE_NAME = "rdbms_table"

# Périmètre réel du cas d'usage pilote (les 6 tables créées dans banking_lineage)
TABLES_ATTENDUES = [
    "clients",
    "agences",
    "comptes",
    "transactions",
    "transactions_suspectes",
    "reporting_mensuel",
]


def get_all_rdbms_tables(host, auth):
    """Récupère toutes les entités de type rdbms_table présentes dans Atlas."""
    url = f"{host}/api/atlas/v2/search/basic"
    body = {
        "typeName": TYPE_NAME,
        "excludeDeletedEntities": True,
        "limit": 1000,
    }
    resp = requests.post(url, json=body, auth=auth, timeout=15)
    resp.raise_for_status()
    data = resp.json()
    return data.get("entities", [])


def get_entity_details(host, auth, guid):
    """Récupère le détail complet d'une entité (attributs, description...)."""
    url = f"{host}/api/atlas/v2/entity/guid/{guid}"
    resp = requests.get(url, auth=auth, timeout=15)
    resp.raise_for_status()
    return resp.json().get("entity", {})


def has_lineage(host, auth, guid):
    """Vérifie si l'entité a au moins un lien de lineage (amont ou aval)."""
    url = f"{host}/api/atlas/v2/lineage/{guid}"
    resp = requests.get(url, params={"direction": "BOTH", "depth": 1}, auth=auth, timeout=15)
    resp.raise_for_status()
    data = resp.json()
    relations = data.get("relations", [])
    return len(relations) > 0


def has_description(entity_detail):
    """Vérifie si l'attribut 'description' est renseigné (non vide)."""
    attrs = entity_detail.get("attributes", {})
    description = attrs.get("description")
    return bool(description and description.strip())


def compute_indicators(host, auth):
    print("Récupération des tables enregistrées dans Atlas...")
    atlas_tables = get_all_rdbms_tables(host, auth)
    atlas_table_names = {e.get("attributes", {}).get("name") for e in atlas_tables}

    # --- 1. COUVERTURE ---
    presentes = [t for t in TABLES_ATTENDUES if t in atlas_table_names]
    manquantes = [t for t in TABLES_ATTENDUES if t not in atlas_table_names]
    taux_couverture = len(presentes) / len(TABLES_ATTENDUES) * 100

    # --- 2 & 3. COMPLÉTUDE (lineage + description) ---
    print("Analyse de la complétude (lineage + description) pour chaque table...")
    tables_avec_lineage = []
    tables_sans_lineage = []
    tables_avec_description = []
    tables_sans_description = []

    for entity in atlas_tables:
        name = entity.get("attributes", {}).get("name")
        if name not in TABLES_ATTENDUES:
            continue  # on ignore les entités hors périmètre du cas d'usage
        guid = entity["guid"]

        try:
            if has_lineage(host, auth, guid):
                tables_avec_lineage.append(name)
            else:
                tables_sans_lineage.append(name)
        except requests.exceptions.HTTPError:
            tables_sans_lineage.append(name)

        try:
            detail = get_entity_details(host, auth, guid)
            if has_description(detail):
                tables_avec_description.append(name)
            else:
                tables_sans_description.append(name)
        except requests.exceptions.HTTPError:
            tables_sans_description.append(name)

    n_presentes = len(presentes)
    taux_lineage = (len(tables_avec_lineage) / n_presentes * 100) if n_presentes else 0
    taux_description = (len(tables_avec_description) / n_presentes * 100) if n_presentes else 0

    return {
        "taux_couverture": taux_couverture,
        "presentes": presentes,
        "manquantes": manquantes,
        "taux_lineage": taux_lineage,
        "tables_avec_lineage": tables_avec_lineage,
        "tables_sans_lineage": tables_sans_lineage,
        "taux_description": taux_description,
        "tables_avec_description": tables_avec_description,
        "tables_sans_description": tables_sans_description,
    }


def print_report(indicators):
    print("\n" + "=" * 60)
    print("RAPPORT DE COUVERTURE ET DE COMPLÉTUDE — banking_lineage")
    print("=" * 60)

    print(f"\n1. COUVERTURE DU CATALOGUE : {indicators['taux_couverture']:.0f}% "
          f"({len(indicators['presentes'])}/{len(TABLES_ATTENDUES)} tables)")
    if indicators["manquantes"]:
        print(f"   Tables manquantes dans Atlas : {', '.join(indicators['manquantes'])}")
    else:
        print("   Toutes les tables attendues sont enregistrées dans Atlas.")

    print(f"\n2. COMPLÉTUDE DU LINEAGE : {indicators['taux_lineage']:.0f}% "
          f"({len(indicators['tables_avec_lineage'])}/{len(indicators['presentes'])} tables avec lineage)")
    if indicators["tables_sans_lineage"]:
        print(f"   Tables sans aucun lien de lineage (orphelines) : "
              f"{', '.join(indicators['tables_sans_lineage'])}")
    else:
        print("   Toutes les tables présentes ont au moins un lien de lineage.")

    print(f"\n3. COMPLÉTUDE DES DESCRIPTIONS : {indicators['taux_description']:.0f}% "
          f"({len(indicators['tables_avec_description'])}/{len(indicators['presentes'])} tables documentées)")
    if indicators["tables_sans_description"]:
        print(f"   Tables sans description : {', '.join(indicators['tables_sans_description'])}")
    else:
        print("   Toutes les tables présentes ont une description renseignée.")

    print("\n" + "=" * 60)
    score_global = (indicators["taux_couverture"] + indicators["taux_lineage"]
                     + indicators["taux_description"]) / 3
    print(f"SCORE GLOBAL DE QUALITÉ DU CATALOGUE : {score_global:.0f}%")
    print("=" * 60 + "\n")


def main():
    parser = argparse.ArgumentParser(description="Indicateurs de couverture et complétude Atlas")
    parser.add_argument("--host", default=DEFAULT_HOST, help="URL du serveur Atlas")
    parser.add_argument("--user", default=DEFAULT_USER, help="Utilisateur Atlas")
    parser.add_argument("--password", default=DEFAULT_PASSWORD, help="Mot de passe Atlas")
    args = parser.parse_args()

    auth = HTTPBasicAuth(args.user, args.password)

    try:
        indicators = compute_indicators(args.host, auth)
    except requests.exceptions.ConnectionError:
        print(f"Erreur : impossible de joindre Atlas sur {args.host}.", file=sys.stderr)
        sys.exit(1)
    except requests.exceptions.HTTPError as e:
        print(f"Erreur HTTP : {e}", file=sys.stderr)
        sys.exit(1)

    print_report(indicators)


if __name__ == "__main__":
    main()
