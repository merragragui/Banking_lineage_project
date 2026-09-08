import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('atlas_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      axios.get('/api/auth/me')
        .then(res => setUser(res.data))
        .catch(() => logout())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    const res = await axios.post('/api/auth/login', { email, password });
    const { access_token, user } = res.data;
    localStorage.setItem('atlas_token', access_token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
    setToken(access_token);
    setUser(user);
    return user;
  };

  // Register saves user in PostgreSQL database without logging in automatically
  const register = async (full_name, email, password, role = "user") => {
    const res = await axios.post('/api/auth/register', { full_name, email, password, role });
    return res.data.user;
  };

  const updateProfile = async (full_name, email, password) => {
    const payload = {};
    if (full_name) payload.full_name = full_name;
    if (email) payload.email = email;
    if (password) payload.password = password;

    const res = await axios.put('/api/auth/profile', payload);
    setUser(res.data);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('atlas_token');
    localStorage.removeItem('atlas_user_profile');
    delete axios.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, updateProfile, logout, loading, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
