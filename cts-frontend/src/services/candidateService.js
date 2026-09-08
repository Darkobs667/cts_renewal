import api from './api';

const candidateService = {
  async getAll() {
    const res = await api.get('/candidates');
    // Adapte selon la structure de réponse (parfois res.data.data, parfois res.data)
    return res.data.data || res.data;
  },

  async create(formData) {
    const res = await api.post('/candidates', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  async update(id, formData) {
    // Laravel attend une requête PUT, mais FormData + Axios ne supporte que POST.
    // On ajoute donc _method=PUT pour simuler un PUT via la route POST.
    formData.append('_method', 'PUT');
    const res = await api.post(`/candidates/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  async delete(id) {
    const res = await api.delete(`/candidates/${id}`);
    return res.data;
  },
};

export default candidateService;