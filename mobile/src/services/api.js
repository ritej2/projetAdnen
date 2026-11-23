import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_API_HOST } from '../utils/constants';

export const TOKEN_STORAGE_KEY = '@jobflow_auth_token';
export const API_HOST_KEY = '@jobflow_api_host';

export const api = axios.create({
  baseURL: DEFAULT_API_HOST,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

export const setStoredToken = async (token) => {
  if (token) {
    await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
  }
};

export const getStoredToken = async () => {
  try {
    return await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
};

export const setCustomApiHost = async (host) => {
  if (host && host.trim()) {
    const trimmed = host.trim();
    await AsyncStorage.setItem(API_HOST_KEY, trimmed);
    api.defaults.baseURL = trimmed;
  } else {
    await AsyncStorage.removeItem(API_HOST_KEY);
    api.defaults.baseURL = DEFAULT_API_HOST;
  }
};

export const initApiBaseUrl = async () => {
  try {
    const customHost = await AsyncStorage.getItem(API_HOST_KEY);
    if (customHost) {
      api.defaults.baseURL = customHost;
    }
  } catch {}
};

api.interceptors.request.use(async (config) => {
  const token = await getStoredToken();
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
        : 'Une erreur est survenue lors de la communication avec le serveur.';

    if (!serverMessage) {
      if (status === 400) {
        cleanMessage = 'Informations invalides ou incomplètes.';
      } else if (status === 401) {
        cleanMessage = 'Session expirée. Veuillez vous reconnecter.';
      } else if (status === 403) {
        cleanMessage = 'Accès non autorisé pour ce profil.';
      } else if (status === 404) {
        cleanMessage = 'Ressource introuvable.';
      } else if (status === 409) {
        cleanMessage = 'Cette action a déjà été effectuée (doublon).';
      } else if (error?.code === 'ERR_NETWORK') {
        cleanMessage = 'Impossible de joindre le backend. Vérifiez que Spring Boot tourne sur le port 8081 et que votre appareil a accès au réseau.';
      }
    }

    error.friendlyMessage = cleanMessage;
    return Promise.reject(error);
  }
);

export default api;
