from fastapi import APIRouter, Depends
from auth import get_current_user
from models import User
from rag.atlas_client import BANKING_METADATA
from rag.atlas_column_lineage import RAW_COLUMN_FLOWS

router = APIRouter(prefix="/api/pipelines", tags=["Pipelines & Lineage"])

@router.get("")
def get_pipelines(current_user: User = Depends(get_current_user)):
    # Flux complet du système bancaire
    flow_steps = [
        {
            "id": 1,
            "source_tables": ["clients", "agences"],
            "process": "alimentation_comptes",
            "process_description": "Ouverture et alimentation des comptes clients par agence",
            "target_tables": ["comptes"]
        },
        {
            "id": 2,
            "source_tables": ["comptes"],
            "process": "generation_transactions",
            "process_description": "Génération et enregistrement des mouvements financiers sur les comptes bancaires",
            "target_tables": ["transactions"]
        },
        {
            "id": 3,
            "source_tables": ["transactions"],
            "process": "detection_transactions_suspectes",
            "process_description": "Détection automatique des transactions à risque (seuil > 50 000 MAD, comportement anormal)",
            "target_tables": ["transactions_suspectes"]
        },
        {
            "id": 4,
            "source_tables": ["agences", "comptes", "transactions"],
            "process": "agregation_reporting_mensuel",
            "process_description": "Agrégation mensuelle du nombre et du volume financier des opérations par agence",
            "target_tables": ["reporting_mensuel"]
        }
    ]

    return {
        "title": "Pipeline Général Banking Lineage",
        "total_steps": len(flow_steps),
        "steps": flow_steps,
        "tables": BANKING_METADATA["tables"],
        "processes": BANKING_METADATA["processes"]
    }

@router.get("/column-lineage/{table_name}/{column_name}")
def get_column_lineage(table_name: str, column_name: str, current_user: User = Depends(get_current_user)):
    t = table_name.lower().strip()
    c = column_name.lower().strip()

    # Dictionnaire canonique du Column-Level Lineage (Module Unifié Atlas)
    column_flows = RAW_COLUMN_FLOWS

    # Reconstitution dynamique des nœuds et arêtes du flow
    matched_flows = []
    for f in column_flows:
        if (f["source"]["table"] == t and f["source"]["column"] == c) or (f["target"]["table"] == t and f["target"]["column"] == c):
            matched_flows.append(f)

    # Si aucune correspondance spécifique n'existe, générer un flow explicatif complet
    if not matched_flows:
        matched_flows = [
            {
                "source": {"table": t, "column": c},
                "process": f"traitement_{t}",
                "target": {"table": "reporting_mensuel", "column": "nombre_transactions"},
                "transformation": "Transformation et consolidation standard"
            }
        ]

    nodes = []
    edges = []
    node_ids = set()

    for flow in matched_flows:
        src_id = f"{flow['source']['table']}.{flow['source']['column']}"
        proc_id = flow['process']
        tgt_id = f"{flow['target']['table']}.{flow['target']['column']}"

        if src_id not in node_ids:
            nodes.append({"id": src_id, "label": src_id, "table": flow['source']['table'], "column": flow['source']['column'], "type": "column", "is_selected": (src_id == f"{t}.{c}")})
            node_ids.add(src_id)

        if proc_id not in node_ids:
            nodes.append({"id": proc_id, "label": proc_id, "type": "process"})
            node_ids.add(proc_id)

        if tgt_id not in node_ids:
            nodes.append({"id": tgt_id, "label": tgt_id, "table": flow['target']['table'], "column": flow['target']['column'], "type": "column", "is_selected": (tgt_id == f"{t}.{c}")})
            node_ids.add(tgt_id)

        edges.append({"from": src_id, "to": proc_id, "label": "alimente"})
        edges.append({"from": proc_id, "to": tgt_id, "label": flow['transformation']})

    return {
        "selected_table": t,
        "selected_column": c,
        "has_lineage": True,
        "matched_flows": matched_flows,
        "nodes": nodes,
        "edges": edges
    }

@router.get("/atlas-column-lineage/{table_name}/{column_name}")
def get_atlas_column_lineage(
    table_name: str,
    column_name: str,
    direction: str = "BOTH"
):
    import requests

    ATLAS_URL = "http://localhost:21000/api/atlas/v2"
    ATLAS_AUTH = ("admin", "admin")

    t = table_name.lower().strip()
    c = column_name.lower().strip()
    dir_upper = direction.upper().strip()

    # 1. Rechercher l'entité rdbms_column dans Atlas
    col_guid = None
    search_url = f"{ATLAS_URL}/search/attribute"
    try:
        resp = requests.get(search_url, params={"typeName": "rdbms_column", "attrName": "name", "attrValuePrefix": c}, auth=ATLAS_AUTH, timeout=10)
        if resp.status_code == 200:
            entities = resp.json().get("entities", [])
            for e in entities:
                qname = e.get("attributes", {}).get("qualifiedName", "").lower()
                if f"{t}.{c}" in qname or t in qname:
                    col_guid = e.get("guid")
                    break
            if not col_guid and entities:
                col_guid = entities[0].get("guid")
    except Exception as err:
        print(f"Erreur recherche Atlas: {err}")

    if not col_guid:
        return {
            "selected_table": t,
            "selected_column": c,
            "direction": dir_upper,
            "nodes": [],
            "edges": [],
            "error": f"Colonne {t}.{c} non trouvée dans Apache Atlas."
        }

    # 2. Interroger le lineage d'Atlas
    lin_url = f"{ATLAS_URL}/lineage/{col_guid}"
    try:
        lin_resp = requests.get(lin_url, params={"direction": dir_upper}, auth=ATLAS_AUTH, timeout=10)
        if lin_resp.status_code != 200:
            return {
                "selected_table": t,
                "selected_column": c,
                "direction": dir_upper,
                "nodes": [],
                "edges": [],
                "error": "Impossible d'interroger le lineage Apache Atlas."
            }
        lin_data = lin_resp.json()
    except Exception as err:
        return {
            "selected_table": t,
            "selected_column": c,
            "direction": dir_upper,
            "nodes": [],
            "edges": [],
            "error": str(err)
        }

    guid_map = lin_data.get("guidEntityMap", {})
    relations = lin_data.get("relations", [])

    def clean_process_name(raw_name):
        n = raw_name.lower()
        if "alimentation_comptes" in n:
            return "Alimentation des Comptes"
        elif "generation_transactions" in n:
            return "Génération des Transactions"
        elif "detection_transactions_suspectes" in n or "fraude" in n:
            return "Détection de Fraude AML"
        elif "agregation_reporting" in n or "reporting" in n:
            return "Agrégation Reporting Mensuel"
        else:
            return raw_name.replace("col_", "").replace("_", " ").title()

    # Build adjacency list & in-degree for DFS
    adj = {}
    in_degree = {g: 0 for g in guid_map}
    inputs_map = {}
    outputs_map = {}

    for rel in relations:
        src = rel["fromEntityId"]
        dst = rel["toEntityId"]
        adj.setdefault(src, []).append(dst)
        in_degree[dst] = in_degree.get(dst, 0) + 1
        inputs_map.setdefault(dst, []).append(src)
        outputs_map.setdefault(src, []).append(dst)

    # Roots are nodes with no incoming edges or the selected column
    roots = [g for g in guid_map if in_degree.get(g, 0) == 0]
    if not roots and col_guid in guid_map:
        roots = [col_guid]

    all_paths = []
    def dfs(current_path):
        curr = current_path[-1]
        neighbors = adj.get(curr, [])
        if not neighbors:
            all_paths.append(list(current_path))
            return
        for nxt in neighbors:
            if nxt not in current_path:
                dfs(current_path + [nxt])

    for r in roots:
        dfs([r])

    # Convert paths to structured independent pathways
    pathways = []
    all_flat_nodes = []
    all_flat_edges = []
    processed_guids = set()

    for idx, path in enumerate(all_paths):
        path_nodes = []
        for g in path:
            ent = guid_map.get(g, {})
            type_name = ent.get("typeName", "")
            attrs = ent.get("attributes", {})
            qname = attrs.get("qualifiedName", "")
            disp_name = attrs.get("name") or ent.get("displayText", "")
            desc = attrs.get("description", "")
            owner = attrs.get("owner", "").strip() or "Non renseigné"
            classifications = ent.get("classificationNames", [])
            class_str = ", ".join(classifications) if classifications else "Non renseignée"

            table_belong = ""
            col_belong = ""
            node_type = "column"
            color = "#3D0C02"

            if type_name == "rdbms_column":
                parts = qname.split("@")[0].split(".")
                table_belong = parts[-2] if len(parts) >= 2 else t
                col_belong = disp_name
                if table_belong in ["reporting_mensuel", "transactions_suspectes"]:
                    node_type = "reporting"
                    color = "#3D0C02"
                else:
                    node_type = "column"
                    color = "#3D0C02"
            elif type_name == "rdbms_table":
                node_type = "table"
                color = "#10B981"
                table_belong = disp_name
            elif type_name == "Process":
                node_type = "process"
                color = "#F36F21"
                disp_name = clean_process_name(disp_name)

            trans_text = ""
            if "Transformation:" in desc:
                trans_text = desc.split("Transformation:")[1].strip()
            elif desc:
                trans_text = desc

            input_names = [guid_map.get(ig, {}).get("attributes", {}).get("name", ig) for ig in inputs_map.get(g, [])]
            output_names = [guid_map.get(og, {}).get("attributes", {}).get("name", og) for og in outputs_map.get(g, [])]

            node_obj = {
                "id": g,
                "guid": g,
                "label": disp_name,
                "qualified_name": qname,
                "type_name": type_name,
                "node_type": node_type,
                "color": color,
                "table": table_belong,
                "column": col_belong,
                "description": desc or "Entité de métadonnées enregistrée dans le catalogue Apache Atlas",
                "owner": owner,
                "classification": class_str,
                "transformation": trans_text or "Transformation standard du pipeline",
                "inputs": input_names,
                "outputs": output_names,
                "is_selected": (g == col_guid)
            }

            path_nodes.append(node_obj)
            if g not in processed_guids:
                all_flat_nodes.append(node_obj)
                processed_guids.add(g)

        # Build path display name
        src_label = f"{path_nodes[0]['table']}.{path_nodes[0]['label']}" if path_nodes[0]['table'] else path_nodes[0]['label']
        dst_label = f"{path_nodes[-1]['table']}.{path_nodes[-1]['label']}" if path_nodes[-1]['table'] else path_nodes[-1]['label']
        path_title = f"Chemin {idx + 1} : {src_label} ➔ {dst_label}"

        pathways.append({
            "path_id": idx + 1,
            "title": path_title,
            "nodes": path_nodes
        })

    for rel in relations:
        all_flat_edges.append({"from": rel["fromEntityId"], "to": rel["toEntityId"]})

    return {
        "selected_table": t,
        "selected_column": c,
        "direction": dir_upper,
        "guid": col_guid,
        "pathways": pathways,
        "nodes": all_flat_nodes,
        "edges": all_flat_edges,
        "stats": {
            "pathways_count": len(pathways),
            "total_nodes": len(all_flat_nodes),
            "total_edges": len(all_flat_edges)
        }
    }


