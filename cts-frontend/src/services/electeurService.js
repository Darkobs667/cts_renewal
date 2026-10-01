import api from './api';

export const electeurService = {
    /**
     * Récupère la liste complète des électeurs (admin uniquement).
     * Le backend renvoie { success: true, data: [...] }.
     */
    async getAll(page = 1, perPage = 50, search = '') {
        const params = { page, per_page: perPage };
        if (search) params.search = search;
        const response = await api.get('/users', { params });
        return response.data; // retourne { data, meta }
    },

    /**
     * Correction #6 : la création d'un compte passe par POST /register,
     * pas par POST /users (route inexistante).
     * Les données attendues : { first_name, last_name, email, password, password_confirmation, browserId? }
     */
    async create(electeurData) {
        const response = await api.post('/register', electeurData);
        return response.data;
    },

    /**
     * Modifier le statut d'un électeur ('Validé' | 'Suspendu').
     * Correction #7 : utilise la route PUT /users/{id}/status ajoutée au backend.
     */
    async updateStatus(id, status) {
        const response = await api.put(`/users/${id}/status`, { status });
        return response.data;
    },

    /**
     * Supprimer un électeur.
     */
    async delete(id) {
        const response = await api.delete(`/users/${id}`);
        return response.data;
    },
};
