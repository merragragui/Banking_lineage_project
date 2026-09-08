#!/usr/bin/env python3
"""
load_qdrant.py
================

Etape 4 : alimentation de Qdrant avec les embeddings generes a l'etape 3.

Cree une collection Qdrant "atlas_metadata" et y insere chaque document
(vecteur + texte + metadonnees) afin de permettre la recherche
semantique depuis le futur chatbot.

Prerequis :
    pip install qdrant-client

Usage :
    python load_qdrant.py
"""

import json
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct

INPUT_FILE = "atlas_embeddings.json"
QDRANT_HOST = "localhost"
QDRANT_PORT = 6333
COLLECTION_NAME = "atlas_metadata"


def main():
    print("=" * 60)
    print("Alimentation de Qdrant")
    print("=" * 60)

    print(f"Lecture de '{INPUT_FILE}'...")
    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        documents = json.load(f)
    print(f"{len(documents)} document(s) a inserer.")

    vector_size = len(documents[0]["embedding"])
    print(f"Dimension des vecteurs : {vector_size}")

    print(f"\nConnexion a Qdrant ({QDRANT_HOST}:{QDRANT_PORT})...")
    client = QdrantClient(host=QDRANT_HOST, port=QDRANT_PORT)

    # (Re)creation de la collection - efface les anciennes donnees
    # si le script est relance apres une mise a jour du lineage.
    print(f"Creation de la collection '{COLLECTION_NAME}'...")
    client.recreate_collection(
        collection_name=COLLECTION_NAME,
        vectors_config=VectorParams(size=vector_size, distance=Distance.COSINE),
    )

    print("Insertion des points...")
    points = []
    for i, doc in enumerate(documents):
        points.append(
            PointStruct(
                id=i,
                vector=doc["embedding"],
                payload={
                    "atlas_guid": doc["id"],
                    "type": doc["type"],
                    "name": doc["name"],
                    "text": doc["text"],
                },
            )
        )

    client.upsert(collection_name=COLLECTION_NAME, points=points)

    count = client.count(collection_name=COLLECTION_NAME).count
    print(f"\nTermine. {count} point(s) dans la collection '{COLLECTION_NAME}'.")
    print("Consultez http://localhost:6333/dashboard pour verifier visuellement.")


if __name__ == "__main__":
    main()
