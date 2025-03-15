const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuration pour l'upload des photos de profil
const photoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/profile-photos';
    // Créer le répertoire s'il n'existe pas
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Générer un nom de fichier unique avec l'ID de l'utilisateur
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const extension = path.extname(file.originalname);
    cb(null, `user-${req.user.id}-${uniqueSuffix}${extension}`);
  }
});

// Filtrer les types de fichiers acceptés
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/jpg') {
    cb(null, true);
  } else {
    cb(new Error('Format non supporté. Utilisez JPG ou PNG.'), false);
  }
};

const uploadPhoto = multer({
  storage: photoStorage,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB max
  },
  fileFilter: fileFilter
});

// @route   GET /api/users/me
// @desc    Obtenir les informations de l'utilisateur connecté
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erreur serveur');
  }
});

// @route   GET /api/users/:id
// @desc    Obtenir les informations d'un utilisateur par son ID
// @access  Private (Admin uniquement)
router.get('/:id', auth, async (req, res) => {
  try {
    // Vérifier si l'utilisateur a le rôle admin ou expert
    if (req.user.role !== 'admin' && req.user.role !== 'expert') {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    console.log(`Route /api/users/:id - Recherche de l'utilisateur avec ID: ${req.params.id}`);
    
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      console.log(`Utilisateur avec ID ${req.params.id} non trouvé`);
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    console.log(`Utilisateur trouvé:`, {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    });
    
    res.json(user);
  } catch (err) {
    console.error(`Erreur lors de la récupération de l'utilisateur ${req.params.id}:`, err.message);
    res.status(500).send('Erreur serveur');
  }
});

// @route   PUT /api/users/notification-preferences
// @desc    Mettre à jour les préférences de notification de l'utilisateur
// @access  Private
router.put('/notification-preferences', auth, async (req, res) => {
  try {
    const { fileStatusUpdates, newFeatures, promotions, emailFrequency } = req.body;

    // Vérifier si les valeurs sont valides
    if (emailFrequency && !['immediate', 'daily', 'weekly'].includes(emailFrequency)) {
      return res.status(400).json({ message: 'Fréquence d\'email invalide' });
    }

    // Trouver l'utilisateur
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Mettre à jour les préférences de notification
    if (user.notificationPreferences === undefined) {
      user.notificationPreferences = {
        fileStatusUpdates: true,
        newFeatures: true,
        promotions: false,
        emailFrequency: 'immediate'
      };
    }

    // Mettre à jour uniquement les champs fournis
    if (fileStatusUpdates !== undefined) {
      user.notificationPreferences.fileStatusUpdates = fileStatusUpdates;
    }
    
    if (newFeatures !== undefined) {
      user.notificationPreferences.newFeatures = newFeatures;
    }
    
    if (promotions !== undefined) {
      user.notificationPreferences.promotions = promotions;
    }
    
    if (emailFrequency) {
      user.notificationPreferences.emailFrequency = emailFrequency;
    }

    await user.save();

    // Renvoyer l'utilisateur sans le mot de passe
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json(userResponse);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erreur serveur');
  }
});

// @route   PUT /api/users/profile
// @desc    Mettre à jour le profil de l'utilisateur
// @access  Private
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, email, currentPassword, newPassword } = req.body;

    // Trouver l'utilisateur
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Mettre à jour le nom et l'email si fournis
    if (name) user.name = name;
    
    if (email && email !== user.email) {
      // Vérifier si l'email est déjà utilisé
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ message: 'Cet email est déjà utilisé' });
      }
      user.email = email;
    }

    // Mettre à jour le mot de passe si fourni
    if (currentPassword && newPassword) {
      // Vérifier le mot de passe actuel
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({ message: 'Mot de passe actuel incorrect' });
      }

      // Définir le nouveau mot de passe
      user.password = newPassword;
    }

    await user.save();

    // Renvoyer l'utilisateur sans le mot de passe
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json(userResponse);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erreur serveur');
  }
});

// @route   POST /api/users/profile-photo
// @desc    Télécharger une photo de profil
// @access  Private
router.post('/profile-photo', auth, uploadPhoto.single('profilePhoto'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Aucune image fournie' });
    }

    // Trouver l'utilisateur
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Si l'utilisateur a déjà une photo, supprimer l'ancienne
    if (user.photoUrl) {
      const oldPhotoPath = user.photoUrl.replace('/uploads/', 'uploads/');
      if (fs.existsSync(oldPhotoPath)) {
        fs.unlinkSync(oldPhotoPath);
      }
    }

    // Mettre à jour le chemin de la photo
    const photoUrl = `/uploads/profile-photos/${req.file.filename}`;
    user.photoUrl = photoUrl;
    await user.save();

    res.json({ photoUrl });
  } catch (err) {
    console.error('Erreur lors de l\'upload de la photo de profil:', err.message);
    res.status(500).json({ message: 'Erreur lors de l\'upload de la photo de profil' });
  }
});

// Gestionnaire d'erreur pour l'upload
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'Le fichier est trop volumineux. Taille maximale: 2MB' });
    }
    return res.status(400).json({ message: `Erreur d'upload: ${err.message}` });
  }
  
  if (err) {
    return res.status(400).json({ message: err.message });
  }
  
  next();
});

module.exports = router; 