import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Header } from '../components/Header';
import { Database, Search, Shield, User } from 'lucide-react';

export const CataloguePage = () => {
  const [tables, setTables] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCatalogue();
  }, [query]);

  const fetchCatalogue = async () => {
    try {
      const res = await axios.get('/api/catalogue/tables', { params: { query } });
      setTables(res.data.tables || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <Header 
        title="Catalogue de métadonnées" 
        subtitle="Exploration et inventaire des tables, colonnes et classifications bancaires" 
      />

      <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Search Bar in Catalogue Page with Banque Populaire Styling */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          border: '1px solid #E5E7EB',
          boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
        }}>
          <Search size={20} color="#F36F21" />
          <input 
            type="text" 
            placeholder="Rechercher une table, colonne, description ou propriétaire..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              border: 'none',
              outline: 'none',
              width: '100%',
              fontSize: '0.92rem',
              color: '#1F2937',
              backgroundColor: 'transparent'
            }}
          />
        </div>

        {/* Table Listing */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E5E7EB',
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
          overflow: 'hidden'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#FAFAFA', borderBottom: '1px solid #E5E7EB', color: '#6B7280', fontWeight: 700 }}>
                <th style={{ padding: '16px 24px' }}>Table / Nom</th>
                <th style={{ padding: '16px 24px' }}>Propriétaire (Data Owner)</th>
                <th style={{ padding: '16px 24px' }}>Classification</th>
                <th style={{ padding: '16px 24px' }}>Niveau de Sensibilité</th>
                <th style={{ padding: '16px 24px' }}>Colonnes</th>
              </tr>
            </thead>
            <tbody>
              {tables.map((t, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #F3F4F6' }}>
                  <td style={{ padding: '18px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ padding: '10px', borderRadius: '10px', backgroundColor: '#FFF4ED', color: '#F36F21', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Database size={18} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, color: '#3D0C02', fontSize: '0.92rem' }}>{t.name}</div>
                        <div style={{ color: '#6B7280', fontSize: '0.78rem', marginTop: '2px' }}>{t.description}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '18px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1F2937', fontWeight: 600 }}>
                      <User size={14} color="#6B7280" />
                      <span>{t.owner}</span>
                    </div>
                  </td>
                  <td style={{ padding: '18px 24px' }}>
                    <span style={{ padding: '4px 12px', borderRadius: '20px', backgroundColor: '#EDE9FE', color: '#5B21B6', fontWeight: 700, fontSize: '0.78rem' }}>
                      {t.classification}
                    </span>
                  </td>
                  <td style={{ padding: '18px 24px' }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '20px',
                      backgroundColor: t.sensitivity === 'Critique' || t.sensitivity === 'Très Élevée' ? '#FEE2E2' : '#FFF4ED',
                      color: t.sensitivity === 'Critique' || t.sensitivity === 'Très Élevée' ? '#991B1B' : '#F36F21',
                      border: t.sensitivity === 'Critique' || t.sensitivity === 'Très Élevée' ? '1px solid #FECACA' : '1px solid #FFDBC2',
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <Shield size={12} /> {t.sensitivity}
                    </span>
                  </td>
                  <td style={{ padding: '18px 24px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {t.columns.map((c, cIdx) => (
                        <span key={cIdx} style={{ padding: '3px 8px', borderRadius: '6px', backgroundColor: '#F3F4F6', color: '#4B5563', fontSize: '0.75rem', fontWeight: 600 }}>
                          {c}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
};
