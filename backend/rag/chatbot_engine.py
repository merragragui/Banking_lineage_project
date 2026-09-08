import os
import sys
import json
import requests
from dotenv import load_dotenv

load_dotenv()

# Ajout du dossier racine pour importer chatbot.py et rag_engine.py
root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

try:
    from chatbot import ask as chatbot_ask
except Exception as e:
    print(f"Mode fallback local pour le chatbot: {e}")
    chatbot_ask = None

try:
    from backend.rag.atlas_client import BANKING_METADATA, get_impact_analysis, check_atlas_connection
    from backend.rag.atlas_column_lineage import get_column_atlas_lineage_paths, generate_visual_ascii_box_schema
except ModuleNotFoundError:
    from rag.atlas_client import BANKING_METADATA, get_impact_analysis, check_atlas_connection
    from rag.atlas_column_lineage import get_column_atlas_lineage_paths, generate_visual_ascii_box_schema

MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY")
QDRANT_HOST = os.getenv("QDRANT_HOST", "localhost")
QDRANT_PORT = int(os.getenv("QDRANT_PORT", "6333"))

# ==============================================================================
# STRUCTURE ET MÉMOIRE CONVERSATIONNELLE POUR LES MÉTADONNÉES
# ==============================================================================

CONVERSATION_CONTEXTS = {}

# Mappage officiel des colonnes par table
TABLE_COLUMNS_MAP = {
    "clients": ["client_id", "nom", "prenom", "email", "date_naissance", "date_creation"],
    "agences": ["agence_id", "code_agence", "nom_agence", "ville", "date_creation"],
    "comptes": ["compte_id", "client_id", "agence_id", "type_compte", "solde", "date_ouverture"],
    "transactions": ["transaction_id", "compte_source_id", "compte_destination_id", "montant", "type_transaction", "devise", "statut", "date_transaction"],
    "transactions_suspectes": ["id", "transaction_id", "score_risque", "motif", "date_detection"],
    "reporting_mensuel": ["id", "agence_id", "mois", "nombre_transactions", "montant_total", "date_generation"]
}

# Column-Level Lineage réel enregistré dans Apache Atlas
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

COLUMN_DESCRIPTIONS_MAP = {
    "clients.client_id": "Identifiant unique du client (Clé Primaire PK).",
    "clients.nom": "Nom de famille du titulaire du compte bancaire.",
    "clients.prenom": "Prénom du titulaire du compte bancaire.",
    "clients.email": "Adresse email de contact du client pour les notifications et alertes bancaires.",
    "clients.date_naissance": "Date de naissance du client (utilisée pour le contrôle KYC et la majorité légale > 18 ans).",
    "clients.date_creation": "Date d'ouverture du profil client dans le système d'information de la banque.",

    "agences.agence_id": "Identifiant unique de l'agence bancaire (Clé Primaire PK).",
    "agences.code_agence": "Code guichet/agence officiel du réseau bancaire.",
    "agences.nom_agence": "Libellé commercial de l'agence bancaire.",
    "agences.ville": "Ville ou zone géographique d'implantation de l'agence.",
    "agences.date_creation": "Date d'ouverture de l'agence bancaire.",

    "comptes.compte_id": "Identifiant unique du compte bancaire (Clé Primaire PK).",
    "comptes.client_id": "Clé étrangère (FK) rattachant le compte bancaire au client titulaire.",
    "comptes.agence_id": "Clé étrangère (FK) rattachant le compte à son agence bancaire d'ouverture.",
    "comptes.type_compte": "Type de compte bancaire (ex: Compte Chèque, Compte Épargne, Compte Courant).",
    "comptes.solde": "Solde comptable actuel du compte bancaire en Dirhams (MAD).",
    "comptes.date_ouverture": "Date d'ouverture officielle du compte bancaire.",

    "transactions.transaction_id": "Identifiant unique de l'opération financière (Clé Primaire PK).",
    "transactions.compte_source_id": "Identifiant du compte bancaire émetteur débité (Clé Étrangère FK).",
    "transactions.compte_destination_id": "Identifiant du compte bancaire bénéficiaire crédité (Clé Étrangère FK).",
    "transactions.montant": "Valeur financière de la transaction en Dirhams (MAD).",
    "transactions.type_transaction": "Nature du transfert financier (ex: Virement, Retrait DAB, Paiement TPE).",
    "transactions.devise": "Devise de l'opération (MAD, EUR, USD).",
    "transactions.statut": "État de la transaction (Validée, En attente, Bloquée AML).",
    "transactions.date_transaction": "Horodatage exact de l'exécution de la transaction.",

    "transactions_suspectes.id": "Identifiant unique de l'alerte de suspicion AML (Clé Primaire PK).",
    "transactions_suspectes.transaction_id": "Clé étrangère (FK) pointant vers la transaction signalée.",
    "transactions_suspectes.score_risque": "Note de risque calculée par le moteur AML (ex: > 50 000 MAD, comportement atypique).",
    "transactions_suspectes.motif": "Raison du signalement d'alerte (ex: Montant élevé, virement international suspect).",
    "transactions_suspectes.date_detection": "Horodatage de la détection de l'alerte de fraude AML.",

    "reporting_mensuel.id": "Identifiant du rapport consolidé mensuel (Clé Primaire PK).",
    "reporting_mensuel.mois": "Période mensuelle de consolidation (ex: 2026-07).",
    "reporting_mensuel.agence_id": "Agence bancaire concernée par le reporting.",
    "reporting_mensuel.nombre_transactions": "Volume total d'opérations exécutées au cours du mois.",
    "reporting_mensuel.montant_total": "Somme globale (SUM) des montants des transactions sur la période mensuelle.",
    "reporting_mensuel.date_generation": "Date de clôture et de génération du rapport financier."
}


def check_qdrant_connection():
    try:
        url = f"http://{QDRANT_HOST}:{QDRANT_PORT}/collections"
        resp = requests.get(url, timeout=3)
        return resp.status_code == 200
    except Exception:
        return False


def check_mistral_connection():
    return bool(MISTRAL_API_KEY and len(MISTRAL_API_KEY) > 10)


def resolve_question_context(question: str, history: list = None, conversation_id: str = None):
    """
    RÉSOLUTION DU CONTEXTE ET DES PRONOMS
    Règle : mémorise et résout 'son', 'sa', 'ses', 'cette table', 'cette colonne', etc.
    """
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

    # Reconstruire le contexte depuis l'historique si la session ou la colonne est incomplète
    if history:
        for msg in reversed(history):
            content = msg.get("content", "").lower()
            if not ctx["current_column"]:
                for t_name, cols in TABLE_COLUMNS_MAP.items():
                    for c_name in cols:
                        if c_name in content:
                            ctx["current_column"] = c_name
                            if not ctx["current_table"]:
                                ctx["current_table"] = t_name
                            break
                    if ctx["current_column"]:
                        break
            if not ctx["current_table"]:
                for t_name in ["transactions_suspectes", "reporting_mensuel", "transactions", "clients", "agences", "comptes"]:
                    if t_name in content:
                        ctx["current_table"] = t_name
                        break
            if ctx["current_table"] and ctx["current_column"]:
                break

    # Détection de réponse affirmative ("oui", "d'accord", "ok", "yes", etc.)
    is_affirmative_input = any(w in question_lower.split() for w in ["oui", "ouais", "ok", "yes", "d'accord", "dac", "daccord", "affirmatif", "volontiers", "exactement", "absolument"]) or question_lower.strip() in ["oui", "ouais", "ok", "yes", "d'accord", "oui svp", "oui s'il vous plait", "oui s'il vous plaît"]
    if is_affirmative_input:
        ctx["is_affirmative"] = True
        if not ctx["current_column"]:
            ctx["current_column"] = "montant"
            ctx["current_table"] = "transactions"
        elif not ctx["current_table"]:
            ctx["current_table"] = "transactions" if ctx["current_column"] == "montant" else "clients"

    # Correction automatique des erreurs et dictées de transcription vocale (Web Speech API French homophones & dictation)
    dictation_replacements = {
        "tiret du bas": "_",
        "tiret d en bas": "_",
        "tiret d'en bas": "_",
        "underscore": "_",
        ", tiret, ": "_",
        " tiret ": "_",
        ", tiret ": "_",
        " tiret, ": "_",
        "tiret": "_",
        "menton": "montant",
        "mentons": "montant",
        "moton": "montant",
        "chant": "champ",
        "chans": "champ"
    }
    for bad_word, good_word in dictation_replacements.items():
        if bad_word in question_lower:
            question_lower = question_lower.replace(bad_word, good_word)

    explicit_table = None
    explicit_col = None
    explicit_proc = None

    # 1. Recherche de colonnes qualifiées (ex: clients.client_id, transactions.montant)
    for t_name, cols in TABLE_COLUMNS_MAP.items():
        for c_name in cols:
            qual = f"{t_name}.{c_name}"
            if qual in question_lower:
                explicit_table = t_name
                explicit_col = c_name
                break
        if explicit_table:
            break

    # 2. Recherche de tables explicites (avec tolérance singulier / pluriel)
    if not explicit_table:
        table_aliases = {
            "transactions_suspectes": ["transactions_suspectes", "transaction_suspecte", "transactions suspectes", "transaction suspecte"],
            "reporting_mensuel": ["reporting_mensuel", "reporting mensuel", "reporting"],
            "transactions": ["transactions", "transaction"],
            "comptes": ["comptes", "compte"],
            "agences": ["agences", "agence"],
            "clients": ["clients", "client"]
        }
        for real_t, aliases in table_aliases.items():
            if any(a in question_lower for a in aliases):
                explicit_table = real_t
                break

    # 3. Recherche de colonnes non qualifiées (avec tolérance vocale & phonétique)
    if not explicit_col:
        col_speech_map = {
            "client_id": ["client_id", "client id", "client i d", "id client", "clients_id", "clients id"],
            "score_risque": ["score_risque", "score risque"],
            "montant_total": ["montant_total", "montant total"],
            "nombre_transactions": ["nombre_transactions", "nombre de transactions"],
            "transaction_id": ["transaction_id", "transaction id", "transactions_id", "transactions id"],
            "compte_source_id": ["compte_source_id", "compte source"],
            "compte_destination_id": ["compte_destination_id", "compte destination"],
            "agence_id": ["agence_id", "agence id", "agences_id", "agences id", "agence i d", "agences i d"],
            "compte_id": ["compte_id", "compte id", "comptes_id", "comptes id"],
            "code_agence": ["code_agence", "code agence"],
            "nom_agence": ["nom_agence", "nom agence"],
            "type_compte": ["type_compte", "type compte"],
            "solde": ["solde", "soldes"],
            "date_ouverture": ["date_ouverture", "date d'ouverture", "date ouverture"],
            "type_transaction": ["type_transaction", "type transaction"],
            "date_transaction": ["date_transaction", "date de transaction", "date transaction"],
            "date_creation": ["date_creation", "date de création", "date de creation"],
            "date_naissance": ["date_naissance", "date de naissance"],
            "date_detection": ["date_detection", "date de détection", "date de detection"],
            "date_generation": ["date_generation", "date de génération", "date de generation"],
            "nom": ["nom", "non"],
            "prenom": ["prenom", "prénom", "prenons"],
            "email": ["email", "e-mail", "mail"],
            "ville": ["ville"],
            "devise": ["devise", "devises"],
            "statut": ["statut"],
            "motif": ["motif", "motifs"],
            "mois": ["mois"],
            "montant": ["montant", "montants", "mon tant", "menton", "mentons", "moton", "montan"]
        }
        for real_col, aliases in col_speech_map.items():
            if any(a in question_lower for a in aliases):
                # Si l'alias est "non", vérifier que la phrase contient un contexte de champ/colonne ("chant", "champ", "colonne")
                if real_col == "nom" and "non" in question_lower and not any(k in question_lower for k in ["nom", "noms"]):
                    if not any(k in question_lower for k in ["champ", "champs", "chant", "chans", "colonne", "column"]):
                        continue
                explicit_col = real_col
                break

    # 4. Recherche de processus
    for p_name in ["alimentation_comptes", "generation_transactions", "detection_transactions_suspectes", "agregation_reporting_mensuel"]:
        if p_name in question_lower:
            explicit_proc = p_name
            break

    # Liste des pronoms et références contextuelles
    pronoun_refs = ["son", "sa", "ses", "cette table", "cette colonne", "cette donnee", "cette donnée",
                    "celle-ci", "celui-ci", "elle", "il", "cette information", "ce champ", "le même",
                    "le meme", "la même", "la meme", "cette relation", "cet impact", "son owner",
                    "sa classification", "son lineage", "son impact", "son imapct", "son impat"]
    has_pronoun = any(p in question_lower for p in pronoun_refs)

    if explicit_table:
        ctx["current_table"] = explicit_table
        if explicit_col:
            ctx["current_column"] = explicit_col
        else:
            # Si une nouvelle table est explicitement nommée sans colonne, réinitialiser current_column
            ctx["current_column"] = None

    elif explicit_col:
        ctx["current_column"] = explicit_col
        if ctx["current_table"] and explicit_col in TABLE_COLUMNS_MAP.get(ctx["current_table"], []):
            pass  # Conserver la table courante
        else:
            # Trouver la table principale de cette colonne
            for t_name, cols in TABLE_COLUMNS_MAP.items():
                if explicit_col in cols:
                    ctx["current_table"] = t_name
                    break

    elif has_pronoun:
        # Résolution des pronoms via le contexte mémorisé
        is_col_pronoun = any(p in question_lower for p in ["cette colonne", "cette donnee", "cette donnée", "ce champ", "cette relation"])
        if is_col_pronoun and ctx["current_column"]:
            pass
        elif ctx["current_column"] and any(k in question_lower for k in ["lineage", "impact", "imapct", "provenance", "origine", "supprim"]):
            pass

    if explicit_proc:
        ctx["current_process"] = explicit_proc

    ctx["explicit_col"] = explicit_col
    ctx["explicit_table"] = explicit_table

    if ctx["current_column"] and ctx["current_table"]:
        ctx["last_entity"] = f"{ctx['current_table']}.{ctx['current_column']}"
    elif ctx["current_table"]:
        ctx["last_entity"] = ctx["current_table"]

    if conversation_id:
        CONVERSATION_CONTEXTS[conversation_id] = ctx

    return ctx


def format_column_lineage_response(table_name: str, col_name: str, direction: str = "BOTH") -> str:
    """
    FORMATAGE STRUCTURÉ DU COLUMN-LEVEL LINEAGE DEPUIS APACHE ATLAS
    Source unique de vérité Apache Atlas.
    """
    paths_info = get_column_atlas_lineage_paths(table_name, col_name, direction)
    full_col = f"{table_name}.{col_name}"
    
    upstream = paths_info.get("upstream", [])
    downstream = paths_info.get("downstream", [])

    if not upstream and not downstream:
        return "Aucun lineage correspondant n'a été trouvé dans Apache Atlas."

    res = f"### Lineage de `{full_col}`\n\n"
    res += f"**Source / Point de départ**\n`{full_col}`\n\n"
    res += "**Chemins détectés dans Apache Atlas**\n\n"

    path_num = 1
    if upstream:
        for u in upstream:
            res += f"**Chemin {path_num} (Amont) :**\n"
            res += f"- **Source** : `{u['source_entity']}`\n"
            res += f"- **Processus ETL** : `{u['process_tech']}` ({u['process_name']})\n"
            res += f"- **Cible** : `{u['target_entity']}`\n"
            res += f"- **Transformation** : {u['transformation']}\n\n"
            path_num += 1

    if downstream:
        for d in downstream:
            res += f"**Chemin {path_num} (Aval) :**\n"
            res += f"- **Source** : `{d['source_entity']}`\n"
            res += f"- **Processus ETL** : `{d['process_tech']}` ({d['process_name']})\n"
            res += f"- **Cible** : `{d['target_entity']}`\n"
            res += f"- **Transformation** : {d['transformation']}\n\n"
            path_num += 1

    res += "**Source Apache Atlas**\n"
    res += "Relations extraites dynamiquement du MetaStore Apache Atlas (RDBMS Column-Level Lineage Graph)."

    return res.strip()


def format_table_lineage_response(table_name: str, direction: str = "BOTH") -> str:
    """
    FORMATAGE STRUCTURÉ DU TABLE-LEVEL LINEAGE AVEC DESCENTE AU NIVEAU DES COLONNES
    Source unique de vérité Apache Atlas.
    """
    t = table_name.lower().strip()
    table_obj = next((tbl for tbl in BANKING_METADATA["tables"] if tbl["name"] == t), None)
    
    if not table_obj:
        return "Aucun lineage correspondant n'a été trouvé dans Apache Atlas."

    inputs = table_obj["lineage"]["inputs"]
    outputs = table_obj["lineage"]["outputs"]

    if not inputs and not outputs:
        return "Aucun lineage correspondant n'a été trouvé dans Apache Atlas."

    res = f"### Lineage de la Table `{t}`\n\n"
    res += f"**Source / Point de départ**\nTable `{t}`\n\n"
    res += "**Traitements ETL enregistrés dans Apache Atlas**\n\n"

    if inputs and direction in ["UPSTREAM", "BOTH"]:
        res += "**Traitements Amont (Inputs) :**\n"
        for inp in inputs:
            res += f"- Tables d'origine : `{inp}` ➔ Processus : `{inp}` ➔ Table `{t}`\n"
        res += "\n"

    if outputs and direction in ["DOWNSTREAM", "BOTH"]:
        res += "**Traitements Aval (Outputs) :**\n"
        for out in outputs:
            res += f"- Table `{t}` ➔ Processus : `{out}`\n"
        res += "\n"

    res += "\n**Source Apache Atlas**\n"
    res += "Lineage de table extrait en temps réel du MetaStore Apache Atlas."

    return res.strip()


def generate_chat_response(question: str, conversation_history: list = None, conversation_id: str = None):
    """
    MOTEUR CHATBOT AVEC MÉMOIRE CONVERSATIONNELLE MULTI-TOURS
    """
    question_lower = question.lower().strip()

    # 1. Résolution du contexte conversationnel
    ctx = resolve_question_context(question, conversation_history, conversation_id)
    target_table = ctx.get("current_table")
    target_col = ctx.get("current_column")

    lineage_flow = None
    sources = [
        {"type": "Apache Atlas REST API", "name": "Banking Lineage MetaStore"},
        {"type": "Qdrant Vector DB", "name": "atlas_metadata collection"}
    ]

    # Construction de la question enrichie avec le contexte pour le LLM Mistral / LangChain Agent
    context_prefix = ""
    if target_col and target_table:
        context_prefix = f"[Contexte : table = '{target_table}', colonne = '{target_col}'] "
    elif target_table:
        context_prefix = f"[Contexte : table = '{target_table}'] "

    enriched_question = context_prefix + question

    answer = None

    # ==============================================================================
    # RÈGLES MÉTADONNÉES APACHE ATLAS - SOURCE UNIQUE DE VÉRITÉ (SANS HALLUCINATION)
    # ==============================================================================
    
    # 0. Filtrage strict des questions hors sujet / hors périmètre du projet
    domain_keywords = [
        "client", "clients", "agence", "agences", "compte", "comptes",
        "transaction", "transactions", "suspect", "suspectes", "reporting",
        "lineage", "impact", "atlas", "colonne", "table", "champ", "donnée",
        "donnee", "gouvernance", "métadonnée", "metadonnée", "metadonnees",
        "métadonnées", "propriétaire", "owner", "classification", "sensibilité",
        "sensibilite", "pii", "etl", "spark", "solde", "montant", "score",
        "source", "cible", "amont", "aval", "d'où", "dou", "chemin", "flux",
        "structure", "description", "rôle", "role", "présente", "presente",
        "qu'est-ce", "quest ce", "c'est quoi", "expliq", "info", "information",
        "supprim", "affect", "modifi", "conséquence", "consequence", "nom", "prenom",
        "email", "ville", "devise", "statut", "motif", "mois", "date", "id",
        "sert", "utilité", "utilite", "usage", "fonction", "objectif", "a quoi sert", "à quoi sert"
    ]
    
    is_affirmative = any(w in question_lower.split() for w in ["oui", "ouais", "ok", "yes", "d'accord", "dac", "daccord", "affirmatif", "volontiers", "exactement", "absolument"]) or question_lower.strip() in ["oui", "ouais", "ok", "yes", "d'accord", "oui svp", "oui s'il vous plait", "oui s'il vous plaît"]
    
    pronoun_refs = ["son", "sa", "ses", "cette table", "cette colonne", "cette donnee", "cette donnée",
                    "celle-ci", "celui-ci", "elle", "il", "cette information", "ce champ", "le même",
                    "le meme", "la même", "la meme", "cette relation", "cet impact", "son owner",
                    "sa classification", "son lineage", "son impact"]
    has_pronoun = any(p in question_lower for p in pronoun_refs)
    has_domain_term = any(k in question_lower for k in domain_keywords)

    if not has_domain_term and not is_affirmative and not has_pronoun:
        return {
            "answer": "Désolé, cette question est hors du périmètre du système de gouvernance des données bancaires et d'Apache Atlas. Veuillez poser une question relative aux métadonnées, au Data Lineage ou à l'analyse d'impact.",
            "sources": sources,
            "lineage_flow": None
        }
    is_lineage_req = any(k in question_lower for k in ["lineage", "provenance", "origine", "d'où", "dou", "chemin", "flux"])
    is_impact_req = any(k in question_lower for k in ["impact", "imapct", "impat", "impac", "supprim", "affect", "modifi", "conséquence", "consequence"])
    is_owner_req = any(k in question_lower for k in ["propriétaire", "proprietaire", "owner", "responsable"])
    is_class_req = any(k in question_lower for k in ["classification", "sensibilité", "sensibilite", "pii", "confidentiel"])
    is_cols_req = any(k in question_lower for k in ["colonne", "column", "structure", "champ", "composition"])
    is_desc_req = any(k in question_lower for k in ["description", "présente", "presente", "qu'est-ce", "quest ce", "c'est quoi", "expliq", "rôle", "role", "détail", "detail", "information", "info", "présentation", "presentation", "donne", "sert", "utilité", "utilite", "usage", "fonction", "objectif", "a quoi sert", "à quoi sert"])

    # Detection direction de lineage: UPSTREAM / DOWNSTREAM / BOTH
    req_direction = "BOTH"
    if any(k in question_lower for k in ["amont", "d'où", "dou", "source", "provenance", "origine"]):
        req_direction = "UPSTREAM"
    elif any(k in question_lower for k in ["aval", "destination", "dépend", "depend", "utilis", "qu'est-ce qui dépend", "qu'est ce qui dépend"]):
        req_direction = "DOWNSTREAM"

    is_affirmative = any(w in question_lower.split() for w in ["oui", "ouais", "ok", "yes", "d'accord", "dac", "daccord", "affirmatif", "volontiers", "exactement", "absolument"]) or question_lower.strip() in ["oui", "ouais", "ok", "yes", "d'accord", "oui svp", "oui s'il vous plait", "oui s'il vous plaît"]

    # 1. Traitement des réponses affirmatives ("oui", "d'accord", "yes"...) après une proposition du bot
    if is_affirmative or ctx.get("is_affirmative"):
        tbl = target_table or "transactions"
        col = target_col or "montant"
        paths_info = get_column_atlas_lineage_paths(tbl, col, req_direction)
        answer = format_column_lineage_response(tbl, col, req_direction)
        lineage_flow = paths_info

    # 2. Traitement des questions de LINEAGE de TABLE / PIPELINE (Prioritaire si aucune colonne explicite n'est demandée)
    elif is_lineage_req and target_table and not ctx.get("explicit_col"):
        answer = format_table_lineage_response(target_table, req_direction)
        table_obj = next((t for t in BANKING_METADATA["tables"] if t["name"] == target_table), None)
        if table_obj:
            inputs = table_obj["lineage"]["inputs"]
            outputs = table_obj["lineage"]["outputs"]
            
            process_source_map = {
                "alimentation_comptes": "clients",
                "generation_transactions": "comptes",
                "detection_transactions_suspectes": "transactions",
                "agregation_reporting_mensuel": "transactions"
            }
            process_target_map = {
                "alimentation_comptes": "comptes",
                "generation_transactions": "transactions",
                "detection_transactions_suspectes": "transactions_suspectes",
                "agregation_reporting_mensuel": "reporting_mensuel"
            }

            upstream_nodes = []
            if req_direction in ["UPSTREAM", "BOTH"]:
                for inp in inputs:
                    upstream_nodes.append({
                        "source_table": process_source_map.get(inp, "clients"),
                        "process_name": inp,
                        "target_table": target_table,
                        "target_column": "Table Cible",
                        "transformation": "Traitement ETL Spark"
                    })
                
            downstream_nodes = []
            if req_direction in ["DOWNSTREAM", "BOTH"]:
                for out in outputs:
                    downstream_nodes.append({
                        "source_table": target_table,
                        "process_name": out,
                        "target_table": process_target_map.get(out, out),
                        "target_column": "Datamart Cible",
                        "transformation": "Traitement ETL Spark"
                    })
                
            lineage_flow = {
                "table": target_table,
                "upstream": upstream_nodes,
                "downstream": downstream_nodes
            }

    # 3. Traitement des questions de COLUMN-LEVEL LINEAGE (Si une colonne explicite est demandée)
    elif is_lineage_req and target_col:
        tbl = target_table or "transactions"
        paths_info = get_column_atlas_lineage_paths(tbl, target_col, req_direction)
        answer = format_column_lineage_response(tbl, target_col, req_direction)
        lineage_flow = paths_info

    # 3. Traitement des questions d'IMPACT sur une TABLE (Prioritaire si aucune colonne explicite n'est demandée)
    elif is_impact_req and target_table and not ctx.get("explicit_col"):
        table_obj = next((t for t in BANKING_METADATA["tables"] if t["name"] == target_table), None)
        if table_obj:
            outputs = table_obj["lineage"]["outputs"]
            process_target_map = {
                "alimentation_comptes": "comptes",
                "generation_transactions": "transactions",
                "detection_transactions_suspectes": "transactions_suspectes",
                "agregation_reporting_mensuel": "reporting_mensuel"
            }
            if outputs:
                answer = f"Analyse d'impact de la suppression ou modification de la table **{target_table}** :\n\n"
                answer += f"1. **Traitements ETL affectés en aval** :\n"
                for o in outputs:
                    target_tbl = process_target_map.get(o, o)
                    answer += f"   - Processus `{o}` ➔ Impacte la table `{target_tbl}`\n"
            else:
                answer = f"La table **{target_table}** est une table de sortie finale. Aucune table en aval n'est impactée."
        else:
            answer = f"Analyse d'impact de la table **{target_table}** : Aucune dépendance en aval enregistrée dans Apache Atlas."

    # 4. Traitement des questions d'IMPACT sur une COLONNE SPÉCIFIQUE
    elif is_impact_req and target_col:
        full_col = f"{target_table}.{target_col}" if target_table else target_col
        lineages = COLUMN_LINEAGES_ATLAS.get(full_col)
        
        if lineages:
            answer = f"Analyse d'impact de la modification ou suppression de la colonne `{full_col}` :\n\n"
            for l in lineages:
                answer += f"1. **Traitement ETL affecté** : `{l['process']}`\n"
                answer += f"2. **Colonne cible impactée** : `{l['target']}`\n"
        else:
            answer = f"Analyse d'impact de la colonne `{full_col}` :\n\nAucun traitement aval dépendant de la colonne `{full_col}` n'est enregistré dans Apache Atlas."

    # 4. Traitement des questions de DATA OWNER
    elif is_owner_req and target_table:
        table_obj = next((t for t in BANKING_METADATA["tables"] if t["name"] == target_table), None)
        if table_obj and table_obj.get("owner"):
            answer = f"Le propriétaire (Data Owner) de la table **{target_table}** est l'**{table_obj['owner']}**."
        else:
            answer = "Cette information n'est pas renseignée dans Apache Atlas."

    # 5. Traitement des questions de CLASSIFICATION / PII
    elif is_class_req and target_table:
        table_obj = next((t for t in BANKING_METADATA["tables"] if t["name"] == target_table), None)
        if table_obj and table_obj.get("classification"):
            answer = f"La classification de la table **{target_table}** est : **{table_obj['classification']}** (Niveau de sensibilité : **{table_obj['sensitivity']}**)."
        else:
            answer = "Cette information n'est pas renseignée dans Apache Atlas."

    # 6. Traitement des questions de COLONNES / STRUCTURE d'une table
    elif is_cols_req and target_table:
        table_obj = next((t for t in BANKING_METADATA["tables"] if t["name"] == target_table), None)
        if table_obj:
            cols_str = "\n".join([f"• **{c}**" for c in table_obj["columns"]])
            answer = (
                f"La table **{target_table}** contient les colonnes suivantes (extraites directement d'Apache Atlas) :\n\n"
                f"{cols_str}"
            )

    # 8. Traitement des questions de DESCRIPTION ou d'INFORMATION GENERALE sur une TABLE
    elif target_table:
        table_obj = next((t for t in BANKING_METADATA["tables"] if t["name"] == target_table), None)
        if table_obj:
            cols_str = ", ".join([f"`{c}`" for c in table_obj["columns"]])
            answer = (
                f"Description de la table **{target_table}** :\n\n"
                f"• **Rôle Métier** : {table_obj.get('description', 'Table référentielle du système bancaire.')}\n"
                f"• **Colonnes** : {cols_str}"
            )

    # 8. Fallback intelligent via LangChain / Mistral ou message strict
    if not answer and chatbot_ask:
        try:
            answer = chatbot_ask(enriched_question)
        except Exception as err:
            print(f"Erreur lors de l'appel chatbot.ask: {err}")

    if not answer:
        answer = "Cette information n'est pas renseignée dans Apache Atlas."

    # Interdiction stricte de texte d'explication générique hors sujet
    return {
        "answer": answer,
        "sources": sources,
        "lineage_flow": lineage_flow
    }
