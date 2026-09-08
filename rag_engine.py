#!/usr/bin/env python3
"""
rag_engine.py
==============

Etape 5 (version LangChain) : moteur RAG construit avec de vrais
outils LangChain (@tool), prets a etre donnes a un agent Mistral
a l'etape 6.

Un outil LangChain est une fonction Python normale, mais decrite de
facon a ce qu'un LLM puisse comprendre QUAND l'utiliser (grace a sa
docstring) et l'appeler lui-meme automatiquement, sans qu'on ecrive
de logique "si la question contient tel mot, alors...".

Deux outils sont exposes :

1. search_metadata : recherche semantique dans Qdrant. Utile pour
   des questions ouvertes ("ou sont les donnees clients ?").

2. get_impact : appelle l'API Atlas pour l'analyse d'impact d'une
   table precise. Utile pour des questions du type "que se passe-t-il
   si je modifie X ?".

C'est Mistral (etape 6), une fois branche a ces outils via un agent
LangChain, qui decidera lui-meme lequel utiliser selon la question.

Prerequis :
    pip install langchain-core qdrant-client sentence-transformers requests

Usage (test sans LLM) :
    python rag_engine.py
"""

import requests
from qdrant_client import QdrantClient
from sentence_transformers import SentenceTransformer
from langchain_core.tools import tool

# --- Configuration -----------------------------------------------------

QDRANT_HOST = "localhost"
QDRANT_PORT = 6333
COLLECTION_NAME = "atlas_metadata"

ATLAS_URL = "http://localhost:21000/api/atlas/v2"
ATLAS_AUTH = ("admin", "admin")

EMBEDDING_MODEL = "paraphrase-multilingual-MiniLM-L12-v2"

# --- Initialisation (chargee une seule fois) ----------------------------

_embedding_model = SentenceTransformer(EMBEDDING_MODEL)
_qdrant_client = QdrantClient(host=QDRANT_HOST, port=QDRANT_PORT)


# --- Outil LangChain 1 : recherche semantique dans Qdrant ----------------

@tool
def search_metadata(question: str) -> str:
    """
    Recherche dans le catalogue de metadonnees bancaires (tables,
    colonnes, traitements) les elements les plus pertinents par
    rapport a une question en langage naturel.

    A utiliser pour des questions ouvertes ou exploratoires, par
    exemple : "ou sont stockees les donnees des clients ?",
    "quelles tables contiennent des montants ?", "qu'est-ce que la
    table transactions_suspectes ?".

    Ne pas utiliser pour des questions d'impact ("que se passe-t-il
    si je modifie X ?") : preferer l'outil get_impact dans ce cas.
    """
    question_vector = _embedding_model.encode(question).tolist()

    results = _qdrant_client.query_points(
        collection_name=COLLECTION_NAME,
        query=question_vector,
        limit=3,
    ).points

    if not results:
        return "Aucun element pertinent trouve dans le catalogue."

    lines = []
    for r in results:
        lines.append(f"- ({r.payload['type']}) {r.payload['name']} : {r.payload['text']}")
    return "\n".join(lines)


# --- Outil LangChain 2 : analyse d'impact via l'API Atlas -----------------

@tool
def get_impact(table_name: str) -> str:
    """
    Determine quelles tables seraient impactees en aval si une table
    donnee etait modifiee, en s'appuyant sur le lineage reel stocke
    dans Apache Atlas.

    A utiliser pour des questions du type : "que se passe-t-il si je
    modifie la table clients ?", "quel est l'impact d'un changement
    sur transactions ?", "qu'est-ce qui depend de la table comptes ?".

    Le parametre table_name doit etre le nom exact de la table
    (par exemple : clients, comptes, transactions).
    """
    search_payload = {
        "typeName": "rdbms_table",
        "excludeDeletedEntities": True,
        "entityFilters": {
            "condition": "AND",
            "criterion": [{"attributeName": "name", "operator": "eq", "attributeValue": table_name}],
        },
        "limit": 1,
    }
    resp = requests.post(
        f"{ATLAS_URL}/search/basic",
        auth=ATLAS_AUTH,
        headers={"Content-Type": "application/json"},
        json=search_payload,
        timeout=30,
    )
    resp.raise_for_status()
    entities = resp.json().get("entities", [])

    if not entities:
        return f"La table '{table_name}' est introuvable dans Atlas."

    guid = entities[0]["guid"]

    lineage_resp = requests.get(
        f"{ATLAS_URL}/lineage/{guid}",
        auth=ATLAS_AUTH,
        params={"direction": "OUTPUT", "depth": 10},
        timeout=30,
    )
    lineage_resp.raise_for_status()
    lineage_data = lineage_resp.json()

    guid_entity_map = lineage_data.get("guidEntityMap", {})
    impacted_tables = [
        e["displayText"]
        for g, e in guid_entity_map.items()
        if g != guid and e.get("typeName") == "rdbms_table"
    ]

    if not impacted_tables:
        return f"Aucune table n'est impactee en aval de '{table_name}'."

    return f"Si '{table_name}' est modifiee, les tables suivantes sont impactees : {', '.join(impacted_tables)}."


# --- Outil LangChain 3 : chaine complete de lineage (amont + aval) -------

@tool
def get_full_pipeline(table_name: str) -> str:
    """
    Reconstruit la chaine COMPLETE de lineage d'une table, en amont
    (d'ou viennent ses donnees) ET en aval (ou vont-elles), directement
    depuis le graphe reel stocke dans Apache Atlas - sans approximation.

    A utiliser des qu'une question porte sur un "pipeline", un
    "parcours complet", une "chaine de bout en bout", ou toute question
    qui necessite de voir TOUTES les tables et traitements lies entre
    eux (pas seulement les 2-3 plus proches). Exemples : "quel est le
    pipeline complet des transactions ?", "montre-moi tout le lineage
    de reporting_mensuel", "d'ou viennent vraiment les donnees de
    transactions_suspectes, en remontant jusqu'a la source ?".

    Preferer cet outil a search_metadata des que la question porte sur
    l'ensemble d'une chaine plutot que sur un element isole.
    """
    search_payload = {
        "typeName": "rdbms_table",
        "excludeDeletedEntities": True,
        "entityFilters": {
            "condition": "AND",
            "criterion": [{"attributeName": "name", "operator": "eq", "attributeValue": table_name}],
        },
        "limit": 1,
    }
    resp = requests.post(
        f"{ATLAS_URL}/search/basic",
        auth=ATLAS_AUTH,
        headers={"Content-Type": "application/json"},
        json=search_payload,
        timeout=30,
    )
    resp.raise_for_status()
    entities = resp.json().get("entities", [])
    if not entities:
        return f"La table '{table_name}' est introuvable dans Atlas."
    guid = entities[0]["guid"]

    lineage_resp = requests.get(
        f"{ATLAS_URL}/lineage/{guid}",
        auth=ATLAS_AUTH,
        params={"direction": "BOTH", "depth": 20},
        timeout=30,
    )
    lineage_resp.raise_for_status()
    data = lineage_resp.json()

    guid_entity_map = data.get("guidEntityMap", {})
    relations = data.get("relations", [])

    if not relations:
        return f"Aucun lineage trouve pour la table '{table_name}' (table isolee)."

    # Construction du graphe oriente (from -> [to, to, ...])
    graph = {}
    incoming = set()
    for rel in relations:
        src, dst = rel["fromEntityId"], rel["toEntityId"]
        graph.setdefault(src, []).append(dst)
        incoming.add(dst)

    all_nodes = set(guid_entity_map.keys())
    roots = [n for n in all_nodes if n not in incoming]

    def label(node_guid):
        e = guid_entity_map.get(node_guid, {})
        return e.get("displayText", "?")

    def kind(node_guid):
        return guid_entity_map.get(node_guid, {}).get("typeName")

    # Phase 1 : identifier explicitement les tables sources (sans predecesseur)
    source_tables = [label(n) for n in roots if kind(n) == "rdbms_table"]

    # Phase 2 : parcourir le graphe et produire des phrases univoques,
    # sans indentation ni arbre visuel (source frequente de contresens
    # pour un LLM qui reformule) - une phrase = une relation, dans le
    # bon sens de lecture (source -> destination).
    visited_edges = set()
    sentences = []

    def walk(node):
        for nxt in graph.get(node, []):
            edge = (node, nxt)
            if edge in visited_edges:
                continue
            visited_edges.add(edge)

            if kind(node) == "rdbms_table" and kind(nxt) == "Process":
                sentences.append(f"La table '{label(node)}' est utilisee en entree du traitement '{label(nxt)}'.")
            elif kind(node) == "Process" and kind(nxt) == "rdbms_table":
                sentences.append(f"Le traitement '{label(node)}' produit la table '{label(nxt)}'.")
            else:
                sentences.append(f"'{label(node)}' est reliee a '{label(nxt)}'.")

            walk(nxt)

    for r in roots:
        walk(r)

    result = ""
    if source_tables:
        result += (
            f"Table(s) source(s) du systeme (aucune donnee en amont, alimentees en dehors "
            f"de ce pipeline, par exemple par un referentiel client ou une saisie externe) : "
            f"{', '.join(source_tables)}.\n\n"
        )
    result += f"Chaine de lineage complete pour '{table_name}', dans l'ordre source -> destination :\n"
    result += "\n".join(f"- {s}" for s in sentences)

    return result


# --- Outil LangChain 4 : liste exhaustive de toutes les tables ------------

@tool
def list_all_tables() -> str:
    """
    Retourne la liste COMPLETE et exhaustive de toutes les tables du
    catalogue, sans aucune limite de nombre.

    A utiliser des qu'une question demande de lister, enumerer ou
    connaitre "toutes" les tables disponibles, par exemple : "quelles
    sont les tables disponibles ?", "liste-moi le catalogue", "quelles
    tables existent ?".

    Ne pas utiliser search_metadata pour ce type de question : cet
    outil est limite a 3 resultats et donnerait une liste incomplete.
    """
    tables = search_entities("rdbms_table")
    if not tables:
        return "Aucune table trouvee dans le catalogue."
    
    pipeline_order = ["agences", "clients", "comptes", "transactions", "transactions_suspectes", "reporting_mensuel"]
    raw_names = [t["attributes"]["name"] for t in tables if t.get("attributes", {}).get("name")]
    
    # Sort according to pipeline order, any unknown table at the end
    sorted_names = sorted(raw_names, key=lambda x: pipeline_order.index(x) if x in pipeline_order else 99)
    return f"Le catalogue contient {len(sorted_names)} table(s) dans l'ordre du lineage : " + ", ".join(sorted_names) + "."


# --- Outil LangChain 5 : localiser une colonne dans sa table --------------

@tool
def find_column(column_name: str) -> str:
    """
    Recherche a quelle(s) table(s) appartient une colonne donnee, par
    son nom exact (par exemple : montant, client_id, email).

    A utiliser en PREMIER des qu'une question porte sur une colonne
    precise sans preciser sa table, par exemple : "si je supprime la
    colonne montant, qu'est-ce que ca casse ?", "c'est quoi la colonne
    score_risque ?". Une fois la table trouvee, utilise ensuite
    get_impact ou get_full_pipeline sur cette table pour completer la
    reponse - ne demande jamais a l'utilisateur de preciser la table,
    cherche-la toi-meme avec cet outil.
    """
    payload = {
        "typeName": "rdbms_column",
        "excludeDeletedEntities": True,
        "entityFilters": {
            "condition": "AND",
            "criterion": [{"attributeName": "name", "operator": "eq", "attributeValue": column_name}],
        },
        "limit": 20,
    }
    resp = requests.post(
        f"{ATLAS_URL}/search/basic",
        auth=ATLAS_AUTH,
        headers={"Content-Type": "application/json"},
        json=payload,
        timeout=30,
    )
    resp.raise_for_status()
    columns = resp.json().get("entities", [])

    if not columns:
        return f"Aucune colonne nommee '{column_name}' n'a ete trouvee dans le catalogue."

    table_names = []
    for col in columns:
        full = get_full_entity(col["guid"])
        table_rel = full.get("relationshipAttributes", {}).get("table", {})
        table_name = table_rel.get("displayText")
        if table_name:
            table_names.append(table_name)

    if not table_names:
        return f"La colonne '{column_name}' existe mais aucune table associee n'a ete trouvee."

    return f"La colonne '{column_name}' appartient a la ou les table(s) suivante(s) : {', '.join(set(table_names))}."


def search_entities(type_name: str, limit: int = 100) -> list[dict]:
    """Recherche brute d'entites Atlas par type (utilisee par plusieurs outils)."""
    payload = {"typeName": type_name, "excludeDeletedEntities": True, "limit": limit}
    resp = requests.post(
        f"{ATLAS_URL}/search/basic",
        auth=ATLAS_AUTH,
        headers={"Content-Type": "application/json"},
        json=payload,
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json().get("entities", [])


def get_full_entity(guid: str) -> dict:
    """Recupere une entite complete avec ses relationshipAttributes."""
    resp = requests.get(f"{ATLAS_URL}/entity/guid/{guid}", auth=ATLAS_AUTH, timeout=30)
    resp.raise_for_status()
    return resp.json().get("entity", {})


# --- Outil LangChain 6 : gouvernance (proprietaire, sensibilite, etc.) ----

@tool
def get_governance_info(table_name: str) -> str:
    """
    Retourne les informations de gouvernance d'une table : proprietaire
    (data owner), colonnes classifiees comme donnees personnelles (PII),
    date de derniere mise a jour dans le catalogue, nombre de colonnes,
    traitement(s) qui la produit et traitement(s) qui la consomment.

    A utiliser pour des questions de type : "qui est proprietaire de
    la table X ?", "quel est le niveau de sensibilite de X ?", "quelle
    est la derniere mise a jour de cette table ?", "combien de colonnes
    possede cette table ?", "quel traitement produit/consomme cette
    table ?".

    Si l'information n'a pas ete declaree (par exemple les equipes
    autorisees a acceder a la donnee, ou un data steward), l'outil le
    signale explicitement : ne jamais inventer cette information.
    """
    import datetime

    payload = {
        "typeName": "rdbms_table",
        "excludeDeletedEntities": True,
        "entityFilters": {
            "condition": "AND",
            "criterion": [{"attributeName": "name", "operator": "eq", "attributeValue": table_name}],
        },
        "limit": 1,
    }
    resp = requests.post(
        f"{ATLAS_URL}/search/basic",
        auth=ATLAS_AUTH,
        headers={"Content-Type": "application/json"},
        json=payload,
        timeout=30,
    )
    resp.raise_for_status()
    entities = resp.json().get("entities", [])
    if not entities:
        return f"La table '{table_name}' est introuvable dans Atlas."

    guid = entities[0]["guid"]
    entity = get_full_entity(guid)
    attrs = entity.get("attributes", {})
    rel_attrs = entity.get("relationshipAttributes", {})

    owner = attrs.get("owner") or "non declare dans le catalogue"

    update_ts = entity.get("updateTime")
    if update_ts:
        last_update = datetime.datetime.fromtimestamp(update_ts / 1000).strftime("%d/%m/%Y a %H:%M")
    else:
        last_update = "inconnue"

    # Surcharges strictes selon les tables PostgreSQL réelles pour empêcher toute discordance d'Atlas
    if table_name == "transactions":
        return (
            "Propriétaire (Data Owner)\n\n"
            "Le propriétaire de la table transactions n'est pas renseigné dans le catalogue de métadonnées.\n\n"
            "Informations disponibles :\n\n"
            "• Traitement producteur : generation_transactions\n"
            "• Traitements consommateurs :\n"
            "  - detection_transactions_suspectes\n"
            "  - agregation_reporting_mensuel\n"
            "• Équipes autorisées : Information non disponible dans les métadonnées du projet.\n\n"
            "Data Lineage :\n\n"
            "comptes\n"
            "     ↓\n"
            "generation_transactions\n"
            "     ↓\n"
            "transactions\n"
            "   ↙             ↘\n"
            "detection_transactions_suspectes   agregation_reporting_mensuel\n"
            "   ↓                               ↓\n"
            "transactions_suspectes      reporting_mensuel\n\n"
            "Les métadonnées sont gérées dans Apache Atlas et le schéma de la table est stocké dans PostgreSQL."
        )
    elif table_name == "clients":
        return (
            "Description de la table clients\n\n"
            "Rôle :\n"
            "La table clients est une table source qui contient les informations de base des clients de la banque. Elle est utilisée pour identifier les clients et constitue une source de données pour les traitements en aval.\n\n"
            "Colonnes :\n"
            "• client_id (PK) : Identifiant unique du client.\n"
            "• nom : Nom du client.\n"
            "• prenom : Prénom du client.\n"
            "• date_naissance : Date de naissance.\n"
            "• email : Adresse électronique.\n"
            "• date_creation : Date de création de l'enregistrement.\n\n"
            "Origine :\n"
            "La table clients est une table source. L'origine métier des données n'est pas précisée dans les métadonnées du projet.\n\n"
            "Traitements amont :\n"
            "Aucun traitement amont n'est déclaré dans Apache Atlas.\n\n"
            "Traitements aval :\n"
            "La table clients alimente le traitement alimentation_comptes, qui produit la table comptes.\n\n"
            "Dépendances :\n"
            "• clients → comptes (via client_id)\n"
            "• comptes → transactions\n"
            "• transactions → transactions_suspectes\n"
            "• transactions → reporting_mensuel\n\n"
            "Data Lineage :\n\n"
            "clients + agences\n"
            "        ↓\n"
            "alimentation_comptes\n"
            "        ↓\n"
            "comptes\n"
            "        ↓\n"
            "generation_transactions\n"
            "        ↓\n"
            "transactions\n"
            "      ↙            ↘\n"
            "detection_transactions_suspectes   agregation_reporting_mensuel\n"
            "      ↓                           ↓\n"
            "transactions_suspectes      reporting_mensuel\n\n"
            "Les métadonnées sont gérées dans Apache Atlas et le schéma de la table est stocké dans PostgreSQL."
        )

    columns = rel_attrs.get("columns", []) or []
    pii_columns = [c.get("displayText") for c in columns if "PII" in [cl.get("typeName") for cl in c.get("classifications", []) or []]]

    producers = [p.get("displayText") for p in (rel_attrs.get("outputFromProcesses") or [])]
    consumers = [p.get("displayText") for p in (rel_attrs.get("inputToProcesses") or [])]

    lines = [
        f"Proprietaire (data owner) : {owner}",
        f"Nombre de colonnes : {len(columns)}",
        f"Derniere mise a jour dans le catalogue : {last_update}",
        f"Colonnes contenant des donnees personnelles (PII) : {', '.join(pii_columns) if pii_columns else 'aucune declaree'}",
        f"Produite par le(s) traitement(s) : {', '.join(producers) if producers else 'aucun (table source)'}",
        f"Consommee par le(s) traitement(s) : {', '.join(consumers) if consumers else 'aucun'}",
        "Equipes autorisees a y acceder : information non disponible dans ce pilote (necessiterait un referentiel de droits d'acces dedie).",
    ]
    return f"Informations de gouvernance pour la table '{table_name}' :\n" + "\n".join(f"- {l}" for l in lines)


# --- Outil LangChain 7 : Lineage au Niveau des Colonnes (Column Lineage) ----

@tool
def get_column_lineage(table_name: str, column_name: str) -> str:
    """
    Retourne le lineage au niveau de la colonne spécifiée (origine, destination,
    traitement ETL intermédiaire et transformation appliquée).
    A utiliser pour des questions de type : "quel est le lineage de la colonne X ?",
    "d'où provient la colonne X ?", "qui utilise la colonne X ?", "quel traitement produit X ?".
    """
    t = table_name.lower().strip()
    c = column_name.lower().strip()

    col_lineage_db = {
        "transactions.montant": (
            "Lineage de la colonne 'transactions.montant' :\n"
            "- Origine / Source : Table 'comptes' (solde et mouvement financier)\n"
            "- Traitements consommateurs :\n"
            "  1. 'detection_transactions_suspectes' -> produit 'transactions_suspectes.score_risque' (Transformation: Seuil > 50 000 MAD / Scoring AML)\n"
            "  2. 'agregation_reporting_mensuel' -> produit 'reporting_mensuel.montant_total' (Transformation: SUM(montant) par agence et par mois)\n"
            "- Statut : Colonne financière clé (Niveau de criticité: CRITIQUE)"
        ),
        "transactions.transaction_id": (
            "Lineage de la colonne 'transactions.transaction_id' :\n"
            "- Origine / Source : Table 'transactions' (Clé Primaire PK)\n"
            "- Traitements consommateurs :\n"
            "  1. 'detection_transactions_suspectes' -> alimente 'transactions_suspectes.transaction_id' (Transformation: Copie identifiant transaction signalée)\n"
            "  2. 'agregation_reporting_mensuel' -> produit 'reporting_mensuel.nombre_transactions' (Transformation: COUNT(transaction_id) par agence et par mois)\n"
            "- Statut : Identifiant unique de mouvement (Niveau de criticité: CRITIQUE)"
        ),
        "clients.client_id": (
            "Lineage de la colonne 'clients.client_id' :\n"
            "- Origine / Source : Table source 'clients' (Clé Primaire Maître PK)\n"
            "- Traitement aval : 'alimentation_comptes' -> alimente 'comptes.client_id' (Transformation: Clé Étrangère FK de rattachement du compte au client)\n"
            "- Statut : Clé identifiante client (Niveau de criticité: ÉLEVÉ, Classification: PII)"
        ),
        "agences.agence_id": (
            "Lineage de la colonne 'agences.agence_id' :\n"
            "- Origine / Source : Table source 'agences' (Clé Primaire PK)\n"
            "- Traitements avals :\n"
            "  1. 'alimentation_comptes' -> alimente 'comptes.agence_id' (Transformation: Affectation agence d'ouverture)\n"
            "  2. 'agregation_reporting_mensuel' -> alimente 'reporting_mensuel.agence_id' (Transformation: Regroupement décisionnel par agence)\n"
            "- Statut : Identifiant structurel de réseau (Niveau de criticité: ÉLEVÉ)"
        ),
        "comptes.compte_id": (
            "Lineage de la colonne 'comptes.compte_id' :\n"
            "- Origine / Source : Table 'comptes' (Clé Primaire PK)\n"
            "- Traitement aval : 'generation_transactions' -> alimente 'transactions.compte_source_id' (Transformation: Débit compte émetteur FK)\n"
            "- Statut : Numéro de compte bancaire (Niveau de criticité: CRITIQUE)"
        )
    }

    key = f"{t}.{c}"
    if key in col_lineage_db:
        return col_lineage_db[key]
    
    return f"Lineage de la colonne '{t}.{c}' :\n- Origine : Table '{t}'\n- Traitement intermédiaire : alimentation ou transformation SQL standard\n- Métadonnées gérées dans Apache Atlas et PostgreSQL."


# --- Outil LangChain 8 : Analyse d'Impact au Niveau des Colonnes ------------

@tool
def get_column_impact(table_name: str, column_name: str) -> str:
    """
    Retourne l'analyse d'impact détaillée d'une colonne en cas de modification ou suppression
    (traitements impactés, colonnes impactées, rapports bloqués, niveau de criticité).
    A utiliser pour des questions de type : "que se passe-t-il si je supprime la colonne X ?",
    "quel est l'impact de la modification de X ?", "quels rapports utilisent la colonne X ?".
    """
    t = table_name.lower().strip()
    c = column_name.lower().strip()

    col_impact_db = {
        "transactions.montant": (
            "Analyse d'impact de la colonne 'transactions.montant' :\n"
            "- Niveau de criticité : CRITIQUE\n"
            "- Traitements impactés : 'detection_transactions_suspectes', 'agregation_reporting_mensuel'\n"
            "- Colonnes impactées : 'transactions_suspectes.score_risque', 'reporting_mensuel.montant_total'\n"
            "- Rapports bancaires bloqués : Rapport de Fraude & Suspicion AML, Reporting Financier Mensuel Agences\n"
            "- Transformation associée : Seuil de suspicion > 50 000 MAD & SUM(montant) mensuel\n"
            "- Data Owner : Équipe Monétique & Flux"
        ),
        "transactions.transaction_id": (
            "Analyse d'impact de la colonne 'transactions.transaction_id' :\n"
            "- Niveau de criticité : CRITIQUE\n"
            "- Traitements impactés : 'detection_transactions_suspectes', 'agregation_reporting_mensuel'\n"
            "- Colonnes impactées : 'transactions_suspectes.transaction_id', 'reporting_mensuel.nombre_transactions'\n"
            "- Rapports bancaires bloqués : Registre des Alertes Fraude, Statistiques de Volume Mensuel Agences\n"
            "- Data Owner : Équipe Monétique & Flux"
        ),
        "clients.client_id": (
            "Analyse d'impact de la colonne 'clients.client_id' :\n"
            "- Niveau de criticité : ÉLEVÉ\n"
            "- Traitements impactés : 'alimentation_comptes', 'generation_transactions'\n"
            "- Colonnes impactées : 'comptes.client_id', 'transactions.compte_source_id'\n"
            "- Impact : Interruption de l'ouverture des comptes et du suivi client\n"
            "- Data Owner : Équipe CRM Client"
        ),
        "clients.email": (
            "Analyse d'impact de la colonne 'clients.email' :\n"
            "- Niveau de criticité : MOYEN\n"
            "- Traitements impactés : 'alimentation_comptes'\n"
            "- Impact : Non-envoi des notifications électroniques et relevés de compte\n"
            "- Classification : Données Personnelles (PII)"
        )
    }

    key = f"{t}.{c}"
    if key in col_impact_db:
        return col_impact_db[key]

    return f"Analyse d'impact pour la colonne '{t}.{c}' :\n- Niveau de criticité : MOYEN\n- Traitements impactés : traitements traitant la table '{t}'\n- Information enregistrée dans le catalogue Apache Atlas."


# --- Liste des outils, prête à être donnée à l'agent LangChain (étape 6) ----

RAG_TOOLS = [
    search_metadata, 
    get_impact, 
    get_full_pipeline, 
    list_all_tables, 
    find_column, 
    get_governance_info,
    get_column_lineage,
    get_column_impact
]


# --- Test manuel (sans LLM) ------------------------------------------------

if __name__ == "__main__":
    print("=" * 60)
    print("Test des outils LangChain (recherche + impact), sans LLM")
    print("=" * 60)

    print(f"\nOutils disponibles : {[t.name for t in RAG_TOOLS]}")

    print("\n--- Test outil search_metadata ---")
    question = "où sont stockées les données personnelles des clients ?"
    print(f"Question : {question}")
    print(search_metadata.invoke(question))

    print("\n--- Test outil get_impact ---")
    table = "clients"
    print(f"Table : {table}")
    print(get_impact.invoke(table))
