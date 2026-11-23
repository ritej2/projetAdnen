import api from './api';

export const applicationService = {
  async applyToJob({ offreId, lettreMotivation, cvUrlSpecifique }) {
    const response = await api.post('/api/candidatures', {
      offreId,
      lettreMotivation,
      cvUrlSpecifique,
    });
    return response.data;
  },

  async getMyApplications() {
    const response = await api.get('/api/candidatures/me');
    return response.data;
  },

  async getCompanyApplications(offreId = null) {
    const params = offreId ? { offreId } : {};
    const response = await api.get('/api/candidatures/entreprise', { params });
    return response.data;
  },

  async updateApplicationStatus(id, { statut, noteRecruteur }) {
    const response = await api.patch(`/api/candidatures/${id}/statut`, {
      statut,
      noteRecruteur,
    });
    return response.data;
  },

  async withdrawApplication(id) {
    await api.delete(`/api/candidatures/${id}`);
  },
};

export default applicationService;
