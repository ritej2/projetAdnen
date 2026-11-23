import api from './api';

export const favoriteService = {
  async getFavorites() {
    const response = await api.get('/api/favoris');
    return response.data;
  },

  async addFavorite(offreId) {
    const response = await api.post(`/api/favoris/${offreId}`);
    return response.data;
  },

  async removeFavorite(offreId) {
    await api.delete(`/api/favoris/${offreId}`);
  },
};

export default favoriteService;
