import psycopg2

def inspect():
    conn = psycopg2.connect(
        host="localhost",
        port=5432,
        user="postgres",
        password="postgres",
        dbname="banking_lineage"
    )
    cur = conn.cursor()

    print("==========================================================")
    print("TABLES EXISTANTES DANS LA BASE POSTGRESQL 'banking_lineage'")
    print("==========================================================")
    cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;")
    tables = cur.fetchall()
    for t in tables:
        print(f"  - {t[0]}")

    print("\n==========================================================")
    print("UTILISATEURS DANS LA TABLE 'users'")
    print("==========================================================")
    cur.execute("SELECT id, email, full_name, role, is_active, created_at FROM users;")
    users = cur.fetchall()
    for u in users:
        print(f"  * ID         : {u[0]}")
        print(f"    Email      : {u[1]}")
        print(f"    Nom        : {u[2]}")
        print(f"    Role       : {u[3]}")
        print(f"    Statut     : {'Actif' if u[4] else 'Inactif'}")
        print(f"    Cree le    : {u[5]}")
        print("  " + "-"*40)

    print("\n==========================================================")
    print("CONVERSATIONS DANS LA TABLE 'conversations'")
    print("==========================================================")
    cur.execute("SELECT id, user_id, title, created_at FROM conversations;")
    convs = cur.fetchall()
    print(f"  Total conversations : {len(convs)}")
    for c in convs:
        print(f"  * Conv ID    : {c[0]}")
        print(f"    Titre      : {c[2]}")
        print(f"    Creee le   : {c[3]}")
        print("  " + "-"*40)

    print("\n==========================================================")
    print("MESSAGES DANS LA TABLE 'messages'")
    print("==========================================================")
    cur.execute("SELECT id, conversation_id, sender, content, created_at FROM messages LIMIT 5;")
    msgs = cur.fetchall()
    print(f"  Apercu des derniers messages ({len(msgs)}) :")
    for m in msgs:
        print(f"  * [{m[2].upper()}] : {m[3][:60]}...")

    conn.close()

if __name__ == "__main__":
    inspect()
