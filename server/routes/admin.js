const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const User = require('../models/User');
const EcuFile = require('../models/EcuFile');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { notifyFileAssignment, notifyFileStatusChange } = require('../utils/notificationService');
const CreditTransaction = require('../models/CreditTransaction');

// Configuration de multer pour le stockage des fichiers
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Créer le répertoire s'il n'existe pas
    const uploadDir = path.join(__dirname, '../uploads/modified');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Générer un nom de fichier unique
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

// Filtre pour les types de fichiers acceptés
const fileFilter = (req, file, cb) => {
  // Accepter les fichiers .bin, .ori, .hex, .frf
  if (file.mimetype === 'application/octet-stream' || 
      file.originalname.endsWith('.bin') || 
      file.originalname.endsWith('.ori') || 
      file.originalname.endsWith('.hex') || 
      file.originalname.endsWith('.frf')) {
    cb(null, true);
  } else {
    cb(new Error('Format de fichier non supporté. Seuls les fichiers .bin, .ori, .hex et .frf sont acceptés.'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // Limite à 10MB
  }
});

// Gestionnaire d'erreur pour multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Une erreur Multer s'est produite lors du téléchargement
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        message: 'Le fichier est trop volumineux. La taille maximale est de 10 Mo.'
      });
    }
    return res.status(400).json({
      message: `Erreur lors du téléchargement: ${err.message}`
    });
  } else if (err) {
    // Une autre erreur s'est produite
    return res.status(400).json({
      message: err.message
    });
  }
  next();
};

// @route   GET /api/admin/users
// @desc    Récupérer tous les utilisateurs (pour les administrateurs)
// @access  Admin
router.get('/users', auth, admin, async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : null;
    const query = User.find().select('-password').sort({ createdAt: -1 });
    
    if (limit) {
      query.limit(limit);
    }
    
    const users = await query;
    res.json(users);
  } catch (err) {
    console.error('Erreur lors de la récupération des utilisateurs:', err.message);
    res.status(500).send('Erreur serveur');
  }
});

// @route   GET /api/admin/users/:id
// @desc    Récupérer un utilisateur spécifique par ID
// @access  Admin
router.get('/users/:id', auth, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    res.json(user);
  } catch (err) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    res.status(500).send('Erreur serveur');
  }
});

// @route   PUT /api/admin/users/:id
// @desc    Mettre à jour un utilisateur
// @access  Admin
router.put('/users/:id', auth, admin, async (req, res) => {
  const { name, email, role, credits, notificationPreferences } = req.body;
  
  // Construire l'objet utilisateur
  const userFields = {};
  if (name) userFields.name = name;
  if (email) userFields.email = email;
  if (role) userFields.role = role;
  if (credits !== undefined) userFields.credits = credits;
  if (notificationPreferences) userFields.notificationPreferences = notificationPreferences;
  
  try {
    let user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    // Mettre à jour
    user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: userFields },
      { new: true }
    ).select('-password');
    
    res.json(user);
  } catch (err) {
    console.error('Erreur lors de la mise à jour de l\'utilisateur:', err.message);
    res.status(500).send('Erreur serveur');
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Supprimer un utilisateur
// @access  Admin
router.delete('/users/:id', auth, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    await User.findByIdAndRemove(req.params.id);
    
    res.json({ message: 'Utilisateur supprimé' });
  } catch (err) {
    console.error('Erreur lors de la suppression de l\'utilisateur:', err.message);
    res.status(500).send('Erreur serveur');
  }
});

// @route   GET /api/admin/files
// @desc    Récupérer tous les fichiers ECU (pour les administrateurs)
// @access  Admin
router.get('/files', auth, admin, async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : null;
    
    const query = EcuFile.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    
    if (limit) {
      query.limit(limit);
    }
    
    const files = await query;
    res.json(files);
  } catch (err) {
    console.error('Erreur lors de la récupération des fichiers:', err.message);
    res.status(500).send('Erreur serveur');
  }
});

// @route   GET /api/admin/files/:id
// @desc    Récupérer un fichier ECU spécifique
// @access  Admin
router.get('/files/:id', auth, admin, async (req, res) => {
  try {
    const file = await EcuFile.findById(req.params.id)
      .populate('user', 'name email');
    
    if (!file) {
      return res.status(404).json({ message: 'Fichier non trouvé' });
    }
    
    res.json(file);
  } catch (err) {
    console.error('Erreur lors de la récupération du fichier:', err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Fichier non trouvé' });
    }
    
    res.status(500).send('Erreur serveur');
  }
});

// @route   PUT /api/admin/files/:id/status
// @desc    Mettre à jour le statut d'un fichier ECU
// @access  Admin
router.put('/files/:id/status', auth, admin, async (req, res) => {
  try {
    const { status, comment } = req.body;
    
    // Vérifier que le statut est valide
    if (!['pending', 'processing', 'completed', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Statut invalide' });
    }
    
    const file = await EcuFile.findById(req.params.id);
    
    if (!file) {
      return res.status(404).json({ message: 'Fichier non trouvé' });
    }
    
    // Créer un nouvel événement dans l'historique des statuts
    const statusEvent = {
      status,
      timestamp: Date.now(),
      comment: comment || ''
    };
    
    // Mettre à jour le fichier
    const updatedFile = await EcuFile.findByIdAndUpdate(
      req.params.id,
      {
        $set: { status, updatedAt: Date.now() },
        $push: { statusHistory: statusEvent }
      },
      { new: true }
    ).populate('user', 'name email');
    
    // Ajouter une notification en fonction du nouveau statut
    let notificationType, notificationMessage;
    
    if (status === 'completed') {
      notificationType = 'download_ready';
      notificationMessage = 'Votre fichier modifié est prêt à être téléchargé.';
    } else if (status === 'processing') {
      notificationType = 'status_update';
      notificationMessage = 'Votre fichier est en cours de traitement par nos experts.';
    } else if (status === 'rejected') {
      notificationType = 'file_rejected';
      notificationMessage = 'Votre fichier a été rejeté. Veuillez consulter les commentaires pour plus d\'informations.';
    }
    
    if (notificationType) {
      await EcuFile.findByIdAndUpdate(
        req.params.id,
        {
          $push: {
            notifications: {
              type: notificationType,
              message: notificationMessage,
              sent: false
            }
          }
        }
      );
    }
    
    // Notifier l'utilisateur du changement de statut
    await notifyFileStatusChange(req.params.id, status, comment);
    
    console.log(`Notification envoyée pour le changement de statut du fichier ${req.params.id} à ${status}`);
    
    res.json(updatedFile);
  } catch (err) {
    console.error('Erreur lors de la mise à jour du statut du fichier:', err.message);
    res.status(500).send('Erreur serveur');
  }
});

// @route   GET /api/admin/stats
// @desc    Récupérer les statistiques pour le tableau de bord admin
// @access  Admin
router.get('/stats', auth, admin, async (req, res) => {
  try {
    // Compter le nombre total d'utilisateurs
    const totalUsers = await User.countDocuments();
    
    // Compter le nombre total de fichiers
    const totalFiles = await EcuFile.countDocuments();
    
    // Compter les fichiers par statut
    const pendingFiles = await EcuFile.countDocuments({ status: 'pending' });
    const processingFiles = await EcuFile.countDocuments({ status: 'processing' });
    const completedFiles = await EcuFile.countDocuments({ status: 'completed' });
    const rejectedFiles = await EcuFile.countDocuments({ status: 'rejected' });
    
    // Compter les utilisateurs par rôle
    const adminUsers = await User.countDocuments({ role: 'admin' });
    const expertUsers = await User.countDocuments({ role: 'expert' });
    const regularUsers = await User.countDocuments({ role: 'user' });
    
    // Calculer les revenus (somme des crédits dépensés)
    const totalCreditsSpent = await EcuFile.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$totalCredits' } } }
    ]);
    
    const revenue = totalCreditsSpent.length > 0 ? totalCreditsSpent[0].total : 0;
    
    // Renvoyer toutes les statistiques
    res.json({
      totalUsers,
      totalFiles,
      pendingFiles,
      processingFiles,
      completedFiles,
      rejectedFiles,
      userStats: {
        adminUsers,
        expertUsers,
        regularUsers
      },
      revenue
    });
  } catch (err) {
    console.error('Erreur lors de la récupération des statistiques:', err.message);
    res.status(500).send('Erreur serveur');
  }
});

// @route   GET /api/admin/settings
// @desc    Récupérer les paramètres du système
// @access  Admin
router.get('/settings', auth, admin, async (req, res) => {
  try {
    // Ici, vous pourriez récupérer les paramètres d'une collection de settings dans MongoDB
    // Pour le moment, nous allons renvoyer des valeurs par défaut
    
    const settings = {
      pricing: {
        powerIncreaseStage1: 50,
        powerIncreaseStage2: 75,
        powerIncreaseCustom: 100,
        dpfOff: 25,
        opfOff: 25,
        catalystOff: 25,
        popAndBang: 25,
        catalystPopBangCombo: 40,
        adBlueOff: 25,
        egrOff: 25,
        dtcRemoval: 15,
        vmaxOff: 25,
        startStopOff: 15
      },
      security: {
        maxLoginAttempts: 5,
        lockoutDuration: 30,
        passwordExpiryDays: 90,
        sessionTimeout: 60,
        requireStrongPasswords: true,
        twoFactorAuth: false
      },
      notifications: {
        emailNotificationsEnabled: true,
        statusUpdateNotifications: true,
        commentNotifications: true,
        downloadReadyNotifications: true,
        marketingEmails: false,
        emailFromName: 'AutoTech File Service',
        emailFromAddress: 'no-reply@autotechfiles.com',
        emailFooterText: 'Copyright © AutoTech File Service. Tous droits réservés.'
      }
    };
    
    res.json(settings);
  } catch (err) {
    console.error('Erreur lors de la récupération des paramètres:', err.message);
    res.status(500).send('Erreur serveur');
  }
});

// @route   PUT /api/admin/settings/:type
// @desc    Mettre à jour un type de paramètres (pricing, security, notifications)
// @access  Admin
router.put('/settings/:type', auth, admin, async (req, res) => {
  try {
    const { type } = req.params;
    const settings = req.body;
    
    // Vérifier que le type est valide
    if (!['pricing', 'security', 'notifications'].includes(type)) {
      return res.status(400).json({ message: 'Type de paramètre invalide' });
    }
    
    // Ici, vous pourriez mettre à jour les paramètres dans une collection de settings dans MongoDB
    // Pour le moment, nous allons simplement renvoyer les paramètres mis à jour
    
    // Simuler un enregistrement
    console.log(`Paramètres ${type} mis à jour:`, settings);
    
    res.json({
      message: `Paramètres ${type} mis à jour avec succès`,
      settings
    });
  } catch (err) {
    console.error('Erreur lors de la mise à jour des paramètres:', err.message);
    res.status(500).send('Erreur serveur');
  }
});

// @route   POST /api/admin/files/:id/upload-modified
// @desc    Télécharger un fichier modifié pour un ECU
// @access  Admin
router.post('/files/:id/upload-modified', auth, admin, (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      return handleMulterError(err, req, res, next);
    }
    next();
  });
}, async (req, res) => {
  try {
    // Vérifier que le fichier existe
    const file = await EcuFile.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ message: 'Fichier non trouvé' });
    }

    // Vérification du fichier téléchargé
    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier n\'a été téléchargé' });
    }
    
    // Chemin relatif du fichier pour la base de données
    const modifiedFilePath = `/uploads/modified/${req.file.filename}`;
    
    // Mettre à jour le fichier avec le chemin du fichier modifié
    const updatedFile = await EcuFile.findByIdAndUpdate(
      req.params.id,
      {
        $set: { 
          'fileInfo.modifiedFilePath': modifiedFilePath,
          'fileInfo.modifiedFileName': req.file.originalname,
          updatedAt: Date.now() 
        }
      },
      { new: true }
    ).populate('user', 'name email');
    
    // Créer un événement dans l'historique des statuts si le statut est "processing"
    if (file.status === 'processing') {
      const statusEvent = {
        status: 'processing',
        timestamp: Date.now(),
        comment: 'Fichier modifié téléchargé par l\'administrateur'
      };
      
      await EcuFile.findByIdAndUpdate(
        req.params.id,
        {
          $push: { statusHistory: statusEvent }
        }
      );
    }
    
    res.json({
      message: 'Fichier modifié téléchargé avec succès',
      modifiedFilePath
    });
  } catch (err) {
    console.error('Erreur lors du téléchargement du fichier modifié:', err.message);
    res.status(500).json({ message: 'Erreur serveur: ' + err.message });
  }
});

// @route   GET /api/admin/weekly-stats
// @desc    Récupérer les statistiques hebdomadaires pour le tableau de bord admin
// @access  Admin
router.get('/weekly-stats', auth, admin, async (req, res) => {
  try {
    // Initialiser les tableaux pour chaque jour de la semaine (0 = lundi, 6 = dimanche)
    const filesSent = [0, 0, 0, 0, 0, 0, 0];
    const creditsBought = [0, 0, 0, 0, 0, 0, 0];
    const creditsSpent = [0, 0, 0, 0, 0, 0, 0];
    const totalUsers = [0, 0, 0, 0, 0, 0, 0];
    const filesRejected = [0, 0, 0, 0, 0, 0, 0]; 
    
    // Calculer les dates pour la semaine passée
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - 7);
    
    // Récupérer tous les fichiers envoyés dans la semaine
    const files = await EcuFile.find({
      createdAt: { $gte: weekStart }
    });
    
    // Récupérer spécifiquement les fichiers rejetés dans la semaine
    const rejectedFiles = await EcuFile.find({
      createdAt: { $gte: weekStart },
      status: 'rejected'
    });
    
    // Récupérer toutes les transactions de crédits dans la semaine
    const transactions = await CreditTransaction.find({
      createdAt: { $gte: weekStart }
    });
    
    // Récupérer les utilisateurs créés dans la semaine
    const users = await User.find({
      createdAt: { $gte: weekStart }
    });
    
    // Calculer le cumul des utilisateurs pour chaque jour de la semaine
    for (let i = 6; i >= 0; i--) {
      const dayDate = new Date(today);
      dayDate.setDate(today.getDate() - i);
      dayDate.setHours(0, 0, 0, 0);
      
      const nextDay = new Date(dayDate);
      nextDay.setDate(dayDate.getDate() + 1);
      
      // Compter les utilisateurs inscrits jusqu'à ce jour
      const userCount = await User.countDocuments({
        createdAt: { $lt: nextDay }
      });
      
      // Le jour de la semaine (0 = lundi, 6 = dimanche)
      const dayOfWeek = (dayDate.getDay() + 6) % 7; // Convertir 0=dimanche à 0=lundi
      totalUsers[dayOfWeek] = userCount;
    }
    
    // Calculer le nombre de fichiers et crédits par jour
    files.forEach(file => {
      const fileDate = new Date(file.createdAt);
      const dayOfWeek = (fileDate.getDay() + 6) % 7; // Convertir 0=dimanche à 0=lundi
      filesSent[dayOfWeek]++;
      
      // Si le fichier a été traité, ajouter les crédits dépensés
      if (file.status !== 'pending') {
        creditsSpent[dayOfWeek] += file.totalCredits || 1;
      }
    });
    
    // Compter les fichiers rejetés par jour
    rejectedFiles.forEach(file => {
      const fileDate = new Date(file.createdAt);
      const dayOfWeek = (fileDate.getDay() + 6) % 7; // Convertir 0=dimanche à 0=lundi
      filesRejected[dayOfWeek]++;
    });
    
    // Calculer les crédits achetés par jour
    transactions.forEach(transaction => {
      if (transaction.type === 'purchase') {
        const transactionDate = new Date(transaction.createdAt);
        const dayOfWeek = (transactionDate.getDay() + 6) % 7; // Convertir 0=dimanche à 0=lundi
        creditsBought[dayOfWeek] += transaction.amount;
      }
    });
    
    res.json({
      filesSent,
      creditsBought,
      creditsSpent,
      totalUsers,
      filesRejected
    });
  } catch (err) {
    console.error('Erreur lors de la récupération des statistiques hebdomadaires:', err);
    res.status(500).send('Erreur serveur');
  }
});

// @route   POST /api/admin/files/:id/send-to-client
// @desc    Envoyer un message et/ou un fichier au client
// @access  Admin
router.post('/files/:id/send-to-client', auth, admin, async (req, res) => {
  console.log('Requête reçue pour envoyer au client, ID fichier:', req.params.id);
  try {
    const { message, sendFile } = req.body;
    
    // Vérifier que le message est fourni
    if (!message) {
      return res.status(400).json({ message: 'Message requis' });
    }
    
    // Vérifier que le fichier existe
    const file = await EcuFile.findById(req.params.id)
      .populate('user', 'name email');
    
    if (!file) {
      return res.status(404).json({ message: 'Fichier non trouvé' });
    }
    
    // Vérifier que le fichier a un chemin modifié si on veut l'envoyer
    if (sendFile && !file.fileInfo.modifiedFilePath) {
      return res.status(400).json({ 
        message: 'Impossible d\'envoyer le fichier: aucun fichier modifié n\'a été téléchargé',
        fileId: req.params.id
      });
    }
    
    // Ajouter un événement à l'historique de traitement
    const processingEvent = {
      type: sendFile ? 'file_sent' : 'message_sent',
      timestamp: Date.now(),
      details: {
        message,
        sentBy: req.user.id
      }
    };
    
    let statusUpdated = false;
    
    if (sendFile && file.status !== 'completed') {
      // Créer un événement dans l'historique des statuts
      const statusEvent = {
        status: 'completed',
        timestamp: Date.now(),
        comment: message || 'Fichier modifié envoyé au client',
        updatedBy: req.user.id
      };
      
      // Mettre à jour le fichier
      await EcuFile.findByIdAndUpdate(
        req.params.id,
        {
          $set: { 
            status: 'completed',
            updatedAt: Date.now() 
          },
          $push: { 
            statusHistory: statusEvent,
            processingHistory: processingEvent
          }
        }
      );
      
      // Ajouter une notification pour le client
      await EcuFile.findByIdAndUpdate(
        req.params.id,
        {
          $push: {
            notifications: {
              type: 'download_ready',
              message: message || 'Votre fichier modifié est prêt à être téléchargé.',
              sent: false
            }
          }
        }
      );
      
      // Notifier l'utilisateur du changement de statut
      await notifyFileStatusChange(req.params.id, 'completed', message);
      console.log(`Notification envoyée pour le fichier ${req.params.id} marqué comme complété`);
      
      statusUpdated = true;
    } else if (!sendFile) {
      // Si on envoie juste un message, l'ajouter à l'historique de traitement
      await EcuFile.findByIdAndUpdate(
        req.params.id,
        {
          $push: { 
            processingHistory: processingEvent
          }
        }
      );
      
      // Et ajouter une notification pour le client
      await EcuFile.findByIdAndUpdate(
        req.params.id,
        {
          $push: {
            notifications: {
              type: 'comment_added',
              message: `Nouveau message de l'administrateur: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`,
              sent: false
            }
          }
        }
      );
      
      // Notifier l'utilisateur du nouveau commentaire
      await notifyFileStatusChange(req.params.id, file.status, message);
      console.log(`Notification envoyée pour le nouveau message sur le fichier ${req.params.id}`);
    }
    
    // Dans une implémentation réelle, vous enverriez un email au client ici
    
    res.json({
      message: 'Message et/ou fichier envoyé au client avec succès',
      statusUpdated
    });
  } catch (err) {
    console.error('Erreur lors de l\'envoi au client:', err.message);
    res.status(500).json({ message: 'Erreur serveur: ' + err.message });
  }
});

// @route   GET /api/admin/test-route
// @desc    Route de test pour vérifier l'accès aux routes admin
// @access  Public
router.get('/test-route', (req, res) => {
  console.log('Route de test admin accédée avec succès');
  res.json({ message: 'Route de test admin fonctionne correctement' });
});

// @route   GET /api/admin/test-auth
// @desc    Route de test pour vérifier l'accès authentifié
// @access  Admin
router.get('/test-auth', auth, admin, (req, res) => {
  console.log('Route de test admin authentifiée accédée avec succès');
  console.log('User ID dans la requête:', req.user.id);
  res.json({ 
    message: 'Route de test admin authentifiée fonctionne correctement',
    userId: req.user.id
  });
});

// Ajout d'une version simplifiée de la route send-to-client pour tester
router.post('/files/:id/send-to-client-test', (req, res) => {
  console.log('Route de test send-to-client accédée avec ID:', req.params.id);
  console.log('Corps de la requête:', req.body);
  console.log('Headers:', req.headers);
  
  res.json({
    message: 'Route de test send-to-client accédée avec succès',
    id: req.params.id,
    requestBody: req.body
  });
});

// @route   PUT /api/admin/files/:id/assign
// @desc    Assigner un fichier à un expert
// @access  Admin
router.put('/files/:id/assign', auth, admin, async (req, res) => {
  try {
    const { expertId } = req.body;
    
    if (!expertId) {
      return res.status(400).json({ message: 'ID de l\'expert requis' });
    }
    
    // Vérifier que l'expert existe et a le rôle d'expert
    const expert = await User.findById(expertId);
    if (!expert) {
      return res.status(404).json({ message: 'Expert non trouvé' });
    }
    
    if (expert.role !== 'expert') {
      return res.status(400).json({ message: 'L\'utilisateur sélectionné n\'est pas un expert' });
    }
    
    // Vérifier que le fichier existe
    const file = await EcuFile.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ message: 'Fichier non trouvé' });
    }
    
    // Mettre à jour le fichier avec l'expert assigné
    const updatedFile = await EcuFile.findByIdAndUpdate(
      req.params.id,
      {
        $set: { 
          assignedTo: expertId,
          updatedAt: Date.now()
        }
      },
      { new: true }
    ).populate('assignedTo', 'name email');
    
    // Ajouter un événement dans l'historique des statuts
    await EcuFile.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          statusHistory: {
            status: file.status,
            timestamp: Date.now(),
            comment: `Fichier assigné à l'expert ${expert.name}`,
            updatedBy: req.user.id
          }
        }
      }
    );
    
    // Envoyer des notifications
    await notifyFileAssignment(req.params.id, expertId, req.user.id);
    
    res.json({
      message: `Fichier assigné avec succès à l'expert ${expert.name}`,
      file: updatedFile
    });
  } catch (err) {
    console.error('Erreur lors de l\'assignation du fichier:', err.message);
    res.status(500).send('Erreur serveur');
  }
});

module.exports = router; 