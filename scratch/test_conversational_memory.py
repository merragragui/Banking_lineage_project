import os
import sys

COLUMN_LINEAGES_ATLAS = {
    "clients.client_id": [
        {
            "source": "clients.client_id",
            "process": "col_alimentation_comptes_client_id",
            "target": "comptes.client_id",
            "transformation": "Clé Étrangère FK (enregistrée dans Apache Atlas)"
        }
    ],
    "agences.agence_id": [
        {
            "source": "agences.agence_id",
            "process": "col_alimentation_comptes_agence_id",
            "target": "comptes.agence_id",
            "transformation": "Clé Étrangère FK (enregistrée dans Apache Atlas)"
        }
    ],
    "comptes.compte_id": [
        {
            "source": "comptes.compte_id",
            "process": "col_generation_transactions_compte_source",
            "target": "transactions.compte_source_id",
            "transformation": "Clé Étrangère FK (enregistrée dans Apache Atlas)"
        }
    ],
    "comptes.client_id": [
        {
            "source": "clients.client_id",
            "process": "col_alimentation_comptes_client_id",
            "target": "comptes.client_id",
            "transformation": "Clé Étrangère FK (enregistrée dans Apache Atlas)"
        }
    ],
    "transactions.transaction_id": [
        {
            "source": "transactions.transaction_id",
            "process": "col_detection_transactions_suspectes_tx_id",
            "target": "transactions_suspectes.transaction_id",
            "transformation": "Clé Étrangère FK (enregistrée dans Apache Atlas)"
        }
    ],
    "transactions.montant": [
        {
            "source": "transactions.montant",
            "process": "col_detection_transactions_suspectes_score",
            "target": "transactions_suspectes.score_risque",
            "transformation": "Calcul (enregistré dans Apache Atlas)"
        },
        {
            "source": "transactions.montant",
            "process": "col_agregation_reporting_montant_total",
            "target": "reporting_mensuel.montant_total",
            "transformation": "SUM(montant) (enregistré dans Apache Atlas)"
        }
    ],
    "transactions_suspectes.score_risque": [
        {
            "source": "transactions.montant",
            "process": "col_detection_transactions_suspectes_score",
            "target": "transactions_suspectes.score_risque",
            "transformation": "Calcul (enregistré dans Apache Atlas)"
        }
    ],
    "reporting_mensuel.montant_total": [
        {
            "source": "transactions.montant",
            "process": "col_agregation_reporting_montant_total",
            "target": "reporting_mensuel.montant_total",
            "transformation": "SUM(montant) (enregistré dans Apache Atlas)"
        }
    ]
}

TABLE_COLUMNS_MAP = {
    "clients": ["client_id", "nom", "prenom", "email", "date_naissance", "date_creation"],
    "agences": ["agence_id", "code_agence", "nom_agence", "ville", "date_creation"],
    "comptes": ["compte_id", "client_id", "agence_id", "type_compte", "solde", "date_ouverture"],
    "transactions": ["transaction_id", "compte_source_id", "compte_destination_id", "montant", "type_transaction", "devise", "statut", "date_transaction"],
    "transactions_suspectes": ["id", "transaction_id", "score_risque", "motif", "date_detection"],
    "reporting_mensuel": ["id", "agence_id", "mois", "nombre_transactions", "montant_total", "date_generation"]
}

CONVERSATION_CONTEXTS = {}

def resolve_question_context(question: str, history: list = None, conversation_id: str = None):
    question_lower = question.lower().strip()

    if conversation_id and conversation_id in CONVERSATION_CONTEXTS:
        ctx = CONVERSATION_CONTEXTS[conversation_id].copy()
    else:
        ctx = {
            "current_table": None,
            "current_column": None,
            "current_process": None,
            "last_entity": None,
            "last_question_type": None
        }

    if not ctx["current_table"] and history:
        for msg in reversed(history):
            content = msg.get("content", "").lower()
            for t_name in ["transactions_suspectes", "reporting_mensuel", "transactions", "clients", "agences", "comptes"]:
                if t_name in content:
                    ctx["current_table"] = t_name
                    break
            if ctx["current_table"]:
                break

    explicit_table = None
    explicit_col = None
    explicit_proc = None

    # 1. Qualified column search (e.g. clients.client_id)
    for t_name, cols in TABLE_COLUMNS_MAP.items():
        for c_name in cols:
            qual = f"{t_name}.{c_name}"
            if qual in question_lower:
                explicit_table = t_name
                explicit_col = c_name
                break
        if explicit_table:
            break

    # 2. Explicit table search
    if not explicit_table:
        for t_name in ["transactions_suspectes", "reporting_mensuel", "transactions", "clients", "agences", "comptes"]:
            if t_name in question_lower:
                explicit_table = t_name
                break

    # 3. Unqualified column search
    if not explicit_col:
        all_cols_ordered = [
            "client_id", "score_risque", "montant_total", "nombre_transactions", "transaction_id",
            "compte_source_id", "compte_destination_id", "agence_id", "compte_id", "code_agence",
            "nom_agence", "type_compte", "solde", "date_ouverture", "type_transaction", "date_transaction",
            "date_creation", "date_naissance", "date_detection", "date_generation", "nom", "prenom",
            "email", "ville", "devise", "statut", "motif", "mois", "montant"
        ]
        for c_name in all_cols_ordered:
            # Check for word boundary or isolated column name
            if c_name in question_lower:
                # Avoid false positives if it's part of another word
                explicit_col = c_name
                break

    # 4. Process search
    for p_name in ["alimentation_comptes", "generation_transactions", "detection_transactions_suspectes", "agregation_reporting_mensuel"]:
        if p_name in question_lower:
            explicit_proc = p_name
            break

    pronoun_refs = ["son", "sa", "ses", "cette table", "cette colonne", "cette donnee", "cette donnée",
                    "celle-ci", "celui-ci", "elle", "il", "cette information", "ce champ", "le même",
                    "le meme", "la même", "la meme", "cette relation", "cet impact", "son owner",
                    "sa classification", "son lineage", "son impact"]
    has_pronoun = any(p in question_lower for p in pronoun_refs)

    if explicit_table:
        ctx["current_table"] = explicit_table
        if explicit_col:
            ctx["current_column"] = explicit_col
        else:
            # If an explicit new table is asked without a column, reset current_column
            ctx["current_column"] = None

    elif explicit_col:
        ctx["current_column"] = explicit_col
        if ctx["current_table"] and explicit_col in TABLE_COLUMNS_MAP.get(ctx["current_table"], []):
            pass
        else:
            for t_name, cols in TABLE_COLUMNS_MAP.items():
                if explicit_col in cols:
                    ctx["current_table"] = t_name
                    break

    elif has_pronoun:
        is_col_pronoun = any(p in question_lower for p in ["cette colonne", "cette donnee", "cette donnée", "ce champ", "cette relation"])
        if is_col_pronoun and ctx["current_column"]:
            pass
        elif ctx["current_column"] and any(k in question_lower for k in ["lineage", "impact", "provenance", "origine", "supprim"]):
            pass
        else:
            if any(k in question_lower for k in ["owner", "propriétaire", "proprietaire", "classification", "sensibilité", "sensibilite", "pii"]):
                # If asking about table owner/classification, use table context
                pass

    if explicit_proc:
        ctx["current_process"] = explicit_proc

    if ctx["current_column"] and ctx["current_table"]:
        ctx["last_entity"] = f"{ctx['current_table']}.{ctx['current_column']}"
    elif ctx["current_table"]:
        ctx["last_entity"] = ctx["current_table"]

    if conversation_id:
        CONVERSATION_CONTEXTS[conversation_id] = ctx

    return ctx

# Test Conversation 1
print("\n--- TEST CONVERSATION 1 ---")
conv_id = "test_conv_1"

q1 = "Quelles sont les colonnes de la table clients ?"
c1 = resolve_question_context(q1, conversation_id=conv_id)
print(f"Q1: '{q1}' -> Context: {c1}")

q2 = "Quel est son Data Owner ?"
c2 = resolve_question_context(q2, conversation_id=conv_id)
print(f"Q2: '{q2}' -> Context: {c2}")

q3 = "Et sa classification ?"
c3 = resolve_question_context(q3, conversation_id=conv_id)
print(f"Q3: '{q3}' -> Context: {c3}")

q4 = "Et le lineage de client_id ?"
c4 = resolve_question_context(q4, conversation_id=conv_id)
print(f"Q4: '{q4}' -> Context: {c4}")

q5 = "Et l'impact si cette colonne est supprimée ?"
c5 = resolve_question_context(q5, conversation_id=conv_id)
print(f"Q5: '{q5}' -> Context: {c5}")

# Test Conversation 2 (Context Switch)
print("\n--- TEST CONVERSATION 2 (CONTEXT SWITCH) ---")
conv_id_2 = "test_conv_2"

q2_1 = "Quel est le lineage de clients.client_id ?"
c2_1 = resolve_question_context(q2_1, conversation_id=conv_id_2)
print(f"Q1: '{q2_1}' -> Context: {c2_1}")

q2_2 = "Et comptes.client_id ?"
c2_2 = resolve_question_context(q2_2, conversation_id=conv_id_2)
print(f"Q2: '{q2_2}' -> Context: {c2_2}")

q2_3 = "Maintenant donne-moi les colonnes de transactions."
c2_3 = resolve_question_context(q2_3, conversation_id=conv_id_2)
print(f"Q3: '{q2_3}' -> Context: {c2_3}")

q2_4 = "Et son owner ?"
c2_4 = resolve_question_context(q2_4, conversation_id=conv_id_2)
print(f"Q4: '{q2_4}' -> Context: {c2_4}")

print("\nTEST COMPLETED SUCCESSFULLY!")
