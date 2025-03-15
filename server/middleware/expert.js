const User = require('../models/User');

module.exports = async function(req, res, next) {
  try {
    // Vérifier si l'utilisateur est authentifié (middleware auth doit être utilisé avant)
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Authentification requise' });
    }

    // Récupérer les informations complètes de l'utilisateur
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Vérifier si l'utilisateur est un expert ou un administrateur
    if (user.role !== 'expert' && user.role !== 'admin') {
      console.log(`Accès refusé: L'utilisateur ${user.email} (${user.role}) a tenté d'accéder à une route expert`);
      return res.status(403).json({ message: 'Accès refusé - Privilèges d\'expert requis' });
    }

    // Utilisateur est un expert ou un administrateur, continuer
    next();
  } catch (err) {
    console.error('Erreur dans le middleware expert:', err.message);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}; 