import axios from 'axios';
import toast from 'react-hot-toast';

let isRedirectingToLogin = false;
// Utilise la variable d'environnement, avec une fallback pour le développement
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL:API_URL ,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Intercepteur pour ajouter le token à chaque requête
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('user_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const requestPath = error.config?.url || '';
    const isAuthRequest = ['/login', '/register', '/refresh'].some((path) => requestPath.includes(path));

    // An expired/revoked token must never leave the UI on a protected page.
    // The server remains the source of truth; client data is cleared only after its 401 response.
    if (status === 401 && !isAuthRequest && !isRedirectingToLogin) {
      isRedirectingToLogin = true;
      localStorage.removeItem('user_token');
      localStorage.removeItem('user_tokenrefsh');
      localStorage.removeItem('user_id');
      if (window.location.pathname !== '/login') window.location.replace('/login');
    }

    const message = error.response?.data?.message
      || error.response?.data?.error
      || (error.request ? 'Le serveur est inaccessible. Vérifiez votre connexion.' : 'Une erreur inattendue est survenue.');

    // Keep form validation local: those messages are rendered next to the fields.
    if (status !== 422 && !(status === 401 && !isAuthRequest)) toast.error(message);
    return Promise.reject(error);
  },
);

export default api;
