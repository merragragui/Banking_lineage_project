import os
import sys

root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

from backend.rag.atlas_column_lineage import analyze_column_downstream_impact

print("==================================================")
print("TEST DU MODULE UNIFIÉ D'ANALYSE D'IMPACT APACHE ATLAS")
print("==================================================")

# TEST 1 : clients.client_id
res1 = analyze_column_downstream_impact("clients", "client_id")
print("\n--- TEST 1 : clients.client_id ---")
print(f"Colonne analysée : {res1['analysed_column']}")
print(f"Colonnes impactées : {res1['impacted_columns']}")
print(f"Traitements impactés : {[p['business_name'] for p in res1['impacted_processes']]}")
print(f"Tables impactées : {res1['impacted_tables']}")
print(f"Niveau de Risque : {res1['criticality_level']}")
print(f"Justification Atlas : {res1['risk_explanation']}")
assert "comptes.client_id" in res1['impacted_columns']
assert len(res1['impacted_processes']) > 0

# TEST 2 : comptes.compte_id
res2 = analyze_column_downstream_impact("comptes", "compte_id")
print("\n--- TEST 2 : comptes.compte_id ---")
print(f"Colonne analysée : {res2['analysed_column']}")
print(f"Colonnes impactées : {res2['impacted_columns']}")
print(f"Traitements impactés : {[p['business_name'] for p in res2['impacted_processes']]}")
print(f"Tables impactées : {res2['impacted_tables']}")
print(f"Niveau de Risque : {res2['criticality_level']}")
print(f"Justification Atlas : {res2['risk_explanation']}")
assert "transactions.compte_source_id" in res2['impacted_columns']

# TEST 3 : transactions.montant
res3 = analyze_column_downstream_impact("transactions", "montant")
print("\n--- TEST 3 : transactions.montant ---")
print(f"Colonne analysée : {res3['analysed_column']}")
print(f"Colonnes impactées : {res3['impacted_columns']}")
print(f"Traitements impactés : {[p['business_name'] for p in res3['impacted_processes']]}")
print(f"Tables impactées : {res3['impacted_tables']}")
print(f"Rapports impactés : {res3['impacted_reports']}")
print(f"Niveau de Risque : {res3['criticality_level']}")
print(f"Justification Atlas : {res3['risk_explanation']}")
assert "transactions_suspectes.score_risque" in res3['impacted_columns']
assert "reporting_mensuel.montant_total" in res3['impacted_columns']
assert len(res3['impacted_processes']) == 2

# TEST 4 : reporting_mensuel.montant_total (Pas de downstream)
res4 = analyze_column_downstream_impact("reporting_mensuel", "montant_total")
print("\n--- TEST 4 : reporting_mensuel.montant_total (Terminal) ---")
print(f"Colonne analysée : {res4['analysed_column']}")
print(f"Colonnes impactées : {res4['impacted_columns']}")
print(f"Justification Atlas : {res4['risk_explanation']}")
assert len(res4['impacted_columns']) == 0
assert "Aucun impact downstream" in res4['risk_explanation']

print("\n==================================================")
print("TOUS LES TESTS D'ANALYSE D'IMPACT ONT RÉUSSI (100% CONFORME ATLAS)")
print("==================================================")
