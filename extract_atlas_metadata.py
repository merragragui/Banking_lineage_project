#!/usr/bin/env python3
"""
extract_atlas_metadata.py
==========================

Etape 2 : extraction des metadonnees Apache Atlas vers des documents
textuels structures, prets a etre vectorises (etape 3 - embeddings).

Pour chaque table, on construit un texte du type :
  "La table clients (base banking_lineage) contient les colonnes :
   client_id, nom, prenom, date_naissance, email, date_creation.
   Elle est alimentee par : (rien). Elle alimente : comptes."

Pour chaque traitement (Process), on construit un texte du type :
  "Le traitement detection_transactions_suspectes prend en entree la
   table transactions et produit la table transactions_suspectes."

Resultat : un fichier atlas_documents.json contenant une liste de
documents { "id", "type", "text" }, en entree de l'etape suivante.

Prerequis :
    pip install requests

Usage :
    python extract_atlas_metadata.py
"""

import requests
import json

ATLAS_URL = "http://localhost:21000/api/atlas/v2"
ATLAS_AUTH = ("admin", "admin")
HEADERS = {"Content-Type": "application/json"}

OUTPUT_FILE = "atlas_documents.json"


def search_entities(type_name, limit=1000):
    """Recherche toutes les entites d'un type donne (non supprimees)."""
    payload = {
        "typeName": type_name,
        "excludeDeletedEntities": True,
        "limit": limit,
    }
    resp = requests.post(
        f"{ATLAS_URL}/search/basic",
        auth=ATLAS_AUTH,
        headers=HEADERS,
        json=payload,
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json().get("entities", [])


def get_full_entity(guid):
    """Recupere une entite complete (avec ses relationshipAttributes)."""
    resp = requests.get(
        f"{ATLAS_URL}/entity/guid/{guid}",
        auth=ATLAS_AUTH,
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json().get("entity", {})


def build_table_documents():
    """Un document texte par table, listant ses colonnes et son lineage."""
    documents = []
    tables = search_entities("rdbms_table")
    print(f"{len(tables)} table(s) trouvee(s) dans Atlas.")

    for t in tables:
        entity = get_full_entity(t["guid"])
        attrs = entity.get("attributes", {})
        rel_attrs = entity.get("relationshipAttributes", {})

        table_name = attrs.get("name", "inconnue")

        # Colonnes rattachees a la table
        columns = rel_attrs.get("columns", []) or []
        column_names = [c.get("displayText", c.get("qualifiedName", "?")) for c in columns]

        # Traitements en entree / sortie (lineage direct)
        inputs = rel_attrs.get("inputToProcesses", []) or []
        outputs = rel_attrs.get("outputFromProcesses", []) or []
        input_names = [p.get("displayText", "?") for p in inputs]
        output_names = [p.get("displayText", "?") for p in outputs]

        text = f"La table '{table_name}' fait partie de la base banking_lineage. "
        if column_names:
            text += f"Elle contient les colonnes suivantes : {', '.join(column_names)}. "
        else:
            text += "Aucune colonne n'est renseignee pour cette table. "

        if output_names:
            text += f"Elle est produite par le(s) traitement(s) : {', '.join(output_names)}. "
        if input_names:
            text += f"Elle alimente le(s) traitement(s) : {', '.join(input_names)}. "

        documents.append({
            "id": t["guid"],
            "type": "table",
            "name": table_name,
            "text": text,
        })
        print(f"  - Table '{table_name}' : {len(column_names)} colonne(s)")

    return documents


def build_process_documents():
    """Un document texte par traitement (Process), decrivant le lineage."""
    documents = []
    processes = search_entities("Process")
    print(f"{len(processes)} traitement(s) trouve(s) dans Atlas.")

    for p in processes:
        entity = get_full_entity(p["guid"])
        attrs = entity.get("attributes", {})
        rel_attrs = entity.get("relationshipAttributes", {})

        process_name = attrs.get("name", "inconnu")
        description = attrs.get("description", "")

        inputs = attrs.get("inputs", []) or rel_attrs.get("inputs", []) or []
        outputs = attrs.get("outputs", []) or rel_attrs.get("outputs", []) or []
        input_names = [i.get("displayText", i.get("qualifiedName", "?")) for i in inputs]
        output_names = [o.get("displayText", o.get("qualifiedName", "?")) for o in outputs]

        text = f"Le traitement '{process_name}' "
        if description:
            text += f"({description}) "
        if input_names:
            text += f"prend en entree la ou les table(s) : {', '.join(input_names)}. "
        if output_names:
            text += f"Il produit la ou les table(s) : {', '.join(output_names)}. "

        documents.append({
            "id": p["guid"],
            "type": "process",
            "name": process_name,
            "text": text,
        })
        print(f"  - Traitement '{process_name}'")

    return documents


def main():
    print("=" * 60)
    print("Extraction des metadonnees Apache Atlas")
    print("=" * 60)

    all_documents = []
    all_documents += build_table_documents()
    print()
    all_documents += build_process_documents()

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(all_documents, f, ensure_ascii=False, indent=2)

    print()
    print(f"{len(all_documents)} document(s) au total.")
    print(f"Fichier genere : {OUTPUT_FILE}")
    print("\nExtrait des documents generes :")
    for doc in all_documents[:3]:
        print(f"  [{doc['type']}] {doc['name']} -> {doc['text'][:80]}...")


if __name__ == "__main__":
    main()
