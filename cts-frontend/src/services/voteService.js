// src/services/voteService.js
import api from './api';

export const voteService = {
    // Récupérer la liste des élections
    getElections: async () => {
        const response = await api.get('/positions');
        return response.data.data;
    },

    // Envoyer un vote
    submitVote: async (positionId, candidateId) => {
        const response = await api.post('/votes', {
            position_id: positionId,
            candidate_id: candidateId,
        });
        return response.data;
    }
};
