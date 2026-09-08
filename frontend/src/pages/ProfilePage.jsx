import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sidebar } from '../components/Sidebar';
import { User, Mail, Lock, Camera, CheckCircle, Save, Eye, EyeOff } from 'lucide-react';

export const ProfilePage = () => {
  const { user, updateProfile } = useAuth();
  
  // Load persisted profile if available
  const savedProfile = JSON.parse(localStorage.getItem('atlas_user_profile') || '{}');

  const [fullName, setFullName] = useState(savedProfile.fullName || user?.full_name || 'Meriam Erragragui (Admin)');
  const [email, setEmail] = useState(savedProfile.email || user?.email || 'merragragui@gmail.com');
  const [avatarUrl, setAvatarUrl] = useState(savedProfile.avatarUrl || null);

  const [currentPassword, setCurrentPassword] = useState(savedProfile.password || 'om1234');
  const [newPassword, setNewPassword] = useState('');
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');
    setSaving(true);

    try {
      if (updateProfile) {
        await updateProfile(fullName, email, newPassword ? newPassword : null);
      }

      const updatedProfile = {
        fullName,
        email,
        avatarUrl,
        password: newPassword ? newPassword : currentPassword
      };
      localStorage.setItem('atlas_user_profile', JSON.stringify(updatedProfile));
      
      if (newPassword) {
        setCurrentPassword(newPassword);
        setNewPassword('');
      }

      setSuccessMsg('Votre profil a été mis à jour avec succès.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.detail || 'Erreur lors de la mise à jour du profil.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="app-container">
      <Sidebar />

      <div className="main-content">
        {/* Header */}
        <header style={{
          height: '64px',
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #E5E7EB',
          padding: '0 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <h1 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#3D0C02', margin: 0 }}>Mon Profil</h1>
            <p style={{ fontSize: '0.78rem', color: '#6B7280', margin: 0 }}>Gérez vos informations personnelles et vos accès de sécurité</p>
          </div>
        </header>

        {/* Centered Profile Form Container */}
        <div style={{ padding: '36px 20px', width: '100%', display: 'flex', justifyContent: 'center' }}>
          
          <div style={{ width: '100%', maxWidth: '640px' }}>
            
            {successMsg && (
              <div style={{
                backgroundColor: '#D1FAE5',
                color: '#065F46',
                border: '1px solid #A7F3D0',
                padding: '12px 16px',
                borderRadius: '10px',
                fontSize: '0.88rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '20px'
              }}>
                <CheckCircle size={18} />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div style={{
                backgroundColor: '#FEE2E2',
                color: '#991B1B',
                border: '1px solid #FECACA',
                padding: '12px 16px',
                borderRadius: '10px',
                fontSize: '0.88rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '20px'
              }}>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Profile Card Centered */}
            <div style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '20px',
              padding: '36px',
              boxShadow: '0 10px 25px rgba(61,12,2,0.04)'
            }}>
              
              {/* Avatar Section without sub-text phrases as requested */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '28px', paddingBottom: '24px', borderBottom: '1px solid #F3F4F6' }}>
                <div style={{ position: 'relative' }}>
                  {avatarUrl ? (
                    <img 
                      src={avatarUrl} 
                      alt="Avatar" 
                      style={{
                        width: '84px',
                        height: '84px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '3px solid #F36F21',
                        boxShadow: '0 4px 12px rgba(243,111,33,0.2)'
                      }} 
                    />
                  ) : (
                    <div style={{
                      width: '84px',
                      height: '84px',
                      borderRadius: '50%',
                      backgroundColor: '#F36F21',
                      color: '#FFFFFF',
                      fontSize: '2.2rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 12px rgba(243,111,33,0.2)'
                    }}>
                      {fullName ? fullName.charAt(0).toUpperCase() : 'M'}
                    </div>
                  )}

                  {/* Hidden File Input for Avatar Upload */}
                  <input 
                    type="file" 
                    id="profile-photo-input" 
                    accept="image/*" 
                    onChange={handleAvatarUpload} 
                    style={{ display: 'none' }} 
                  />

                  <label 
                    htmlFor="profile-photo-input"
                    style={{
                      position: 'absolute',
                      bottom: '2px',
                      right: '2px',
                      width: '30px',
                      height: '30px',
                      borderRadius: '50%',
                      backgroundColor: '#3D0C02',
                      color: '#FFFFFF',
                      border: '2px solid #FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                    }}
                    title="Ajouter ou modifier la photo de profil"
                  >
                    <Camera size={15} />
                  </label>
                </div>

                <div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1F2937', margin: 0 }}>
                    {fullName}
                  </h2>
                </div>
              </div>

              {/* Profile Edit Form */}
              <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Full Name */}
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#3D0C02', marginBottom: '8px', display: 'block' }}>
                    Nom complet
                  </label>
                  <div style={{ position: 'relative' }}>
                    <User size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                    <input 
                      type="text" 
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      style={{ width: '100%', padding: '12px 14px 12px 42px', borderRadius: '10px', border: '1px solid #D1D5DB', fontSize: '0.90rem', outline: 'none', backgroundColor: '#FAFAFA' }}
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#3D0C02', marginBottom: '8px', display: 'block' }}>
                    Adresse e-mail
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      style={{ width: '100%', padding: '12px 14px 12px 42px', borderRadius: '10px', border: '1px solid #D1D5DB', fontSize: '0.90rem', outline: 'none', backgroundColor: '#FAFAFA' }}
                    />
                  </div>
                </div>

                {/* Password Section with Eye Toggle Controls */}
                <div style={{ paddingTop: '16px', borderTop: '1px solid #F3F4F6' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#3D0C02', marginBottom: '16px' }}>Sécurité & Mot de passe</h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    
                    {/* Current Password with Eye Toggle */}
                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#4B5563', marginBottom: '6px', display: 'block' }}>
                        Mot de passe actuel
                      </label>
                      <div style={{ position: 'relative' }}>
                        <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                        <input 
                          type={showCurrentPassword ? 'text' : 'password'} 
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          style={{ width: '100%', padding: '10px 36px 10px 38px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '0.88rem', outline: 'none', backgroundColor: '#FAFAFA' }}
                        />
                        <button 
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', cursor: 'pointer', color: '#9CA3AF' }}
                        >
                          {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    {/* New Password with Eye Toggle */}
                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#4B5563', marginBottom: '6px', display: 'block' }}>
                        Nouveau mot de passe
                      </label>
                      <div style={{ position: 'relative' }}>
                        <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                        <input 
                          type={showNewPassword ? 'text' : 'password'} 
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Nouveau mot de passe"
                          style={{ width: '100%', padding: '10px 36px 10px 38px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '0.88rem', outline: 'none', backgroundColor: '#FAFAFA' }}
                        />
                        <button 
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', cursor: 'pointer', color: '#9CA3AF' }}
                        >
                          {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                  </div>
                </div>

                <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button 
                    type="submit" 
                    style={{
                      padding: '13px 26px',
                      borderRadius: '10px',
                      backgroundColor: '#F36F21',
                      color: '#FFFFFF',
                      border: 'none',
                      fontWeight: 800,
                      fontSize: '0.92rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 14px rgba(243,111,33,0.35)',
                      transition: 'all 0.2s'
                    }}
                  >
                    <Save size={18} />
                    <span>Enregistrer les modifications</span>
                  </button>
                </div>

              </form>

            </div>

          </div>

        </div>
      </div>
    </div>
  );
};
