//pour recupérer les informations de l'utilisateur
export const getConnectedUser = () => {
    const userData = localStorage.getItem('user_data');
    if (!userData) return null;
    
    const user = JSON.parse(userData);
    
    // Génération des initiales (ex: Marc Dupon -> MD)
    const initials = `${user.first_name?.charAt(0) || ''}${user.last_name?.charAt(0) || ''}`.toUpperCase();
    
    return {
        ...user,
        fullName: `${user.first_name} ${user.last_name}`,
        initials: initials
    };
};