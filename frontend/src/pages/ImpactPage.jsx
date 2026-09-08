import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Header } from '../components/Header';
import { 
  Database, Cpu, Layers, ArrowRight, ShieldAlert, CheckCircle2, 
  Download, ExternalLink, FileText, Sliders, AlertCircle, HelpCircle, GitFork
} from 'lucide-react';

export const ImpactPage = () => {
  const [selectedTable, setSelectedTable] = useState('clients');

  const impactDataMap = {
    clients: {
      table: 'clients',
      impactedCount: 4,
      impactedTables: ['comptes', 'reporting_mensuel', 'transactions', 'transactions_suspectes'],
      levels: [
        { 
          title: '01. DÉPART (SOURCES)', 
          subtitle: 'Tables sources initiales',
          items: [
            { name: 'clients', type: 'Table Source', tag: 'rdbms_table', cat: 'depart' },
            { name: 'agences', type: 'Table Source', tag: 'rdbms_table', cat: 'depart' }
          ] 
        },
        { 
          title: '02. NIVEAU 1', 
          subtitle: 'Ingestion & Alimentation',
          items: [
            { name: 'alimentation_comptes', type: 'Traitement • Process ETL', tag: 'spark_process', cat: 'process' }
          ] 
        },
        { 
          title: '03. NIVEAU 2', 
          subtitle: 'Table des Comptes',
          items: [
            { name: 'comptes', type: 'Table • Core Banking', tag: 'rdbms_table', cat: 'table' }
          ] 
        },
        { 
          title: '04. NIVEAU 3', 
          subtitle: 'Génération Transactions',
          items: [
            { name: 'generation_transactions', type: 'Traitement • Core Process', tag: 'spark_process', cat: 'process' }
          ] 
        },
        { 
          title: '05. NIVEAU 4', 
          subtitle: 'Historique des Mouvements',
          items: [
            { name: 'transactions', type: 'Table • Transactions', tag: 'rdbms_table', cat: 'table' }
          ] 
        },
        { 
          title: '06. NIVEAU 5', 
          subtitle: 'Traitements Aval (Branchement)',
          items: [
            { name: 'detection_transactions_suspectes', type: 'Traitement • Moteur AML', tag: 'ml_process', cat: 'process' },
            { name: 'agregation_reporting_mensuel', type: 'Traitement • Process BI', tag: 'hive_process', cat: 'process' }
          ] 
        },
        { 
          title: '07. NIVEAU 6', 
          subtitle: 'Datamarts & Reporting',
          items: [
            { name: 'transactions_suspectes', type: 'Table • Suspectes (AML)', tag: 'rdbms_table', cat: 'table' },
            { name: 'reporting_mensuel', type: 'Table • BI Mensuel', tag: 'rdbms_table', cat: 'table' }
          ] 
        }
      ]
    },
    agences: {
      table: 'agences',
      impactedCount: 4,
      impactedTables: ['comptes', 'reporting_mensuel', 'transactions', 'transactions_suspectes'],
      levels: [
        { 
          title: '01. DÉPART (SOURCES)', 
          subtitle: 'Tables sources initiales',
          items: [
            { name: 'agences', type: 'Table Source', tag: 'rdbms_table', cat: 'depart' },
            { name: 'clients', type: 'Table Source', tag: 'rdbms_table', cat: 'depart' }
          ] 
        },
        { 
          title: '02. NIVEAU 1', 
          subtitle: 'Ingestion & Alimentation',
          items: [
            { name: 'alimentation_comptes', type: 'Traitement • Process ETL', tag: 'spark_process', cat: 'process' }
          ] 
        },
        { 
          title: '03. NIVEAU 2', 
          subtitle: 'Table des Comptes',
          items: [
            { name: 'comptes', type: 'Table • Core Banking', tag: 'rdbms_table', cat: 'table' }
          ] 
        },
        { 
          title: '04. NIVEAU 3', 
          subtitle: 'Génération Transactions',
          items: [
            { name: 'generation_transactions', type: 'Traitement • Core Process', tag: 'spark_process', cat: 'process' }
          ] 
        },
        { 
          title: '05. NIVEAU 4', 
          subtitle: 'Historique des Mouvements',
          items: [
            { name: 'transactions', type: 'Table • Transactions', tag: 'rdbms_table', cat: 'table' }
          ] 
        },
        { 
          title: '06. NIVEAU 5', 
          subtitle: 'Traitements Aval (Branchement)',
          items: [
            { name: 'detection_transactions_suspectes', type: 'Traitement • Moteur AML', tag: 'ml_process', cat: 'process' },
            { name: 'agregation_reporting_mensuel', type: 'Traitement • Process BI', tag: 'hive_process', cat: 'process' }
          ] 
        },
        { 
          title: '07. NIVEAU 6', 
          subtitle: 'Datamarts & Reporting',
          items: [
            { name: 'transactions_suspectes', type: 'Table • Suspectes (AML)', tag: 'rdbms_table', cat: 'table' },
            { name: 'reporting_mensuel', type: 'Table • BI Mensuel', tag: 'rdbms_table', cat: 'table' }
          ] 
        }
      ]
    },
    transactions: {
      table: 'transactions',
      impactedCount: 2,
      impactedTables: ['transactions_suspectes', 'reporting_mensuel'],
      levels: [
        { 
          title: '01. DÉPART', 
          subtitle: 'Table sous analyse',
          items: [
            { name: 'transactions', type: 'Table Analysée', tag: 'rdbms_table', cat: 'depart' }
          ] 
        },
        { 
          title: '02. NIVEAU 1', 
          subtitle: 'Traitements Aval',
          items: [
            { name: 'detection_transactions_suspectes', type: 'Traitement • AML Moteur', tag: 'ml_process', cat: 'process' },
            { name: 'agregation_reporting_mensuel', type: 'Traitement • Process BI', tag: 'hive_process', cat: 'process' }
          ] 
        },
        { 
          title: '03. NIVEAU 2', 
          subtitle: 'Datamarts Impactés',
          items: [
            { name: 'transactions_suspectes', type: 'Table • Reporting AML', tag: 'rdbms_table', cat: 'table' },
            { name: 'reporting_mensuel', type: 'Table • Datamart BI', tag: 'rdbms_table', cat: 'table' }
          ] 
        }
      ]
    },
    comptes: {
      table: 'comptes',
      impactedCount: 3,
      impactedTables: ['transactions', 'transactions_suspectes', 'reporting_mensuel'],
      levels: [
        { 
          title: '01. DÉPART', 
          subtitle: 'Table sous analyse',
          items: [
            { name: 'comptes', type: 'Table Analysée', tag: 'rdbms_table', cat: 'depart' }
          ] 
        },
        { 
          title: '02. NIVEAU 1', 
          subtitle: 'Génération Transactions',
          items: [
            { name: 'generation_transactions', type: 'Traitement • Process Core', tag: 'spark_process', cat: 'process' }
          ] 
        },
        { 
          title: '03. NIVEAU 2', 
          subtitle: 'Flux Financiers',
          items: [
            { name: 'transactions', type: 'Table • Transactions', tag: 'rdbms_table', cat: 'table' }
          ] 
        },
        { 
          title: '04. NIVEAU 3', 
          subtitle: 'Détection Conformité',
          items: [
            { name: 'detection_transactions_suspectes', type: 'Traitement • AML Moteur', tag: 'ml_process', cat: 'process' }
          ] 
        },
        { 
          title: '05. NIVEAU 4', 
          subtitle: 'Audit Final',
          items: [
            { name: 'transactions_suspectes', type: 'Table • Reporting AML', tag: 'rdbms_table', cat: 'table' }
          ] 
        }
      ]
    }
  };

  const currentImpact = impactDataMap[selectedTable] || impactDataMap.clients;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <Header title="Analyse d'impact" subtitle="Évaluation graphique et traçabilité des dépendances du pipeline bancaire" />

      <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Selector Bar */}
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: '16px',
          padding: '20px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 4px 12px rgba(61,12,2,0.03)',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#3D0C02', letterSpacing: '0.5px' }}>TABLE SÉLECTIONNÉE</span>
            <select 
              value={selectedTable}
              onChange={(e) => setSelectedTable(e.target.value)}
              style={{
                padding: '11px 20px',
                borderRadius: '10px',
                border: '1px solid #D1D5DB',
                backgroundColor: '#FAFAFA',
                fontSize: '0.92rem',
                fontWeight: 700,
                color: '#1F2937',
                outline: 'none',
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
              }}
            >
              <option value="clients">clients</option>
              <option value="comptes">comptes</option>
              <option value="transactions">transactions</option>
              <option value="agences">agences</option>
              <option value="transactions_suspectes">transactions_suspectes</option>
              <option value="reporting_mensuel">reporting_mensuel</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              padding: '6px 14px',
              borderRadius: '20px',
              backgroundColor: '#FFF4ED',
              border: '1px solid #FFDBC2',
              color: '#F36F21',
              fontWeight: 700,
              fontSize: '0.80rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <ShieldAlert size={14} />
              <span>{currentImpact.impactedCount} Tables Impactées en Aval</span>
            </div>
          </div>
        </div>

        {/* Modern Interactive Flow Chart Container */}
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: '20px',
          padding: '32px 28px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          overflowX: 'auto'
        }}>
          
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', minWidth: 'max-content' }}>
            {currentImpact.levels.map((lvl, idx) => (
              <React.Fragment key={idx}>
                
                {/* Level Column */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  width: '260px',
                  flexShrink: 0
                }}>
                  {/* Column Header Badge */}
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: '10px',
                    backgroundColor: '#FAFAFA',
                    border: '1px solid #E5E7EB',
                    borderLeft: idx === 0 ? '4px solid #F36F21' : '4px solid #3D0C02'
                  }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 800, color: idx === 0 ? '#F36F21' : '#3D0C02', letterSpacing: '0.5px' }}>
                      {lvl.title}
                    </div>
                    <div style={{ fontSize: '0.70rem', color: '#6B7280', marginTop: '2px' }}>
                      {lvl.subtitle}
                    </div>
                  </div>

                  {/* Level Cards */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {lvl.items.map((item, itemIdx) => {
                      const isDepart = item.cat === 'depart';
                      const isProcess = item.cat === 'process';

                      return (
                        <div 
                          key={itemIdx}
                          style={{
                            padding: '16px 18px',
                            borderRadius: '14px',
                            backgroundColor: isDepart ? '#FFF4ED' : isProcess ? '#FAFAFA' : '#F8F9FB',
                            border: isDepart ? '2px solid #F36F21' : isProcess ? '1px solid #E5E7EB' : '1px solid #D1D5DB',
                            boxShadow: isDepart ? '0 4px 14px rgba(243,111,33,0.15)' : '0 2px 6px rgba(0,0,0,0.02)',
                            transition: 'all 0.2s ease',
                            wordBreak: 'break-word',
                            overflowWrap: 'break-word'
                          }}
                        >
                          {/* Card Icon & Tag */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                            <div style={{
                              width: '30px',
                              height: '30px',
                              borderRadius: '8px',
                              backgroundColor: isDepart ? '#F36F21' : isProcess ? '#FFF4ED' : '#E0F2FE',
                              color: isDepart ? '#FFFFFF' : isProcess ? '#F36F21' : '#0284C7',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              {isProcess ? <Cpu size={16} /> : <Database size={16} />}
                            </div>

                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '12px',
                              backgroundColor: isDepart ? '#F36F21' : isProcess ? '#FEF3C7' : '#DCFCE7',
                              color: isDepart ? '#FFFFFF' : isProcess ? '#92400E' : '#166534',
                              fontSize: '0.68rem',
                              fontWeight: 700
                            }}>
                              {item.tag}
                            </span>
                          </div>

                          {/* Card Node Title - Full display without truncation */}
                          <div style={{
                            fontSize: '0.92rem',
                            fontWeight: 800,
                            color: isDepart ? '#F36F21' : '#1F2937',
                            lineHeight: 1.4,
                            wordBreak: 'break-word'
                          }}>
                            {item.name}
                          </div>

                          {/* Card Type Subtitle */}
                          <div style={{
                            fontSize: '0.74rem',
                            color: '#6B7280',
                            marginTop: '6px',
                            fontWeight: 600
                          }}>
                            {item.type}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Connecting Arrow between levels */}
                {idx < currentImpact.levels.length - 1 && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingTop: '60px',
                    color: '#F36F21',
                    flexShrink: 0
                  }}>
                    <ArrowRight size={22} color="#F36F21" />
                  </div>
                )}

              </React.Fragment>
            ))}
          </div>

        </div>

        {/* Bottom Impacted Tables Summary Pill Container */}
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: '16px',
          padding: '20px 28px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap',
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.90rem', color: '#1F2937' }}>
            <CheckCircle2 size={18} color="#F36F21" />
            <span>
              <strong>{currentImpact.impactedCount} table(s)</strong> dépendante(s) en cas de modification de <strong>{currentImpact.table}</strong> :
            </span>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {currentImpact.impactedTables.map((tName) => (
              <span 
                key={tName}
                style={{
                  padding: '7px 16px',
                  borderRadius: '20px',
                  backgroundColor: '#FFF4ED',
                  border: '1px solid #FFDBC2',
                  color: '#F36F21',
                  fontWeight: 800,
                  fontSize: '0.84rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 4px rgba(243,111,33,0.1)'
                }}
              >
                <Database size={14} />
                <span>{tName}</span>
              </span>
            ))}
          </div>
        </div>

        {/* SECTION NOUVELLE : ANALYSE D'IMPACT DE COLONNE (APACHE ATLAS DIRECT) */}
        <ColumnImpactSection />

      </div>
    </div>
  );
};

const ColumnImpactSection = () => {
  const tableColumns = {
    clients: ['client_id', 'nom', 'prenom', 'date_naissance', 'email', 'date_creation'],
    agences: ['agence_id', 'code_agence', 'nom_agence', 'ville', 'date_creation'],
    comptes: ['compte_id', 'client_id', 'agence_id', 'type_compte', 'solde', 'date_ouverture'],
    transactions: ['montant', 'transaction_id', 'compte_source_id', 'compte_destination_id', 'type_transaction', 'devise', 'statut', 'date_transaction'],
    transactions_suspectes: ['id', 'transaction_id', 'score_risque', 'motif', 'date_detection'],
    reporting_mensuel: ['id', 'mois', 'agence_id', 'nombre_transactions', 'montant_total', 'date_generation']
  };

  const [selectedTable, setSelectedTable] = useState('clients');
  const [selectedColumn, setSelectedColumn] = useState('client_id');
  const [direction, setDirection] = useState('OUTPUT'); // OUTPUT (Aval), INPUT (Amont), BOTH (Les deux)
  const [impactData, setImpactData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedNodeDetails, setSelectedNodeDetails] = useState(null);

  useEffect(() => {
    fetchColumnImpact(selectedTable, selectedColumn, direction);
  }, []);

  const handleTableChange = (e) => {
    const newTable = e.target.value;
    setSelectedTable(newTable);
    const cols = tableColumns[newTable] || [];
    setSelectedColumn(cols[0] || '');
  };

  const handleAnalyze = () => {
    fetchColumnImpact(selectedTable, selectedColumn, direction);
  };

  const fetchColumnImpact = async (table, column, dir) => {
    if (!table || !column) return;
    setLoading(true);
    const startTime = Date.now();
    try {
      const authToken = localStorage.getItem('atlas_token');
      const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
      const res = await axios.get(`/api/impact/column-impact/${table}/${column}?direction=${dir}`, { headers });
      
      const elapsedTime = Date.now() - startTime;
      if (elapsedTime < 1000) {
        await new Promise(resolve => setTimeout(resolve, 1000 - elapsedTime));
      }
      setImpactData(res.data);
    } catch (err) {
      console.error("Erreur chargement Column Impact:", err);
    } finally {
      setLoading(false);
    }
  };

  // Export handlers (PNG, JSON, PDF)
  const handleExportJSON = () => {
    if (!impactData) return;
    const blob = new Blob([JSON.stringify(impactData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `impact_atlas_${selectedTable}_${selectedColumn}.json`;
    a.click();
  };

  const handleExportPDF = () => {
    window.print();
  };

  const availableColumns = tableColumns[selectedTable] || [];

  return (
    <div style={{
      backgroundColor: '#FFFFFF',
      borderRadius: '16px',
      border: '1px solid #E5E7EB',
      padding: '24px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px'
    }}>
      {/* CLEAN HEADER TITLE */}
      <div style={{ borderBottom: '1px solid #F3F4F6', paddingBottom: '14px' }}>
        <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#3D0C02', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShieldAlert size={22} color="#F36F21" />
          <span>Analyse d'Impact au Niveau des Colonnes</span>
        </div>
      </div>

      {/* SELECTORS ROW WITH ANALYSER BUTTON */}
      <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#F9FAFB', padding: '16px 20px', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#3D0C02', textTransform: 'uppercase' }}>Table</label>
            <select
              value={selectedTable}
              onChange={handleTableChange}
              style={{
                backgroundColor: '#FFFFFF',
                border: '1.5px solid #D1D5DB',
                borderRadius: '10px',
                padding: '8px 14px',
                fontSize: '0.88rem',
                fontWeight: 700,
                color: '#1F2937',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              {Object.keys(tableColumns).map(tbl => (
                <option key={tbl} value={tbl}>{tbl}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#3D0C02', textTransform: 'uppercase' }}>Colonne</label>
            <select
              value={selectedColumn}
              onChange={(e) => setSelectedColumn(e.target.value)}
              style={{
                backgroundColor: '#FFF4ED',
                border: '1.5px solid #F36F21',
                borderRadius: '10px',
                padding: '8px 14px',
                fontSize: '0.88rem',
                fontWeight: 800,
                color: '#F36F21',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              {availableColumns.map(col => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
          </div>

          {/* ANALYSER BUTTON */}
          <button
            onClick={handleAnalyze}
            style={{
              backgroundColor: '#F36F21',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '10px',
              padding: '9px 22px',
              fontSize: '0.86rem',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(243,111,33,0.2)',
              transition: 'all 0.15s ease'
            }}
          >
            Analyser
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#F36F21', fontWeight: 800 }}>
          Interrogation en direct de l'API REST d'Apache Atlas & Calcul d'Impact...
        </div>
      ) : (
        impactData && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* RISQUE & EXPLICATION CALCULÉE */}
            <div style={{
              backgroundColor: impactData.criticality_level === 'CRITIQUE' ? '#FEF2F2' : (impactData.criticality_level === 'ÉLEVÉ' ? '#FFF7ED' : (impactData.criticality_level === 'AUCUN' ? '#F0FDF4' : '#F0F9FF')),
              border: impactData.criticality_level === 'CRITIQUE' ? '1.5px solid #FCA5A5' : (impactData.criticality_level === 'ÉLEVÉ' ? '1.5px solid #FDBA74' : (impactData.criticality_level === 'AUCUN' ? '1.5px solid #86EFAC' : '1.5px solid #BAE6FD')),
              borderRadius: '14px',
              padding: '18px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <AlertCircle size={22} color={impactData.criticality_level === 'CRITIQUE' ? '#DC2626' : (impactData.criticality_level === 'ÉLEVÉ' ? '#C2410C' : (impactData.criticality_level === 'AUCUN' ? '#16A34A' : '#0284C7'))} />
                  <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#3D0C02' }}>
                    Analyse de Risque Calculée : <span style={{ color: '#F36F21' }}>{impactData.analysed_column}</span>
                  </span>
                </div>
                <span style={{
                  backgroundColor: impactData.criticality_level === 'CRITIQUE' ? '#DC2626' : (impactData.criticality_level === 'ÉLEVÉ' ? '#EA580C' : (impactData.criticality_level === 'AUCUN' ? '#16A34A' : '#0284C7')),
                  color: '#FFFFFF',
                  padding: '6px 18px',
                  borderRadius: '20px',
                  fontSize: '0.84rem',
                  fontWeight: 900
                }}>
                  {impactData.criticality_level === 'AUCUN' ? 'AUCUN RISQUE' : `RISQUE ${impactData.criticality_level}`}
                </span>
              </div>

              {/* Justification calculée */}
              <p style={{ fontSize: '0.88rem', color: '#374151', margin: 0, lineHeight: 1.5, paddingLeft: '32px' }}>
                <strong>Justification Atlas :</strong> {impactData.risk_explanation}
              </p>
            </div>

            {/* GRILLE DES 6 CARTES DE METADONNEES DYNAMIQUES ATLAS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', fontSize: '0.84rem' }}>
              
              {/* 1. Colonne analysée */}
              <div style={{ backgroundColor: '#FFF4ED', padding: '14px', borderRadius: '12px', border: '1px solid #FFDBC2' }}>
                <span style={{ color: '#F36F21', fontSize: '0.75rem', fontWeight: 800, display: 'block', textTransform: 'uppercase' }}>1. Colonne analysée</span>
                <span style={{ fontWeight: 800, color: '#3D0C02', marginTop: '4px', display: 'block', fontSize: '0.95rem', fontFamily: 'monospace' }}>
                  {impactData.analysed_column}
                </span>
              </div>

              {/* 2. Colonnes impactées */}
              <div style={{ backgroundColor: '#FFFFFF', padding: '14px', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
                <span style={{ color: '#6B7280', fontSize: '0.75rem', fontWeight: 800, display: 'block', textTransform: 'uppercase' }}>2. Colonnes impactées</span>
                <div style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {impactData.impacted_columns && impactData.impacted_columns.length > 0 ? (
                    impactData.impacted_columns.map(col => (
                      <span key={col} style={{ fontWeight: 800, color: '#1F2937', fontSize: '0.84rem', fontFamily: 'monospace', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        {col}
                      </span>
                    ))
                  ) : (
                    <span style={{ color: '#9CA3AF', fontSize: '0.82rem' }}>Aucune colonne impactée</span>
                  )}
                </div>
              </div>

              {/* 3. Traitements impactés (Business process name + Technical tooltip) */}
              <div style={{ backgroundColor: '#FFFFFF', padding: '14px', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
                <span style={{ color: '#6B7280', fontSize: '0.75rem', fontWeight: 800, display: 'block', textTransform: 'uppercase' }}>3. Traitements impactés</span>
                <div style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {impactData.impacted_processes && impactData.impacted_processes.length > 0 ? (
                    impactData.impacted_processes.map((proc, i) => (
                      <span 
                        key={i} 
                        onClick={() => alert(`Nom technique Atlas : ${typeof proc === 'object' ? proc.technical_name : proc}\nQualifiedName : ${typeof proc === 'object' ? proc.qualified_name : proc}`)}
                        title={`Cliquez pour voir le nom technique (${typeof proc === 'object' ? proc.technical_name : proc})`}
                        style={{ fontWeight: 800, color: '#F36F21', fontSize: '0.84rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        {typeof proc === 'object' ? (proc.business_name || proc.technical_name) : proc}
                      </span>
                    ))
                  ) : (
                    <span style={{ color: '#9CA3AF', fontSize: '0.82rem' }}>Aucun traitement impacté</span>
                  )}
                </div>
              </div>

              {/* 4. Tables impactées */}
              <div style={{ backgroundColor: '#FFFFFF', padding: '14px', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
                <span style={{ color: '#6B7280', fontSize: '0.75rem', fontWeight: 800, display: 'block', textTransform: 'uppercase' }}>4. Tables impactées</span>
                <div style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {impactData.impacted_tables && impactData.impacted_tables.length > 0 ? (
                    impactData.impacted_tables.map(tbl => (
                      <span key={tbl} style={{ fontWeight: 800, color: '#3D0C02', fontSize: '0.84rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        {tbl}
                      </span>
                    ))
                  ) : (
                    <span style={{ color: '#9CA3AF', fontSize: '0.82rem' }}>Aucune table impactée</span>
                  )}
                </div>
              </div>

              {/* 5. Rapports impactés */}
              <div style={{ backgroundColor: '#FFFFFF', padding: '14px', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
                <span style={{ color: '#6B7280', fontSize: '0.75rem', fontWeight: 800, display: 'block', textTransform: 'uppercase' }}>5. Rapports impactés</span>
                <div style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {impactData.impacted_reports && impactData.impacted_reports.length > 0 ? (
                    impactData.impacted_reports.map((rep, i) => (
                      <span key={i} style={{ fontWeight: 800, color: '#1F2937', fontSize: '0.84rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        {rep}
                      </span>
                    ))
                  ) : (
                    <span style={{ color: '#9CA3AF', fontSize: '0.82rem' }}>Aucun rapport identifié</span>
                  )}
                </div>
              </div>

              {/* 6. Transformation appliquée */}
              <div style={{ backgroundColor: '#FFFFFF', padding: '14px', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
                <span style={{ color: '#6B7280', fontSize: '0.75rem', fontWeight: 800, display: 'block', textTransform: 'uppercase' }}>6. Transformation appliquée</span>
                <span style={{ fontWeight: 800, color: '#3D0C02', marginTop: '4px', display: 'block', fontSize: '0.84rem' }}>
                  {impactData.applied_transformation || 'Transformation non documentée'}
                </span>
              </div>

            </div>

            {/* SECTION : CONSEQUENCES & IMPACT METIER */}
            <div style={{ backgroundColor: '#FFF4ED', borderRadius: '14px', border: '1px solid #FFDBC2', padding: '22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h4 style={{ fontSize: '1.02rem', fontWeight: 800, color: '#3D0C02', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldAlert size={20} color="#F36F21" />
                  <span>Conséquences d'une modification de la colonne {impactData.analysed_column}</span>
                </h4>
              </div>

              {/* IMPACT METIER BUSINESS WARNING BOX */}
              <div style={{ backgroundColor: '#FFFFFF', padding: '14px 18px', borderRadius: '10px', borderLeft: '4px solid #F36F21', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <span style={{ fontSize: '0.80rem', fontWeight: 800, color: '#F36F21', textTransform: 'uppercase', display: 'block' }}>Impact Métier (Conséquence Business)</span>
                <p style={{ fontSize: '0.90rem', fontWeight: 700, color: '#1F2937', margin: '4px 0 0 0' }}>
                  {impactData.business_impact}
                </p>
              </div>

              {/* 4 COUNTS */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', fontSize: '0.88rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1F2937', fontWeight: 700 }}>
                  <span style={{ color: '#10B981', fontWeight: 900 }}>✓</span>
                  <span><strong>{impactData.consequences.columns_count}</strong> colonne(s) seront impactée(s) en aval</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1F2937', fontWeight: 700 }}>
                  <span style={{ color: '#10B981', fontWeight: 900 }}>✓</span>
                  <span><strong>{impactData.consequences.processes_count}</strong> traitement(s) ETL seront affecté(s)</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1F2937', fontWeight: 700 }}>
                  <span style={{ color: '#10B981', fontWeight: 900 }}>✓</span>
                  <span><strong>{impactData.consequences.tables_count}</strong> table(s) devront être recalculée(s)</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1F2937', fontWeight: 700 }}>
                  <span style={{ color: '#10B981', fontWeight: 900 }}>✓</span>
                  <span><strong>{impactData.consequences.reports_count}</strong> rapport(s) ou datamart(s) deviendront incomplet(s)</span>
                </div>
              </div>
            </div>



          </div>
        )
      )}
    </div>
  );
};
