import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Logo } from '../components/Logo';
import { Mail, Lock, Eye, EyeOff, User, ArrowRight, UserPlus, CheckCircle } from 'lucide-react';

export const LoginPage = () => {
  const [mode, setMode] = useState('login'); // 'login' ou 'register'
  
  // Login fields (empty by default so new registered users enter their own credentials)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Register fields
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { token, user, login, register } = useAuth();
  const navigate = useNavigate();

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Email ou mot de passe incorrect.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Strict validation rules
    if (regFullName.includes('@')) {
      setError('Le nom complet ne doit pas être une adresse e-mail.');
      return;
    }

    if (!regEmail.includes('@') || !regEmail.toLowerCase().endsWith('@gmail.com')) {
      setError('Veuillez saisir une adresse e-mail valide se terminant par @gmail.com.');
      return;
    }

    if (!regPassword || regPassword.trim().length < 3) {
      setError('Veuillez saisir un mot de passe valide.');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Create user in PostgreSQL database
      await register(regFullName, regEmail, regPassword, 'user');
      
      // 2. Redirect to login form directly
      setEmail(regEmail);
      setPassword('');
      setRegFullName('');
      setRegEmail('');
      setRegPassword('');
      setMode('login');
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors de la création du compte.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      backgroundColor: '#F8F9FB',
      fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
      overflow: 'hidden'
    }}>
      
      {/* ================= LEFT FULL-HEIGHT BACKGROUND PHOTO (BANK_BP.AVIF) ================= */}
      <div style={{
        flex: '1.2',
        position: 'relative',
        backgroundImage: "url('/bank_bp.avif')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '48px 56px'
      }}>
        
        {/* Dark Gradient Overlay */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.45) 45%, rgba(0,0,0,0.15) 100%)',
          zIndex: 1
        }} />

        <div />

        {/* Bottom Hero Overlay Text matching exact user photo */}
        <div style={{ position: 'relative', zIndex: 2, maxWidth: '640px', marginBottom: '24px' }}>
          
          <h1 style={{
            fontSize: '3.2rem',
            fontWeight: 800,
            color: '#FFFFFF',
            margin: '0 0 8px 0',
            letterSpacing: '-0.5px',
            lineHeight: 1.1,
            textShadow: '0 2px 10px rgba(0,0,0,0.4)'
          }}>
            BANKING LINEAGE
          </h1>

          <h2 style={{
            fontSize: '1.4rem',
            fontWeight: 700,
            color: '#F36F21',
            margin: '0 0 16px 0',
            textShadow: '0 2px 8px rgba(0,0,0,0.5)'
          }}>
            Assistant Intelligent de Data Lineage
          </h2>

          <p style={{
            fontSize: '1.02rem',
            color: 'rgba(255, 255, 255, 0.92)',
            lineHeight: 1.6,
            margin: 0,
            textShadow: '0 1px 4px rgba(0,0,0,0.5)',
            maxWidth: '540px'
          }}>
            Plateforme d'entreprise permettant d'automatiser l'analyse d'impact, la traçabilité des données bancaires et la gouvernance
          </p>

        </div>

      </div>

      {/* ================= RIGHT COLUMN: LOGIN FORM CARD ================= */}
      <div style={{
        flex: '0.8',
        backgroundColor: '#F8F9FB',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px'
      }}>
        
        <div style={{
          width: '100%',
          maxWidth: '420px',
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          boxShadow: '0 20px 40px rgba(61, 12, 2, 0.06)',
          padding: '44px 38px',
          border: '1px solid #E5E7EB'
        }}>
          
          {/* Form Header */}
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#3D0C02', margin: '0 0 6px 0' }}>
              {mode === 'login' ? 'Connexion' : 'Création de compte'}
            </h2>
            {mode === 'login' && (
              <p style={{ fontSize: '0.88rem', color: '#6B7280', margin: 0 }}>
                Accédez à votre espace Banking Lineage
              </p>
            )}
          </div>

          {/* Error Banner */}
          {error && (
            <div style={{
              backgroundColor: '#FEF2F2',
              color: '#991B1B',
              border: '1px solid #FECACA',
              padding: '10px 14px',
              borderRadius: '10px',
              fontSize: '0.82rem',
              marginBottom: '20px',
              fontWeight: 600
            }}>
              {error}
            </div>
          )}

          {/* ================= LOGIN FORM ================= */}
          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Email Input */}
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#3D0C02', marginBottom: '8px', display: 'block' }}>
                  Adresse e-mail
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                  <input 
                    type="email" 
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="username"
                    placeholder="exemple@gmail.com"
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
              </div>

              {/* Password Input */}
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#3D0C02', marginBottom: '8px', display: 'block' }}>
                  Mot de passe
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    placeholder="Entrez votre mot de passe"
                    style={{
                      width: '100%',
                      padding: '12px 42px 12px 42px',
                      borderRadius: '10px',
                      border: '1px solid #D1D5DB',
                      fontSize: '0.90rem',
                      outline: 'none',
                      backgroundColor: '#FAFAFA'
                    }}
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', color: '#9CA3AF', cursor: 'pointer'
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Remember Me ONLY */}
              <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.85rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4B5563', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    style={{ accentColor: '#F36F21', width: '16px', height: '16px', borderRadius: '4px' }}
                  />
                  <span style={{ fontWeight: 500 }}>Se souvenir de moi</span>
                </label>
              </div>

              {/* Submit Button */}
              <button 
                type="submit" 
                disabled={submitting}
                style={{
                  marginTop: '6px',
                  width: '100%',
                  padding: '14px',
                  borderRadius: '10px',
                  backgroundColor: '#F36F21',
                  color: '#FFFFFF',
                  border: 'none',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(243, 111, 33, 0.35)',
                  transition: 'background 0.2s'
                }}
              >
                <span>{submitting ? 'Connexion en cours...' : 'Se connecter'}</span>
                <ArrowRight size={18} />
              </button>

              {/* Toggle to Register */}
              <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.88rem', color: '#6B7280' }}>
                Vous n'avez pas de compte ?{' '}
                <button 
                  type="button"
                  onClick={() => { 
                    setMode('register'); 
                    setError(''); 
                    setSuccess('');
                    setRegFullName('');
                    setRegEmail('');
                    setRegPassword('');
                  }}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: '#F36F21',
                    fontWeight: 800,
                    cursor: 'pointer',
                    fontSize: '0.88rem'
                  }}
                >
                  Créer un compte
                </button>
              </div>

            </form>
          ) : (
            /* ================= REGISTER FORM ================= */
            <form onSubmit={handleRegisterSubmit} autoComplete="off" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              
              {/* Dummy hidden inputs to trap browser password autofill popup */}
              <input type="text" name="prevent_autofill_user" style={{ display: 'none', opacity: 0, position: 'absolute', width: 0, height: 0 }} tabIndex={-1} aria-hidden="true" readOnly />
              <input type="password" name="prevent_autofill_pass" style={{ display: 'none', opacity: 0, position: 'absolute', width: 0, height: 0 }} tabIndex={-1} aria-hidden="true" readOnly />

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#3D0C02', marginBottom: '6px', display: 'block' }}>
                  Nom complet
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                  <input 
                    type="text" 
                    name="register_user_fullname_field"
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    required
                    autoComplete="off"
                    data-lpignore="true"
                    data-form-type="other"
                    placeholder="ex: Sofia Mansouri"
                    style={{ width: '100%', padding: '12px 14px 12px 42px', borderRadius: '10px', border: '1px solid #D1D5DB', fontSize: '0.88rem', outline: 'none', backgroundColor: '#FAFAFA' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#3D0C02', marginBottom: '6px', display: 'block' }}>
                  Adresse e-mail (@gmail.com)
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                  <input 
                    type="email" 
                    name="register_user_email_field"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    required
                    autoComplete="off"
                    data-lpignore="true"
                    placeholder="exemple@gmail.com"
                    style={{ width: '100%', padding: '12px 14px 12px 42px', borderRadius: '10px', border: '1px solid #D1D5DB', fontSize: '0.88rem', outline: 'none', backgroundColor: '#FAFAFA' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#3D0C02', marginBottom: '6px', display: 'block' }}>
                  Mot de passe
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                  <input 
                    type="password" 
                    name="register_user_password_field"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    data-lpignore="true"
                    placeholder="Créez votre mot de passe"
                    style={{ width: '100%', padding: '12px 14px 12px 42px', borderRadius: '10px', border: '1px solid #D1D5DB', fontSize: '0.88rem', outline: 'none', backgroundColor: '#FAFAFA' }}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={submitting}
                style={{
                  marginTop: '8px',
                  width: '100%',
                  padding: '13px',
                  borderRadius: '10px',
                  backgroundColor: '#F36F21',
                  color: '#FFFFFF',
                  border: 'none',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(243, 111, 33, 0.35)'
                }}
              >
                <UserPlus size={18} />
                <span>{submitting ? 'Inscription...' : "S'inscrire"}</span>
              </button>

              <div style={{ textAlign: 'center', marginTop: '14px', fontSize: '0.88rem', color: '#6B7280' }}>
                Vous avez déjà un compte ?{' '}
                <button 
                  type="button"
                  onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
                  style={{ border: 'none', background: 'transparent', color: '#F36F21', fontWeight: 800, cursor: 'pointer', fontSize: '0.88rem' }}
                >
                  Se connecter
                </button>
              </div>

            </form>
          )}

        </div>

      </div>

    </div>
  );
};
