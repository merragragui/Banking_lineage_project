#!/usr/bin/env python3
"""
generate_embeddings.py
========================

Etape 3 : generation des embeddings pour chaque document extrait
d'Apache Atlas (atlas_documents.json -> atlas_embeddings.json).

Utilise un modele local (sentence-transformers), multilingue,
pour ne jamais envoyer les donnees bancaires vers un service externe
- coherent avec le choix de deploiement souverain de Mistral Large.

Prerequis :
    pip install sentence-transformers

Usage :
    python generate_embeddings.py
"""

import json
from sentence_transformers import SentenceTransformer

INPUT_FILE = "atlas_documents.json"
OUTPUT_FILE = "atlas_embeddings.json"

# Modele local, multilingue (francais inclus), leger et rapide.
# Premiere execution : le modele est telecharge une seule fois (~470 Mo)
# puis reste en cache localement (aucun appel reseau ensuite).
MODEL_NAME = "paraphrase-multilingual-MiniLM-L12-v2"


def main():
    print("=" * 60)
    print("Generation des embeddings (modele local)")
    print("=" * 60)

    print(f"Chargement du modele '{MODEL_NAME}'...")
    print("(le premier lancement telecharge le modele, ~470 Mo, une seule fois)")
    model = SentenceTransformer(MODEL_NAME)

    print(f"\nLecture de '{INPUT_FILE}'...")
    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        documents = json.load(f)
    print(f"{len(documents)} document(s) a vectoriser.")

    texts = [doc["text"] for doc in documents]

    print("\nCalcul des embeddings...")
    embeddings = model.encode(texts, show_progress_bar=True)

    for doc, vector in zip(documents, embeddings):
        doc["embedding"] = vector.tolist()

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(documents, f, ensure_ascii=False)

    print(f"\nTermine. Fichier genere : {OUTPUT_FILE}")
    print(f"Dimension des vecteurs : {len(embeddings[0])}")


if __name__ == "__main__":
    main()
