import api from './api';

export const statsService = {
    getDashboardStats: async () => {
        const response = await api.get('/admin/stats-globales');
        return response.data.data;
        // Doit retourner { totalElecteurs, votesClotures, votesEnCours, participationRate, recentesElections: [] }
    }
};
