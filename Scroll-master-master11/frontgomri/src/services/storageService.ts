import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage, isFirebaseConfigured, auth } from '../firebase/config';
import api from './api';

export interface UploadResult {
  url: string;
  fileName: string;
}

export async function uploadDocumentOrLogo(
  file: File,
  type: 'cv' | 'logo'
): Promise<UploadResult> {
  // Validate file size (max 5 MB)
  const maxBytes = 5 * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error('Le fichier dépasse la taille maximale autorisée de 5 Mo.');
  }

  if (type === 'cv' && file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    throw new Error('Veuillez sélectionner un document au format PDF uniquement.');
  }

  if (type === 'logo' && !file.type.startsWith('image/')) {
    throw new Error('Veuillez sélectionner une image valide (PNG, JPG, WEBP, SVG).');
  }

  // 1. If Firebase Storage is configured and user is signed into Firebase, upload to Firebase Storage
  if (isFirebaseConfigured && storage && auth?.currentUser) {
    const folder = type === 'cv' ? 'cvs' : 'logos';
    const uid = auth.currentUser.uid;
    const safeName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const storageRef = ref(storage, `${folder}/${uid}/${safeName}`);
    await uploadBytes(storageRef, file, { contentType: file.type });
    const downloadUrl = await getDownloadURL(storageRef);

    // Persist URL in PostgreSQL backend
    if (type === 'cv') {
      await api.patch('/api/candidats/me/cv', { cvUrl: downloadUrl });
    } else {
      await api.patch('/api/entreprises/me/logo', { logoUrl: downloadUrl });
    }

    return { url: downloadUrl, fileName: file.name };
  }

  // 2. Otherwise upload directly to the Spring Boot FileStorageController (/api/files/upload)
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', type);

  const response = await api.post('/api/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return {
    url: response.data.url,
    fileName: response.data.fileName || file.name,
  };
}
