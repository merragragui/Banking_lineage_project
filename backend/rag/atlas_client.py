import requests
from requests.auth import HTTPBasicAuth
import os

ATLAS_HOST = os.getenv("ATLAS_HOST", "http://localhost:21000")
ATLAS_USER = os.getenv("ATLAS_USER", "admin")
ATLAS_PASSWORD = os.getenv("ATLAS_PASSWORD", "admin")

VALID_BANKING_TABLES = {"clients", "agences", "comptes", "transactions", "transactions_suspectes", "reporting_mensuel"}

# Données statiques de secours basées sur le projet bancaire réel
BANKING_METADATA = {
    "tables": [
        {
            "name": "clients",
            "type": "rdbms_table",
            "owner": "Équipe CRM Client",
            "classification": "Confidentiel / PII",
            "sensitivity": "Élevée",
            "description": "Référentiel des clients de la banque : identité, coordonnées et date de création du profil.",
            "columns": ["client_id", "nom", "prenom", "email", "date_naissance", "date_creation"],
            "lineage": {"inputs": [], "outputs": ["alimentation_comptes"]}
        },
        {
            "name": "agences",
            "type": "rdbms_table",
            "owner": "Équipe Réseau & Distribution",
            "classification": "Interne",
            "sensitivity": "Moyenne",
            "description": "Référentiel des agences bancaires physiques, avec leur ville de rattachement.",
            "columns": ["agence_id", "code_agence", "nom_agence", "ville", "date_creation"],
            "lineage": {"inputs": [], "outputs": ["alimentation_comptes", "agregation_reporting_mensuel"]}
        },
        {
            "name": "comptes",
            "type": "rdbms_table",
            "owner": "Équipe Core Banking",
            "classification": "Financier",
            "sensitivity": "Élevée",
            "description": "Comptes bancaires détenus par les clients, rattachés à une agence, avec leur solde courant.",
            "columns": ["compte_id", "client_id", "agence_id", "type_compte", "solde", "date_ouverture"],
            "lineage": {"inputs": ["alimentation_comptes"], "outputs": ["generation_transactions", "agregation_reporting_mensuel"]}
        },
        {
            "name": "transactions",
            "type": "rdbms_table",
            "owner": "Équipe Monétique & Flux",
            "classification": "Financier / Sensible",
            "sensitivity": "Critique",
            "description": "Historique brut des transactions bancaires (virements, retraits, dépôts, paiements) entre comptes.",
            "columns": ["transaction_id", "compte_source_id", "compte_destination_id", "montant", "type_transaction", "devise", "statut", "date_transaction"],
            "lineage": {"inputs": ["generation_transactions"], "outputs": ["detection_transactions_suspectes", "agregation_reporting_mensuel"]}
        },
        {
            "name": "transactions_suspectes",
            "type": "rdbms_table",
            "owner": "Équipe Conformité & AML",
            "classification": "Conformité / Suspicion AML",
            "sensitivity": "Très Élevée",
            "description": "Résultat du moteur de détection de risque : transactions identifiées comme suspectes, avec score de risque et motif.",
            "columns": ["id", "transaction_id", "score_risque", "motif", "date_detection"],
            "lineage": {"inputs": ["detection_transactions_suspectes"], "outputs": []}
        },
        {
            "name": "reporting_mensuel",
            "type": "rdbms_table",
            "owner": "Équipe BI & Data Reporting",
            "classification": "Réglementaire",
            "sensitivity": "Élevée",
            "description": "Agrégat mensuel des transactions par agence, utilisé pour le pilotage et le reporting.",
            "columns": ["id", "agence_id", "mois", "nombre_transactions", "montant_total", "date_generation"],
            "lineage": {"inputs": ["agregation_reporting_mensuel"], "outputs": []}
        }
    ],
    "processes": [
        {
            "name": "alimentation_comptes",
            "type": "rdbms_process",
            "description": "Ouverture et alimentation des comptes clients par agence.",
            "inputs": ["clients", "agences"],
            "outputs": ["comptes"]
        },
        {
            "name": "generation_transactions",
            "type": "rdbms_process",
            "description": "Génération et enregistrement des mouvements financiers sur les comptes bancaires.",
            "inputs": ["comptes"],
            "outputs": ["transactions"]
        },
        {
            "name": "detection_transactions_suspectes",
            "type": "rdbms_process",
            "description": "Détection automatique des transactions à risque (seuil > 50 000 MAD, comportement anormal).",
            "inputs": ["transactions"],
            "outputs": ["transactions_suspectes"]
        },
        {
            "name": "agregation_reporting_mensuel",
            "type": "rdbms_process",
            "description": "Agrégation mensuelle du nombre et du volume financier des opérations par agence.",
            "inputs": ["agences", "comptes", "transactions"],
            "outputs": ["reporting_mensuel"]
        }
    ]
}

def check_atlas_connection():
    try:
        url = f"{ATLAS_HOST}/api/atlas/v2/types/typedefs/headers"
        resp = requests.get(url, auth=HTTPBasicAuth(ATLAS_USER, ATLAS_PASSWORD), timeout=3)
        return resp.status_code == 200
    except Exception:
        return False

def get_catalogue_tables():
    if check_atlas_connection():
        try:
            url = f"{ATLAS_HOST}/api/atlas/v2/search/basic"
            body = {"typeName": "rdbms_table", "excludeDeletedEntities": True, "limit": 1000}
            resp = requests.post(url, json=body, auth=HTTPBasicAuth(ATLAS_USER, ATLAS_PASSWORD), timeout=5)
            if resp.status_code == 200:
                entities = resp.json().get("entities", [])
                if entities:
                    tables = []
                    for e in entities:
                        attrs = e.get("attributes", {})
                        raw_name = attrs.get("name", "inconnu")
                        name_lower = raw_name.lower().strip()
                        if name_lower not in VALID_BANKING_TABLES:
                            continue
                        meta = next((t for t in BANKING_METADATA["tables"] if t["name"] == name_lower), None)
                        tables.append({
                            "name": name_lower,
                            "guid": e.get("guid"),
                            "type": e.get("typeName"),
                            "owner": meta["owner"] if meta else "Data Team",
                            "classification": meta["classification"] if meta else "Standard",
                            "sensitivity": meta["sensitivity"] if meta else "Normale",
                            "description": meta["description"] if meta else attrs.get("description", ""),
                            "columns": meta["columns"] if meta else [],
                            "lineage": meta["lineage"] if meta else {"inputs": [], "outputs": []}
                        })
                    if tables:
                        order = ["clients", "agences", "comptes", "transactions", "transactions_suspectes", "reporting_mensuel"]
                        tables.sort(key=lambda x: order.index(x["name"]) if x["name"] in order else 99)
                        return tables
        except Exception:
            pass
    return BANKING_METADATA["tables"]

def get_impact_analysis(entity_name: str):
    # Chercher dans les tables
    table = next((t for t in BANKING_METADATA["tables"] if t["name"].lower() == entity_name.lower()), None)
    
    # Si c'est une colonne, trouver la table parente
    col_found = None
    if not table:
        for t in BANKING_METADATA["tables"]:
            if entity_name.lower() in [c.lower() for c in t["columns"]]:
                col_found = entity_name
                table = t
                break

    if not table:
        return {"error": f"Entité ou colonne '{entity_name}' non trouvée dans le catalogue."}

    # Calcul des impacts direct et indirect
    direct_processes = table["lineage"]["outputs"]
    direct_impacts = []
    indirect_tables = []
    indirect_processes = []

    for proc_name in direct_processes:
        proc = next((p for p in BANKING_METADATA["processes"] if p["name"] == proc_name), None)
        if proc:
            direct_impacts.append({"name": proc["name"], "kind": "Traitement", "level": 1, "description": proc["description"]})
            for out_table in proc["outputs"]:
                if out_table != table["name"]:
                    indirect_tables.append(out_table)
                    # Prochains traitements impactés
                    out_t_obj = next((t for t in BANKING_METADATA["tables"] if t["name"] == out_table), None)
                    if out_t_obj:
                        for next_proc in out_t_obj["lineage"]["outputs"]:
                            indirect_processes.append(next_proc)

    all_impacted_tables = list(set([table["name"]] + indirect_tables))
    all_impacted_processes = list(set(direct_processes + indirect_processes))

    return {
        "target": entity_name,
        "is_column": bool(col_found),
        "table_parent": table["name"],
        "owner": table["owner"],
        "sensitivity": table["sensitivity"],
        "description": table["description"],
        "direct_impacts": direct_impacts,
        "impacted_tables": all_impacted_tables,
        "impacted_processes": all_impacted_processes,
        "lineage_flow": {
            "sources": table["lineage"]["inputs"] or [table["name"]],
            "treatment": direct_processes[0] if direct_processes else "Aucun",
            "utilization": indirect_processes,
            "outputs": indirect_tables
        }
    }
