import api from './api';



const adminService = {
    getStats: async () => {
        return await api.get('/admin/stats-globales');
    },


    // Pour créer l'élection (Position)
    createPosition: async (data) => {
        return await api.post('/positions', data);
    },

    updatePosition: async (id, data) => {
        return await api.put(`/positions/${id}`, data);
    },

    // Pour ajouter un candidat à cette élection spécifique
    addCandidat: async (formData) => {
        return await api.post('/candidates', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    }
};

export default adminService;
