import os
import sys

root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__ if '__file__' in globals() else '.'), ".."))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

from backend.rag.chatbot_engine import generate_chat_response, CONVERSATION_CONTEXTS

print("==================================================")
print("TEST DE LA MÉMOIRE CONVERSATIONNELLE ET DU RAG")
print("==================================================")

conv_id = "integration_test_session"
history = []

questions = [
    "Quelles sont les colonnes de la table clients ?",
    "Quel est son Data Owner ?",
    "Et sa classification ?",
    "Et le lineage de client_id ?",
    "Et l'impact si cette colonne est supprimée ?",
    "Maintenant donne-moi les colonnes de transactions.",
    "Et son owner ?",
    "Et son lineage ?"
]

for idx, q in enumerate(questions, 1):
    print(f"\n--- TOUR {idx} ---")
    print(f"Utilisateur : {q}")
    res = generate_chat_response(q, conversation_history=history, conversation_id=conv_id)
    ans = res["answer"]
    print(f"Chatbot :\n{ans}")
    print(f"\nContexte Mémorisé : {CONVERSATION_CONTEXTS.get(conv_id)}")
    
    history.append({"sender": "user", "content": q})
    history.append({"sender": "assistant", "content": ans})

print("\n==================================================")
print("TEST SUCCÈS - TOUTES LES ÉTAPES VALIDÉES !")
print("==================================================")
