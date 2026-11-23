import Swal from 'sweetalert2';
import { toast as sonnerToast } from 'sonner';

/**
 * Transforme n'importe quelle erreur technique ou HTTP (400, 401, 403, 404, 409, 500, Network Error)
 * en un message professionnel, clair et en français, sans jamais afficher de code HTTP brut.
 */
export const formatProfessionalErrorMessage = (err: any, fallbackMessage?: string): string => {
  if (!err) {
    return fallbackMessage || 'Une opération a rencontré un problème inattendu. Veuillez réessayer.';
  }

  // Si c'est déjà une chaîne propre sans jargon HTTP
  if (typeof err === 'string') {
    if (
      err.includes('Request failed') ||
      err.includes('status code') ||
      err.includes('Network Error') ||
      err.includes('AxiosError')
    ) {
      return fallbackMessage || 'Le service est momentanément indisponible. Veuillez vérifier votre connexion et réessayer.';
    }
    return err;
  }

  // Message métier renvoyé par le backend Spring Boot
  const backendMsg = err?.response?.data?.message;
  const validationDetails = err?.response?.data?.details;

  if (validationDetails && typeof validationDetails === 'object') {
    const firstDetail = Object.values(validationDetails)[0];
    if (typeof firstDetail === 'string' && firstDetail.trim()) {
      return firstDetail;
    }
  }

  if (
    typeof backendMsg === 'string' &&
    backendMsg.trim().length > 0 &&
    !backendMsg.toLowerCase().includes('status code') &&
    !backendMsg.toLowerCase().includes('exception') &&
    !backendMsg.toLowerCase().includes('jdbc') &&
    !backendMsg.toLowerCase().includes('sql')
  ) {
    return backendMsg;
  }

  // Traduction professionnelle selon le statut HTTP (sans jamais afficher "404" ou "500")
  const status = err?.response?.status;
  switch (status) {
    case 400:
      return fallbackMessage || 'Certaines informations saisies sont incomplètes ou invalides. Veuillez vérifier les champs du formulaire.';
    case 401:
      return 'Votre session a expiré ou vos identifiants sont incorrects. Veuillez vous reconnecter à votre espace.';
    case 403:
      return 'Vous ne disposez pas des droits nécessaires pour effectuer cette action avec votre profil actuel.';
    case 404:
      return fallbackMessage || 'L’élément ou le compte recherché est introuvable sur la plateforme.';
    case 409:
      return 'Cette action a déjà été enregistrée (par exemple : vous avez déjà postulé à cette offre ou ce compte existe déjà).';
    case 413:
      return 'Le fichier sélectionné dépasse la taille maximale autorisée (5 Mo maximum).';
    case 500:
    case 502:
    case 503:
      return 'Notre serveur traite actuellement votre demande. Veuillez patienter quelques instants puis réessayer.';
    default:
      break;
  }

  // Erreur réseau ou serveur éteint
  if (err?.code === 'ERR_NETWORK' || String(err?.message || '').includes('Network Error')) {
    return 'Connexion au serveur en cours... Veuillez vérifier que le service JobFlow est bien actif.';
  }

  const rawMsg = String(err?.message || '');
  if (
    rawMsg &&
    !rawMsg.includes('Request failed') &&
    !rawMsg.includes('status code') &&
    !rawMsg.includes('AxiosError')
  ) {
    return rawMsg;
  }

  return fallbackMessage || 'Une erreur inattendue est survenue lors du traitement de votre demande.';
};

const getSwalTheme = () => {
  const isDark = document.body.classList.contains('jf-dark-mode');
  return {
    background: isDark ? '#111827' : '#ffffff',
    color: isDark ? '#f8fafc' : '#0f172a',
    confirmButtonColor: '#2563eb',
    cancelButtonColor: '#64748b',
  };
};

/**
 * Alerte modale SweetAlert2 professionnelle en cas d'erreur importante
 */
export const showProfessionalErrorModal = (title: string, err: any, fallbackMessage?: string) => {
  const theme = getSwalTheme();
  const cleanMessage = formatProfessionalErrorMessage(err, fallbackMessage);

  return Swal.fire({
    icon: 'error',
    title,
    text: cleanMessage,
    confirmButtonText: 'Compris',
    background: theme.background,
    color: theme.color,
    confirmButtonColor: theme.confirmButtonColor,
    customClass: {
      popup: 'jf-swal-popup',
    },
  });
};

/**
 * Alerte modale SweetAlert2 de succès (ex: Candidature envoyée, Offre publiée, Entretien planifié)
 */
export const showProfessionalSuccessModal = (title: string, text: string) => {
  const theme = getSwalTheme();
  return Swal.fire({
    icon: 'success',
    title,
    text,
    timer: 2600,
    showConfirmButton: true,
    confirmButtonText: 'Parfait',
    background: theme.background,
    color: theme.color,
    confirmButtonColor: theme.confirmButtonColor,
  });
};

/**
 * Boîte de dialogue de confirmation SweetAlert2 avant suppression ou action critique
 */
export const confirmProfessionalAction = async (
  title: string,
  text: string,
  confirmText = 'Oui, confirmer',
  cancelText = 'Annuler'
): Promise<boolean> => {
  const theme = getSwalTheme();
  const result = await Swal.fire({
    icon: 'warning',
    title,
    text,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    background: theme.background,
    color: theme.color,
    confirmButtonColor: '#2563eb',
    cancelButtonColor: '#64748b',
  });
  return Boolean(result.isConfirmed);
};

/**
 * Wrapper intelligent autour des notifications toast + SweetAlert2 pour que tous les appels
 * `toast.error(...)`, `toast.success(...)`, `toast.info(...)`, `toast.warning(...)` du site
 * affichent un message professionnel compatible avec le design JobFlow.
 */
export const professionalToast = {
  success: (message: string) => {
    sonnerToast.success(message);
  },
  info: (message: string) => {
    sonnerToast.info(message);
  },
  warning: (message: string) => {
    sonnerToast.warning(message);
  },
  error: (errOrMessage: any, title = 'Attention') => {
    const clean = formatProfessionalErrorMessage(errOrMessage);
    Swal.fire({
      icon: 'error',
      title,
      text: clean,
      confirmButtonText: 'Fermer',
      ...getSwalTheme(),
    });
  },
};

