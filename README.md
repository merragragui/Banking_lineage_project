# Plateforme Web de Data Lineage Bancaire

## Présentation du projet

Ce projet a été développé dans le cadre d'un projet de fin d'études chez Banque Populaire.

Il s'agit d'une plateforme web qui automatise et facilite la gouvernance des données bancaires :

- Automatisation de l'alimentation du Data Lineage dans Apache Atlas.
- Visualisation des dépendances entre les données, les traitements ETL et les rapports.
- Analyse automatisée de l'impact d'une modification de colonne ou de table.
- Interrogation intelligente du catalogue de données et du lineage en langage naturel via un assistant IA.

## Objectifs

- Fournir un outil simple, moderne et efficace pour la gouvernance des données bancaires.
- Automatiser la traçabilité des données et réduire le travail manuel d'analyse.
- Centraliser l'exploitation des métadonnées gérées par Apache Atlas.

## Fonctionnalités principales

- Inscription et authentification sécurisée (JWT).
- Tableau de bord de supervision des données bancaires.
- Visualisation graphique des pipelines et du Data Lineage (tables et colonnes).
- Analyse d'impact automatisée avec calcul du niveau de risque.
- Assistant IA conversationnel (RAG) pour interroger le catalogue en langage naturel.
- Commande vocale pour interroger l'assistant.
- Console d'administration pour la gestion des utilisateurs et des rôles (RBAC).

## Technologies utilisées

| Catégorie | Technologie |
|---|---|
| Backend | Python, FastAPI, Uvicorn, SQLAlchemy |
| Frontend | React 18, Vite, Lucide React |
| Base de données | SQLite (base applicative du prototype) |
| Data Governance et Lineage | Apache Atlas |
| Base vectorielle | Qdrant |
| Embeddings | sentence-transformers/all-MiniLM-L6-v2 |
| LLM | Mistral AI |
| Authentification | JWT |
| Commande vocale | Web Speech API |
| Communication | Axios / REST |
| Outils | GitHub, VS Code, Docker |

## Installation et lancement

### Prérequis

- Python 3.11 ou supérieur.
- Node.js et npm.
- Une instance Apache Atlas accessible.
- Une instance Qdrant accessible.
- Une clé API Mistral AI.

### Étapes d'installation

1. Cloner le projet :
```
git clone https://github.com/merragragui/Banking_lineage_project
```

2. Installer les dépendances backend :
```
cd backend
pip install -r requirements.txt
```

3. Installer les dépendances frontend :
```
cd frontend
npm install
```

4. Lancer le backend (FastAPI) :
```
python -m uvicorn main:app --reload --port 8000
```

5. Lancer le frontend (React) :
```
npm run dev
```

## Guide d'utilisation rapide

- Se connecter à la plateforme.
- Consulter le tableau de bord de supervision des données.
- Visualiser les pipelines et le Data Lineage des tables et des colonnes.
- Lancer une analyse d'impact sur une colonne ou une table.
- Interroger l'assistant IA en langage naturel pour explorer le catalogue de données.
- L'administrateur peut gérer les utilisateurs et leurs rôles.

## Améliorations futures

- Extension de l'analyse d'impact à d'autres types de sources de données.
- Génération de rapports d'analyse exportables (PDF, Excel).
- Amélioration de la précision du RAG via un fine-tuning des embeddings.
- Développement d'une application mobile.

## Auteurs et encadrants

| Rôle | Nom |
|---|---|
| Étudiante | Mlle Meriam Erragragui |
| Entreprise d'accueil | Banque Populaire |
| Encadrement professionnel | Mme Samira Mejbar (Banque Populaire) |
| Encadrement académique | EMSI, Pr. Fadwa Fathi |

## Contact

- Email : merragragui@gmail.com
- LinkedIn : https://www.linkedin.com/in/meriam-erragragui-23b02929a/
- GitHub : https://github.com/merragragui
