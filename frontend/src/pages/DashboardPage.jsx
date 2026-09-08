import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { 
  Database, ShieldAlert, Coins, FileText, Share2, Clock, RefreshCw, Calendar, Target, MessageSquare, ArrowRight, CheckCircle2 
} from 'lucide-react';

export const DashboardPage = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/dashboard/metrics');
      setData(res.data);
    } catch (err) {
      console.error("Erreur chargement dashboard:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  if (loading || !data) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#F8F9FB', minHeight: '100vh' }}>
        <Header title="Tableau de bord – Supervision des données bancaires" subtitle="Suivi du Data Lineage, des transactions suspectes et des rapports mensuels" />
        <div style={{ padding: '60px', textAlign: 'center', color: '#F36F21', fontWeight: 800, fontSize: '1.1rem' }}>
          Chargement des indicateurs Banque Populaire en temps réel...
        </div>
      </div>
    );
  }

  const {
    kpis,
    transaction_evolution,
    suspect_evolution,
    lineage_state,
    transaction_types,
    suspect_reasons,
    impact_analysis,
    agency_reports,
    agency_total,
    recent_ai_questions
  } = data;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#F8F9FB', minHeight: '100vh' }}>
      
      {/* Header Bar */}
      <Header 
        title="Tableau de bord – Supervision des données bancaires" 
        subtitle="Suivi du Data Lineage, des transactions suspectes et des rapports mensuels" 
      />

      <div className="page-content" style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* ROW 1: 5 KPI METRIC CARDS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '14px' }}>
          
          {/* 1. Transactions totales */}
          <KpiCard 
            icon={<Database size={20} color="#F36F21" />}
            iconBg="#FFF4ED"
            title="Transactions totales"
            value={kpis.total_transactions}
            subtext={kpis.total_transactions_delta}
            subtextColor="#F36F21"
          />

          {/* 2. Transactions suspectes */}
          <KpiCard 
            icon={<ShieldAlert size={20} color="#EF4444" />}
            iconBg="#FEE2E2"
            title="Transactions suspectes"
            value={kpis.suspect_transactions}
            subtext={kpis.suspect_percentage}
            subtextColor="#EF4444"
          />

          {/* 3. Montant total traité */}
          <KpiCard 
            icon={<Coins size={20} color="#F36F21" />}
            iconBg="#FFF4ED"
            title="Montant total traité"
            value={kpis.total_amount}
            subtext={kpis.total_amount_delta}
            subtextColor="#F36F21"
          />

          {/* 4. Rapports mensuels générés */}
          <KpiCard 
            icon={<FileText size={20} color="#F36F21" />}
            iconBg="#FFF4ED"
            title="Rapports mensuels générés"
            value={kpis.monthly_reports}
            subtext={kpis.reports_agencies_pct}
            subtextColor="#F36F21"
          />

          {/* 5. Couverture du Data Lineage */}
          <KpiCard 
            icon={<Share2 size={20} color="#10B981" />}
            iconBg="#D1FAE5"
            title="Couverture du Data Lineage"
            value={kpis.lineage_coverage}
            subtext={kpis.lineage_status}
            subtextColor="#10B981"
          />

        </div>

        {/* ROW 2: 3 CARDS (Évolution transactions + Évolution suspectes + État du lineage) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 0.8fr', gap: '16px' }}>
          
          {/* Card 1: Évolution des transactions */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <h3 style={cardTitleStyle}>Évolution des transactions</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#4B5563', fontWeight: 600 }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#F36F21' }}></span>
                Transactions totales
              </div>
            </div>
            <div style={{ width: '100%', height: '200px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={transaction_evolution} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                  <XAxis dataKey="date" stroke="#9CA3AF" fontSize={11} tickLine={false} />
                  <YAxis domain={['auto', 'auto']} stroke="#9CA3AF" fontSize={11} tickLine={false} />
                  <Tooltip formatter={(val) => [`${val.toLocaleString()} transactions`, 'Totales']} />
                  <Line type="monotone" dataKey="total" stroke="#F36F21" strokeWidth={2.5} dot={{ fill: '#F36F21', r: 5 }} label={({ x, y, value }) => (<text x={x} y={y - 8} fill="#F36F21" fontSize={10} fontWeight={800} textAnchor="middle">{value}</text>)} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Card 2: Évolution des transactions suspectes */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <h3 style={cardTitleStyle}>Évolution des transactions suspectes</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#4B5563', fontWeight: 600 }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3D0C02' }}></span>
                Transactions suspectes
              </div>
            </div>
            <div style={{ width: '100%', height: '200px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={suspect_evolution} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                  <XAxis dataKey="date" stroke="#9CA3AF" fontSize={11} tickLine={false} />
                  <YAxis domain={[0, 50]} stroke="#9CA3AF" fontSize={11} tickLine={false} />
                  <Tooltip formatter={(val) => [`${val} transactions`, 'Suspectes']} />
                  <Line 
                    type="monotone" 
                    dataKey="suspect" 
                    stroke="#3D0C02" 
                    strokeWidth={2.5} 
                    dot={{ fill: '#3D0C02', r: 5 }} 
                    label={({ x, y, value }) => (
                      <text x={x} y={y - 8} fill="#3D0C02" fontSize={10} fontWeight={800} textAnchor="middle">
                        {value}
                      </text>
                    )}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Card 3: État du lineage */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <Share2 size={18} color="#F36F21" />
              <h3 style={cardTitleStyle}>État du lineage</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={statusRowStyle}>
                <span style={{ color: '#4B5563', fontWeight: 600 }}>Tables (Atlas)</span>
                <span style={{ color: '#1F2937', fontWeight: 800 }}>{lineage_state.tables_atlas}</span>
              </div>
              <div style={statusRowStyle}>
                <span style={{ color: '#4B5563', fontWeight: 600 }}>Traitements</span>
                <span style={{ color: '#1F2937', fontWeight: 800 }}>{lineage_state.traitements}</span>
              </div>
              <div style={statusRowStyle}>
                <span style={{ color: '#4B5563', fontWeight: 600 }}>Relations</span>
                <span style={{ color: '#1F2937', fontWeight: 800 }}>{lineage_state.relations}</span>
              </div>
              <div style={{ ...statusRowStyle, borderBottom: 'none', paddingTop: '8px' }}>
                <span style={{ color: '#4B5563', fontWeight: 600 }}>Lineage</span>
                <span style={{ color: '#10B981', fontWeight: 800 }}>{lineage_state.status}</span>
              </div>
            </div>
          </div>

        </div>

        {/* ROW 3: 3 CARDS (Répartition types + Motifs transactions suspectes + Analyse d'impact) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr 0.7fr', gap: '16px' }}>
          
          {/* Card 1: Répartition des transactions par type */}
          <div style={cardStyle}>
            <h3 style={{ ...cardTitleStyle, marginBottom: '16px' }}>Répartition des transactions par type</h3>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <div style={{ width: '130px', height: '130px', flexShrink: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={transaction_types} dataKey="percentage" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={3}>
                      {transaction_types.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {transaction_types.map((type) => (
                  <div key={type.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.80rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: type.color }}></span>
                      <span style={{ color: '#374151', fontWeight: 600 }}>{type.name}</span>
                    </div>
                    <span style={{ color: '#1F2937', fontWeight: 800 }}>{type.percentage}% ({type.count.toLocaleString()})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Card 2: Transactions suspectes par motif (Horizontal Bar Chart) */}
          <div style={cardStyle}>
            <h3 style={{ ...cardTitleStyle, marginBottom: '16px' }}>Transactions suspectes par motif</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {suspect_reasons.map((item) => {
                const maxVal = 120;
                const pct = (item.count / maxVal) * 100;
                return (
                  <div key={item.reason} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.78rem' }}>
                    <div style={{ width: '160px', textAlign: 'right', fontWeight: 600, color: '#374151', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.reason}
                    </div>
                    <div style={{ flex: 1, backgroundColor: '#F3F4F6', height: '16px', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
                      <div style={{ width: `${pct}%`, backgroundColor: '#3D0C02', height: '100%', borderRadius: '4px', transition: 'width 0.5s ease' }}></div>
                    </div>
                    <div style={{ width: '30px', fontWeight: 800, color: '#3D0C02', fontSize: '0.82rem' }}>
                      {item.count}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card 3: Analyse d'impact */}
          <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Target size={18} color="#F36F21" />
                <h3 style={cardTitleStyle}>Analyse d'impact</h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.82rem' }}>
                <div>
                  <span style={{ color: '#6B7280', display: 'block', marginBottom: '2px' }}>Table analysée</span>
                  <span style={{ fontWeight: 800, color: '#3D0C02' }}>{impact_analysis.table_analyzed}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F3F4F6', paddingTop: '8px' }}>
                  <span style={{ color: '#6B7280' }}>Objets impactés</span>
                  <span style={{ fontWeight: 800, color: '#1F2937' }}>{impact_analysis.impacted_objects}</span>
                </div>

                <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: '8px' }}>
                  <span style={{ color: '#6B7280', display: 'block', marginBottom: '4px' }}>Dépendances directes</span>
                  {impact_analysis.direct_dependencies.map((dep) => (
                    <div key={dep} style={{ fontWeight: 700, color: '#3D0C02', paddingLeft: '8px', fontSize: '0.78rem' }}>
                      ➔ {dep}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button 
              onClick={() => navigate('/impact')}
              style={{
                marginTop: '16px',
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #F36F21',
                backgroundColor: '#FFF4ED',
                color: '#F36F21',
                fontWeight: 700,
                fontSize: '0.80rem',
                cursor: 'pointer',
                textAlign: 'center'
              }}
            >
              Voir l'analyse complète
            </button>
          </div>

        </div>

        {/* ROW 4: 2 CARDS (Reporting mensuel par agence + Assistant IA Questions récentes) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '16px' }}>
          
          {/* Card 1: Reporting mensuel par agence */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <FileText size={18} color="#F36F21" />
              <h3 style={cardTitleStyle}>Reporting mensuel par agence</h3>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#FAFAFA', borderBottom: '1px solid #E5E7EB', color: '#6B7280', fontWeight: 700 }}>
                    <th style={{ padding: '10px 12px' }}>Agence</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Transactions</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Montant traité (MAD)</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Transactions suspectes</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Taux de suspicion</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center' }}>Dernier rapport</th>
                  </tr>
                </thead>
                <tbody>
                  {agency_reports.map((row) => (
                    <tr key={row.agency} style={{ borderBottom: '1px solid #F3F4F6' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 700, color: '#374151' }}>{row.agency}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: '#4B5563' }}>{row.transactions}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: '#4B5563' }}>{row.amount}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: '#4B5563' }}>{row.suspect}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: '#374151' }}>{row.rate}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'center', color: '#6B7280' }}>{row.date}</td>
                    </tr>
                  ))}
                  
                  {/* Total Row */}
                  <tr style={{ backgroundColor: '#FAFAFA', fontWeight: 800, color: '#1F2937' }}>
                    <td style={{ padding: '12px' }}>{agency_total.agency}</td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>{agency_total.transactions}</td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>{agency_total.amount}</td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>{agency_total.suspect}</td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>{agency_total.rate}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>{agency_total.date}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Card 2: Assistant IA – Questions récentes */}
          <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <MessageSquare size={18} color="#F36F21" />
                <h3 style={cardTitleStyle}>Assistant IA – Questions récentes</h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {(data?.recent_ai_questions && data.recent_ai_questions.length > 0 ? data.recent_ai_questions : [
                  { question: "Quel est le lineage de la colonne transactions.montant ?", time: "11:15" },
                  { question: "Quelles agences ont le plus grand volume de transactions ?", time: "11:10" },
                  { question: "Quels traitements dépendent de la table comptes ?", time: "11:05" }
                ]).map((q, idx) => (
                  <div 
                    key={idx}
                    onClick={() => navigate('/chat', { state: { initialQuestion: q.question } })}
                    style={{
                      backgroundColor: '#FAFAFA',
                      border: '1px solid #E5E7EB',
                      borderRadius: '10px',
                      padding: '12px 14px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px',
                      transition: 'all 0.15s'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#FFF4ED'; e.currentTarget.style.borderColor = '#FFDBC2'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#FAFAFA'; e.currentTarget.style.borderColor = '#E5E7EB'; }}
                  >
                    <span style={{ fontSize: '0.80rem', fontWeight: 600, color: '#374151', lineHeight: 1.4 }}>
                      {q.question}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#9CA3AF', fontWeight: 600, flexShrink: 0 }}>
                      {q.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <button 
              onClick={() => navigate('/chat')}
              style={{
                marginTop: '16px',
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: '#FFF4ED',
                color: '#F36F21',
                fontWeight: 800,
                fontSize: '0.84rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <span>Interroger l'assistant IA</span>
              <ArrowRight size={16} />
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};

// Common Card Styles
const cardStyle = {
  backgroundColor: '#FFFFFF',
  borderRadius: '14px',
  border: '1px solid #E5E7EB',
  padding: '20px 22px',
  boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
};

const cardTitleStyle = {
  fontSize: '0.92rem',
  fontWeight: 800,
  color: '#3D0C02',
  margin: 0
};

const statusRowStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  fontSize: '0.84rem',
  borderBottom: '1px solid #F3F4F6',
  paddingBottom: '8px'
};

// KPI Card Component
const KpiCard = ({ icon, iconBg, title, value, subtext, subtextColor }) => (
  <div style={{
    backgroundColor: '#FFFFFF',
    borderRadius: '14px',
    border: '1px solid #E5E7EB',
    padding: '16px 18px',
    boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between'
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
      <div style={{
        width: '36px',
        height: '36px',
        borderRadius: '10px',
        backgroundColor: iconBg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        {icon}
      </div>
      <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#4B5563', lineHeight: 1.3 }}>
        {title}
      </span>
    </div>

    <div>
      <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#1F2937', marginBottom: '4px' }}>
        {value}
      </div>
      <div style={{ fontSize: '0.70rem', fontWeight: 700, color: subtextColor }}>
        {subtext}
      </div>
    </div>
  </div>
);
