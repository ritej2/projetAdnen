import api, { setStoredToken } from './api';

export const DEMO_USERS = {
  CANDIDAT: {
    uid: 'uid-candidat-1',
    email: 'marie.dubois@talentflow.io',
    name: 'Marie Dubois',
    role: 'CANDIDAT',
  },
  ENTREPRISE: {
    uid: 'uid-entreprise-1',
    email: 'recrutement@novastudio.io',
    name: 'Sophie Mercier (Nova Studio)',
    role: 'ENTREPRISE',
  },
  ADMIN: {
    uid: 'uid-admin-1',
    email: 'admin@talentflow.io',
    name: 'Alexandre Moreau',
    role: 'ADMIN',
  },
};

export const authService = {
  async loginWithEmail(email, password) {
    const cleanEmail = email.trim().toLowerCase();
    let token = `dev-token:uid-${cleanEmail.replace(/[^a-z0-9]/g, '-')}:${cleanEmail}:${cleanEmail.split('@')[0]}`;

    if (cleanEmail === 'marie.dubois@talentflow.io') {
      token = `dev-token:uid-candidat-1:marie.dubois@talentflow.io:Marie Dubois`;
    } else if (cleanEmail === 'recrutement@novastudio.io') {
      token = `dev-token:uid-entreprise-1:recrutement@novastudio.io:Sophie Mercier`;
    } else if (cleanEmail === 'admin@talentflow.io') {
      token = `dev-token:uid-admin-1:admin@talentflow.io:Alexandre Moreau`;
    }

    await setStoredToken(token);
    try {
      const response = await api.get('/api/users/me');
      return response.data;
    } catch (err) {
      await setStoredToken(null);
      throw err;
    }
  },

  async loginDemo(role) {
    const demo = DEMO_USERS[role];
    if (!demo) throw new Error('Rôle démo inconnu');
    const token = `dev-token:${demo.uid}:${demo.email}:${demo.name}`;
    await setStoredToken(token);
    const response = await api.get('/api/users/me');
    return response.data;
  },

  async register(payload) {
    const cleanEmail = payload.email.trim().toLowerCase();
    const uid = `uid-${cleanEmail.replace(/[^a-z0-9]/g, '-')}-${Date.now()}`;
    const token = `dev-token:${uid}:${cleanEmail}:${payload.nom.trim()}`;
    await setStoredToken(token);

    try {
      const response = await api.post('/api/users/sync', {
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
      return response.data;
    } catch (err) {
      await setStoredToken(null);
      throw err;
    }
  },

  async getCurrentProfile() {
    const response = await api.get('/api/users/me');
    return response.data;
  },

  async updateProfile(data) {
    const response = await api.put('/api/users/me', data);
    return response.data;
  },

  async logout() {
    await setStoredToken(null);
  },
};

export default authService;
