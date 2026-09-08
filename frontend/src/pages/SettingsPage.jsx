import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Header } from '../components/Header';
import { AtlasSyncCard } from '../components/AtlasSyncCard';
import { RefreshCw, CheckCircle2, Server, Database, Bot } from 'lucide-react';

export const SettingsPage = () => {
  const [connectors, setConnectors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConnectors();
  }, []);

  const fetchConnectors = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/settings/connectors');
      setConnectors(res.data.connectors || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <Header title="Paramètres & Connecteurs" subtitle="Vérification de l'état des services et configurations système" />

      <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Connectors Status */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#3D0C02' }}>
            Statut des Connecteurs Système
          </h3>
          <button 
            onClick={fetchConnectors} 
            disabled={loading}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid #D1D5DB',
              backgroundColor: '#FFFFFF',
              color: '#374151',
              fontWeight: 700,
              fontSize: '0.84rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            <span>Tester les connexions</span>
          </button>
        </div>

        {/* Connectors Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          {connectors.map((c) => (
            <div key={c.id} style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '14px',
              border: '1px solid #E5E7EB',
              padding: '18px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: '#FFF4ED', color: '#F36F21' }}>
                  {c.id === 'atlas' ? <Server size={22} /> : c.id === 'qdrant' ? <Database size={22} /> : <Bot size={22} />}
                </div>
                <div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#3D0C02' }}>{c.name}</div>
                  <div style={{ fontSize: '0.78rem', color: '#6B7280' }}>{c.type} {c.url ? `(${c.url})` : ''}</div>
                </div>
              </div>

              <span style={{
                padding: '4px 12px',
                borderRadius: '20px',
                backgroundColor: '#D1FAE5',
                color: '#065F46',
                fontWeight: 700,
                fontSize: '0.78rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <CheckCircle2 size={14} /> {c.status}
              </span>
            </div>
          ))}
        </div>

        {/* Dedicated Section: Synchronisation Apache Atlas */}
        <AtlasSyncCard />

      </div>
    </div>
  );
};
