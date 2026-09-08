#!/usr/bin/env python3
"""
add_governance_metadata.py
============================

Declare dans Apache Atlas des metadonnees de gouvernance qui n'existent
nulle part dans la base Postgres source, et doivent donc etre saisies
explicitement (une seule fois) par un responsable gouvernance :

  1. Le PROPRIETAIRE (owner) de chaque table.
  2. La classification PII (donnee personnelle) sur les colonnes
     sensibles.

Les valeurs ci-dessous (OWNERS, PII_COLUMNS) sont des exemples
plausibles pour le pilote bancaire. Adaptez-les a la realite de votre
organisation avant la soutenance.

Prerequis :
    pip install requests

Usage :
    python add_governance_metadata.py
"""

import requests

ATLAS_URL = "http://localhost:21000/api/atlas/v2"
ATLAS_AUTH = ("admin", "admin")
HEADERS = {"Content-Type": "application/json"}

# --- A adapter a votre contexte reel -------------------------------------

OWNERS = {
    "clients": "Direction de la Relation Client",
    "agences": "Direction du Reseau",
    "comptes": "Direction des Operations Bancaires",
    "transactions": "Direction des Operations Bancaires",
    "transactions_suspectes": "Direction Conformite et Lutte Anti-Fraude",
    "reporting_mensuel": "Direction Controle de Gestion",
}

# Colonnes contenant des donnees personnelles (PII)
PII_COLUMNS = ["nom", "prenom", "email", "date_naissance"]


def search_entities(type_name):
    payload = {"typeName": type_name, "excludeDeletedEntities": True, "limit": 100}
    resp = requests.post(f"{ATLAS_URL}/search/basic", auth=ATLAS_AUTH, headers=HEADERS, json=payload, timeout=30)
    resp.raise_for_status()
    return resp.json().get("entities", [])


def create_pii_classification_type():
    """Cree le type de classification 'PII' dans Atlas s'il n'existe pas deja."""
    payload = {
        "classificationDefs": [
            {
                "name": "PII",
                "description": "Donnee a caractere personnel (Personally Identifiable Information)",
                "superTypes": [],
                "attributeDefs": [],
            }
        ]
    }
    resp = requests.post(f"{ATLAS_URL}/types/typedefs", auth=ATLAS_AUTH, headers=HEADERS, json=payload, timeout=30)
    if resp.status_code == 200:
        print("Classification 'PII' creee.")
    else:
        # Deja existante -> pas bloquant
        print(f"Classification 'PII' : {resp.status_code} (probablement deja existante)")


def set_owner(table_name, owner):
    entities = search_entities("rdbms_table")
    match = next((e for e in entities if e["attributes"]["name"] == table_name), None)
    if not match:
        print(f"  [ERREUR] Table '{table_name}' introuvable.")
        return

    payload = {
        "entity": {
            "typeName": "rdbms_table",
            "guid": match["guid"],
            "attributes": {
                "qualifiedName": match["attributes"]["qualifiedName"],
                "name": table_name,
                "owner": owner,
            },
        }
    }
    resp = requests.post(f"{ATLAS_URL}/entity", auth=ATLAS_AUTH, headers=HEADERS, json=payload, timeout=30)
    status = "OK" if resp.status_code in (200, 201) else f"ERREUR {resp.status_code}"
    print(f"  [{status}] Proprietaire de '{table_name}' -> {owner}")


def tag_pii_column(column_name):
    payload = {
        "typeName": "rdbms_column",
        "excludeDeletedEntities": True,
        "entityFilters": {
            "condition": "AND",
            "criterion": [{"attributeName": "name", "operator": "eq", "attributeValue": column_name}],
        },
        "limit": 20,
    }
    resp = requests.post(f"{ATLAS_URL}/search/basic", auth=ATLAS_AUTH, headers=HEADERS, json=payload, timeout=30)
    resp.raise_for_status()
    columns = resp.json().get("entities", [])

    for col in columns:
        guid = col["guid"]
        classify_payload = {"classification": {"typeName": "PII"}, "entityGuids": [guid]}
        resp2 = requests.post(
            f"{ATLAS_URL}/entity/bulk/classification",
            auth=ATLAS_AUTH,
            headers=HEADERS,
            json=classify_payload,
            timeout=30,
        )
        status = "OK" if resp2.status_code in (200, 201, 204) else f"ERREUR {resp2.status_code} : {resp2.text}"
        print(f"  [{status}] Colonne '{column_name}' taguee PII")


def main():
    print("=" * 60)
    print("1/3 - Creation du type de classification PII")
    print("=" * 60)
    create_pii_classification_type()

    print()
    print("=" * 60)
    print("2/3 - Declaration des proprietaires de tables")
    print("=" * 60)
    for table, owner in OWNERS.items():
        set_owner(table, owner)

    print()
    print("=" * 60)
    print("3/3 - Classification PII des colonnes sensibles")
    print("=" * 60)
    for col in PII_COLUMNS:
        tag_pii_column(col)

    print("\nTermine.")


if __name__ == "__main__":
    main()
