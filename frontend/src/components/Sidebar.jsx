import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Logo } from './Logo';
import { 
  LayoutDashboard, 
  Database, 
  GitCommit, 
  GitFork, 
  Bot, 
  User as UserIcon,
  LogOut,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';

export const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('atlas_sidebar_collapsed') === 'true';
  });

  useEffect(() => {
    const handleToggle = () => {
      const isCollapsed = localStorage.getItem('atlas_sidebar_collapsed') === 'true';
      setCollapsed(isCollapsed);
    };

    window.addEventListener('sidebarToggle', handleToggle);
    window.addEventListener('storage', handleToggle);

    return () => {
      window.removeEventListener('sidebarToggle', handleToggle);
      window.removeEventListener('storage', handleToggle);
    };
  }, []);

  useEffect(() => {
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
      mainContent.style.marginLeft = collapsed ? '0px' : '260px';
      mainContent.style.transition = 'margin-left 0.25s ease';
    }
  }, [collapsed]);

  const savedProfile = JSON.parse(localStorage.getItem('atlas_user_profile') || '{}');
  const rawName = savedProfile.fullName || user?.full_name || 'Meriam Erragragui';
  const displayName = rawName.replace(/\s*\(Admin\)/gi, '').trim();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside style={{
      position: 'fixed',
      top: 0,
      left: 0,
      bottom: 0,
      height: '100vh',
      width: '260px',
      backgroundColor: '#FFFFFF',
      borderRight: '1px solid #E5E7EB',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      zIndex: 100,
      boxShadow: '2px 0 10px rgba(0,0,0,0.03)',
      transform: collapsed ? 'translateX(-260px)' : 'translateX(0)',
      transition: 'transform 0.25s ease',
      visibility: collapsed ? 'hidden' : 'visible'
    }}>
      
      {/* Top Header Official Banque Populaire Logo */}
      <div style={{
        padding: '16px 14px',
        borderBottom: '1px solid #F3F4F6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        flexShrink: 0
      }}>
        <Logo size="large" />
      </div>

      {/* Main Navigation Menu */}
      <nav style={{ flex: 1, padding: '20px 14px', overflowY: 'auto' }}>
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          
          <li>
            <NavLink to="/dashboard" style={({ isActive }) => navItemStyle(isActive)}>
              <LayoutDashboard size={18} />
              <span>Tableau de bord</span>
            </NavLink>
          </li>

          <li>
            <NavLink to="/impact" style={({ isActive }) => navItemStyle(isActive)}>
              <GitCommit size={18} />
              <span>Analyse d'impact</span>
            </NavLink>
          </li>

          <li>
            <NavLink to="/pipelines" style={({ isActive }) => navItemStyle(isActive)}>
              <GitFork size={18} />
              <span>Pipelines & Lineage</span>
            </NavLink>
          </li>

          <li>
            <NavLink to="/chat" style={({ isActive }) => navItemStyle(isActive)}>
              <Bot size={18} />
              <span>Assistant IA</span>
            </NavLink>
          </li>

          {/* Admin Navigation */}
          {user?.role === 'admin' && (
            <>
              <li style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #F3F4F6' }}>
                <NavLink to="/admin/users" style={({ isActive }) => navItemStyle(isActive)}>
                  <ShieldCheck size={18} />
                  <span>Console Admin</span>
                </NavLink>
              </li>
            </>
          )}

          {/* Mon Profil & Déconnexion */}
          <li style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #F3F4F6' }}>
            <NavLink to="/profile" style={({ isActive }) => navItemStyle(isActive)}>
              <UserIcon size={18} />
              <span>Mon Profil</span>
            </NavLink>
          </li>

          <li>
            <button 
              onClick={handleLogout}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 14px',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: 'transparent',
                color: '#EF4444',
                fontSize: '0.88rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              <LogOut size={18} />
              <span>Déconnexion</span>
            </button>
          </li>

        </ul>
      </nav>

      {/* Footer User Profile (ALWAYS FIXED & VISIBLE AT THE BOTTOM) */}
      <div style={{
        padding: '14px 16px',
        borderTop: '1px solid #E5E7EB',
        backgroundColor: '#FAFAFA',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        flexShrink: 0
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          backgroundColor: '#F36F21',
          color: '#FFFFFF',
          fontSize: '0.85rem',
          fontWeight: 800,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0 2px 6px rgba(243,111,33,0.3)'
        }}>
          {displayName.charAt(0).toUpperCase()}
        </div>

        <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1F2937', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {displayName}
        </div>
      </div>

    </aside>
  );
};

const navItemStyle = (isActive) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '10px 14px',
  borderRadius: '10px',
  color: isActive ? '#FFFFFF' : '#4B5563',
  backgroundColor: isActive ? '#F36F21' : 'transparent',
  textDecoration: 'none',
  fontSize: '0.88rem',
  fontWeight: isActive ? 700 : 500,
  transition: 'all 0.15s ease',
  boxShadow: isActive ? '0 4px 12px rgba(243, 111, 33, 0.3)' : 'none'
});
