import api from './api';

export const testService = {
  // Récupérer le test QCM lié à une offre
  async getTestsForJob(offreId) {
    const response = await api.get(`/api/evaluations-tests/tests/offre/${offreId}`);
    return response.data;
  },

  // Récupérer un test par son ID
  async getTestById(id) {
    const response = await api.get(`/api/evaluations-tests/tests/${id}`);
    return response.data;
  },

  // Soumettre les réponses d'un candidat à un test
  async submitTest({ testId, candidatureId, reponses }) {
    const response = await api.post('/api/evaluations-tests/tests/passer', {
      testId,
      candidatureId,
      reponses,
    });
    return response.data;
  },

  // Historique des passages de tests du candidat connecté
  async getMyAttempts() {
    const response = await api.get('/api/evaluations-tests/tests/mes-passages');
    return response.data;
  },

  // Déclencher une évaluation IA pour une candidature
  async evaluateWithAI(candidatureId) {
    const response = await api.post(`/api/evaluations-tests/evaluer/${candidatureId}`);
    return response.data;
  },

  // Obtenir l'évaluation IA enregistrée d'une candidature
  async getEvaluation(candidatureId) {
    const response = await api.get(`/api/evaluations-tests/candidature/${candidatureId}`);
    return response.data;
  },

  // Créer un test technique pour une offre (côté entreprise)
  async createTest(testData) {
    const response = await api.post('/api/evaluations-tests/tests', testData);
    return response.data;
  },

  // Récupérer les tests créés par l'entreprise
  async getCompanyTests() {
    const response = await api.get('/api/evaluations-tests/tests/entreprise');
    return response.data;
  },

  // Publier un test
  async publishTest(id) {
    const response = await api.patch(`/api/evaluations-tests/tests/${id}/publier`);
    return response.data;
  },

  // Chatbot IA Studio pour générer/composer des tests techniques (/api/evaluations-tests/agent-chat)
  async chatWithAgent({
    offreId,
    message,
    questionsActuelles = [],
    dureeMinutes = 20,
    scoreMinimum = 60,
    titreTest = '',
  }) {
    const response = await api.post('/api/evaluations-tests/agent-chat', {
      offreId,
      message,
      questionsActuelles,
      dureeMinutes,
      scoreMinimum,
      titreTest,
    });
    return response.data;
  },
};

export default testService;
