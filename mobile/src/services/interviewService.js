import api from './api';

export const interviewService = {
  async getMyInterviews() {
    const response = await api.get('/api/entretiens/me');
    return response.data;
  },

  async scheduleInterview({ candidatureId, dateEntretien, typeEntretien, lienOuLieu, commentaire }) {
    const response = await api.post('/api/entretiens', {
      candidatureId,
      dateEntretien,
      typeEntretien,
      lienOuLieu,
      commentaire,
    });
    return response.data;
  },
};

export default interviewService;
