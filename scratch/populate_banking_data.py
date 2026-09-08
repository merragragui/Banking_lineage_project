import sys
import random
from datetime import datetime, timedelta
sys.path.insert(0, 'backend')
from database import SessionLocal
from sqlalchemy import text

db = SessionLocal()

print("Populating rich realistic banking dataset in PostgreSQL...")

# 1. Fetch agences
agencies = db.execute(text("SELECT agence_id, nom_agence FROM agences")).fetchall()
if not agencies:
    db.execute(text("INSERT INTO agences (nom_agence, ville) VALUES ('Casablanca Main', 'Casablanca'), ('Rabat Hassan', 'Rabat'), ('Marrakech Guéliz', 'Marrakech'), ('Tanger Ville', 'Tanger'), ('Agadir Marina', 'Agadir')"))
    db.commit()
    agencies = db.execute(text("SELECT agence_id, nom_agence FROM agences")).fetchall()

agency_ids = [a[0] for a in agencies]

# 2. Add clients if needed up to 250
current_client_count = db.execute(text("SELECT COUNT(*) FROM clients")).scalar()
first_names = ["Youssef", "Fatima", "Omar", "Khadija", "Amine", "Sara", "Mehdi", "Hajar", "Karim", "Zineb", "Hamza", "Salma", "Othmane", "Nadia", "Tarik", "Meryem", "Reda", "Leila", "Anass", "Houda"]
last_names = ["Benali", "El Amrani", "Berrada", "Alaoui", "Idrissi", "Chraibi", "Tahiri", "Tazi", "Bennani", "Slaoui", "El Mansouri", "Naciri", "Kettani", "Kadiri", "Ghellab"]

if current_client_count < 250:
    for i in range(current_client_count + 1, 251):
        fn = random.choice(first_names)
        ln = random.choice(last_names)
        email = f"{fn.lower()}.{ln.lower()}{i}@gmail.com"
        dob = datetime(1975, 1, 1) + timedelta(days=random.randint(0, 10000))
        dob_str = dob.strftime("%Y-%m-%d")
        dt_str = (datetime(2022, 1, 1) + timedelta(days=random.randint(0, 1000))).strftime("%Y-%m-%d %H:%M:%S")
        db.execute(text("INSERT INTO clients (nom, prenom, date_naissance, email, date_creation) VALUES (:nom, :prenom, :dob, :email, :dt)"),
                   {"nom": ln, "prenom": fn, "dob": dob_str, "email": email, "dt": dt_str})
    db.commit()

clients = db.execute(text("SELECT client_id FROM clients")).fetchall()
client_ids = [c[0] for c in clients]

# 3. Add comptes if needed up to 350
current_account_count = db.execute(text("SELECT COUNT(*) FROM comptes")).scalar()
types_compte = ["courant", "epargne", "entreprise"]

if current_account_count < 350:
    for i in range(current_account_count + 1, 351):
        cid = random.choice(client_ids)
        aid = random.choice(agency_ids)
        tc = random.choice(types_compte)
        solde = round(random.uniform(2000.0, 150000.0), 2)
        dt_str = (datetime(2023, 1, 1) + timedelta(days=random.randint(0, 700))).strftime("%Y-%m-%d %H:%M:%S")
        db.execute(text("INSERT INTO comptes (client_id, agence_id, type_compte, solde, date_ouverture) VALUES (:cid, :aid, :tc, :solde, :dt)"),
                   {"cid": cid, "aid": aid, "tc": tc, "solde": solde, "dt": dt_str})
    db.commit()

accounts = db.execute(text("SELECT compte_id FROM comptes")).fetchall()
account_ids = [acc[0] for acc in accounts]

# 4. Generate Transactions to reach 10,254 total transactions & ~18.75M MAD
current_tx_count = db.execute(text("SELECT COUNT(*) FROM transactions")).scalar()
target_tx_count = 10254
needed_tx = target_tx_count - current_tx_count

print(f"Current transactions: {current_tx_count}. Target: {target_tx_count}. Inserting {needed_tx} new transactions...")

tx_types = ["virement", "virement", "paiement", "paiement", "retrait", "depot"]
statuses = ["validee", "validee", "validee", "en_attente", "rejetee"]
dates_pool = [
    datetime(2026, 7, 29, random.randint(8, 20), random.randint(0, 59)),
    datetime(2026, 7, 31, random.randint(8, 20), random.randint(0, 59)),
    datetime(2026, 8, 2, random.randint(8, 20), random.randint(0, 59)),
    datetime(2026, 8, 4, random.randint(8, 20), random.randint(0, 59)),
    datetime(2026, 8, 5, random.randint(8, 20), random.randint(0, 59)),
    datetime(2026, 8, 6, random.randint(8, 20), random.randint(0, 59)),
    datetime(2026, 8, 10, random.randint(8, 20), random.randint(0, 59))
]

if needed_tx > 0:
    batch = []
    for i in range(needed_tx):
        src = random.choice(account_ids)
        dest = random.choice([a for a in account_ids if a != src])
        amt = round(random.triangular(100.0, 8000.0, 800.0), 2)
        ttype = random.choice(tx_types)
        stat = random.choice(statuses)
        dt = random.choice(dates_pool) + timedelta(minutes=random.randint(0, 1400))
        
        batch.append({
            "src": src,
            "dest": dest,
            "amt": amt,
            "devise": "MAD",
            "ttype": ttype,
            "stat": stat,
            "dt": dt.strftime("%Y-%m-%d %H:%M:%S")
        })

        if len(batch) >= 1000:
            db.execute(text("""
                INSERT INTO transactions (compte_source_id, compte_destination_id, montant, devise, type_transaction, statut, date_transaction)
                VALUES (:src, :dest, :amt, :devise, :ttype, :stat, :dt)
            """), batch)
            db.commit()
            batch = []

    if batch:
        db.execute(text("""
            INSERT INTO transactions (compte_source_id, compte_destination_id, montant, devise, type_transaction, statut, date_transaction)
            VALUES (:src, :dest, :amt, :devise, :ttype, :stat, :dt)
        """), batch)
        db.commit()

# 5. Populate transactions_suspectes up to 324
current_suspect_count = db.execute(text("SELECT COUNT(*) FROM transactions_suspectes")).scalar()
target_suspect = 324
needed_suspect = target_suspect - current_suspect_count

if needed_suspect > 0:
    tx_samples = db.execute(text("SELECT transaction_id FROM transactions ORDER BY montant DESC LIMIT 2000")).fetchall()
    tx_sample_ids = [t[0] for t in tx_samples]

    existing_suspect_tx_ids = set([s[0] for s in db.execute(text("SELECT transaction_id FROM transactions_suspectes")).fetchall()])
    available_tx_ids = [tid for tid in tx_sample_ids if tid not in existing_suspect_tx_ids]

    motifs = [
        "Montant inhabituellement élevé pour ce profil client",
        "Virement fractionné suspect (structuring)",
        "Cumul de retraits proche du seuil réglementaire sur une courte période",
        "Transaction effectuée en dehors des horaires habituels du client",
        "Compte destinataire associé à plusieurs alertes récentes",
        "Fréquence anormale de transactions sur 24h",
        "Transaction vers un compte destinataire jamais utilisé auparavant"
    ]

    suspect_batch = []
    for tid in available_tx_ids[:needed_suspect]:
        score = round(random.uniform(0.72, 0.98), 2)
        motif = random.choice(motifs)
        dt = (datetime(2026, 8, 1) + timedelta(days=random.randint(0, 9))).strftime("%Y-%m-%d %H:%M:%S")
        suspect_batch.append({
            "tid": tid,
            "score": score,
            "motif": motif,
            "dt": dt
        })

    if suspect_batch:
        db.execute(text("""
            INSERT INTO transactions_suspectes (transaction_id, score_risque, motif, date_detection)
            VALUES (:tid, :score, :motif, :dt)
        """), suspect_batch)
        db.commit()

# 6. Populate reporting_mensuel if needed
current_reports = db.execute(text("SELECT COUNT(*) FROM reporting_mensuel")).scalar()
if current_reports < 60:
    for aid in agency_ids:
        for mois in ["2026-03-01", "2026-04-01", "2026-05-01", "2026-06-01", "2026-07-01", "2026-08-01"]:
            existing_rep = db.execute(text("SELECT id FROM reporting_mensuel WHERE agence_id = :aid AND mois = :m"), {"aid": aid, "m": mois}).first()
            if not existing_rep:
                tx_c = random.randint(1500, 2500)
                tot_m = round(random.uniform(2500000.0, 4500000.0), 2)
                dt_g = (datetime(2026, 8, 1)).strftime("%Y-%m-%d %H:%M:%S")
                db.execute(text("INSERT INTO reporting_mensuel (agence_id, mois, nombre_transactions, montant_total, date_generation) VALUES (:aid, :m, :tx_c, :tot_m, :dt_g)"),
                           {"aid": aid, "m": mois, "tx_c": tx_c, "tot_m": tot_m, "dt_g": dt_g})
    db.commit()

final_tx = db.execute(text("SELECT COUNT(*) FROM transactions")).scalar()
final_amt = db.execute(text("SELECT SUM(montant) FROM transactions")).scalar()
final_susp = db.execute(text("SELECT COUNT(*) FROM transactions_suspectes")).scalar()

print(f"SUCCESS! Database populated successfully.")
print(f"Final Transactions: {final_tx}")
print(f"Final Total Amount: {final_amt:,.2f} MAD")
print(f"Final Suspect Transactions: {final_susp}")
