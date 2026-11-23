import api from './api';

export const jobService = {
  async getJobs({ keyword, localisation, typeContrat, categorie, salaireMin, page = 0, size = 20 } = {}) {
    const params = { page, size, statut: 'ACTIVE' };
    if (keyword) params.keyword = keyword;
    if (localisation) params.localisation = localisation;
    if (typeContrat) params.typeContrat = typeContrat;
    if (categorie) params.categorie = categorie;
    if (salaireMin) params.salaireMin = salaireMin;

    const response = await api.get('/api/offres', { params });
    return response.data;
  },

  async getJobById(id) {
    const response = await api.get(`/api/offres/${id}`);
    return response.data;
  },

  async getMyCompanyJobs() {
    const response = await api.get('/api/offres/me');
    return response.data;
  },

  async createJob(jobData) {
    const response = await api.post('/api/offres', jobData);
    return response.data;
  },

  async updateJob(id, jobData) {
    const response = await api.put(`/api/offres/${id}`, jobData);
    return response.data;
  },

  async deleteJob(id) {
    await api.delete(`/api/offres/${id}`);
  },
};

export default jobService;
