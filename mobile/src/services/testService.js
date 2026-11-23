import api from './api';

export const testService = {
  async getTestsForJob(offreId) {
    const response = await api.get(`/api/evaluations-tests/tests/offre/${offreId}`);
    return response.data;
  },

  async getTestById(id) {
    const response = await api.get(`/api/evaluations-tests/tests/${id}`);
    return response.data;
  },

  async submitTest({ testId, candidatureId, reponses }) {
    const response = await api.post('/api/evaluations-tests/tests/passer', {
      testId,
      candidatureId,
      reponses,
    });
    return response.data;
  },

  async getMyAttempts() {
    const response = await api.get('/api/evaluations-tests/tests/mes-passages');
    return response.data;
  },

  async evaluateWithAI(candidatureId) {
    const response = await api.post(`/api/evaluations-tests/evaluer/${candidatureId}`);
    return response.data;
  },
};

export default testService;
