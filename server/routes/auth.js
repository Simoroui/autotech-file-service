const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const EcuFile = require('../models/EcuFile');
const CreditTransaction = require('../models/CreditTransaction');

// @route   GET /api/auth
// @desc    Récupérer les informations de l'utilisateur connecté
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erreur serveur');
  }
});

// @route   POST /api/auth/register
// @desc    Inscription d'un nouvel utilisateur
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Vérifier si l'utilisateur existe déjà
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'Cet utilisateur existe déjà' });
    }

    // Créer un nouvel utilisateur
    user = new User({
      name,
      email,
      password
    });

    await user.save();

    // Créer et renvoyer le token JWT
    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };

    jwt.sign(
      payload,
      "autotech_secret_key_2024",
      { expiresIn: '24h' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erreur serveur');
  }
});

// @route   POST /api/auth/login
// @desc    Connexion d'un utilisateur
// @access  Public
router.post('/login', async (req, res) => {
  try {
    console.log('Tentative de connexion reçue:', req.body);
    const { email, password } = req.body;

    // Vérifier si l'utilisateur existe
    const user = await User.findOne({ email });
    if (!user) {
      console.log(`Utilisateur non trouvé avec l'email: ${email}`);
      return res.status(400).json({ message: 'Identifiants invalides' });
    }
    console.log(`Utilisateur trouvé: ${user.id}, ${user.name}, ${user.email}`);

    // Vérifier le mot de passe
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log('Mot de passe incorrect');
      return res.status(400).json({ message: 'Identifiants invalides' });
    }
    console.log('Mot de passe correct');

    // Créer et renvoyer le token JWT
    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };
    console.log('Payload du token:', payload);
    
    // Log pour déboguer la valeur de JWT_SECRET
    console.log('Valeur de JWT_SECRET:', process.env.JWT_SECRET ? 'Définie' : 'Non définie', typeof process.env.JWT_SECRET);
    if (process.env.JWT_SECRET === '') console.log('JWT_SECRET est une chaîne vide');
    if (process.env.JWT_SECRET === undefined) console.log('JWT_SECRET est undefined');
    if (process.env.JWT_SECRET === null) console.log('JWT_SECRET est null');

    jwt.sign(
      payload,
      "autotech_secret_key_2024",
      { expiresIn: '24h' },
      (err, token) => {
        if (err) {
          console.error('Erreur lors de la génération du token:', err.message);
          return res.status(500).json({ message: 'Erreur lors de la génération du token' });
        }
        res.json({ token });
      }
    );
  } catch (err) {
    console.error('Erreur lors de la connexion:', err.message);
    res.status(500).send('Erreur serveur');
  }
});

// @route   POST /api/auth/add-credits
// @desc    Ajouter des crédits à l'utilisateur connecté (pour les tests)
// @access  Private
router.post('/add-credits', auth, async (req, res) => {
  try {
    const { credits } = req.body;
    
    // Vérifier si le nombre de crédits est valide
    if (!credits || credits <= 0) {
      return res.status(400).json({ message: 'Veuillez fournir un nombre de crédits valide' });
    }

    // Trouver l'utilisateur et mettre à jour ses crédits
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    user.credits += parseInt(credits);
    await user.save();
    
    // Créer une transaction de crédit
    const transaction = new CreditTransaction({
      user: req.user.id,
      amount: parseInt(credits),
      type: 'purchase',
      description: 'Achat de crédits'
    });
    
    await transaction.save();

    res.json({ 
      message: `${credits} crédits ajoutés avec succès`, 
      user: {
        name: user.name,
        email: user.email,
        credits: user.credits
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erreur serveur');
  }
});

// @route   POST /api/auth/reset-password
// @desc    Route temporaire pour réinitialiser le mot de passe d'un utilisateur par email
// @access  Public
router.post('/reset-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    
    if (!email || !newPassword) {
      return res.status(400).json({ message: 'Veuillez fournir un email et un nouveau mot de passe' });
    }
    
    // Trouver l'utilisateur par email
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    // Réinitialiser le mot de passe
    user.password = newPassword;
    await user.save();
    
    // Créer et renvoyer un nouveau token JWT
    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };
    
    jwt.sign(
      payload,
      "autotech_secret_key_2024",
      { expiresIn: '24h' },
      (err, token) => {
        if (err) {
          console.error('Erreur lors de la génération du token:', err.message);
          return res.status(500).json({ message: 'Erreur lors de la génération du token' });
        }
        res.json({ 
          message: 'Mot de passe réinitialisé avec succès',
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
          }
        });
      }
    );
  } catch (err) {
    console.error('Erreur lors de la réinitialisation du mot de passe:', err.message);
    res.status(500).send('Erreur serveur');
  }
});

// @route   GET /api/auth/weekly-stats
// @desc    Récupérer les statistiques hebdomadaires (fichiers envoyés et crédits achetés)
// @access  Private
router.get('/weekly-stats', auth, async (req, res) => {
  try {
    // Initialiser les tableaux pour les 7 jours de la semaine (Lundi à Dimanche)
    const filesSent = [0, 0, 0, 0, 0, 0, 0];
    const creditsBought = [0, 0, 0, 0, 0, 0, 0];
    const creditsAvailable = [0, 0, 0, 0, 0, 0, 0];
    
    // Calculer les dates pour la dernière semaine
    const today = new Date();
    
    // Trouver le jour de la semaine actuel (0 = dimanche, 1 = lundi, etc.)
    const currentDayOfWeek = today.getDay();
    
    // Calculer le décalage pour commencer par le lundi précédent
    // Si on est dimanche (0), reculer de 6 jours pour aller au lundi
    // Si on est lundi (1), reculer de 0 jour, etc.
    const daysToSubtract = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;
    
    // Commencer par le lundi (de la semaine en cours ou précédente)
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - daysToSubtract);
    startDate.setHours(0, 0, 0, 0);
    
    // Date de fin = maintenant
    const endDate = new Date();
    
    // 1. Récupérer tous les fichiers de l'utilisateur pour la dernière semaine
    const files = await EcuFile.find({
      user: req.user.id,
      createdAt: { $gte: startDate, $lte: endDate }
    });
    
    // 2. Récupérer toutes les transactions de crédits pour la dernière semaine
    const transactions = await CreditTransaction.find({
      user: req.user.id,
      createdAt: { $gte: startDate, $lte: endDate }
    });
    
    // 3. Récupérer l'utilisateur pour son solde actuel de crédits
    const user = await User.findById(req.user.id);
    
    // Compter les fichiers pour chaque jour
    files.forEach(file => {
      const fileDate = new Date(file.createdAt);
      const dayIndex = Math.floor((fileDate - startDate) / (24 * 60 * 60 * 1000));
      
      if (dayIndex >= 0 && dayIndex < 7) {
        filesSent[dayIndex]++;
      }
    });
    
    // Initialiser le solde de crédits à la fin de la semaine (solde actuel)
    let currentCredits = user.credits;
    
    // Parcourir les jours en ordre inverse (du plus récent au plus ancien)
    // pour calculer le solde de crédits pour chaque jour
    for (let i = 6; i >= 0; i--) {
      // Le solde du jour actuel est le solde courant
      creditsAvailable[i] = currentCredits;
      
      // Calculer la date du jour
      const dayDate = new Date(startDate);
      dayDate.setDate(startDate.getDate() + i);
      const nextDayDate = new Date(dayDate);
      nextDayDate.setDate(dayDate.getDate() + 1);
      
      // Trouver toutes les transactions pour ce jour
      const dayTransactions = transactions.filter(transaction => {
        const transactionDate = new Date(transaction.createdAt);
        return transactionDate >= dayDate && transactionDate < nextDayDate;
      });
      
      // Ajuster le solde en fonction des transactions du jour (en inverse puisqu'on remonte dans le temps)
      dayTransactions.forEach(transaction => {
        if (transaction.type === 'purchase') {
          // Si c'est un achat, on soustrait les crédits (puisqu'on va du présent vers le passé)
          currentCredits -= transaction.amount;
        } else if (transaction.type === 'usage') {
          // Si c'est une utilisation, on ajoute les crédits (puisqu'on va du présent vers le passé)
          currentCredits += transaction.amount;
        }
      });
    }
    
    // Filtrer les transactions d'achat pour les crédits achetés par jour
    transactions
      .filter(transaction => transaction.type === 'purchase')
      .forEach(transaction => {
        const transactionDate = new Date(transaction.createdAt);
        const dayIndex = Math.floor((transactionDate - startDate) / (24 * 60 * 60 * 1000));
        
        if (dayIndex >= 0 && dayIndex < 7) {
          creditsBought[dayIndex] += transaction.amount;
        }
      });
    
    res.json({
      filesSent,
      creditsBought,
      creditsAvailable
    });
  } catch (err) {
    console.error('Erreur lors de la récupération des statistiques hebdomadaires:', err.message);
    res.status(500).send('Erreur serveur');
  }
});

module.exports = router; 