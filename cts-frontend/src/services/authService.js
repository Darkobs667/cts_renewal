// src/services/authService.js
import api from './api';

// L'intercepteur axios dans api.js injecte automatiquement le header
// Authorization: Bearer <token> sur toutes les requêtes sortantes.
// Il ne faut donc JAMAIS le re-déclarer manuellement dans les méthodes ci-dessous.

const authService = {
    register: async (userData) => {
        try {
            const response = await api.post('/register', userData);
            return response.data;
        } catch (error) {
            if (error.response?.data) throw error.response.data;
            throw new Error('Impossible de contacter le serveur de vote.');
        }
    },

    login: async (credentials) => {
        try {
            const response = await api.post('/login', credentials);
            const backendData = response.data.data;

            if (backendData?.access_token) {
                localStorage.setItem('user_token', backendData.access_token);
                localStorage.setItem('user_tokenrefsh', backendData.refresh_token);
            }

            return response.data;
        } catch (error) {
            if (error.response?.data) throw error.response.data;
            throw new Error('Erreur lors de la connexion au serveur.');
        }
    },

    logout: () => {
        localStorage.removeItem('user_token');
        localStorage.removeItem('user_tokenrefsh');
        localStorage.removeItem('user_id');
    },

    me: async () => (await api.get('/auth/me')).data.user,

    /**
     * Correction #10 : l'en-tête Authorization est géré par l'intercepteur d'api.js.
     * On ne le re-déclare plus ici.
     */
    isAdmin: async () => {
        if (!localStorage.getItem('user_token')) return false;
        try {
            const response = await api.get('/auth/check-admin');
            return response.data.is_admin === true;
        } catch {
            return false;
        }
    },

    getRealUserRole: async () => {
        if (!localStorage.getItem('user_token')) return null;
        try {
            const response = await api.get('/auth/verify-role');
            return response.data.data.role ?? null;
        } catch {
            return null;
        }
    },
};

export default authService;
