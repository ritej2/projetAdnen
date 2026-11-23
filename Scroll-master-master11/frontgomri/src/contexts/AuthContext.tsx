import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../firebase/config';
import api, { setStoredAuthToken, getStoredAuthToken } from '../services/api';
import { Candidat, Entreprise, RoleUtilisateur, Utilisateur } from '../types';

interface RegisterPayload {
  nom: string;
  email: string;
  password: string;
  telephone?: string;
  role: 'CANDIDAT' | 'ENTREPRISE';
  nomEntreprise?: string;
  secteur?: string;
  titreProfil?: string;
  logoUrl?: string;
  photoUrl?: string;
}

interface AuthContextValue {
  user: Utilisateur | null;
  candidat: Candidat | null;
  entreprise: Entreprise | null;
  loading: boolean;
  isFirebaseActive: boolean;
  loginWithEmail: (email: string, password: string) => Promise<Utilisateur>;
  registerUser: (payload: RegisterPayload) => Promise<Utilisateur>;
  loginAsDemoRole: (role: RoleUtilisateur) => Promise<Utilisateur>;
  sendResetPassword: (email: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const DEMO_ACCOUNTS: Record<RoleUtilisateur, { uid: string; email: string; name: string }> = {
  CANDIDAT: {
    uid: 'uid-candidat-1',
    email: 'marie.dubois@talentflow.io',
    name: 'Marie Dubois',
  },
  ENTREPRISE: {
    uid: 'uid-entreprise-1',
    email: 'recrutement@novastudio.io',
    name: 'Sophie Mercier (Nova Studio)',
  },
  ADMIN: {
    uid: 'uid-admin-1',
    email: 'admin@talentflow.io',
    name: 'Alexandre Moreau',
  },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Utilisateur | null>(null);
  const [candidat, setCandidat] = useState<Candidat | null>(null);
  const [entreprise, setEntreprise] = useState<Entreprise | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchBackendUser = async (): Promise<Utilisateur> => {
    const res = await api.get('/api/users/me');
    setUser(res.data.user);
    setCandidat(res.data.candidat || null);
    setEntreprise(res.data.entreprise || null);
    return res.data.user;
  };

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      const existingToken = getStoredAuthToken();
      if (existingToken) {
        try {
          await fetchBackendUser();
        } catch {
          setStoredAuthToken(null);
          setUser(null);
          setCandidat(null);
          setEntreprise(null);
        }
      }
      if (mounted) setLoading(false);
    };

    if (isFirebaseConfigured && auth) {
      const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
        if (fbUser) {
          try {
            const idToken = await fbUser.getIdToken();
            setStoredAuthToken(idToken);
            await fetchBackendUser();
          } catch {
            // User may be in the middle of registration sync
          }
        } else if (!getStoredAuthToken()?.startsWith('dev-token:')) {
          setStoredAuthToken(null);
          setUser(null);
          setCandidat(null);
          setEntreprise(null);
        }
        if (mounted) setLoading(false);
      });
      return () => {
        mounted = false;
        unsubscribe();
      };
    } else {
      initAuth();
    }

    return () => {
      mounted = false;
    };
  }, []);

  const loginWithEmail = async (email: string, password: string): Promise<Utilisateur> => {
    const normalized = email.trim().toLowerCase();
    if (!normalized) {
      throw new Error('Veuillez saisir votre adresse e-mail.');
    }

    try {
      if (isFirebaseConfigured && auth) {
        try {
          const cred = await signInWithEmailAndPassword(auth, normalized, password);
          const idToken = await cred.user.getIdToken();
          setStoredAuthToken(idToken);
          return await fetchBackendUser();
        } catch (firebaseErr: any) {
          if (
            normalized === 'admin@talentflow.io' ||
            normalized === 'recrutement@novastudio.io' ||
            normalized === 'marie.dubois@talentflow.io'
          ) {
            // Utiliser le compte d'administration / démo en local
          } else {
            throw firebaseErr;
          }
        }
      }

      // Local / Hybrid authentication against Spring Boot MySQL database by email
      let token = `dev-token:uid-${normalized.replace(/[^a-z0-9]/g, '-')}:${normalized}:${normalized.split('@')[0]}`;

      if (normalized === 'marie.dubois@talentflow.io') {
        token = `dev-token:uid-candidat-1:marie.dubois@talentflow.io:Marie Dubois`;
      } else if (normalized === 'recrutement@novastudio.io') {
        token = `dev-token:uid-entreprise-1:recrutement@novastudio.io:Sophie Mercier`;
      } else if (normalized === 'admin@talentflow.io') {
        token = `dev-token:uid-admin-1:admin@talentflow.io:Alexandre Moreau`;
      }

      setStoredAuthToken(token);
      return await fetchBackendUser();
    } catch (err: any) {
      // IMPORTANT: Clear invalid token if user was not found so localStorage doesn't stay polluted
      setStoredAuthToken(null);
      setUser(null);
      setCandidat(null);
      setEntreprise(null);
      if (err.response?.status === 404) {
        throw new Error(
          "Aucun compte trouvé avec cette adresse e-mail. Veuillez d'abord créer un compte via l'onglet « S'inscrire »."
        );
      }
      throw err;
    }
  };

  const registerUser = async (payload: RegisterPayload): Promise<Utilisateur> => {
    const cleanEmail = payload.email.trim().toLowerCase();
    let uid = `uid-${cleanEmail.replace(/[^a-z0-9]/g, '-')}-${Date.now()}`;

    try {
      if (isFirebaseConfigured && auth) {
        const cred = await createUserWithEmailAndPassword(auth, cleanEmail, payload.password);
        uid = cred.user.uid;
        const idToken = await cred.user.getIdToken();
        setStoredAuthToken(idToken);
      } else {
        const devToken = `dev-token:${uid}:${cleanEmail}:${payload.nom.trim()}`;
        setStoredAuthToken(devToken);
      }

      const res = await api.post('/api/users/sync', {
        firebaseUid: uid,
        nom: payload.nom.trim(),
        email: cleanEmail,
        telephone: payload.telephone,
        role: payload.role,
        nomEntreprise: payload.nomEntreprise,
        secteur: payload.secteur,
        titreProfil: payload.titreProfil,
        logoUrl: payload.logoUrl,
        photoUrl: payload.photoUrl,
      });

      setUser(res.data.user);
      setCandidat(res.data.candidat || null);
      setEntreprise(res.data.entreprise || null);

      if (payload.photoUrl && res.data.user?.id) {
        localStorage.setItem(`jf_user_avatar_${res.data.user.id}`, payload.photoUrl);
        localStorage.setItem('jf_candidate_avatar', payload.photoUrl);
        window.dispatchEvent(new Event('jf-avatar-updated'));
      }
      return res.data.user;
    } catch (err) {
      setStoredAuthToken(null);
      throw err;
    }
  };

  const loginAsDemoRole = async (role: RoleUtilisateur): Promise<Utilisateur> => {
    const demo = DEMO_ACCOUNTS[role];
    const token = `dev-token:${demo.uid}:${demo.email}:${demo.name}`;
    setStoredAuthToken(token);
    return await fetchBackendUser();
  };

  const sendResetPassword = async (email: string) => {
    if (isFirebaseConfigured && auth) {
      await sendPasswordResetEmail(auth, email);
    }
  };

  const refreshProfile = async () => {
    await fetchBackendUser();
  };

  const logout = async () => {
    if (isFirebaseConfigured && auth) {
      await firebaseSignOut(auth);
    }
    setStoredAuthToken(null);
    setUser(null);
    setCandidat(null);
    setEntreprise(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        candidat,
        entreprise,
        loading,
        isFirebaseActive: isFirebaseConfigured,
        loginWithEmail,
        registerUser,
        loginAsDemoRole,
        sendResetPassword,
        refreshProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};
