const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  // Récupérer le token du header
  const token = req.header('x-auth-token');

  console.log('Middleware Auth - Headers:', req.headers);
  console.log('Middleware Auth - Token reçu:', token);

  // Vérifier si le token existe
  if (!token) {
    console.log('Middleware Auth - Pas de token, accès refusé');
    return res.status(401).json({ message: 'Pas de token, accès refusé' });
  }

  try {
    // Vérifier le token
    const decoded = jwt.verify(token, "autotech_secret_key_2024"); // Valeur en dur
    console.log('Middleware Auth - Token vérifié avec succès, utilisateur:', decoded.user);
    
    // Ajouter l'utilisateur à la requête
    req.user = decoded.user;
    next();
  } catch (err) {
    console.error('Middleware Auth - Token invalide:', err.message);
    res.status(401).json({ message: 'Token invalide' });
  }
}; 