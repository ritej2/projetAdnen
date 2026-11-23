import axios from 'axios';
import { auth, isFirebaseConfigured } from '../firebase/config';

const TOKEN_STORAGE_KEY = 'talentflow_auth_token';

export const setStoredAuthToken = (token: string | null) => {
  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
};

export const getStoredAuthToken = (): string | null => {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
};

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  let token = getStoredAuthToken();

  if (isFirebaseConfigured && auth?.currentUser) {
    try {
      token = await auth.currentUser.getIdToken();
      setStoredAuthToken(token);
    } catch {
      // keep fallback token if any
    }
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;

    let cleanMessage =
      typeof serverMessage === 'string' && serverMessage.trim()
        ? serverMessage
        : 'Votre demande n’a pas pu aboutir. Veuillez vérifier vos informations et réessayer.';

    if (!serverMessage) {
      if (status === 400) {
        cleanMessage = 'Certaines informations saisies sont invalides ou incomplètes.';
      } else if (status === 401) {
        cleanMessage = 'Veuillez vous connecter à votre compte pour effectuer cette action.';
      } else if (status === 403) {
        cleanMessage = 'Accès réservé : votre profil actuel ne permet pas d’effectuer cette action.';
      } else if (status === 404) {
        cleanMessage = 'L’élément ou le compte recherché est introuvable sur la plateforme.';
      } else if (status === 409) {
        cleanMessage = 'Cette opération a déjà été effectuée (doublon détecté).';
      } else if (status && status >= 500) {
        cleanMessage = 'Le service traite actuellement votre demande. Veuillez réessayer dans un instant.';
      } else if (error?.code === 'ERR_NETWORK') {
        cleanMessage = 'Connexion au serveur impossible pour le moment. Veuillez vérifier que le backend est actif.';
      }
    }

    error.message = cleanMessage;
    return Promise.reject(error);
  }
);

export default api;
