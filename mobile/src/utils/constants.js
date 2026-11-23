import { Platform } from 'react-native';

// En émulateur Android standard, 10.0.2.2 redirige vers le localhost de la machine hôte.
// Sur appareil physique ou Expo Go, remplacer par l'adresse IP locale (ex: 192.168.1.X)
export const DEFAULT_API_HOST = Platform.select({
  android: 'http://10.0.2.2:8081',
  ios: 'http://localhost:8081',
  default: 'http://localhost:8081',
});

// Charte graphique officielle JobFlow / Superio Design System
export const COLORS = {
  primary: '#1967D2', // Bleu Signature JobFlow
  primaryHover: '#124FAC',
  primaryLight: '#EBF2FD',
  secondary: '#0F172A', // Slate 900
  accent: '#4F46E5', // Indigo
  accentLight: '#EEF2FF',
  background: '#F5F7FC', // Page background Superio
  surface: '#FFFFFF',
  text: '#202124',
  textMuted: '#64748B',
  border: '#E2E8F0',
  success: '#10B981',
  successLight: '#DCFCE7',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  danger: '#EF4444',
  dangerLight: '#FEE2E2',
  info: '#0284C7',
  infoLight: '#E0F2FE',
  cardShadow: 'rgba(15, 23, 42, 0.08)',
};

export const APPLICATION_STATUS_CONFIG = {
  EN_ATTENTE: {
    label: 'En attente',
    color: '#D97706',
    bgColor: '#FEF3C7',
  },
  EN_COURS_EXAMEN: {
    label: 'En examen',
    color: '#0284C7',
    bgColor: '#E0F2FE',
  },
  ENTRETIEN: {
    label: 'Entretien',
    color: '#7C3AED',
    bgColor: '#EDE9FE',
  },
  ACCEPTEE: {
    label: 'Acceptée',
    color: '#10B981',
    bgColor: '#DCFCE7',
  },
  REFUSEE: {
    label: 'Refusée',
    color: '#EF4444',
    bgColor: '#FEE2E2',
  },
  RETIREE: {
    label: 'Retirée',
    color: '#64748B',
    bgColor: '#F1F5F9',
  },
};

export const CONTRACT_TYPES = ['CDI', 'CDD', 'Stage', 'Alternance', 'Freelance', 'Temps partiel'];
