import os
import sys
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base, SessionLocal
from models import User
from auth import get_password_hash

# Inclure le sous-dossier actuel pour les imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from routers.auth_router import router as auth_router
from routers.users_router import router as users_router
from routers.dashboard_router import router as dashboard_router
from routers.catalogue_router import router as catalogue_router
from routers.impact_router import router as impact_router
from routers.pipelines_router import router as pipelines_router
from routers.chat_router import router as chat_router
from routers.settings_router import router as settings_router

# Création des tables dans la base de données PostgreSQL / SQLite
Base.metadata.create_all(bind=engine)

def seed_default_users():
    db = SessionLocal()
    try:
        # Administrateur par défaut (merragragui@gmail.com / om1234)
        admin_user = db.query(User).filter(User.email == "merragragui@gmail.com").first()
        if not admin_user:
            admin = User(
                email="merragragui@gmail.com",
                full_name="Meriam Erragragui",
                password_hash=get_password_hash("om1234"),
                role="admin",
                is_active=True
            )
            db.add(admin)
        else:
            admin_user.full_name = "Meriam Erragragui"
            admin_user.password_hash = get_password_hash("om1234")
            admin_user.role = "admin"

        db.commit()
    except Exception as e:
        print(f"Initialisation des utilisateurs : {e}")
        db.rollback()
    finally:
        db.close()

seed_default_users()

app = FastAPI(
    title="Banque Populaire - Plateforme de Data Lineage & Assistant IA",
    description="Backend FastAPI pour l'automatisation et l'interrogation intelligente du Data Lineage Apache Atlas",
    version="2.0.0"
)

# Activation CORS pour le Frontend React Vite
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Montage des routers
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(dashboard_router)
app.include_router(catalogue_router)
app.include_router(impact_router)
app.include_router(pipelines_router)
app.include_router(chat_router)
app.include_router(settings_router)

@app.get("/api/health")
def health_check():
    return {
        "status": "online",
        "service": "Banque Populaire Data Lineage API",
        "version": "2.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
