from typing import Optional
from fastapi import APIRouter, Depends, Query
from auth import get_current_user
from models import User
from rag.atlas_client import get_catalogue_tables, BANKING_METADATA

router = APIRouter(prefix="/api/catalogue", tags=["Catalogue de Métadonnées"])

@router.get("/tables")
def get_tables(
    query: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user)
):
    tables = get_catalogue_tables()
    if query:
        q = query.lower()
        tables = [
            t for t in tables
            if q in t["name"].lower()
            or q in t["description"].lower()
            or q in t["owner"].lower()
            or any(q in c.lower() for c in t.get("columns", []))
        ]
    return {
        "total": len(tables),
        "tables": tables
    }

@router.get("/processes")
def get_processes(current_user: User = Depends(get_current_user)):
    return {
        "total": len(BANKING_METADATA["processes"]),
        "processes": BANKING_METADATA["processes"]
    }
