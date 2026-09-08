import React from 'react';
import { Menu } from 'lucide-react';

export const Header = ({ title = "Dashboard", subtitle = "", rightAction = null }) => {
  const toggleSidebar = () => {
    const isCollapsed = localStorage.getItem('atlas_sidebar_collapsed') === 'true';
    const nextState = !isCollapsed;
    localStorage.setItem('atlas_sidebar_collapsed', nextState.toString());
    window.dispatchEvent(new Event('sidebarToggle'));
  };

  return (
    <header style={{
      height: '64px',
      backgroundColor: '#FFFFFF',
      borderBottom: '1px solid #E5E7EB',
      padding: '0 32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 10,
      width: '100%',
      boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: 0 }}>
        {/* Orange Theme Hamburger Menu Toggle Button */}
        <button
          onClick={toggleSidebar}
          title="Réduire / Afficher le menu de navigation"
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '8px',
            border: '1px solid #FFDBC2',
            backgroundColor: '#FFF4ED',
            color: '#F36F21',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
            transition: 'all 0.15s ease',
            boxShadow: '0 2px 6px rgba(243,111,33,0.15)'
          }}
        >
          <Menu size={20} color="#F36F21" />
        </button>

        <div style={{ minWidth: 0, flex: 1 }}>
          <h1 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#3D0C02', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</h1>
          {subtitle && <p style={{ fontSize: '0.78rem', color: '#6B7280', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{subtitle}</p>}
        </div>
      </div>

      {rightAction && (
        <div style={{ flexShrink: 0, marginLeft: '16px' }}>
          {rightAction}
        </div>
      )}
    </header>
  );
};
