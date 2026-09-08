import React from 'react';
import { Database, Cpu, ArrowRight } from 'lucide-react';

export const LineageDiagram = ({ title = "Lineage de score_risque", flow }) => {
  if (!flow) return null;

  const sources = flow.sources || ["clients", "transactions"];
  const treatment = flow.treatment || "generation_transactions";
  const utilization = flow.utilization || ["detection_transactions_suspectes", "agregation_reporting_mensuel"];
  const outputs = flow.outputs || ["transactions_suspectes", "reporting_mensuel"];

  return (
    <div style={{
      marginTop: '16px',
      padding: '16px 20px',
      backgroundColor: '#f8fafc',
      borderRadius: '12px',
      border: '1px solid #e2e8f0'
    }}>
      <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1e293b', marginBottom: '14px' }}>
        {title}
      </h4>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '12px',
        alignItems: 'center'
      }}>
        {/* Step 1: Sources */}
        <div style={{
          backgroundColor: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '10px',
          padding: '10px 12px'
        }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1d4ed8', display: 'block', marginBottom: '8px' }}>
            Sources
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {sources.map((item, idx) => (
              <div key={idx} style={{
                backgroundColor: '#ffffff',
                border: '1px solid #dbeafe',
                padding: '6px 10px',
                borderRadius: '6px',
                fontSize: '0.78rem',
                fontWeight: 600,
                color: '#1e40af',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <Database size={13} />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Step 2: Traitement */}
        <div style={{
          backgroundColor: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: '10px',
          padding: '10px 12px'
        }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#15803d', display: 'block', marginBottom: '8px' }}>
            Traitement
          </span>
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #dcfce7',
            padding: '6px 10px',
            borderRadius: '6px',
            fontSize: '0.78rem',
            fontWeight: 600,
            color: '#166534',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <Cpu size={13} />
            <span>{treatment}</span>
          </div>
        </div>

        {/* Step 3: Utilisation */}
        <div style={{
          backgroundColor: '#f3e8ff',
          border: '1px solid #e9d5ff',
          borderRadius: '10px',
          padding: '10px 12px'
        }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#7e22ce', display: 'block', marginBottom: '8px' }}>
            Utilisation
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {utilization.map((item, idx) => (
              <div key={idx} style={{
                backgroundColor: '#ffffff',
                border: '1px solid #f3e8ff',
                padding: '6px 10px',
                borderRadius: '6px',
                fontSize: '0.78rem',
                fontWeight: 600,
                color: '#6b21a8',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <Cpu size={13} />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Step 4: Sorties */}
        <div style={{
          backgroundColor: '#eff6ff',
          border: '1px solid #93c5fd',
          borderRadius: '10px',
          padding: '10px 12px'
        }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1e40af', display: 'block', marginBottom: '8px' }}>
            Sorties
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {outputs.map((item, idx) => (
              <div key={idx} style={{
                backgroundColor: '#ffffff',
                border: '1px solid #bfdbfe',
                padding: '6px 10px',
                borderRadius: '6px',
                fontSize: '0.78rem',
                fontWeight: 600,
                color: '#1e3a8a',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <Database size={13} />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
