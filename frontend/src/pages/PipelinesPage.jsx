import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Header } from '../components/Header';
import { 
  Database, GitFork, Download, Plus, Minus, Maximize2, BookOpen, Share2 
} from 'lucide-react';

export const PipelinesPage = () => {
  const [zoomLevel, setZoomLevel] = useState(100);
  const [showLegend, setShowLegend] = useState(false);

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 10, 130));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 10, 80));
  const handleResetZoom = () => setZoomLevel(100);

  // Real PNG Export functionality - Draws full high-res canvas with all nodes, text, and arrows
  const handleExportPNG = () => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1920;
      canvas.height = 950;
      const ctx = canvas.getContext('2d');

      // White background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, 1920, 950);

      // Header Banner with Banque Populaire branding
      ctx.fillStyle = '#3D0C02';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText('BANQUE POPULAIRE DU MAROC', 60, 55);

      ctx.fillStyle = '#F36F21';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('Cartographie Graphique des Pipelines & Data Lineage', 60, 88);

      ctx.fillStyle = '#6B7280';
      ctx.font = '14px sans-serif';
      ctx.fillText('Généré le ' + new Date().toLocaleDateString('fr-FR') + ' à ' + new Date().toLocaleTimeString('fr-FR'), 1480, 55);

      // Helper for drawing node cards
      const drawNodeCard = (x, y, w, h, title, desc, isProcess) => {
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = isProcess ? '#F36F21' : '#3D0C02';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 14);
        ctx.fill();
        ctx.stroke();

        // Icon circle
        ctx.fillStyle = isProcess ? '#FFF4ED' : '#F3F4F6';
        ctx.beginPath();
        ctx.arc(x + 24, y + 32, 14, 0, Math.PI * 2);
        ctx.fill();

        // Icon symbol
        ctx.fillStyle = isProcess ? '#F36F21' : '#3D0C02';
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText(isProcess ? '⚙' : '🛢', x + 18, y + 37);

        // Title
        ctx.fillStyle = '#1F2937';
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText(title, x + 46, y + 32);

        // Description
        ctx.fillStyle = '#6B7280';
        ctx.font = '11px sans-serif';
        ctx.fillText(desc, x + 46, y + 54);
      };

      // Helper to draw connecting arrows
      const drawArrow = (x1, y1, x2, y2, color) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        // Arrow head
        const angle = Math.atan2(y2 - y1, x2 - x1);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - 10 * Math.cos(angle - Math.PI / 6), y2 - 10 * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(x2 - 10 * Math.cos(angle + Math.PI / 6), y2 - 10 * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fill();
      };

      // Draw all 10 nodes matching on-screen pipeline layout
      // Col 1: Sources
      drawNodeCard(60, 200, 200, 75, 'clients', 'Table maître client (source)', false);
      drawNodeCard(60, 480, 200, 75, 'agences', 'Données agences (source)', false);

      // Col 2: Treatment 1
      drawNodeCard(320, 340, 220, 75, 'alimentation_comptes', 'Traitement ouverture & alimentation', true);

      // Col 3: Table 2
      drawNodeCard(600, 340, 200, 75, 'comptes', 'Comptes bancaires clients', false);

      // Col 4: Treatment 2
      drawNodeCard(860, 340, 230, 75, 'generation_transactions', 'Génération des flux financiers', true);

      // Col 5: Table 3
      drawNodeCard(1150, 340, 200, 75, 'transactions', 'Historique des mouvements', false);

      // Col 6 & 7: Top Branch
      drawNodeCard(1410, 200, 250, 75, 'detection_transactions_suspectes', 'Détection transactions suspectes', true);
      drawNodeCard(1690, 200, 190, 75, 'transactions_suspectes', 'Transactions suspectes', false);

      // Col 6 & 7: Bottom Branch
      drawNodeCard(1410, 480, 250, 75, 'agregation_reporting_mensuel', 'Agrégation du reporting mensuel', true);
      drawNodeCard(1690, 480, 190, 75, 'reporting_mensuel', 'Rapports mensuels agences', false);

      // Draw connecting arrows
      drawArrow(260, 237, 320, 377, '#F36F21');
      drawArrow(260, 517, 320, 377, '#F36F21');
      drawArrow(540, 377, 600, 377, '#F36F21');
      drawArrow(800, 377, 860, 377, '#F36F21');
      drawArrow(1090, 377, 1150, 377, '#F36F21');
      drawArrow(1350, 377, 1410, 237, '#F36F21');
      drawArrow(1350, 377, 1410, 517, '#F36F21');
      drawArrow(1660, 237, 1690, 237, '#3D0C02');
      drawArrow(1660, 517, 1690, 517, '#3D0C02');

      // Bottom Banner Summary Box
      ctx.fillStyle = '#FAFAFA';
      ctx.strokeStyle = '#E5E7EB';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(60, 750, 1820, 120, 16);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#3D0C02';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('Résumé de la chaîne du Data Lineage (Banking Lineage)', 90, 790);

      ctx.fillStyle = '#4B5563';
      ctx.font = '13px sans-serif';
      ctx.fillText('• 6 Tables Atlas | 4 Traitements Spark/ETL | 12 Relations de lineage directes', 90, 820);
      ctx.fillText('• Flux complet : [clients] + [agences] ➔ [alimentation_comptes] ➔ [comptes] ➔ [generation_transactions] ➔ [transactions] ➔ [reporting & détection]', 90, 845);

      // Trigger automatic PNG file download in user file explorer
      const imageURI = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = 'cartographie_pipeline_banking_populaire.png';
      link.href = imageURI;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Erreur export PNG:", err);
      alert("Erreur lors de la génération du PNG.");
    }
  };

  const exportBtn = (
    <button 
      onClick={handleExportPNG}
      style={{
        padding: '10px 20px',
        borderRadius: '10px',
        backgroundColor: '#3D0C02',
        color: '#FFFFFF',
        border: 'none',
        fontWeight: 800,
        fontSize: '0.88rem',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        boxShadow: '0 4px 12px rgba(61,12,2,0.2)',
        transition: 'all 0.15s ease'
      }}
    >
      <Download size={16} />
      <span>Exporter en PNG</span>
    </button>
  );

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%' }}>
      {/* 100% Full-Width Header Bar */}
      <Header 
        title="Pipelines & Lineage" 
        subtitle="Cartographie graphique des traitements de données du système bancaire"
      />

      <div className="page-content" style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
        
        {/* Full-width Main Pipeline Canvas Box */}
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: '20px',
          padding: '24px 28px 28px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          width: '100%',
          overflow: 'hidden'
        }}>
          
          {/* Canvas Top Bar Controls */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#FFF4ED',
                color: '#F36F21',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800
              }}>
                <Share2 size={18} color="#F36F21" />
              </div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#3D0C02', margin: 0 }}>
                Vue d'ensemble du lineage
              </h2>
            </div>

            {/* Right Toolbar Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#F8F9FB',
                border: '1px solid #E5E7EB',
                borderRadius: '10px',
                padding: '4px 8px'
              }}>
                <button onClick={handleZoomOut} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#6B7280', padding: '4px' }}>
                  <Minus size={14} />
                </button>
                <span style={{ fontSize: '0.80rem', fontWeight: 700, color: '#1F2937', padding: '0 10px' }}>
                  {zoomLevel}%
                </span>
                <button onClick={handleZoomIn} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#6B7280', padding: '4px' }}>
                  <Plus size={14} />
                </button>
              </div>

              <button 
                onClick={handleResetZoom}
                style={{
                  padding: '8px 14px',
                  borderRadius: '10px',
                  backgroundColor: '#F8F9FB',
                  border: '1px solid #E5E7EB',
                  color: '#4B5563',
                  fontSize: '0.80rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Maximize2 size={14} />
                <span>Ajuster</span>
              </button>
            </div>
          </div>

          {/* 100% Fluid Diagram Box */}
          <div style={{
            position: 'relative',
            width: '100%',
            height: '420px',
            overflow: 'hidden',
            transform: `scale(${zoomLevel / 100})`,
            transformOrigin: 'top center',
            transition: 'transform 0.2s ease'
          }}>
            <svg 
              viewBox="0 0 1000 400"
              preserveAspectRatio="none"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 1
              }}
            >
              <defs>
                <marker id="arrow-orange" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 1 L 8 5 L 0 9 z" fill="#F36F21" />
                </marker>
                <marker id="arrow-brown" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 1 L 8 5 L 0 9 z" fill="#3D0C02" />
                </marker>
              </defs>

              <path d="M 125 90 C 145 90, 145 200, 160 200" fill="none" stroke="#F36F21" strokeWidth="2" markerEnd="url(#arrow-orange)" />
              <path d="M 125 310 C 145 310, 145 200, 160 200" fill="none" stroke="#F36F21" strokeWidth="2" markerEnd="url(#arrow-orange)" />
              <path d="M 295 200 L 305 200" fill="none" stroke="#F36F21" strokeWidth="2" markerEnd="url(#arrow-orange)" />
              <path d="M 430 200 L 440 200" fill="none" stroke="#F36F21" strokeWidth="2" markerEnd="url(#arrow-orange)" />
              <path d="M 570 200 L 580 200" fill="none" stroke="#F36F21" strokeWidth="2" markerEnd="url(#arrow-orange)" />
              <path d="M 710 200 C 725 200, 725 90, 735 90" fill="none" stroke="#F36F21" strokeWidth="2" markerEnd="url(#arrow-orange)" />
              <path d="M 710 200 C 725 200, 725 310, 735 310" fill="none" stroke="#F36F21" strokeWidth="2" markerEnd="url(#arrow-orange)" />
              <path d="M 865 90 L 875 90" fill="none" stroke="#3D0C02" strokeWidth="2" markerEnd="url(#arrow-brown)" />
              <path d="M 865 310 L 875 310" fill="none" stroke="#3D0C02" strokeWidth="2" markerEnd="url(#arrow-brown)" />
            </svg>

            {/* Nodes */}
            <DiagramNode left="0.5%" top="60px" width="12%" title="clients" subtitle="Table maître client (source)" icon={<Database size={16} color="#3D0C02" />} type="table" />
            <DiagramNode left="0.5%" top="280px" width="12%" title="agences" subtitle="Données agences (source)" icon={<Database size={16} color="#3D0C02" />} type="table" />
            <DiagramNode left="16%" top="170px" width="13.5%" title="alimentation_comptes" subtitle="Traitement ouverture & alimentation" icon={<GitFork size={16} color="#F36F21" />} type="process" />
            <DiagramNode left="30.5%" top="170px" width="12.5%" title="comptes" subtitle="Comptes bancaires clients" icon={<Database size={16} color="#3D0C02" />} type="table" />
            <DiagramNode left="44%" top="170px" width="13%" title="generation_transactions" subtitle="Génération des flux financiers" icon={<GitFork size={16} color="#F36F21" />} type="process" />
            <DiagramNode left="58%" top="170px" width="13%" title="transactions" subtitle="Historique des mouvements" icon={<Database size={16} color="#3D0C02" />} type="table" />
            <DiagramNode left="73.5%" top="60px" width="13%" title="detection_transactions_suspectes" subtitle="Détection transactions suspectes" icon={<GitFork size={16} color="#F36F21" />} type="process" />
            <DiagramNode left="87.5%" top="60px" width="12%" title="transactions_suspectes" subtitle="Transactions suspectes" icon={<Database size={16} color="#3D0C02" />} type="table" />
            <DiagramNode left="73.5%" top="280px" width="13%" title="agregation_reporting_mensuel" subtitle="Agrégation du reporting mensuel" icon={<GitFork size={16} color="#F36F21" />} type="process" />
            <DiagramNode left="87.5%" top="280px" width="12%" title="reporting_mensuel" subtitle="Rapports mensuels agences" icon={<Database size={16} color="#3D0C02" />} type="table" />
          </div>

        </div>

        {/* SECTION : VUE D'ENSEMBLE DU LINEAGE DES COLONNES (GLOBAL COLUMN LINEAGE) */}
        <DynamicAtlasColumnLineage />

      </div>
    </div>
  );
};

const DiagramNode = ({ left, top, width, title, subtitle, icon, type }) => {
  const isProcess = type === 'process';
  return (
    <div style={{
      position: 'absolute',
      left: left,
      top: top,
      width: width,
      backgroundColor: '#FFFFFF',
      borderRadius: '12px',
      border: isProcess ? '1.5px solid #F36F21' : '1.5px solid #3D0C02',
      padding: '10px 12px',
      boxShadow: isProcess ? '0 4px 12px rgba(243,111,33,0.08)' : '0 4px 12px rgba(61,12,2,0.06)',
      zIndex: 2,
      display: 'flex',
      flexDirection: 'column',
      gap: '4px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <div style={{
          width: '24px',
          height: '24px',
          borderRadius: '6px',
          backgroundColor: isProcess ? '#FFF4ED' : '#F3F4F6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          {icon}
        </div>
        <div style={{ 
          fontSize: '0.80rem', 
          fontWeight: 800, 
          color: '#1F2937', 
          wordBreak: 'break-word',
          lineHeight: 1.2
        }}>
          {title}
        </div>
      </div>
      {subtitle && (
        <div style={{ 
          fontSize: '0.68rem', 
          color: '#6B7280', 
          lineHeight: 1.2, 
          paddingLeft: '30px',
          wordBreak: 'break-word'
        }}>
          {subtitle}
        </div>
      )}
    </div>
  );
};

const DynamicAtlasColumnLineage = () => {
  return (
    <div style={{
      backgroundColor: '#FFFFFF',
      borderRadius: '20px',
      border: '1px solid #E5E7EB',
      padding: '24px 28px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
      width: '100%'
    }}>
      {/* Header & Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #F3F4F6', paddingBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            backgroundColor: '#FFF4ED',
            color: '#F36F21',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <GitFork size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#3D0C02', margin: 0 }}>
              Lineage des Métadonnées
            </h2>
          </div>
        </div>
      </div>

      {/* UNIFIED BRANCHING LINEAGE TREE (100% FIT WITH AUTO SCROLLBACK & COMPACT FIT) */}
      <div style={{
        backgroundColor: '#FAFAFA',
        borderRadius: '16px',
        border: '1px solid #E5E7EB',
        padding: '20px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        overflowX: 'auto',
        width: '100%'
      }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0px', minWidth: '100%', padding: '0 8px' }}>
          
          {/* 1. LEFT INPUT SOURCES (clients.client_id & agences.agence_id) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', justifyContent: 'center' }}>
            
            {/* Source 1: clients.client_id */}
            <div style={{
              backgroundColor: '#FFFFFF',
              border: '1.5px solid #3D0C02',
              borderRadius: '10px',
              padding: '8px 10px',
              minWidth: '110px',
              boxShadow: '0 2px 6px rgba(61,12,2,0.04)',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.58rem', fontWeight: 800, textTransform: 'uppercase', color: '#3D0C02' }}>Colonne</span>
                <span style={{ fontSize: '0.56rem', backgroundColor: '#FFF4ED', color: '#F36F21', border: '1px solid #FFDBC2', padding: '1px 5px', borderRadius: '6px', fontWeight: 800 }}>Source</span>
              </div>
              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#1F2937', fontFamily: 'monospace' }}>client_id</div>
              <div style={{ fontSize: '0.62rem', color: '#6B7280' }}>Table: <strong style={{ color: '#3D0C02' }}>clients</strong></div>
            </div>

            {/* Source 2: agences.agence_id */}
            <div style={{
              backgroundColor: '#FFFFFF',
              border: '1.5px solid #3D0C02',
              borderRadius: '10px',
              padding: '8px 10px',
              minWidth: '110px',
              boxShadow: '0 2px 6px rgba(61,12,2,0.04)',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.58rem', fontWeight: 800, textTransform: 'uppercase', color: '#3D0C02' }}>Colonne</span>
                <span style={{ fontSize: '0.56rem', backgroundColor: '#FFF4ED', color: '#F36F21', border: '1px solid #FFDBC2', padding: '1px 5px', borderRadius: '6px', fontWeight: 800 }}>Source</span>
              </div>
              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#1F2937', fontFamily: 'monospace' }}>agence_id</div>
              <div style={{ fontSize: '0.62rem', color: '#6B7280' }}>Table: <strong style={{ color: '#3D0C02' }}>agences</strong></div>
            </div>

          </div>

          {/* 2. LEFT SVG CURVED MERGE CONNECTOR */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', flexShrink: 0 }}>
            <svg width="28" height="115" viewBox="0 0 28 115" style={{ overflow: 'visible' }}>
              {/* Top Source (clients.client_id) merging down to center */}
              <path
                d="M 0 16 C 14 16, 14 57.5, 28 57.5"
                fill="none"
                stroke="#F36F21"
                strokeWidth="2.0"
              />
              
              {/* Bottom Source (agences.agence_id) merging up to center */}
              <path
                d="M 0 98 C 14 98, 14 57.5, 28 57.5"
                fill="none"
                stroke="#F36F21"
                strokeWidth="2.0"
              />
              <polygon points="23,54.5 28,57.5 23,60.5" fill="#F36F21" />
            </svg>
          </div>

          {/* 3. CENTER TRUNK */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>

            {/* Node: Alimentation des Comptes */}
            <div style={{
              backgroundColor: '#FFFFFF',
              border: '1.5px solid #F36F21',
              borderRadius: '10px',
              padding: '8px 10px',
              minWidth: '115px',
              boxShadow: '0 2px 6px rgba(243,111,33,0.06)',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px'
            }}>
              <span style={{ fontSize: '0.58rem', fontWeight: 800, textTransform: 'uppercase', color: '#F36F21' }}>Traitement ETL</span>
              <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#1F2937' }}>Alimentation des Comptes</div>
            </div>

            <div style={{ color: '#F36F21', fontWeight: 900, fontSize: '0.95rem' }}>➔</div>

            {/* Node: comptes (client_id, agence_id) */}
            <div style={{
              backgroundColor: '#FFFFFF',
              border: '1.5px solid #3D0C02',
              borderRadius: '10px',
              padding: '8px 10px',
              minWidth: '120px',
              boxShadow: '0 2px 6px rgba(61,12,2,0.04)',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px'
            }}>
              <span style={{ fontSize: '0.58rem', fontWeight: 800, textTransform: 'uppercase', color: '#3D0C02' }}>Colonnes</span>
              <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#1F2937', fontFamily: 'monospace' }}>client_id, agence_id</div>
              <div style={{ fontSize: '0.62rem', color: '#6B7280' }}>Table: <strong style={{ color: '#3D0C02' }}>comptes</strong></div>
            </div>

            <div style={{ color: '#F36F21', fontWeight: 900, fontSize: '0.95rem' }}>➔</div>

            {/* Node: Génération des Transactions */}
            <div style={{
              backgroundColor: '#FFFFFF',
              border: '1.5px solid #F36F21',
              borderRadius: '10px',
              padding: '8px 10px',
              minWidth: '115px',
              boxShadow: '0 2px 6px rgba(243,111,33,0.06)',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px'
            }}>
              <span style={{ fontSize: '0.58rem', fontWeight: 800, textTransform: 'uppercase', color: '#F36F21' }}>Traitement ETL</span>
              <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#1F2937' }}>Génération des Transactions</div>
            </div>

            <div style={{ color: '#F36F21', fontWeight: 900, fontSize: '0.95rem' }}>➔</div>

            {/* Node: transactions.compte_source_id */}
            <div style={{
              backgroundColor: '#FFFFFF',
              border: '2px solid #F36F21',
              borderRadius: '10px',
              padding: '8px 10px',
              minWidth: '115px',
              boxShadow: '0 0 0 3px rgba(243,111,33,0.10)',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px'
            }}>
              <span style={{ fontSize: '0.58rem', fontWeight: 800, textTransform: 'uppercase', color: '#3D0C02' }}>Colonne</span>
              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#1F2937', fontFamily: 'monospace' }}>compte_source_id</div>
              <div style={{ fontSize: '0.62rem', color: '#6B7280' }}>Table: <strong style={{ color: '#3D0C02' }}>transactions</strong></div>
            </div>

          </div>

          {/* 4. RIGHT SVG CURVED SPLIT CONNECTOR */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', flexShrink: 0 }}>
            <svg width="28" height="115" viewBox="0 0 28 115" style={{ overflow: 'visible' }}>
              {/* Top Branch Curved Connector */}
              <path
                d="M 0 57.5 C 14 57.5, 14 16, 28 16"
                fill="none"
                stroke="#F36F21"
                strokeWidth="2.0"
              />
              <polygon points="23,13 28,16 23,19" fill="#F36F21" />

              {/* Bottom Branch Curved Connector */}
              <path
                d="M 0 57.5 C 14 57.5, 14 98, 28 98"
                fill="none"
                stroke="#F36F21"
                strokeWidth="2.0"
              />
              <polygon points="23,95 28,98 23,101" fill="#F36F21" />
            </svg>
          </div>

          {/* 5. PARALLEL RIGHT FORKED BRANCHES */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', justifyContent: 'center' }}>
            
            {/* TOP BRANCH: FRAUDE AML */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{
                backgroundColor: '#FFFFFF',
                border: '1.5px solid #F36F21',
                borderRadius: '10px',
                padding: '8px 10px',
                minWidth: '115px',
                boxShadow: '0 2px 6px rgba(243,111,33,0.06)',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px'
              }}>
                <span style={{ fontSize: '0.58rem', fontWeight: 800, textTransform: 'uppercase', color: '#F36F21' }}>Traitement ETL</span>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#1F2937', fontFamily: 'monospace', lineHeight: '1.2' }}>
                  detection_transactions_<br />suspectes
                </div>
              </div>

              <div style={{ color: '#F36F21', fontWeight: 900, fontSize: '0.95rem' }}>➔</div>

              <div style={{
                backgroundColor: '#FFFFFF',
                border: '1.5px solid #3D0C02',
                borderRadius: '10px',
                padding: '8px 10px',
                minWidth: '115px',
                boxShadow: '0 2px 6px rgba(61,12,2,0.04)',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px'
              }}>
                <span style={{ fontSize: '0.58rem', fontWeight: 800, textTransform: 'uppercase', color: '#3D0C02' }}>Datamart</span>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#1F2937', fontFamily: 'monospace' }}>score_risque</div>
                <div style={{ fontSize: '0.62rem', color: '#6B7280' }}>Table: <strong style={{ color: '#3D0C02' }}>transactions_suspectes</strong></div>
              </div>
            </div>

            {/* BOTTOM BRANCH: REPORTING MENSUEL */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{
                backgroundColor: '#FFFFFF',
                border: '1.5px solid #F36F21',
                borderRadius: '10px',
                padding: '8px 10px',
                minWidth: '115px',
                boxShadow: '0 2px 6px rgba(243,111,33,0.06)',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px'
              }}>
                <span style={{ fontSize: '0.58rem', fontWeight: 800, textTransform: 'uppercase', color: '#F36F21' }}>Traitement ETL</span>
                <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#1F2937' }}>Agrégation Reporting Mensuel</div>
              </div>

              <div style={{ color: '#F36F21', fontWeight: 900, fontSize: '0.95rem' }}>➔</div>

              <div style={{
                backgroundColor: '#FFFFFF',
                border: '1.5px solid #3D0C02',
                borderRadius: '10px',
                padding: '8px 10px',
                minWidth: '115px',
                boxShadow: '0 2px 6px rgba(61,12,2,0.04)',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px'
              }}>
                <span style={{ fontSize: '0.58rem', fontWeight: 800, textTransform: 'uppercase', color: '#3D0C02' }}>Datamart</span>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#1F2937', fontFamily: 'monospace' }}>montant_total</div>
                <div style={{ fontSize: '0.62rem', color: '#6B7280' }}>Table: <strong style={{ color: '#3D0C02' }}>reporting_mensuel</strong></div>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
