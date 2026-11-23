import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';
import { getStoredToken, initApiBaseUrl } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [candidat, setCandidat] = useState(null);
  const [entreprise, setEntreprise] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadCurrentUser = async () => {
    try {
      await initApiBaseUrl();
      const token = await getStoredToken();
      if (token) {
        const data = await authService.getCurrentProfile();
        setUser(data.user);
        setCandidat(data.candidat || null);
        setEntreprise(data.entreprise || null);
      } else {
        setUser(null);
        setCandidat(null);
        setEntreprise(null);
      }
    } catch (err) {
      console.log('Erreur init auth:', err?.message);
      setUser(null);
      setCandidat(null);
      setEntreprise(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCurrentUser();
  }, []);

  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const data = await authService.loginWithEmail(email, password);
      setUser(data.user);
      setCandidat(data.candidat || null);
      setEntreprise(data.entreprise || null);
      return data;
    } finally {
      setIsLoading(false);
    }
  };

  const loginDemo = async (role) => {
    setIsLoading(true);
    try {
      const data = await authService.loginDemo(role);
      setUser(data.user);
      setCandidat(data.candidat || null);
      setEntreprise(data.entreprise || null);
      return data;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload) => {
    setIsLoading(true);
    try {
      const data = await authService.register(payload);
      setUser(data.user);
      setCandidat(data.candidat || null);
      setEntreprise(data.entreprise || null);
      return data;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
      setUser(null);
      setCandidat(null);
      setEntreprise(null);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProfile = async () => {
    try {
      const data = await authService.getCurrentProfile();
      setUser(data.user);
      setCandidat(data.candidat || null);
      setEntreprise(data.entreprise || null);
    } catch (err) {
      console.log('Erreur refresh profile:', err?.message);
    }
  };

  const isCandidate = user?.role === 'CANDIDAT';
  const isCompany = user?.role === 'ENTREPRISE' || user?.role === 'ADMIN';

  return (
    <AuthContext.Provider
      value={{
        user,
        candidat,
        entreprise,
        role: user?.role,
        isCandidate,
        isCompany,
        isLoading,
        login,
        loginDemo,
        register,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé au sein d’un AuthProvider');
  }
  return context;
};

export default AuthContext;
