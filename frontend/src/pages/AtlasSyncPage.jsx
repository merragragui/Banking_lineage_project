import React from 'react';
import { Header } from '../components/Header';
import { AtlasSyncCard } from '../components/AtlasSyncCard';

export const AtlasSyncPage = () => {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <Header 
        title="Synchronisation Apache Atlas" 
        subtitle="Alimentation automatique des métadonnées PostgreSQL vers Apache Atlas via API REST" 
      />

      <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <AtlasSyncCard />
      </div>
    </div>
  );
};
