// src/services/authService.js
import api from './api';

const authService = {
    register: async (userData) => {
        try {
            const response = await api.post(`/register`, userData, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });
            
            return response.data;
        } catch (error) {
            if (error.response && error.response.data) {
                throw error.response.data;
            }
            throw new Error("Impossible de contacter le serveur de vote.");
        }
    },

    login: async (credentials) => {
        try {
            const response = await api.post(`/login`, credentials, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            const backendData = response.data.data;

            if (backendData && backendData.access_token) {
                localStorage.setItem('user_token', backendData.access_token);
                localStorage.setItem('user_tokenrefsh', backendData.refresh_token);
            }

            return response.data;
        } catch (error) {
            if (error.response && error.response.data) {
                throw error.response.data;
            }
            throw new Error("Erreur lors de la connexion au serveur.");
        }
    },

    logout: () => {
        localStorage.removeItem('user_token');
        localStorage.removeItem('user_tokenrefsh');
        localStorage.removeItem('user_id');
    },

    me: async () => (await api.get('/auth/me')).data.user,
    
    // NOUVELLE MÉTHODE: Vérifier si l'utilisateur est admin via le serveur
    isAdmin: async () => {
        const token = localStorage.getItem('user_token');
        if (!token) return false;
        
        try {
            const response = await api.get('/auth/check-admin', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            return response.data.is_admin === true;
        } catch (error) {
            return false;
        }
    },
    
    // NOUVELLE MÉTHODE: Obtenir le vrai rôle depuis le serveur
    getRealUserRole: async () => {
        const token = localStorage.getItem('user_token');
        if (!token) return null;
        
        try {
            const response = await api.get('/auth/verify-role', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            return response.data.data.role;
        } catch (error) {
            return null;
        }
    }
};

export default authService;
