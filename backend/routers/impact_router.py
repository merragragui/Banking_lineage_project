import requests
from requests.auth import HTTPBasicAuth
from fastapi import APIRouter, Depends, Query
from auth import get_current_user
from models import User
from rag.atlas_client import get_impact_analysis, BANKING_METADATA
from rag.atlas_column_lineage import analyze_column_downstream_impact

ATLAS_URL = "http://localhost:21000/api/atlas/v2"
ATLAS_AUTH = HTTPBasicAuth("admin", "admin")

router = APIRouter(prefix="/api/impact", tags=["Analyse d'Impact"])

@router.get("/analyze")
def analyze_impact(
    target: str = Query("transactions", description="Nom de la table ou colonne"),
    current_user: User = Depends(get_current_user)
):
    result = get_impact_analysis(target)
    return result

@router.get("/column-impact/{table_name}/{column_name}")
def get_column_impact(
    table_name: str,
    column_name: str,
    direction: str = Query("OUTPUT", description="Direction du lineage: OUTPUT (Aval), INPUT (Amont), BOTH (Les deux)")
):
    """
    ANALYSE D'IMPACT DE COLONNE DIRECTEMENT BASÉE SUR APACHE ATLAS (SOURCE DE VÉRITÉ)
    """
    return analyze_column_downstream_impact(table_name, column_name, direction)
