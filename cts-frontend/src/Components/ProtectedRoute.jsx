// src/Components/ProtectedRoute.jsx
import { Navigate } from 'react-router';
import { useAuth } from '../hooks/useAuth';

const ProtectedRoute = ({ children, allowedRole }) => {
    const { user, isAdmin, isElecteur, loading } = useAuth();

    // La vérification initiale est silencieuse : aucune page intermédiaire.
    if (loading) {
        return null;
    }

    // Pas d'utilisateur connecté
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Vérification basée sur les données du SERVEUR, pas du localStorage
    if (allowedRole === 'admin' && !isAdmin) {
        return <Navigate to="/voterDashboard" replace />;
    }

    if (allowedRole === 'electeur' && !isElecteur && !isAdmin) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default ProtectedRoute;
