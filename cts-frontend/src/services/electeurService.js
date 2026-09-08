import api from './api';

export const electeurService = {
    // Récupérer tous les électeurs
    async getAll() {
    const response = await api.get('/users');
    // le backend renvoie { success: true, data: [...] }
    return response.data.data;
  },
    // Ajouter un nouvel électeur (si tu as une modale pour ça)
    create: async (electeurData) => {
        const response = await api.post('/users', electeurData);
        return response.data;
    },

    // Supprimer un électeur
    delete: async (id) => {
        const response = await api.delete(`/users/${id}`);
        return response.data;
    }
};