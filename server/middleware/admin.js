const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async function(req, res, next) {
  try {
    // Vérifier que l'utilisateur existe et qu'il est un administrateur
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ msg: 'Utilisateur non trouvé' });
    }
    
    if (user.role !== 'admin') {
      return res.status(403).json({ msg: 'Accès refusé. Vous n\'êtes pas administrateur.' });
    }
    
    next();
  } catch (err) {
    console.error('Erreur middleware admin:', err.message);
    res.status(500).send('Erreur serveur');
  }
}; 