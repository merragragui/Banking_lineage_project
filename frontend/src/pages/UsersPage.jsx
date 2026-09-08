import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Header } from '../components/Header';
import { AtlasSyncCard } from '../components/AtlasSyncCard';
import { Users, UserPlus, ShieldCheck, Trash2, CheckCircle2, XCircle, Search, Lock } from 'lucide-react';

export const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get('/api/users');
      setUsers(res.data || []);
    } catch (err) {
      console.error("Erreur lors de la récupération des utilisateurs:", err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/users', { full_name: fullName, email, password, role });
      setUsers(prev => [res.data, ...prev]);
      setShowModal(false);
      setFullName('');
      setEmail('');
      setPassword('');
      alert("Utilisateur créé avec succès !");
    } catch (err) {
      alert(err.response?.data?.detail || 'Erreur lors de la création de l\'utilisateur.');
    }
  };

  const toggleUserActive = async (userObj) => {
    if (userObj.email.toLowerCase().trim() === 'merragragui@gmail.com') {
      alert("Le statut du compte administrateur principal ne peut pas être modifié.");
      return;
    }
    try {
      const res = await axios.put(`/api/users/${userObj.id}`, { is_active: !userObj.is_active });
      setUsers(prev => prev.map(u => u.id === userObj.id ? res.data : u));
    } catch (err) {
      alert(err.response?.data?.detail || 'Erreur lors de la modification de l\'utilisateur.');
    }
  };

  const handleDeleteUser = async (userObj) => {
    // Protect primary admin Meriam Erragragui
    if (userObj.email.toLowerCase().trim() === 'merragragui@gmail.com') {
      alert("Le compte administrateur principal Meriam Erragragui est protégé et ne peut pas être supprimé.");
      return;
    }

    if (!window.confirm(`Voulez-vous vraiment supprimer l'utilisateur "${userObj.full_name}" ?`)) return;

    try {
      await axios.delete(`/api/users/${userObj.id}`);
      setUsers(prev => prev.filter(u => u.id !== userObj.id));
      alert("Utilisateur supprimé avec succès.");
    } catch (err) {
      alert(err.response?.data?.detail || 'Erreur lors de la suppression de l\'utilisateur.');
    }
  };

  // Filtered Users Logic
  const filteredUsers = users.filter((u) => {
    const matchesSearch = 
      (u.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.role || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <Header title="Console Administration – Gestion des Utilisateurs" subtitle="Recherchez, gérez et modifiez les accès des utilisateurs et administrateurs" />

      <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Admin Search Bar & Actions */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          padding: '20px 24px',
          border: '1px solid #E5E7EB',
          boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap'
        }}>
          {/* Functional User Search Bar */}
          <div style={{
            position: 'relative',
            flex: 1,
            minWidth: '280px'
          }}>
            <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#F36F21' }} />
            <input 
              type="text" 
              placeholder="Rechercher une personne par nom, e-mail ou rôle (User / Admin)..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px 12px 42px',
                borderRadius: '10px',
                border: '1px solid #D1D5DB',
                fontSize: '0.90rem',
                outline: 'none',
                backgroundColor: '#FAFAFA'
              }}
            />
          </div>

          {/* Role Filter Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#3D0C02' }}>
              Filtre Rôle :
            </div>
            <select 
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              style={{
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid #D1D5DB',
                backgroundColor: '#FFFFFF',
                fontSize: '0.88rem',
                fontWeight: 700,
                color: '#1F2937',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="all">Tous les utilisateurs</option>
              <option value="user">User (Utilisateur Métier)</option>
              <option value="admin">Admin (Administrateur)</option>
            </select>
          </div>

          {/* Add User Button */}
          <button 
            onClick={() => setShowModal(true)}
            style={{
              padding: '12px 20px',
              borderRadius: '10px',
              backgroundColor: '#F36F21',
              color: '#FFFFFF',
              border: 'none',
              fontWeight: 800,
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(243,111,33,0.3)'
            }}
          >
            <UserPlus size={18} />
            <span>Nouvel Utilisateur</span>
          </button>
        </div>

        {/* User Table */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E5E7EB',
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
          overflow: 'hidden'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#FAFAFA', borderBottom: '1px solid #E5E7EB', color: '#6B7280', fontWeight: 700 }}>
                <th style={{ padding: '16px 24px' }}>Nom Complet</th>
                <th style={{ padding: '16px 24px' }}>Email</th>
                <th style={{ padding: '16px 24px' }}>Rôle</th>
                <th style={{ padding: '16px 24px' }}>Statut</th>
                <th style={{ padding: '16px 24px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" style={{ padding: '32px', textAlign: 'center', color: '#F36F21', fontWeight: 700 }}>
                    Chargement des utilisateurs...
                  </td>
                </tr>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((u) => {
                  const isPrimaryAdmin = u.email.toLowerCase().trim() === 'merragragui@gmail.com';
                  return (
                    <tr key={u.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                      <td style={{ padding: '18px 24px', fontWeight: 800, color: '#3D0C02' }}>{u.full_name.replace(/\s*\(Admin\)/gi, '')}</td>
                      <td style={{ padding: '18px 24px', color: '#4B5563' }}>{u.email}</td>
                      <td style={{ padding: '18px 24px' }}>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '20px',
                          backgroundColor: u.role === 'admin' ? '#FFF4ED' : '#E0F2FE',
                          color: u.role === 'admin' ? '#F36F21' : '#0369A1',
                          border: u.role === 'admin' ? '1px solid #FFDBC2' : '1px solid #BAE6FD',
                          fontWeight: 700,
                          fontSize: '0.78rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          <ShieldCheck size={14} />
                          {u.role === 'admin' ? 'Administrateur' : 'Utilisateur Métier'}
                        </span>
                      </td>
                      <td style={{ padding: '18px 24px' }}>
                        <button 
                          onClick={() => toggleUserActive(u)}
                          disabled={isPrimaryAdmin}
                          style={{ background: 'transparent', border: 'none', cursor: isPrimaryAdmin ? 'not-allowed' : 'pointer' }}
                          title={isPrimaryAdmin ? "Compte principal protégé" : "Basculer statut actif / inactif"}
                        >
                          {u.is_active ? (
                            <span style={{ padding: '4px 12px', borderRadius: '20px', backgroundColor: '#D1FAE5', color: '#065F46', fontWeight: 700, fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <CheckCircle2 size={14} /> Actif
                            </span>
                          ) : (
                            <span style={{ padding: '4px 12px', borderRadius: '20px', backgroundColor: '#FEE2E2', color: '#991B1B', fontWeight: 700, fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <XCircle size={14} /> Inactif
                            </span>
                          )}
                        </button>
                      </td>
                      <td style={{ padding: '18px 24px' }}>
                        {isPrimaryAdmin ? (
                          <span 
                            title="Compte administrateur principal protégé"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 700, color: '#9CA3AF', backgroundColor: '#F3F4F6', padding: '4px 10px', borderRadius: '12px' }}
                          >
                            <Lock size={12} color="#9CA3AF" /> Protégé
                          </span>
                        ) : (
                          <button 
                            onClick={() => handleDeleteUser(u)}
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#EF4444', padding: '6px' }}
                            title="Supprimer l'utilisateur"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" style={{ padding: '32px', textAlign: 'center', color: '#6B7280' }}>
                    Aucun utilisateur trouvé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Modal Add User */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(61,12,2,0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100
        }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', width: '440px', padding: '32px', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#3D0C02', marginBottom: '20px' }}>Créer un nouvel utilisateur</h3>
            <form onSubmit={handleCreateUser} autoComplete="off" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Dummy hidden inputs to trap browser password autofill popup */}
              <input type="text" name="prevent_autofill_user" style={{ display: 'none', opacity: 0, position: 'absolute', width: 0, height: 0 }} tabIndex={-1} aria-hidden="true" readOnly />
              <input type="password" name="prevent_autofill_pass" style={{ display: 'none', opacity: 0, position: 'absolute', width: 0, height: 0 }} tabIndex={-1} aria-hidden="true" readOnly />

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#3D0C02', marginBottom: '6px', display: 'block' }}>Nom complet</label>
                <input 
                  type="text" 
                  name="create_user_fullname_field"
                  required 
                  value={fullName} 
                  onChange={(e) => setFullName(e.target.value)} 
                  placeholder="ex: Karim Bennani" 
                  autoComplete="off"
                  data-lpignore="true"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '0.88rem' }} 
                />
              </div>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#3D0C02', marginBottom: '6px', display: 'block' }}>Email (@gmail.com)</label>
                <input 
                  type="email" 
                  name="create_user_email_field"
                  required 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="nom@gmail.com" 
                  autoComplete="off"
                  data-lpignore="true"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '0.88rem' }} 
                />
              </div>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#3D0C02', marginBottom: '6px', display: 'block' }}>Mot de passe</label>
                <input 
                  type="password" 
                  name="create_user_password_field"
                  required 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="••••••••" 
                  autoComplete="new-password"
                  data-lpignore="true"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '0.88rem' }} 
                />
              </div>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#3D0C02', marginBottom: '6px', display: 'block' }}>Rôle</label>
                <select value={role} onChange={(e) => setRole(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '0.88rem', backgroundColor: '#FFFFFF' }}>
                  <option value="user">Utilisateur Métier (User)</option>
                  <option value="admin">Administrateur (Admin)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button type="button" style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #D1D5DB', backgroundColor: '#FFFFFF', color: '#4B5563', fontWeight: 700, cursor: 'pointer' }} onClick={() => setShowModal(false)}>Annuler</button>
                <button type="submit" style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: '#F36F21', color: '#FFFFFF', fontWeight: 800, cursor: 'pointer' }}>Créer le compte</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
