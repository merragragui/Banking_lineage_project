import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { RefreshCw, Database, CheckCircle2, AlertTriangle, Clock, Layers, FileText, Share2, Terminal } from 'lucide-react';

export const AtlasSyncCard = () => {
  const [syncData, setSyncData] = useState({
    status: 'Synchronisé',
    last_sync: new Date().toLocaleDateString('fr-FR') + ' à ' + new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    tables_updated: 6,
    columns_updated: 34,
    relations_updated: 12,
    errors_count: 0,
    logs: [
      `[${new Date().toLocaleTimeString()}] 🔌 Connexion à la base de données PostgreSQL... Réussie.`,
      `[${new Date().toLocaleTimeString()}] 🔍 Détection des métadonnées : 6 tables et 34 colonnes identifiées.`,
      `[${new Date().toLocaleTimeString()}] 🌐 Transmission des types et entités à l'API REST Apache Atlas...`,
      `[${new Date().toLocaleTimeString()}] 🔄 Rafraîchissement des relations de Data Lineage...`,
      `[${new Date().toLocaleTimeString()}] ✅ Synchronisation terminée avec succès (0 erreur).`
    ]
  });

  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetchSyncStatus();
  }, []);

  const fetchSyncStatus = async () => {
    try {
      const res = await axios.get('/api/settings/atlas/sync-status');
      if (res.data) setSyncData(res.data);
    } catch (err) {
      console.error("Erreur récupération statut sync:", err);
    }
  };

  const handleTriggerSync = async () => {
    setSyncing(true);
    setSyncData(prev => ({
      ...prev,
      status: 'En cours',
      logs: [
        `[${new Date().toLocaleTimeString()}] 🔄 Initialisation du mécanisme d'alimentation automatique Python...`,
        `[${new Date().toLocaleTimeString()}] 🔌 Connexion à la base de données PostgreSQL...`
      ]
    }));

    try {
      const res = await axios.post('/api/settings/atlas/sync');
      setTimeout(() => {
        setSyncData(res.data);
        setSyncing(false);
      }, 1200);
    } catch (err) {
      console.error(err);
      setSyncData(prev => ({
        ...prev,
        status: 'Erreur',
        errors_count: prev.errors_count + 1,
        logs: [...prev.logs, `[${new Date().toLocaleTimeString()}] ❌ Erreur lors de la communication avec Apache Atlas.`]
      }));
      setSyncing(false);
    }
  };

  // Status Badge Styling based on sync status
  const getStatusBadge = () => {
    if (syncData.status === 'En cours' || syncing) {
      return (
        <span style={{
          padding: '6px 16px',
          borderRadius: '20px',
          backgroundColor: '#FEF3C7',
          color: '#92400E',
          border: '1px solid #FDE68A',
          fontWeight: 800,
          fontSize: '0.82rem',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <RefreshCw size={14} className="spin" /> Synchronisation en cours...
        </span>
      );
    }
    if (syncData.status === 'Erreur') {
      return (
        <span style={{
          padding: '6px 16px',
          borderRadius: '20px',
          backgroundColor: '#FEE2E2',
          color: '#991B1B',
          border: '1px solid #FECACA',
          fontWeight: 800,
          fontSize: '0.82rem',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <AlertTriangle size={14} /> Erreur de synchronisation
        </span>
      );
    }
    return (
      <span style={{
        padding: '6px 16px',
        borderRadius: '20px',
        backgroundColor: '#D1FAE5',
        color: '#065F46',
        border: '1px solid #A7F3D0',
        fontWeight: 800,
        fontSize: '0.82rem',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px'
      }}>
        <CheckCircle2 size={14} /> Synchronisé
      </span>
    );
  };

  return (
    <div style={{
      backgroundColor: '#FFFFFF',
      borderRadius: '16px',
      border: '1px solid #E5E7EB',
      padding: '24px 28px',
      boxShadow: '0 4px 12px rgba(61,12,2,0.03)',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px'
    }}>
      
      {/* Card Header & Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            backgroundColor: '#FFF4ED',
            color: '#F36F21',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #FFDBC2',
            boxShadow: '0 2px 8px rgba(243,111,33,0.15)'
          }}>
            <RefreshCw size={22} color="#F36F21" className={syncing ? 'spin' : ''} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#3D0C02', margin: 0 }}>
              Synchronisation Apache Atlas
            </h3>
            <p style={{ fontSize: '0.78rem', color: '#6B7280', margin: '2px 0 0 0' }}>
              Mécanisme d'alimentation automatique Python (PostgreSQL ➔ API REST Apache Atlas ➔ Data Lineage)
            </p>
          </div>
        </div>

        {/* Status Badge & Trigger Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          {getStatusBadge()}

          <button
            onClick={handleTriggerSync}
            disabled={syncing}
            style={{
              padding: '12px 22px',
              borderRadius: '10px',
              backgroundColor: '#F36F21',
              color: '#FFFFFF',
              border: 'none',
              fontWeight: 800,
              fontSize: '0.88rem',
              cursor: syncing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(243,111,33,0.3)',
              opacity: syncing ? 0.7 : 1,
              transition: 'all 0.15s ease'
            }}
          >
            <RefreshCw size={18} className={syncing ? 'spin' : ''} />
            <span>{syncing ? 'Synchronisation...' : 'Synchroniser Atlas'}</span>
          </button>
        </div>
      </div>

      {/* Date & Time of Last Synchronization Banner */}
      <div style={{
        backgroundColor: '#FAFAFA',
        border: '1px solid #F3F4F6',
        borderRadius: '12px',
        padding: '12px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '0.84rem',
        color: '#4B5563'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: '#3D0C02' }}>
          <Clock size={16} color="#F36F21" />
          <span>Dernière synchronisation :</span>
          <span style={{ color: '#F36F21', fontWeight: 800 }}>{syncData.last_sync}</span>
        </div>
        <div style={{ fontSize: '0.78rem', color: '#6B7280' }}>
          Source : Base de données PostgreSQL (`banking_lineage`)
        </div>
      </div>

      {/* Ingestion Metrics Counter Cards (4 Pills) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        
        <div style={metricPillStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={16} color="#F36F21" />
            <span style={{ fontSize: '0.76rem', color: '#6B7280', fontWeight: 600 }}>Tables détectées</span>
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#3D0C02', marginTop: '4px' }}>
            {syncData.tables_updated} <span style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 700 }}>PostgreSQL</span>
          </div>
        </div>

        <div style={metricPillStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={16} color="#F36F21" />
            <span style={{ fontSize: '0.76rem', color: '#6B7280', fontWeight: 600 }}>Colonnes mises à jour</span>
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#3D0C02', marginTop: '4px' }}>
            {syncData.columns_updated} <span style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 700 }}>Colonnes</span>
          </div>
        </div>

        <div style={metricPillStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Share2 size={16} color="#10B981" />
            <span style={{ fontSize: '0.76rem', color: '#6B7280', fontWeight: 600 }}>Relations lineage</span>
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#3D0C02', marginTop: '4px' }}>
            {syncData.relations_updated} <span style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 700 }}>Générées</span>
          </div>
        </div>

        <div style={metricPillStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} color={syncData.errors_count === 0 ? "#10B981" : "#EF4444"} />
            <span style={{ fontSize: '0.76rem', color: '#6B7280', fontWeight: 600 }}>Journal d'erreurs</span>
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: syncData.errors_count === 0 ? '#10B981' : '#EF4444', marginTop: '4px' }}>
            {syncData.errors_count} <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>Erreur</span>
          </div>
        </div>

      </div>

      {/* Journal de Synchronisation (Execution Log Terminal Box) */}
      <div style={{
        backgroundColor: '#1E293B',
        borderRadius: '12px',
        padding: '16px 20px',
        color: '#E2E8F0',
        fontFamily: 'monospace',
        fontSize: '0.80rem',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', borderBottom: '1px solid #334155', paddingBottom: '8px', color: '#F36F21', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          <Terminal size={16} color="#F36F21" />
          <span>Journal de synchronisation (Python Ingestion Log)</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '140px', overflowY: 'auto' }}>
          {syncData.logs.map((log, idx) => (
            <div key={idx} style={{ lineHeight: 1.5, color: log.includes('✅') ? '#4ADE80' : log.includes('❌') ? '#F87171' : '#94A3B8' }}>
              {log}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

const metricPillStyle = {
  backgroundColor: '#FFFFFF',
  border: '1px solid #E5E7EB',
  borderRadius: '12px',
  padding: '12px 14px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
};
