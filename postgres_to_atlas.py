#!/usr/bin/env python3
"""
postgres_to_atlas.py
=====================

Automatise la publication des metadonnees d'une base Postgres vers Apache Atlas :
  1. Lit information_schema.tables / information_schema.columns
  2. Cree les entites rdbms_db, rdbms_table, rdbms_column dans Atlas
  3. Cree le lineage (entites Process) entre les tables selon un mapping defini

Prerequis :
    pip install psycopg2-binary requests

Usage :
    python postgres_to_atlas.py
"""

import requests
import psycopg2
import psycopg2.extras
import sys
import traceback

# ------------------------------------------------------------------
# CONFIGURATION - a adapter a votre environnement
# ------------------------------------------------------------------

PG_CONFIG = {
    "host": "localhost",
    "port": 5432,
    "dbname": "banking_lineage",
    "user": "postgres",
    "password": "postgres",
}

ATLAS_URL = "http://localhost:21000/api/atlas/v2"
ATLAS_AUTH = ("admin", "admin")  

CLUSTER_NAME = "cluster1"          
INSTANCE_QUALIFIED_NAME = f"postgres-bank@{CLUSTER_NAME}"
DB_QUALIFIED_NAME = f"banking_lineage@{CLUSTER_NAME}"

LINEAGE_MAP = [
    {
        "process_name": "alimentation_comptes",
        "description": "Ouverture et alimentation des comptes clients par agence",
        "inputs": ["clients", "agences"],
        "outputs": ["comptes"],
    },
    {
        "process_name": "generation_transactions",
        "description": "Generation des transactions bancaires sur les comptes existants",
        "inputs": ["comptes"],
        "outputs": ["transactions"],
    },
    {
        "process_name": "detection_transactions_suspectes",
        "description": "Detection des transactions a risque (montant > 50000 MAD, virement inhabituel)",
        "inputs": ["transactions"],
        "outputs": ["transactions_suspectes"],
    },
    {
        "process_name": "agregation_reporting_mensuel",
        "description": "Agregation mensuelle du nombre de transactions et montants par agence",
        "inputs": ["transactions", "comptes", "agences"],
        "outputs": ["reporting_mensuel"],
    },
]

# Mapping du Lineage au Niveau des Colonnes (Column-Level Lineage)
COLUMN_LINEAGE_MAP = [
    {
        "process_name": "col_alimentation_comptes_client_id",
        "description": "Propagation de la clé client vers la table comptes",
        "source": {"table": "clients", "column": "client_id"},
        "target": {"table": "comptes", "column": "client_id"},
        "transformation": "Clé Étrangère FK (Rattachement compte au client)"
    },
    {
        "process_name": "col_generation_transactions_client_link",
        "description": "Transmission de la référence client vers le compte émetteur de la transaction",
        "source": {"table": "comptes", "column": "client_id"},
        "target": {"table": "transactions", "column": "compte_source_id"},
        "transformation": "Rattachement client aux transactions"
    },
    {
        "process_name": "col_alimentation_comptes_agence_id",
        "description": "Propagation de l'agence de rattachement vers la table comptes",
        "source": {"table": "agences", "column": "agence_id"},
        "target": {"table": "comptes", "column": "agence_id"},
        "transformation": "Affectation agence d'ouverture"
    },
    {
        "process_name": "col_generation_transactions_compte_source",
        "description": "Association du compte émetteur à la transaction financière",
        "source": {"table": "comptes", "column": "compte_id"},
        "target": {"table": "transactions", "column": "compte_source_id"},
        "transformation": "Débit du compte émetteur (FK)"
    },
    {
        "process_name": "col_detection_transactions_suspectes_score",
        "description": "Calcul du score de risque de suspicion AML sur les mouvements",
        "source": {"table": "transactions", "column": "montant"},
        "target": {"table": "transactions_suspectes", "column": "score_risque"},
        "transformation": "Seuil > 50 000 MAD / Scoring de risque AML"
    },
    {
        "process_name": "col_detection_transactions_suspectes_link",
        "description": "Rattachement de l'identifiant transaction suspecte",
        "source": {"table": "transactions", "column": "transaction_id"},
        "target": {"table": "transactions_suspectes", "column": "transaction_id"},
        "transformation": "Copie identifiant de transaction signalée"
    },
    {
        "process_name": "col_agregation_reporting_montant_total",
        "description": "Sommation mensuelle du volume financier des opérations par agence",
        "source": {"table": "transactions", "column": "montant"},
        "target": {"table": "reporting_mensuel", "column": "montant_total"},
        "transformation": "SUM(montant) par agence et par mois"
    },
    {
        "process_name": "col_detection_transactions_suspectes_client_risk",
        "description": "Propagations des opérations du client vers la détection de risque AML",
        "source": {"table": "transactions", "column": "compte_source_id"},
        "target": {"table": "transactions_suspectes", "column": "score_risque"},
        "transformation": "Analyse de risque AML par compte client"
    },
    {
        "process_name": "col_agregation_reporting_client_total",
        "description": "Aggregation des mouvements du compte client dans le reporting mensuel",
        "source": {"table": "transactions", "column": "compte_source_id"},
        "target": {"table": "reporting_mensuel", "column": "montant_total"},
        "transformation": "SUM(opérations client) par mois"
    }
]

HEADERS = {"Content-Type": "application/json"}


# ------------------------------------------------------------------
# 1. LECTURE DU SCHEMA POSTGRES
# ------------------------------------------------------------------

def read_postgres_schema():
    """Retourne { table_name: [ {column_name, data_type, is_nullable}, ... ] }"""

    # On force l'encodage cote client AVANT toute requete, pour eviter
    # les erreurs de decodage sur les colonnes contenant des accents
    # (ex: villes 'Fes', 'Gueliz' inserees via une console non-UTF8).
    conn = psycopg2.connect(
        host=PG_CONFIG["host"],
        port=PG_CONFIG["port"],
        dbname=PG_CONFIG["dbname"],
        user=PG_CONFIG["user"],
        password=PG_CONFIG["password"],
        options="-c client_encoding=LATIN1",
    )
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    cur.execute("""
        SELECT table_name, column_name, data_type, is_nullable, ordinal_position
        FROM information_schema.columns
        WHERE table_schema = 'public'
        ORDER BY table_name, ordinal_position;
    """)
    rows = cur.fetchall()
    cur.close()
    conn.close()

    schema = {}
    for row in rows:
        schema.setdefault(row["table_name"], []).append(row)
    return schema


# ------------------------------------------------------------------
# 2. HELPERS ATLAS
# ------------------------------------------------------------------

def atlas_post_entity(payload):
    resp = requests.post(
        f"{ATLAS_URL}/entity",
        auth=ATLAS_AUTH,
        headers=HEADERS,
        json=payload,
        timeout=30,
    )
    if resp.status_code not in (200, 201):
        print(f"  [ERREUR] {resp.status_code} : {resp.text}")
    else:
        print(f"  [OK] entite creee/mise a jour")
    return resp


def table_qualified_name(table_name):
    return f"banking_lineage.public.{table_name}@{CLUSTER_NAME}"


def column_qualified_name(table_name, column_name):
    return f"banking_lineage.public.{table_name}.{column_name}@{CLUSTER_NAME}"


# ------------------------------------------------------------------
# 3. CREATION DU SERVEUR (rdbms_instance) PUIS DE LA BASE (rdbms_db)
# ------------------------------------------------------------------

def create_instance_entity():
    """rdbms_db exige un parent rdbms_instance (le serveur Postgres) :
    on le cree en premier, sinon Atlas refuse rdbms_db avec une erreur
    'mandatory attribute value missing'."""
    print("Creation de l'entite rdbms_instance...")
    payload = {
        "entity": {
            "typeName": "rdbms_instance",
            "attributes": {
                "qualifiedName": INSTANCE_QUALIFIED_NAME,
                "name": "postgres-bank",
                "description": "Instance Postgres (conteneur Docker postgres-bank)",
                "rdbms_type": "PostgreSQL",
            },
        }
    }
    atlas_post_entity(payload)


def create_database_entity():
    print("Creation de l'entite rdbms_db...")
    payload = {
        "entity": {
            "typeName": "rdbms_db",
            "attributes": {
                "qualifiedName": DB_QUALIFIED_NAME,
                "name": "banking_lineage",
                "description": "Base pilote lineage bancaire",
                "instance": {
                    "typeName": "rdbms_instance",
                    "uniqueAttributes": {"qualifiedName": INSTANCE_QUALIFIED_NAME},
                },
            },
        }
    }
    atlas_post_entity(payload)


# ------------------------------------------------------------------
# 4. CREATION DES TABLES ET COLONNES (rdbms_table / rdbms_column)
# ------------------------------------------------------------------

def create_table_entity(table_name, columns):
    print(f"Creation de la table '{table_name}'...")

    # 1) Creer la table SEULE, sans colonnes imbriquees.
    #    L'API /entity refuse les objets imbriques completement definis
    #    (elle attend une simple reference guid/uniqueAttributes) : on
    #    cree donc la table d'abord, puis chaque colonne separement.
    table_payload = {
        "entity": {
            "typeName": "rdbms_table",
            "attributes": {
                "qualifiedName": table_qualified_name(table_name),
                "name": table_name,
                "db": {
                    "typeName": "rdbms_db",
                    "uniqueAttributes": {"qualifiedName": DB_QUALIFIED_NAME},
                },
            },
        }
    }
    atlas_post_entity(table_payload)

    # 2) Creer chaque colonne, en reference vers la table qui vient d'etre creee.
    for col in columns:
        print(f"  Creation de la colonne '{col['column_name']}'...")
        column_payload = {
            "entity": {
                "typeName": "rdbms_column",
                "attributes": {
                    "qualifiedName": column_qualified_name(table_name, col["column_name"]),
                    "name": col["column_name"],
                    "data_type": col["data_type"],
                    "isNullable": col["is_nullable"] == "YES",
                    "table": {
                        "typeName": "rdbms_table",
                        "uniqueAttributes": {"qualifiedName": table_qualified_name(table_name)},
                    },
                },
            }
        }
        atlas_post_entity(column_payload)


# ------------------------------------------------------------------
# 5. CREATION DU LINEAGE (Process)
# ------------------------------------------------------------------

def create_process_entity(process_name, description, input_tables, output_tables):
    print(f"Creation du lineage '{process_name}' : {input_tables} -> {output_tables}")

    inputs = [
        {"typeName": "rdbms_table", "uniqueAttributes": {"qualifiedName": table_qualified_name(t)}}
        for t in input_tables
    ]
    outputs = [
        {"typeName": "rdbms_table", "uniqueAttributes": {"qualifiedName": table_qualified_name(t)}}
        for t in output_tables
    ]

    payload = {
        "entity": {
            "typeName": "Process",
            "attributes": {
                "qualifiedName": f"{process_name}@banking_lineage",
                "name": process_name,
                "description": description,
                "inputs": inputs,
                "outputs": outputs,
            },
        }
    }
    atlas_post_entity(payload)


def create_column_process_entity(process_name, description, source, target, transformation):
    src_table = source["table"]
    src_col = source["column"]
    tgt_table = target["table"]
    tgt_col = target["column"]

    print(f"Creation du lineage de colonne '{process_name}' : {src_table}.{src_col} -> {tgt_table}.{tgt_col}")

    inputs = [
        {
            "typeName": "rdbms_column",
            "uniqueAttributes": {"qualifiedName": column_qualified_name(src_table, src_col)}
        }
    ]
    outputs = [
        {
            "typeName": "rdbms_column",
            "uniqueAttributes": {"qualifiedName": column_qualified_name(tgt_table, tgt_col)}
        }
    ]

    payload = {
        "entity": {
            "typeName": "Process",
            "attributes": {
                "qualifiedName": f"{process_name}@banking_lineage",
                "name": process_name,
                "description": f"{description} | Transformation: {transformation}",
                "inputs": inputs,
                "outputs": outputs,
            },
        }
    }
    atlas_post_entity(payload)


# ------------------------------------------------------------------
# MAIN
# ------------------------------------------------------------------

def main():
    print("=" * 60)
    print("1/4 - Lecture du schema Postgres")
    print("=" * 60)
    try:
        schema = read_postgres_schema()
    except Exception as e:
        print(f"Impossible de lire Postgres : {e}")
        traceback.print_exc()
        sys.exit(1)

    print(f"{len(schema)} tables trouvees : {list(schema.keys())}\n")

    print("=" * 60)
    print("2/4 - Publication des entites dans Atlas")
    print("=" * 60)
    create_instance_entity()
    create_database_entity()
    for table_name, columns in schema.items():
        create_table_entity(table_name, columns)

    print()
    print("=" * 60)
    print("3/4 - Publication du lineage de tables")
    print("=" * 60)
    for process in LINEAGE_MAP:
        create_process_entity(
            process["process_name"],
            process["description"],
            process["inputs"],
            process["outputs"],
        )

    print()
    print("=" * 60)
    print("4/4 - Publication du lineage de colonnes (Column-Level Lineage)")
    print("=" * 60)
    for col_proc in COLUMN_LINEAGE_MAP:
        create_column_process_entity(
            col_proc["process_name"],
            col_proc["description"],
            col_proc["source"],
            col_proc["target"],
            col_proc["transformation"],
        )

    print("\nTermine. Ouvrez http://localhost:21000, recherchez une entite colonne (ex: 'montant'),")
    print("puis consultez le Column-Level Lineage dans Apache Atlas.")


if __name__ == "__main__":
    main()