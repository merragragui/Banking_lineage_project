#!/usr/bin/env python3
"""
Dashboard web local pour visualiser les indicateurs de couverture / complétude
et l'analyse d'impact du catalogue Atlas.

Installation :
    pip install flask requests

Usage :
    python dashboard.py
    puis ouvre http://localhost:5000 dans ton navigateur
"""

import json
import os
from collections import deque
from datetime import datetime

from flask import Flask, render_template_string, request
import requests
from requests.auth import HTTPBasicAuth

ATLAS_HOST = "http://localhost:21000"
ATLAS_USER = "admin"
ATLAS_PASSWORD = "admin"
TYPE_NAME = "rdbms_table"

TABLES_ATTENDUES = [
    "clients", "agences", "comptes", "transactions",
    "transactions_suspectes", "reporting_mensuel",
]

HISTORY_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "score_history.json")

MOIS_FR = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet",
           "août", "septembre", "octobre", "novembre", "décembre"]

app = Flask(__name__)
auth = HTTPBasicAuth(ATLAS_USER, ATLAS_PASSWORD)


# ------------------------------------------------------------------
# Indicateurs de couverture / complétude
# ------------------------------------------------------------------

def get_all_rdbms_tables():
    url = f"{ATLAS_HOST}/api/atlas/v2/search/basic"
    body = {"typeName": TYPE_NAME, "excludeDeletedEntities": True, "limit": 1000}
    resp = requests.post(url, json=body, auth=auth, timeout=15)
    resp.raise_for_status()
    return resp.json().get("entities", [])


def get_entity_details(guid):
    url = f"{ATLAS_HOST}/api/atlas/v2/entity/guid/{guid}"
    resp = requests.get(url, auth=auth, timeout=15)
    resp.raise_for_status()
    return resp.json().get("entity", {})


def has_lineage(guid):
    url = f"{ATLAS_HOST}/api/atlas/v2/lineage/{guid}"
    resp = requests.get(url, params={"direction": "BOTH", "depth": 1}, auth=auth, timeout=15)
    resp.raise_for_status()
    return len(resp.json().get("relations", [])) > 0


def has_description(entity_detail):
    description = entity_detail.get("attributes", {}).get("description")
    return bool(description and description.strip())


def compute_indicators():
    atlas_tables = get_all_rdbms_tables()
    atlas_table_names = {e.get("attributes", {}).get("name") for e in atlas_tables}

    presentes = [t for t in TABLES_ATTENDUES if t in atlas_table_names]
    manquantes = [t for t in TABLES_ATTENDUES if t not in atlas_table_names]
    taux_couverture = len(presentes) / len(TABLES_ATTENDUES) * 100 if TABLES_ATTENDUES else 0

    tables_avec_lineage, tables_sans_lineage = [], []
    tables_avec_description, tables_sans_description = [], []

    for entity in atlas_tables:
        name = entity.get("attributes", {}).get("name")
        if name not in TABLES_ATTENDUES:
            continue
        guid = entity["guid"]

        try:
            (tables_avec_lineage if has_lineage(guid) else tables_sans_lineage).append(name)
        except requests.exceptions.HTTPError:
            tables_sans_lineage.append(name)

        try:
            detail = get_entity_details(guid)
            (tables_avec_description if has_description(detail) else tables_sans_description).append(name)
        except requests.exceptions.HTTPError:
            tables_sans_description.append(name)

    n = len(presentes)
    taux_lineage = (len(tables_avec_lineage) / n * 100) if n else 0
    taux_description = (len(tables_avec_description) / n * 100) if n else 0
    score_global = (taux_couverture + taux_lineage + taux_description) / 3

    return {
        "taux_couverture": taux_couverture, "presentes": presentes, "manquantes": manquantes,
        "taux_lineage": taux_lineage, "tables_sans_lineage": tables_sans_lineage,
        "taux_description": taux_description, "tables_sans_description": tables_sans_description,
        "score_global": score_global,
    }


def record_score_history(score_global):
    """Enregistre le score du jour dans un petit fichier JSON local, pour tracer l'historique."""
    today = datetime.now().strftime("%Y-%m-%d")
    history = []
    if os.path.exists(HISTORY_FILE):
        try:
            with open(HISTORY_FILE, "r", encoding="utf-8") as f:
                history = json.load(f)
        except (json.JSONDecodeError, OSError):
            history = []

    history = [h for h in history if h.get("date") != today]
    history.append({"date": today, "score": round(score_global, 1)})
    history = history[-14:]  # on garde les 14 derniers jours

    try:
        with open(HISTORY_FILE, "w", encoding="utf-8") as f:
            json.dump(history, f)
    except OSError:
        pass

    return history


# ------------------------------------------------------------------
# Analyse d'impact (toujours en aval / OUTPUT)
# ------------------------------------------------------------------

def get_entity_by_name(table_name):
    url = f"{ATLAS_HOST}/api/atlas/v2/search/attribute"
    params = {"typeName": TYPE_NAME, "attrName": "name", "attrValuePrefix": table_name}
    resp = requests.get(url, params=params, auth=auth, timeout=15)
    resp.raise_for_status()
    entities = resp.json().get("entities", [])
    matches = [e for e in entities if e.get("attributes", {}).get("name") == table_name]
    return matches[0] if matches else None


def get_lineage_api(guid, depth=0):
    url = f"{ATLAS_HOST}/api/atlas/v2/lineage/{guid}"
    resp = requests.get(url, params={"direction": "OUTPUT", "depth": depth}, auth=auth, timeout=15)
    resp.raise_for_status()
    return resp.json()


def build_impact_report(lineage_data, base_guid):
    guid_entity_map = lineage_data.get("guidEntityMap", {})
    relations = lineage_data.get("relations", [])

    adjacency = {}
    for rel in relations:
        adjacency.setdefault(rel.get("fromEntityId"), []).append(rel.get("toEntityId"))

    visited = {base_guid: 0}
    queue = deque([base_guid])
    levels = {}

    while queue:
        current = queue.popleft()
        level = visited[current]
        if current != base_guid:
            levels.setdefault(level, []).append(current)
        for neighbor in adjacency.get(current, []):
            if neighbor not in visited:
                visited[neighbor] = level + 1
                queue.append(neighbor)

    report = []
    for level in sorted(levels.keys()):
        entries = []
        for guid in levels[level]:
            entity = guid_entity_map.get(guid, {})
            type_name = entity.get("typeName", "?")
            name = entity.get("attributes", {}).get("name") or entity.get("displayText", guid)
            kind = "Traitement" if "process" in type_name.lower() else "Table"
            entries.append({"name": name, "type": type_name, "kind": kind})
        entries.sort(key=lambda i: (i["kind"], i["name"]))
        report.append({"level": level, "entries": entries})
    return report


def score_badge(score):
    if score >= 90:
        return "Excellent", "#16a34a", "#dcfce7"
    if score >= 70:
        return "Bon", "#2563eb", "#dbeafe"
    if score >= 50:
        return "Correct", "#d97706", "#fef3c7"
    return "À améliorer", "#dc2626", "#fee2e2"


def format_date_fr(dt):
    return f"{dt.day} {MOIS_FR[dt.month - 1]} {dt.year} · {dt.strftime('%H:%M')}"


# ------------------------------------------------------------------
# Design commun
# ------------------------------------------------------------------

SIDEBAR_HTML = """
<div class="sidebar">
  <div class="brand">
    <div class="brand-icon">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M4 6C4 4.9 7.58 4 12 4C16.42 4 20 4.9 20 6C20 7.1 16.42 8 12 8C7.58 8 4 7.1 4 6Z" fill="white"/><path d="M4 6V18C4 19.1 7.58 20 12 20C16.42 20 20 19.1 20 18V6" stroke="white" stroke-width="1.6" fill="none"/><path d="M4 12C4 13.1 7.58 14 12 14C16.42 14 20 13.1 20 12" stroke="white" stroke-width="1.6" fill="none"/></svg>
    </div>
    <div class="brand-text">BANKING<br>LINEAGE</div>
  </div>
  <nav class="nav">
    <a href="/" class="nav-item {{ 'active' if active_page == 'dashboard' else '' }}">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/></svg>
      Dashboard
    </a>
    <a href="/impact" class="nav-item {{ 'active' if active_page == 'impact' else '' }}">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="12" cy="18" r="2.5"/><path d="M8 7.5L11 16M16 7.5L13 16"/></svg>
      Analyse d'impact
    </a>
  </nav>
</div>
"""

BASE_STYLE = """
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  * { box-sizing: border-box; }
  body {
    font-family: 'Inter', -apple-system, sans-serif;
    background: #f4f6fb;
    color: #1a2233;
    margin: 0;
    display: flex;
    min-height: 100vh;
  }
  .sidebar {
    width: 232px; flex-shrink: 0; min-height: 100vh;
    background: linear-gradient(180deg, #0f1e42 0%, #16295c 100%);
    padding: 26px 18px; color: white;
  }
  .brand { display:flex; align-items:center; gap:10px; padding: 0 8px 26px 8px; }
  .brand-icon { width:34px; height:34px; border-radius:9px; background:#2f6fed; display:flex; align-items:center; justify-content:center; flex-shrink:0;}
  .brand-text { font-size: 13px; font-weight: 700; line-height: 1.25; letter-spacing: 0.01em; }
  .nav { display:flex; flex-direction:column; gap: 4px; }
  .nav-item {
    display:flex; align-items:center; gap: 11px; color: #aab4cc; text-decoration:none;
    font-size: 13.5px; font-weight: 500; padding: 10px 12px; border-radius: 8px; transition: background 0.15s, color 0.15s;
  }
  .nav-item:hover { background: rgba(255,255,255,0.06); color: white; }
  .nav-item.active { background: #2f6fed; color: white; }

  .main { flex: 1; padding: 30px 38px 50px 38px; max-width: 1500px; }
  .top-bar { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 26px; flex-wrap: wrap; gap: 14px;}
  .top-bar h1 { font-size: 21px; font-weight: 700; margin: 0 0 4px 0; }
  .top-bar .subtitle { color: #6b7280; font-size: 13.5px; margin:0; }
  .top-actions { display:flex; gap: 10px; align-items:center; }
  .btn-refresh {
    display:flex; align-items:center; gap:7px; background:white; border:1px solid #e6e9f2; color:#374151;
    padding: 9px 15px; border-radius:8px; font-size:13px; font-weight:600; text-decoration:none; cursor:pointer;
  }
  .date-chip {
    display:flex; align-items:center; gap:7px; background:white; border:1px solid #e6e9f2; color:#374151;
    padding: 9px 15px; border-radius:8px; font-size:12.5px; font-weight:500;
  }
  .card { background: white; border: 1px solid #e6e9f2; border-radius: 14px; }
  .error { background:#fee2e2; border: 1px solid #fca5a5; padding:16px 20px; border-radius:10px; color:#991b1b; margin-top:16px; font-size: 14px;}
"""

TEMPLATE = """
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Dashboard qualité — banking_lineage</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
<style>
""" + BASE_STYLE + """
  .score-banner {
    background: linear-gradient(120deg, #2f6fed 0%, #1b4fd6 100%);
    border-radius: 16px; padding: 30px 34px; color: white; display:flex; align-items:center; gap: 30px;
    margin-bottom: 22px; position: relative; overflow:hidden;
  }
  .score-banner::after {
    content:""; position:absolute; right:-40px; top:-60px; width:220px; height:220px; border-radius:50%;
    background: rgba(255,255,255,0.06);
  }
  .score-left { min-width: 150px; }
  .score-eyebrow { font-size: 12px; letter-spacing:0.08em; opacity:0.75; font-weight:600; margin-bottom:6px;}
  .score-value { font-size: 44px; font-weight: 800; line-height:1; }
  .badge { display:inline-flex; align-items:center; gap:5px; margin-top:12px; background: rgba(255,255,255,0.18);
           padding: 5px 12px; border-radius: 20px; font-size: 12.5px; font-weight: 600; }
  .score-msg { font-size: 14.5px; opacity: 0.92; max-width: 380px; line-height:1.5; }
  .score-medal { margin-left:auto; width:64px; height:64px; border-radius:50%; background: rgba(255,255,255,0.14);
                 display:flex; align-items:center; justify-content:center; position:relative; z-index:1; flex-shrink:0;}

  .metrics-row { display:grid; grid-template-columns: repeat(3, 1fr); gap: 18px; margin-bottom: 22px; }
  .metric-card { padding: 22px; }
  .metric-top { display:flex; align-items:center; gap: 12px; margin-bottom: 14px; }
  .metric-icon { width:38px; height:38px; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0;}
  .metric-title { font-size: 13px; color:#4b5563; font-weight:600; }
  .metric-value { font-size: 26px; font-weight: 800; margin-bottom: 10px; }
  .metric-track { height:6px; border-radius:3px; background:#eef0f6; overflow:hidden; margin-bottom: 12px;}
  .metric-fill { height:100%; border-radius:3px; }
  .metric-note { font-size: 12.5px; color:#6b7280; }

  .bottom-row { display:grid; grid-template-columns: 1fr 1.35fr; gap: 18px; margin-bottom: 20px; }
  .panel-title { font-size: 14.5px; font-weight:700; padding: 20px 22px 4px 22px; }
  .donut-wrap { display:flex; align-items:center; gap: 26px; padding: 6px 22px 24px 22px; }
  .donut-box { position: relative; width: 170px; height: 170px; flex-shrink: 0; }
  .donut-box canvas { width: 170px !important; height: 170px !important; }
  .donut-center { position:absolute; top:0; left:0; width:100%; height:100%;
                  display:flex; flex-direction:column; align-items:center; justify-content:center; pointer-events:none; }
  .donut-center .val { font-size: 24px; font-weight: 800; color:#1a2233; line-height:1.1; }
  .donut-center .lbl { font-size: 11px; color:#6b7280; margin-top: 3px; }
  .legend-item { display:flex; align-items:center; gap:8px; font-size:13px; color:#374151; margin-bottom:10px; }
  .legend-dot { width:9px; height:9px; border-radius:50%; flex-shrink:0; }
  .legend-value { margin-left:auto; font-weight:700; }
  .legend-list { flex:1; }
  .chart-wrap { padding: 4px 22px 22px 22px; }

  .info-bar { display:flex; align-items:center; gap:10px; background:#eaf1ff; border:1px solid #d7e3fb;
              color:#1d4ed8; padding:13px 18px; border-radius:10px; font-size:13px; }
</style>
</head>
<body>
""" + SIDEBAR_HTML + """
  <div class="main">
    <div class="top-bar">
      <div>
        <h1>Dashboard qualité du catalogue</h1>
        <p class="subtitle">Suivez la qualité et la complétude des métadonnées de votre catalogue de données.</p>
      </div>
      <div class="top-actions">
        <a href="/" class="btn-refresh">⟳ Actualiser</a>
        <div class="date-chip">📅 {{ date_str }}</div>
      </div>
    </div>

    {% if error %}
      <div class="error">{{ error }}</div>
    {% else %}
    {% set badge_label, badge_color, badge_bg = badge %}
    <div class="score-banner">
      <div class="score-left">
        <div class="score-eyebrow">SCORE GLOBAL</div>
        <div class="score-value">{{ "%.0f"|format(data.score_global) }}%</div>
        <div class="badge" style="color:white;">● {{ badge_label }}</div>
      </div>
      <div class="score-msg">
        {% if data.score_global >= 90 %}
          Votre catalogue de données est complet et de haute qualité.
        {% elif data.score_global >= 70 %}
          Votre catalogue est globalement solide, quelques points restent à compléter.
        {% else %}
          Votre catalogue nécessite des compléments pour atteindre un bon niveau de qualité.
        {% endif %}
      </div>
      <div class="score-medal">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="white"><path d="M12 2l2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4-3.9-3.8 5.4-.8L12 2z"/></svg>
      </div>
    </div>

    <div class="metrics-row">
      <div class="card metric-card">
        <div class="metric-top">
          <div class="metric-icon" style="background:#e8f0fe;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2f6fed" stroke-width="2"><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.66 3.58 3 8 3s8-1.34 8-3V5"/><path d="M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3"/></svg>
          </div>
          <div class="metric-title">Couverture du catalogue</div>
        </div>
        <div class="metric-value" style="color:#2f6fed;">{{ "%.0f"|format(data.taux_couverture) }}%</div>
        <div class="metric-track"><div class="metric-fill" style="width:{{ data.taux_couverture }}%; background:#2f6fed;"></div></div>
        <div class="metric-note">{% if data.manquantes %}Manquantes : {{ data.manquantes|join(', ') }}{% else %}Toutes les tables attendues sont présentes.{% endif %}</div>
      </div>

      <div class="card metric-card">
        <div class="metric-top">
          <div class="metric-icon" style="background:#e7f8ee;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2"><circle cx="6" cy="6" r="2.6"/><circle cx="18" cy="6" r="2.6"/><circle cx="12" cy="18" r="2.6"/><path d="M8 7.3L11 16.2M16 7.3L13 16.2"/></svg>
          </div>
          <div class="metric-title">Complétude du lineage</div>
        </div>
        <div class="metric-value" style="color:#16a34a;">{{ "%.0f"|format(data.taux_lineage) }}%</div>
        <div class="metric-track"><div class="metric-fill" style="width:{{ data.taux_lineage }}%; background:#16a34a;"></div></div>
        <div class="metric-note">{% if data.tables_sans_lineage %}Sans lineage : {{ data.tables_sans_lineage|join(', ') }}{% else %}Toutes les tables ont un lineage.{% endif %}</div>
      </div>

      <div class="card metric-card">
        <div class="metric-top">
          <div class="metric-icon" style="background:#f2ecfd;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="2"><path d="M7 3h8l4 4v14H7z"/><path d="M15 3v4h4"/><path d="M9 12h6M9 16h6"/></svg>
          </div>
          <div class="metric-title">Complétude des descriptions</div>
        </div>
        <div class="metric-value" style="color:#8b5cf6;">{{ "%.0f"|format(data.taux_description) }}%</div>
        <div class="metric-track"><div class="metric-fill" style="width:{{ data.taux_description }}%; background:#8b5cf6;"></div></div>
        <div class="metric-note">{% if data.tables_sans_description %}Sans description : {{ data.tables_sans_description|join(', ') }}{% else %}Toutes les tables sont documentées.{% endif %}</div>
      </div>
    </div>

    <div class="bottom-row">
      <div class="card">
        <div class="panel-title">Vue d'ensemble</div>
        <div class="donut-wrap">
          <div class="donut-box">
            <canvas id="donutChart"></canvas>
            <div class="donut-center">
              <div class="val">{{ "%.0f"|format(data.score_global) }}%</div>
              <div class="lbl">Qualité globale</div>
            </div>
          </div>
          <div class="legend-list">
            <div class="legend-item"><span class="legend-dot" style="background:#2f6fed;"></span>Couverture du catalogue<span class="legend-value">{{ "%.0f"|format(data.taux_couverture) }}%</span></div>
            <div class="legend-item"><span class="legend-dot" style="background:#16a34a;"></span>Complétude du lineage<span class="legend-value">{{ "%.0f"|format(data.taux_lineage) }}%</span></div>
            <div class="legend-item"><span class="legend-dot" style="background:#8b5cf6;"></span>Complétude des descriptions<span class="legend-value">{{ "%.0f"|format(data.taux_description) }}%</span></div>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="panel-title">Historique des scores</div>
        <div class="chart-wrap"><canvas id="historyChart" height="150"></canvas></div>
      </div>
    </div>

    <div class="info-bar">ⓘ Les indicateurs sont calculés à chaque chargement de la page.</div>

    <script>
      const donutCtx = document.getElementById('donutChart');
      new Chart(donutCtx, {
        type: 'doughnut',
        data: {
          labels: ['Couverture', 'Lineage', 'Descriptions'],
          datasets: [{
            data: [{{ data.taux_couverture }}, {{ data.taux_lineage }}, {{ data.taux_description }}],
            backgroundColor: ['#2f6fed', '#16a34a', '#8b5cf6'],
            borderWidth: 0,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '72%',
          plugins: { legend: { display: false }, tooltip: { enabled: true } }
        }
      });

      const historyCtx = document.getElementById('historyChart');
      new Chart(historyCtx, {
        type: 'line',
        data: {
          labels: {{ history_labels|tojson }},
          datasets: [{
            data: {{ history_values|tojson }},
            borderColor: '#2f6fed',
            backgroundColor: 'rgba(47,111,237,0.08)',
            fill: true, tension: 0.35, pointRadius: 3, pointBackgroundColor: '#2f6fed',
          }]
        },
        options: {
          plugins: { legend: { display: false } },
          scales: { y: { min: 0, max: 100, ticks: { callback: v => v + '%' } } }
        }
      });
    </script>
    {% endif %}
  </div>
</body>
</html>
"""

IMPACT_TEMPLATE = """
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Analyse d'impact — banking_lineage</title>
<style>
""" + BASE_STYLE + """
  .controls { display:flex; gap: 12px; align-items:center; flex-wrap:wrap; padding: 20px 24px; margin-bottom: 24px; }
  select {
    background: #f4f6fb; color:#1a2233; border: 1px solid #e6e9f2;
    padding: 10px 14px; border-radius: 8px; font-size: 13.5px; font-weight:500;
  }
  button {
    background: #2f6fed; color: white; border: none; padding: 10px 22px; border-radius: 8px;
    font-weight: 600; cursor: pointer; font-size: 13.5px;
  }
  .helper { color: #6b7280; font-size: 12.5px; margin-left: auto; }

  .flow { display:flex; flex-wrap: wrap; align-items:flex-start; gap: 18px 0; padding: 14px 4px 22px 4px; }
  .level-col { width: 240px; padding: 0 20px; margin-bottom: 10px; }
  .level-col:not(:first-child) { border-left: 1px dashed #e6e9f2; }
  .level-title { color:#9aa2b1; font-size:11.5px; text-transform:uppercase; letter-spacing:0.07em; margin-bottom:14px; font-weight:700;}
  .node { background: #f8f9fc; border:1px solid #e6e9f2; border-radius:12px; padding:16px 17px; margin-bottom:12px; }
  .node-name { font-size:14.5px; font-weight:700; display:flex; align-items:center; color:#1a2233;}
  .dot { width:9px; height:9px; border-radius:50%; display:inline-block; margin-right:10px; flex-shrink:0; }
  .dot.table { background: #16a34a; }
  .dot.process { background: #f59e0b; }
  .node-type { color:#6b7280; font-size:12px; margin-top:6px; margin-left:19px; }
  .node.start { border-color: #2f6fed; background: #eaf1ff; }
  .node.start .dot { background: #2f6fed; }

  .summary { padding: 20px 24px; font-size: 14px; line-height: 1.6; }
  .pill { display:inline-block; background: #eaf1ff; color: #1d4ed8; padding:6px 13px; border-radius:20px;
          font-size:12.5px; font-weight:600; margin: 4px 8px 0 0; }
  .empty { color: #6b7280; padding: 20px 24px; font-size: 14px; }
</style>
</head>
<body>
""" + SIDEBAR_HTML + """
  <div class="main">
    <div class="top-bar">
      <div>
        <h1>Analyse d'impact</h1>
        <p class="subtitle">Que casse une modification de cette table dans le pipeline ?</p>
      </div>
    </div>

    <form class="card controls" method="get" action="/impact">
      <label style="font-size:13px; color:#4b5563; font-weight:600;">TABLE&nbsp;
        <select name="table">
          {% for t in tables %}
            <option value="{{ t }}" {% if t == selected_table %}selected{% endif %}>{{ t }}</option>
          {% endfor %}
        </select>
      </label>
      <button type="submit">Analyser →</button>
      <span class="helper">Impact en aval — ce qui dépend de cette table</span>
    </form>

    {% if error %}
      <div class="error">{{ error }}</div>
    {% elif report is not none %}
      <div class="card">
        {% if report %}
          <div class="flow">
            <div class="level-col">
              <div class="level-title">Départ</div>
              <div class="node start">
                <div class="node-name"><span class="dot"></span>{{ selected_table }}</div>
                <div class="node-type">Table analysée</div>
              </div>
            </div>
            {% for lvl in report %}
              <div class="level-col">
                <div class="level-title">Niveau {{ lvl.level }}</div>
                {% for item in lvl.entries %}
                  <div class="node">
                    <div class="node-name"><span class="dot {{ 'process' if item.kind == 'Traitement' else 'table' }}"></span>{{ item.name }}</div>
                    <div class="node-type">{{ item.kind }} · {{ item.type }}</div>
                  </div>
                {% endfor %}
              </div>
            {% endfor %}
          </div>
        {% else %}
          <div class="empty">Aucune entité en aval de <strong>{{ selected_table }}</strong> — c'est un terminus du pipeline.</div>
        {% endif %}
      </div>

      {% if impacted_table_names %}
        <div class="card summary" style="margin-top: 18px;">
          <strong>{{ n_tables_impacted }} table(s)</strong> potentiellement impactée(s) si <strong>{{ selected_table }}</strong> est modifiée :
          <div style="margin-top:6px;">
            {% for name in impacted_table_names %}<span class="pill">{{ name }}</span>{% endfor %}
          </div>
        </div>
      {% endif %}
    {% endif %}
  </div>
</body>
</html>
"""


@app.route("/impact")
def impact():
    selected_table = request.args.get("table", TABLES_ATTENDUES[0])

    try:
        entity = get_entity_by_name(selected_table)
        if entity is None:
            return render_template_string(IMPACT_TEMPLATE, tables=TABLES_ATTENDUES, active_page="impact",
                                           selected_table=selected_table,
                                           report=None, error=f"Table '{selected_table}' introuvable dans Atlas.")
        lineage_data = get_lineage_api(entity["guid"], depth=0)
        report = build_impact_report(lineage_data, entity["guid"])
        impacted_table_names = [
            item["name"] for lvl in report for item in lvl["entries"] if item["kind"] == "Table"
        ]
        n_tables_impacted = len(impacted_table_names)
        return render_template_string(IMPACT_TEMPLATE, tables=TABLES_ATTENDUES, active_page="impact",
                                       selected_table=selected_table,
                                       report=report, n_tables_impacted=n_tables_impacted,
                                       impacted_table_names=impacted_table_names, error=None)
    except requests.exceptions.ConnectionError:
        return render_template_string(IMPACT_TEMPLATE, tables=TABLES_ATTENDUES, active_page="impact",
                                       selected_table=selected_table,
                                       report=None, error=f"Impossible de joindre Atlas sur {ATLAS_HOST}.")
    except requests.exceptions.HTTPError as e:
        return render_template_string(IMPACT_TEMPLATE, tables=TABLES_ATTENDUES, active_page="impact",
                                       selected_table=selected_table,
                                       report=None, error=str(e))


@app.route("/")
def dashboard():
    try:
        data = compute_indicators()
        history = record_score_history(data["score_global"])
        history_labels = [datetime.strptime(h["date"], "%Y-%m-%d").strftime("%d %b") for h in history]
        history_values = [h["score"] for h in history]
        return render_template_string(
            TEMPLATE, data=data, error=None, active_page="dashboard",
            badge=score_badge(data["score_global"]),
            date_str=format_date_fr(datetime.now()),
            history_labels=history_labels, history_values=history_values,
        )
    except requests.exceptions.ConnectionError:
        return render_template_string(TEMPLATE, data=None, active_page="dashboard",
                                       error=f"Impossible de joindre Atlas sur {ATLAS_HOST}. Vérifie que le conteneur tourne.")
    except requests.exceptions.HTTPError as e:
        return render_template_string(TEMPLATE, data=None, active_page="dashboard", error=str(e))


if __name__ == "__main__":
    print("Dashboard disponible sur : http://localhost:5000")
    app.run(host="0.0.0.0", port=5000, debug=False)
