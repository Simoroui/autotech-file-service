const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const EcuFile = require('../models/EcuFile');
const User = require('../models/User');
const CreditTransaction = require('../models/CreditTransaction');
const { sendStatusUpdateEmail, sendCommentNotificationEmail } = require('../utils/emailService');
const jwt = require('jsonwebtoken');
const { notifyNewComment, notifyFileStatusChange, notifyNewFileUpload } = require('../utils/notificationService');

// Configuration de Multer pour le stockage des fichiers ECU
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/original');
    
    // Créer le répertoire s'il n'existe pas
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

// Filtre pour les types de fichiers ECU acceptés
const fileFilter = (req, file, cb) => {
  const allowedFileTypes = ['.bin', '.hex'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedFileTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier non supporté. Seuls les fichiers .bin et .hex sont acceptés.'));
  }
};

// Configuration pour les uploads d'images dans les commentaires
const imageStorage = multer.memoryStorage();

// Filtre pour les types d'images acceptés
const imageFileFilter = (req, file, cb) => {
  console.log(`MULTER - Vérification du type de fichier image: ${file.originalname}, mimetype: ${file.mimetype}`);
  
  // Accepter tous les types d'images communs
  if (file.mimetype.startsWith('image/')) {
    console.log(`MULTER - Type de fichier accepté: ${file.mimetype}`);
    cb(null, true);
  } else {
    console.log(`MULTER - Type de fichier rejeté: ${file.mimetype}`);
    cb(new Error('Type d\'image non supporté. Seules les images sont acceptées.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 } // 100 MB
});

const imageUpload = multer({
  storage: imageStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

// Middleware pour vérifier l'authentification
const auth = require('../middleware/auth');

// @route   GET /api/ecu-files/download-original/:id
// @desc    Télécharger un fichier ECU original
// @access  Private
router.get('/download-original/:id', auth, async (req, res) => {
  try {
    console.log(`Tentative de téléchargement du fichier original avec ID: ${req.params.id}`);
    console.log(`Utilisateur authentifié: ${req.user.id}, rôle: ${req.user.role}`);
    
    const ecuFile = await EcuFile.findById(req.params.id);
    
    if (!ecuFile) {
      console.log(`Fichier non trouvé avec ID: ${req.params.id}`);
      return res.status(404).json({ message: 'Fichier non trouvé' });
    }

    console.log(`Fichier trouvé: ${ecuFile._id}, utilisateur: ${ecuFile.user}, demandeur: ${req.user.id}`);

    // Vérifier si l'utilisateur est autorisé à accéder à ce fichier
    if (ecuFile.user.toString() !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'expert') {
      console.log(`Accès non autorisé pour l'utilisateur: ${req.user.id}, rôle: ${req.user.role}`);
      return res.status(403).json({ message: 'Accès non autorisé' });
    }

    // Vérifier si le fichier original existe
    if (!ecuFile.fileInfo.originalFilePath) {
      console.log(`Chemin du fichier original non disponible`);
      return res.status(400).json({ message: 'Le fichier original n\'est pas disponible' });
    }

    const filePath = ecuFile.fileInfo.originalFilePath;
    console.log(`Tentative d'envoi du fichier: ${filePath}`);

    // Vérifier si le fichier existe sur le disque
    if (!fs.existsSync(filePath)) {
      console.log(`Fichier non trouvé sur le disque: ${filePath}`);
      
      // Essayer avec le nom de fichier seulement (dans le répertoire uploads/original)
      const fileName = path.basename(filePath);
      const uploadsDir = path.join(__dirname, '../uploads/original');
      const alternativePath = path.join(uploadsDir, fileName);
      
      console.log(`Tentative avec chemin alternatif: ${alternativePath}`);
      
      if (fs.existsSync(alternativePath)) {
        console.log(`Fichier trouvé avec chemin alternatif: ${alternativePath}`);
        
        // Extraire le nom du fichier original
        const fileName = path.basename(alternativePath);
        
        // Définir les en-têtes pour le téléchargement
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Type', 'application/octet-stream');
        
        // Envoyer le fichier
        console.log(`Envoi du fichier en cours depuis chemin alternatif...`);
        return res.sendFile(alternativePath);
      }
      
      // Si toujours pas trouvé, vérifier tous les fichiers du dossier pour trouver une correspondance partielle
      if (fs.existsSync(uploadsDir)) {
        const files = fs.readdirSync(uploadsDir);
        console.log(`Fichiers dans le répertoire: ${files.length} fichiers trouvés`);
        
        // Extraire la partie du nom de fichier après le timestamp (par exemple, après 1741594848320-)
        const originalNameParts = fileName.split('-');
        if (originalNameParts.length > 1) {
          const originalNameWithoutTimestamp = originalNameParts.slice(1).join('-');
          console.log(`Recherche de fichier contenant: ${originalNameWithoutTimestamp}`);
          
          // Chercher un fichier qui contient le même nom (sans timestamp)
          for (const file of files) {
            if (file.includes(originalNameWithoutTimestamp)) {
              const matchedPath = path.join(uploadsDir, file);
              console.log(`Correspondance trouvée: ${matchedPath}`);
              
              // Définir les en-têtes pour le téléchargement
              res.setHeader('Content-Disposition', `attachment; filename="${file}"`);
              res.setHeader('Content-Type', 'application/octet-stream');
              
              // Envoyer le fichier
              console.log(`Envoi du fichier correspondant en cours...`);
              return res.sendFile(matchedPath);
            }
          }
        }
      }
      
      return res.status(404).json({ message: 'Fichier non trouvé sur le serveur' });
    }

    // Extraire le nom du fichier original
    const fileName = path.basename(filePath);
    
    // Définir les en-têtes pour le téléchargement
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    
    // Envoyer le fichier DIRECTEMENT depuis le chemin absolu
    console.log(`Envoi du fichier en cours depuis le chemin absolu...`);
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error(`Erreur lors de l'envoi du fichier: ${err.message}`);
        // Si l'erreur n'a pas déjà été envoyée au client
        if (!res.headersSent) {
          res.status(500).json({ message: 'Erreur lors du téléchargement du fichier' });
        }
      } else {
        console.log(`Fichier envoyé avec succès: ${fileName}`);
      }
    });
  } catch (err) {
    console.error(`Erreur lors du téléchargement du fichier original: ${err.message}`);
    res.status(500).send('Erreur serveur');
  }
});

// @route   GET /api/ecu-files/download/:id
// @desc    Télécharger un fichier ECU modifié
// @access  Private
router.get('/download/:id', auth, async (req, res) => {
  try {
    console.log(`Tentative de téléchargement du fichier modifié avec ID: ${req.params.id}`);
    
    const ecuFile = await EcuFile.findById(req.params.id);
    
    if (!ecuFile) {
      console.log(`Fichier non trouvé avec ID: ${req.params.id}`);
      return res.status(404).json({ message: 'Fichier non trouvé' });
    }

    console.log(`Fichier trouvé: ${ecuFile._id}, utilisateur: ${ecuFile.user}, demandeur: ${req.user.id}`);

    // Vérifier si l'utilisateur est autorisé à accéder à ce fichier
    if (ecuFile.user.toString() !== req.user.id && req.user.role !== 'admin') {
      console.log(`Accès non autorisé pour l'utilisateur: ${req.user.id}, rôle: ${req.user.role}`);
      return res.status(403).json({ message: 'Accès non autorisé' });
    }

    // Vérifier si le fichier modifié existe
    if (!ecuFile.fileInfo.modifiedFilePath) {
      console.log(`Chemin du fichier modifié non disponible`);
      return res.status(400).json({ message: 'Le fichier modifié n\'est pas encore disponible' });
    }

    const filePath = ecuFile.fileInfo.modifiedFilePath;
    console.log(`Tentative d'envoi du fichier: ${filePath}`);

    // Vérifier si le fichier existe sur le disque
    if (!fs.existsSync(filePath)) {
      console.log(`Fichier non trouvé sur le disque: ${filePath}`);
      return res.status(404).json({ message: 'Fichier non trouvé sur le serveur' });
    }

    // Extraire le nom du fichier original
    const fileName = path.basename(filePath);
    
    // Définir les en-têtes pour le téléchargement
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    
    // Envoyer le fichier
    console.log(`Envoi du fichier en cours...`);
    res.download(filePath, fileName, (err) => {
      if (err) {
        console.error(`Erreur lors de l'envoi du fichier: ${err.message}`);
        // Si l'erreur n'a pas déjà été envoyée au client
        if (!res.headersSent) {
          res.status(500).json({ message: 'Erreur lors du téléchargement du fichier' });
        }
      } else {
        console.log(`Fichier envoyé avec succès: ${fileName}`);
      }
    });
  } catch (err) {
    console.error(`Erreur lors du téléchargement du fichier modifié: ${err.message}`);
    res.status(500).send('Erreur serveur');
  }
});

// @route   POST /api/ecu-files
// @desc    Envoyer un nouveau fichier ECU
// @access  Private
router.post('/', auth, upload.single('file'), async (req, res) => {
  try {
    const {
      vehicleType,
      manufacturer,
      model,
      year,
      engine,
      transmission,
      mileage,
      licensePlate,
      vin,
      reprogrammingTool,
      readMethod,
      ecuBrand,
      ecuType,
      hwNumber,
      swNumber,
      powerIncrease,
      dpfOff,
      opfOff,
      catalystOff,
      popAndBang,
      adBlueOff,
      egrOff,
      dtcRemoval,
      vmaxOff,
      startStopOff,
      comments
    } = req.body;

    // Calculer le coût total en crédits
    let totalCredits = 0;
    
    // Coût de base selon le niveau de puissance
    if (powerIncrease === 'Stage 1') totalCredits += 50;
    else if (powerIncrease === 'Stage 2') totalCredits += 75;
    else if (powerIncrease === 'Custom') totalCredits += 100;
    // Si aucune augmentation de puissance n'est sélectionnée, le coût reste à 0
    
    // Vérifier qu'au moins une option est sélectionnée
    const hasSelectedOptions = 
      powerIncrease || 
      dpfOff === 'true' || 
      opfOff === 'true' || 
      catalystOff === 'true' || 
      popAndBang === 'true' || 
      adBlueOff === 'true' || 
      egrOff === 'true' || 
      dtcRemoval === 'true' || 
      vmaxOff === 'true' || 
      startStopOff === 'true';
    
    if (!hasSelectedOptions) {
      return res.status(400).json({ message: 'Veuillez sélectionner au moins une option de personnalisation' });
    }
    
    // Options supplémentaires
    if (dpfOff === 'true') totalCredits += 25;
    if (opfOff === 'true') totalCredits += 25;
    if (catalystOff === 'true' && popAndBang === 'true') totalCredits += 40;
    else {
      if (catalystOff === 'true') totalCredits += 25;
      if (popAndBang === 'true') totalCredits += 25;
    }
    if (adBlueOff === 'true') totalCredits += 25;
    if (egrOff === 'true') totalCredits += 25;
    if (dtcRemoval === 'true') totalCredits += 15;
    if (vmaxOff === 'true') totalCredits += 25;
    if (startStopOff === 'true') totalCredits += 15;

    // Vérifier si l'utilisateur a suffisamment de crédits
    const user = await User.findById(req.user.id);
    if (user.credits < totalCredits) {
      return res.status(400).json({ message: 'Crédits insuffisants' });
    }

    // Créer un nouveau fichier ECU
    const vehicleInfo = {
      type: vehicleType,
      manufacturer,
      model,
      year,
      engine,
      transmission
    };
    
    // Ajouter les champs optionnels seulement s'ils sont fournis
    if (mileage !== undefined && mileage !== '') vehicleInfo.mileage = Number(mileage);
    if (licensePlate) vehicleInfo.licensePlate = licensePlate;
    if (vin) vehicleInfo.vin = vin;
    
    console.log('Vehicle Info:', vehicleInfo);
    
    const ecuFile = new EcuFile({
      user: req.user.id,
      vehicleInfo,
      fileInfo: {
        reprogrammingTool,
        readMethod,
        ecuBrand,
        ecuType,
        hwNumber,
        swNumber,
        originalFilePath: req.file.path
      },
      options: {
        powerIncrease,
        dpfOff: dpfOff === 'true',
        opfOff: opfOff === 'true',
        catalystOff: catalystOff === 'true',
        popAndBang: popAndBang === 'true',
        adBlueOff: adBlueOff === 'true',
        egrOff: egrOff === 'true',
        dtcRemoval: dtcRemoval === 'true',
        vmaxOff: vmaxOff === 'true',
        startStopOff: startStopOff === 'true'
      },
      comments,
      totalCredits
    });

    await ecuFile.save();

    // Déduire les crédits de l'utilisateur
    user.credits -= totalCredits;
    await user.save();
    
    // Créer une transaction de crédit pour enregistrer l'utilisation des crédits
    const transaction = new CreditTransaction({
      user: req.user.id,
      amount: totalCredits,
      type: 'usage',
      description: `Utilisation de crédits pour le fichier ${ecuFile._id}`,
      relatedFile: ecuFile._id
    });
    
    await transaction.save();

    // Envoyer une notification aux administrateurs
    await notifyNewFileUpload(ecuFile._id);
    console.log(`Notification envoyée aux administrateurs pour le nouveau fichier ${ecuFile._id}`);

    res.status(201).json(ecuFile);
  } catch (err) {
    console.error('Erreur lors de l\'envoi d\'un fichier ECU:', err.message);
    res.status(500).send('Erreur serveur: ' + err.message);
  }
});

// @route   GET /api/ecu-files
// @desc    Obtenir tous les fichiers ECU de l'utilisateur
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const ecuFiles = await EcuFile.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(ecuFiles);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erreur serveur');
  }
});

// @route   PUT /api/ecu-files/:id/status
// @desc    Mettre à jour le statut d'un fichier ECU
// @access  Private (Admin/Expert)
router.put('/:id/status', auth, async (req, res) => {
  try {
    // Vérifier si l'utilisateur est un admin ou un expert
    if (req.user.role !== 'admin' && req.user.role !== 'expert') {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }

    const { status, comment } = req.body;

    // Vérifier si le statut est valide
    if (!['pending', 'in_progress', 'completed', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Statut invalide' });
    }

    // Trouver et mettre à jour le fichier
    const ecuFile = await EcuFile.findById(req.params.id);

    if (!ecuFile) {
      return res.status(404).json({ message: 'Fichier non trouvé' });
    }

    // Mettre à jour le statut
    ecuFile.status = status;
    ecuFile.updatedAt = Date.now();

    // Ajouter à l'historique des statuts
    ecuFile.statusHistory.push({
      status,
      timestamp: Date.now(),
      comment: comment || '',
      updatedBy: req.user.id
    });

    await ecuFile.save();

    // Envoyer une notification par email
    sendStatusUpdateEmail(ecuFile, status, comment);
    
    // Envoyer une notification in-app
    await notifyFileStatusChange(ecuFile._id, status, comment);

    res.json(ecuFile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erreur serveur');
  }
});

// @route   POST /api/ecu-files/:id/comments
// @desc    Ajouter un commentaire à un fichier ECU
// @access  Private
router.post('/:id/comments', auth, (req, res) => {
  // Utiliser multer avec une gestion d'erreur personnalisée
  console.log(`=================================================`);
  console.log(`DÉBUT DE LA ROUTE: POST /api/ecu-files/:id/comments`);
  console.log(`ID du fichier: ${req.params.id}`);
  console.log(`Utilisateur: ${req.user.id}, rôle: ${req.user.role}`);
  console.log(`Headers de la requête:`, req.headers);
  console.log(`Type de contenu: ${req.headers['content-type']}`);
  
  const upload = imageUpload.single('image');
  
  upload(req, res, async function(err) {
    if (err) {
      console.error('ERREUR MULTER DÉTAILLÉE:', err);
      console.error('Message d\'erreur:', err.message);
      console.error('Stack trace:', err.stack);
      
      if (err instanceof multer.MulterError) {
        // Erreur Multer spécifique
        console.error(`Type d'erreur Multer: ${err.code}`);
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({ message: 'L\'image est trop volumineuse. Taille maximale: 5 Mo.' });
        } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return res.status(400).json({ message: 'Fichier inattendu dans la requête.' });
        }
        return res.status(400).json({ message: `Erreur lors de l'upload de l'image: ${err.message} (${err.code})` });
      } else {
        // Erreur non-Multer
        return res.status(500).json({ message: `Erreur serveur lors de l'upload: ${err.message}` });
      }
    }
    
    try {
      console.log(`==========================================`);
      console.log(`MULTER OK - DÉBUT TRAITEMENT COMMENTAIRE`);
      console.log(`Contenu de la requête:`, req.body);
      console.log(`Fichier reçu:`, req.file ? {
        fieldname: req.file.fieldname,
        originalname: req.file.originalname,
        encoding: req.file.encoding,
        mimetype: req.file.mimetype,
        size: req.file.size,
        buffer: req.file.buffer ? 'Buffer présent' : 'Pas de buffer'
      } : 'Aucun fichier');
      
      const { comment } = req.body;
      const imageFile = req.file;

      // Vérifier qu'il y a au moins un commentaire ou une image
      if ((!comment || comment.trim() === '') && !imageFile) {
        console.log(`Erreur: Ni commentaire ni image fournis`);
        return res.status(400).json({ message: 'Le commentaire ou une image est requis' });
      }

      // Trouver le fichier
      console.log(`Recherche du fichier avec ID: ${req.params.id}`);
      const ecuFile = await EcuFile.findById(req.params.id);

      if (!ecuFile) {
        console.log(`Erreur: Fichier non trouvé avec ID ${req.params.id}`);
        return res.status(404).json({ message: 'Fichier non trouvé' });
      }

      console.log(`Fichier trouvé: ${ecuFile._id}`);

      // Vérifier si l'utilisateur est autorisé à commenter ce fichier
      if (ecuFile.user.toString() !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'expert') {
        console.log(`Erreur: Utilisateur ${req.user.id} non autorisé à commenter ce fichier`);
        return res.status(403).json({ message: 'Accès non autorisé' });
      }

      // Créer un nouveau commentaire
      const newComment = {
        user: req.user.id,
        text: comment || '',
        createdAt: Date.now()
      };

      // Ajouter le chemin de l'image si une image a été téléversée
      if (imageFile) {
        // Générer un nom de fichier unique
        const uniqueFilename = `${Date.now()}-${imageFile.originalname}`;
        const uploadDir = path.join(__dirname, '../uploads/images');
        const fullImagePath = path.join(uploadDir, uniqueFilename);
        
        // S'assurer que le répertoire existe
        if (!fs.existsSync(uploadDir)) {
          console.log(`Création du répertoire ${uploadDir}`);
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        // Écrire le fichier depuis le buffer
        try {
          fs.writeFileSync(fullImagePath, imageFile.buffer);
          console.log(`Fichier image écrit sur le disque: ${fullImagePath}`);
          
          // Vérifier que le fichier a bien été écrit
          if (fs.existsSync(fullImagePath)) {
            console.log(`Vérification: le fichier existe sur le disque: ${fullImagePath}`);
          } else {
            console.error(`ERREUR: Le fichier n'a pas été correctement écrit: ${fullImagePath}`);
            return res.status(500).json({ message: 'Erreur lors de l\'enregistrement de l\'image' });
          }
          
          // Chemin relatif pour l'accès via le navigateur
          newComment.imagePath = `/uploads/images/${uniqueFilename}`;
          console.log(`Image ajoutée au commentaire: ${newComment.imagePath}`);
        } catch (writeErr) {
          console.error(`ERREUR lors de l'écriture du fichier:`, writeErr);
          return res.status(500).json({ message: `Erreur lors de l'enregistrement de l'image: ${writeErr.message}` });
        }
        
        // Si on a une image, le texte n'est pas obligatoire
        if (!newComment.text) {
          newComment.text = '';
        }
      }

      // Ajouter le commentaire au fichier
      if (!ecuFile.discussionComments) {
        ecuFile.discussionComments = [];
      }
      
      ecuFile.discussionComments.push(newComment);
      ecuFile.updatedAt = Date.now();

      console.log(`Sauvegarde du fichier avec le nouveau commentaire...`);
      try {
        await ecuFile.save();
        console.log(`Fichier sauvegardé avec succès`);
      } catch (saveError) {
        console.error(`Erreur lors de la sauvegarde du fichier:`, saveError);
        throw saveError;
      }
      
      console.log(`Commentaire ajouté avec succès, ID: ${ecuFile.discussionComments[ecuFile.discussionComments.length - 1]._id}`);

      // Envoi de notification par email si configuré
      const user = await User.findById(req.user.id);
      const authorName = user.role === 'admin' ? 'Administrateur' : user.role === 'expert' ? 'Expert technique' : user.name;
      
      // Utiliser le service de notification pour créer des notifications pour tous les utilisateurs concernés
      try {
        const { notifyNewComment } = require('../utils/notificationService');
        // Utiliser le texte réel du commentaire, pas un placeholder
        const commentText = comment || (req.file ? 'Image jointe' : '');
        await notifyNewComment(ecuFile._id.toString(), req.user.id, commentText);
        console.log(`Notifications pour le nouveau commentaire envoyées avec succès`);
      } catch (notifError) {
        console.error(`Erreur lors de l'envoi des notifications de commentaire:`, notifError);
        // Ne pas bloquer la réponse en cas d'erreur de notification
      }

      // Envoyer un email de notification si configuré
      try {
        if (process.env.EMAIL_ENABLED === 'true' && ecuFile.user.toString() !== req.user.id) {
          const fileOwner = await User.findById(ecuFile.user);
          if (fileOwner && fileOwner.email) {
            await sendCommentNotificationEmail(
              fileOwner.email,
              fileOwner.name,
              ecuFile.filename,
              authorName,
              comment || (req.file ? 'Image jointe' : '')
            );
            console.log(`Email de notification envoyé à ${fileOwner.email}`);
          }
        }
      } catch (emailError) {
        console.error(`Erreur lors de l'envoi de l'email:`, emailError);
        // Ne pas bloquer la réponse en cas d'erreur d'email
      }

      return res.json(ecuFile);
    } catch (error) {
      console.error(`Erreur lors du traitement du commentaire:`, error);
      return res.status(500).json({ message: `Erreur serveur: ${error.message}` });
    }
  });
});

// @route   GET /api/ecu-files/:id
// @desc    Obtenir un fichier ECU spécifique
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    console.log(`Tentative de récupération des détails du fichier avec ID: ${req.params.id}`);
    console.log(`Utilisateur authentifié: ${req.user.id}, rôle: ${req.user.role}`);
    
    const ecuFile = await EcuFile.findById(req.params.id);
    
    if (!ecuFile) {
      console.log(`Fichier non trouvé avec ID: ${req.params.id}`);
      return res.status(404).json({ message: 'Fichier non trouvé' });
    }

    console.log(`Fichier trouvé: ${ecuFile._id}, utilisateur: ${ecuFile.user}, demandeur: ${req.user.id}`);

    // Vérifier si l'utilisateur est autorisé à accéder à ce fichier
    if (ecuFile.user.toString() !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'expert') {
      console.log(`Accès non autorisé pour l'utilisateur: ${req.user.id}, rôle: ${req.user.role}`);
      return res.status(403).json({ message: 'Accès non autorisé' });
    }

    res.json(ecuFile);
  } catch (err) {
    console.error('Erreur lors de la récupération des détails du fichier:', err.message);
    res.status(500).send('Erreur serveur');
  }
});

// @route   POST /api/ecu-files/download-original/:id
// @desc    Télécharger un fichier ECU original (via POST)
// @access  Private
router.post('/download-original/:id', async (req, res) => {
  try {
    console.log(`Tentative de téléchargement POST du fichier original avec ID: ${req.params.id}`);
    
    // Récupérer le token du corps de la requête
    const token = req.body.token;
    console.log(`Token reçu dans le corps: ${token ? 'Présent' : 'Absent'}`);
    
    if (!token) {
      return res.status(401).json({ message: 'Pas de token, accès refusé' });
    }
    
    // Vérifier le token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Token vérifié avec succès, utilisateur:', decoded.user);
    } catch (err) {
      console.error('Token invalide:', err.message);
      return res.status(401).json({ message: 'Token invalide' });
    }
    
    // Ajouter l'utilisateur à la requête
    req.user = decoded.user;
    
    console.log(`Utilisateur authentifié: ${req.user.id}, rôle: ${req.user.role}`);
    
    const ecuFile = await EcuFile.findById(req.params.id);
    
    if (!ecuFile) {
      console.log(`Fichier non trouvé avec ID: ${req.params.id}`);
      return res.status(404).json({ message: 'Fichier non trouvé' });
    }

    console.log(`Fichier trouvé: ${ecuFile._id}, utilisateur: ${ecuFile.user}, demandeur: ${req.user.id}`);

    // Vérifier si l'utilisateur est autorisé à accéder à ce fichier
    if (ecuFile.user.toString() !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'expert') {
      console.log(`Accès non autorisé pour l'utilisateur: ${req.user.id}, rôle: ${req.user.role}`);
      return res.status(403).json({ message: 'Accès non autorisé' });
    }

    // Vérifier si le fichier original existe
    if (!ecuFile.fileInfo.originalFilePath) {
      console.log(`Chemin du fichier original non disponible`);
      return res.status(400).json({ message: 'Le fichier original n\'est pas disponible' });
    }

    const filePath = ecuFile.fileInfo.originalFilePath;
    console.log(`Tentative d'envoi du fichier: ${filePath}`);

    // Vérifier si le fichier existe sur le disque
    if (!fs.existsSync(filePath)) {
      console.log(`Fichier non trouvé sur le disque: ${filePath}`);
      
      // Vérifier si le répertoire existe
      const dirPath = path.dirname(filePath);
      const dirExists = fs.existsSync(dirPath);
      console.log(`Le répertoire ${dirPath} existe: ${dirExists}`);
      
      // Lister les fichiers dans le répertoire s'il existe
      if (dirExists) {
        const files = fs.readdirSync(dirPath);
        console.log(`Fichiers dans le répertoire: ${files.join(', ')}`);
      }
      
      return res.status(404).json({ message: 'Fichier non trouvé sur le serveur' });
    }

    // Extraire le nom du fichier original
    const fileName = path.basename(filePath);
    
    // Définir les en-têtes pour le téléchargement
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    
    // Envoyer le fichier
    console.log(`Envoi du fichier en cours...`);
    res.download(filePath, fileName, (err) => {
      if (err) {
        console.error(`Erreur lors de l'envoi du fichier: ${err.message}`);
        // Si l'erreur n'a pas déjà été envoyée au client
        if (!res.headersSent) {
          res.status(500).json({ message: 'Erreur lors du téléchargement du fichier' });
        }
      } else {
        console.log(`Fichier envoyé avec succès: ${fileName}`);
      }
    });
  } catch (err) {
    console.error(`Erreur lors du téléchargement du fichier original: ${err.message}`);
    res.status(500).send('Erreur serveur');
  }
});

// @route   POST /api/ecu-files/download/:id
// @desc    Télécharger un fichier ECU modifié (via POST)
// @access  Private
router.post('/download/:id', async (req, res) => {
  try {
    console.log(`Tentative de téléchargement POST du fichier modifié avec ID: ${req.params.id}`);
    
    // Récupérer le token du corps de la requête
    const token = req.body.token;
    console.log(`Token reçu dans le corps: ${token ? 'Présent' : 'Absent'}`);
    
    if (!token) {
      return res.status(401).json({ message: 'Pas de token, accès refusé' });
    }
    
    // Vérifier le token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Token vérifié avec succès, utilisateur:', decoded.user);
    } catch (err) {
      console.error('Token invalide:', err.message);
      return res.status(401).json({ message: 'Token invalide' });
    }
    
    // Ajouter l'utilisateur à la requête
    req.user = decoded.user;
    
    console.log(`Utilisateur authentifié: ${req.user.id}, rôle: ${req.user.role}`);
    
    const ecuFile = await EcuFile.findById(req.params.id);
    
    if (!ecuFile) {
      console.log(`Fichier non trouvé avec ID: ${req.params.id}`);
      return res.status(404).json({ message: 'Fichier non trouvé' });
    }

    console.log(`Fichier trouvé: ${ecuFile._id}, utilisateur: ${ecuFile.user}, demandeur: ${req.user.id}`);

    // Vérifier si l'utilisateur est autorisé à accéder à ce fichier
    if (ecuFile.user.toString() !== req.user.id && req.user.role !== 'admin') {
      console.log(`Accès non autorisé pour l'utilisateur: ${req.user.id}, rôle: ${req.user.role}`);
      return res.status(403).json({ message: 'Accès non autorisé' });
    }

    // Vérifier si le fichier modifié existe
    if (!ecuFile.fileInfo.modifiedFilePath) {
      console.log(`Chemin du fichier modifié non disponible`);
      return res.status(400).json({ message: 'Le fichier modifié n\'est pas encore disponible' });
    }

    const filePath = ecuFile.fileInfo.modifiedFilePath;
    console.log(`Tentative d'envoi du fichier: ${filePath}`);

    // Vérifier si le fichier existe sur le disque
    if (!fs.existsSync(filePath)) {
      console.log(`Fichier non trouvé sur le disque: ${filePath}`);
      
      // Vérifier si le répertoire existe
      const dirPath = path.dirname(filePath);
      const dirExists = fs.existsSync(dirPath);
      console.log(`Le répertoire ${dirPath} existe: ${dirExists}`);
      
      // Lister les fichiers dans le répertoire s'il existe
      if (dirExists) {
        const files = fs.readdirSync(dirPath);
        console.log(`Fichiers dans le répertoire: ${files.join(', ')}`);
      }
      
      return res.status(404).json({ message: 'Fichier non trouvé sur le serveur' });
    }

    // Extraire le nom du fichier original
    const fileName = path.basename(filePath);
    
    // Définir les en-têtes pour le téléchargement
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    
    // Envoyer le fichier
    console.log(`Envoi du fichier en cours...`);
    res.download(filePath, fileName, (err) => {
      if (err) {
        console.error(`Erreur lors de l'envoi du fichier: ${err.message}`);
        // Si l'erreur n'a pas déjà été envoyée au client
        if (!res.headersSent) {
          res.status(500).json({ message: 'Erreur lors du téléchargement du fichier' });
        }
      } else {
        console.log(`Fichier envoyé avec succès: ${fileName}`);
      }
    });
  } catch (err) {
    console.error(`Erreur lors du téléchargement du fichier modifié: ${err.message}`);
    res.status(500).send('Erreur serveur');
  }
});

// @route   GET /api/ecu-files/download-original-direct/:id
// @desc    Télécharger un fichier ECU original (via token dans l'URL)
// @access  Private
router.get('/download-original-direct/:id', async (req, res) => {
  try {
    console.log(`Tentative de téléchargement direct du fichier original avec ID: ${req.params.id}`);
    
    // Récupérer le token de l'URL
    const token = req.query.token;
    console.log(`Token reçu dans l'URL: ${token ? 'Présent' : 'Absent'}`);
    
    if (!token) {
      return res.status(401).json({ message: 'Pas de token, accès refusé' });
    }
    
    // Vérifier le token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Token vérifié avec succès, utilisateur:', decoded.user);
    } catch (err) {
      console.error('Token invalide:', err.message);
      return res.status(401).json({ message: 'Token invalide' });
    }
    
    // Ajouter l'utilisateur à la requête
    req.user = decoded.user;
    
    console.log(`Utilisateur authentifié: ${req.user.id}, rôle: ${req.user.role}`);
    
    const ecuFile = await EcuFile.findById(req.params.id);
    
    if (!ecuFile) {
      console.log(`Fichier non trouvé avec ID: ${req.params.id}`);
      return res.status(404).json({ message: 'Fichier non trouvé' });
    }

    console.log(`Fichier trouvé: ${ecuFile._id}, utilisateur: ${ecuFile.user}, demandeur: ${req.user.id}`);
    console.log(`Informations du fichier:`, ecuFile.fileInfo);

    // Vérifier si l'utilisateur est autorisé à accéder à ce fichier
    if (ecuFile.user.toString() !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'expert') {
      console.log(`Accès non autorisé pour l'utilisateur: ${req.user.id}, rôle: ${req.user.role}`);
      return res.status(403).json({ message: 'Accès non autorisé' });
    }

    // Vérifier si le fichier original existe
    if (!ecuFile.fileInfo.originalFilePath) {
      console.log(`Chemin du fichier original non disponible`);
      return res.status(400).json({ message: 'Le fichier original n\'est pas disponible' });
    }

    // Extraire le nom du fichier original (ne prendre que la partie après le dernier / ou \)
    let originalFileName = path.basename(ecuFile.fileInfo.originalFilePath);
    console.log(`Nom du fichier original extrait: ${originalFileName}`);
    
    // Répertoire des uploads
    const uploadsDir = path.join(__dirname, '../uploads/original');
    console.log(`Répertoire des uploads: ${uploadsDir}`);
    
    // Lister tous les fichiers du répertoire uploads/original
    if (!fs.existsSync(uploadsDir)) {
      console.log(`Répertoire uploads/original non trouvé: ${uploadsDir}`);
      return res.status(404).json({ message: 'Répertoire des uploads non trouvé' });
    }
    
    const uploadFiles = fs.readdirSync(uploadsDir);
    console.log(`Fichiers dans uploads/original (${uploadFiles.length}): ${uploadFiles.slice(0, 5).join(', ')}${uploadFiles.length > 5 ? '...' : ''}`);
    
    // 1. Essayer d'abord de trouver le fichier exact
    if (uploadFiles.includes(originalFileName)) {
      const filePath = path.join(uploadsDir, originalFileName);
      console.log(`Fichier exact trouvé: ${filePath}`);
      
      // Envoyer le fichier
      return res.download(filePath, originalFileName, (err) => {
        if (err) {
          console.error(`Erreur lors de l'envoi du fichier: ${err.message}`);
          if (!res.headersSent) {
            res.status(500).json({ message: 'Erreur lors du téléchargement du fichier' });
          }
        } else {
          console.log(`Fichier envoyé avec succès: ${originalFileName}`);
        }
      });
    }
    
    // 2. Si non trouvé, chercher un fichier qui contient le nom du fichier original sans le timestamp
    // Extraire le nom sans le timestamp (supposant un format comme 1741594848320-nomdufichier.ext)
    const nameParts = originalFileName.split('-');
    let searchName = '';
    
    if (nameParts.length > 1 && !isNaN(nameParts[0])) {
      // Si le format est comme 1741594848320-nomdufichier.ext
      searchName = nameParts.slice(1).join('-');
    } else {
      // Sinon, utiliser le nom complet
      searchName = originalFileName;
    }
    
    console.log(`Recherche de fichiers contenant: ${searchName}`);
    
    // Chercher un fichier qui contient le nom recherché
    const matchingFiles = uploadFiles.filter(file => file.includes(searchName));
    
    if (matchingFiles.length > 0) {
      const filePath = path.join(uploadsDir, matchingFiles[0]);
      console.log(`Fichier correspondant trouvé: ${filePath}`);
      
      // Envoyer le fichier
      return res.download(filePath, matchingFiles[0], (err) => {
        if (err) {
          console.error(`Erreur lors de l'envoi du fichier: ${err.message}`);
          if (!res.headersSent) {
            res.status(500).json({ message: 'Erreur lors du téléchargement du fichier' });
          }
        } else {
          console.log(`Fichier envoyé avec succès: ${matchingFiles[0]}`);
        }
      });
    }
    
    // 3. Si toutes les tentatives échouent, chercher un fichier avec le timestamp
    const timestampPattern = /^\d{13}-/; // Format typique du timestamp (13 chiffres suivis d'un tiret)
    
    // Extraire le timestamp du chemin original s'il existe
    let timestamp = '';
    if (nameParts.length > 1 && !isNaN(nameParts[0])) {
      timestamp = nameParts[0];
    }
    
    // Chercher des fichiers avec ce timestamp
    const timestampFiles = timestamp ? 
      uploadFiles.filter(file => file.startsWith(timestamp)) : 
      uploadFiles.filter(file => timestampPattern.test(file));
    
    if (timestampFiles.length > 0) {
      const filePath = path.join(uploadsDir, timestampFiles[0]);
      console.log(`Fichier avec timestamp trouvé: ${filePath}`);
      
      // Envoyer le fichier
      return res.download(filePath, timestampFiles[0], (err) => {
        if (err) {
          console.error(`Erreur lors de l'envoi du fichier: ${err.message}`);
          if (!res.headersSent) {
            res.status(500).json({ message: 'Erreur lors du téléchargement du fichier' });
          }
        } else {
          console.log(`Fichier envoyé avec succès: ${timestampFiles[0]}`);
        }
      });
    }
    
    // Si aucun fichier n'est trouvé, envoyer une erreur
    console.log('Aucun fichier correspondant trouvé dans le répertoire uploads/original');
    return res.status(404).json({ message: 'Fichier non trouvé sur le serveur' });
    
  } catch (err) {
    console.error(`Erreur lors du téléchargement du fichier original: ${err.message}`);
    res.status(500).send('Erreur serveur');
  }
});

// @route   GET /api/ecu-files/download-modified-direct/:id
// @desc    Télécharger un fichier ECU modifié (via token dans l'URL)
// @access  Private
router.get('/download-modified-direct/:id', async (req, res) => {
  try {
    console.log(`Tentative de téléchargement direct du fichier modifié avec ID: ${req.params.id}`);
    
    // Récupérer le token de l'URL
    const token = req.query.token;
    console.log(`Token reçu dans l'URL: ${token ? 'Présent' : 'Absent'}`);
    
    if (!token) {
      return res.status(401).json({ message: 'Pas de token, accès refusé' });
    }
    
    // Vérifier le token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Token vérifié avec succès, utilisateur:', decoded.user);
    } catch (err) {
      console.error('Token invalide:', err.message);
      return res.status(401).json({ message: 'Token invalide' });
    }
    
    // Ajouter l'utilisateur à la requête
    req.user = decoded.user;
    
    console.log(`Utilisateur authentifié: ${req.user.id}, rôle: ${req.user.role}`);
    
    const ecuFile = await EcuFile.findById(req.params.id);
    
    if (!ecuFile) {
      console.log(`Fichier non trouvé avec ID: ${req.params.id}`);
      return res.status(404).json({ message: 'Fichier non trouvé' });
    }

    console.log(`Fichier trouvé: ${ecuFile._id}, utilisateur: ${ecuFile.user}, demandeur: ${req.user.id}`);
    console.log(`Informations du fichier:`, ecuFile.fileInfo);

    // Vérifier si l'utilisateur est autorisé à accéder à ce fichier
    if (ecuFile.user.toString() !== req.user.id && req.user.role !== 'admin') {
      console.log(`Accès non autorisé pour l'utilisateur: ${req.user.id}, rôle: ${req.user.role}`);
      return res.status(403).json({ message: 'Accès non autorisé' });
    }

    // Vérifier si le fichier modifié existe
    if (!ecuFile.fileInfo.modifiedFilePath) {
      console.log(`Chemin du fichier modifié non disponible`);
      return res.status(400).json({ message: 'Le fichier modifié n\'est pas encore disponible' });
    }

    const filePath = ecuFile.fileInfo.modifiedFilePath;
    console.log(`Tentative d'envoi du fichier: ${filePath}`);

    // Vérifier si le fichier existe sur le disque
    if (!fs.existsSync(filePath)) {
      console.log(`Fichier non trouvé sur le chemin exact: ${filePath}`);
      
      // Extraire le nom du fichier à partir du chemin
      const fileName = path.basename(filePath);
      console.log(`Nom du fichier extrait: ${fileName}`);
      
      // Vérifier dans le répertoire uploads/modified
      const modifiedDir = path.join(__dirname, '../uploads/modified');
      console.log(`Vérification dans le répertoire: ${modifiedDir}`);
      
      if (fs.existsSync(modifiedDir)) {
        console.log(`Répertoire uploads/modified existe`);
        const files = fs.readdirSync(modifiedDir);
        console.log(`Fichiers trouvés dans uploads/modified (${files.length}): ${files.slice(0, 10).join(', ')}`);
        
        // 1. Recherche par nom exact
        if (files.includes(fileName)) {
          const exactFilePath = path.join(modifiedDir, fileName);
          console.log(`Fichier trouvé par nom exact: ${exactFilePath}`);
          
          // Définir les en-têtes pour le téléchargement
          res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
          res.setHeader('Content-Type', 'application/octet-stream');
          
          // Envoyer le fichier
          console.log(`Envoi du fichier exact...`);
          return res.download(exactFilePath, fileName, (err) => {
            if (err) {
              console.error(`Erreur lors de l'envoi du fichier: ${err.message}`);
              if (!res.headersSent) {
                res.status(500).json({ message: 'Erreur lors du téléchargement du fichier' });
              }
            } else {
              console.log(`Fichier envoyé avec succès: ${fileName}`);
            }
          });
        }
        
        // 2. Recherche par ID de fichier (les fichiers modifiés contiennent souvent l'ID)
        const fileId = ecuFile._id.toString();
        console.log(`Recherche de fichiers contenant l'ID: ${fileId}`);
        
        const filesWithId = files.filter(file => file.includes(fileId));
        if (filesWithId.length > 0) {
          const fileWithIdPath = path.join(modifiedDir, filesWithId[0]);
          console.log(`Fichier trouvé contenant l'ID: ${fileWithIdPath}`);
          
          // Définir les en-têtes pour le téléchargement
          res.setHeader('Content-Disposition', `attachment; filename="${filesWithId[0]}"`);
          res.setHeader('Content-Type', 'application/octet-stream');
          
          // Envoyer le fichier
          console.log(`Envoi du fichier avec ID...`);
          return res.download(fileWithIdPath, filesWithId[0], (err) => {
            if (err) {
              console.error(`Erreur lors de l'envoi du fichier: ${err.message}`);
              if (!res.headersSent) {
                res.status(500).json({ message: 'Erreur lors du téléchargement du fichier' });
              }
            } else {
              console.log(`Fichier envoyé avec succès: ${filesWithId[0]}`);
            }
          });
        }
        
        // 3. Recherche par correspondance partielle avec le nom original
        if (ecuFile.fileInfo.originalFilePath) {
          const originalFileName = path.basename(ecuFile.fileInfo.originalFilePath);
          // Enlever le timestamp et l'extension
          const baseName = originalFileName.split('-').slice(1).join('-').split('.')[0];
          console.log(`Recherche de fichiers contenant le nom de base: ${baseName}`);
          
          const matchingFiles = files.filter(file => file.includes(baseName));
          if (matchingFiles.length > 0) {
            const matchingFilePath = path.join(modifiedDir, matchingFiles[0]);
            console.log(`Fichier trouvé par correspondance partielle: ${matchingFilePath}`);
            
            // Définir les en-têtes pour le téléchargement
            res.setHeader('Content-Disposition', `attachment; filename="${matchingFiles[0]}"`);
            res.setHeader('Content-Type', 'application/octet-stream');
            
            // Envoyer le fichier
            console.log(`Envoi du fichier par correspondance partielle...`);
            return res.download(matchingFilePath, matchingFiles[0], (err) => {
              if (err) {
                console.error(`Erreur lors de l'envoi du fichier: ${err.message}`);
                if (!res.headersSent) {
                  res.status(500).json({ message: 'Erreur lors du téléchargement du fichier' });
                }
              } else {
                console.log(`Fichier envoyé avec succès: ${matchingFiles[0]}`);
              }
            });
          }
        }
        
        // 4. Si aucun fichier spécifique n'est trouvé, utiliser le fichier le plus récent
        if (files.length > 0) {
          // Trier les fichiers par date de création (du plus récent au plus ancien)
          const sortedFiles = files.map(file => {
            const filePath = path.join(modifiedDir, file);
            const stats = fs.statSync(filePath);
            return { file, stats };
          }).sort((a, b) => b.stats.ctime.getTime() - a.stats.ctime.getTime());
          
          const latestFile = sortedFiles[0].file;
          const latestFilePath = path.join(modifiedDir, latestFile);
          console.log(`Utilisation du fichier le plus récent: ${latestFilePath}`);
          
          // Définir les en-têtes pour le téléchargement
          res.setHeader('Content-Disposition', `attachment; filename="${latestFile}"`);
          res.setHeader('Content-Type', 'application/octet-stream');
          
          // Envoyer le fichier
          console.log(`Envoi du fichier le plus récent...`);
          return res.download(latestFilePath, latestFile, (err) => {
            if (err) {
              console.error(`Erreur lors de l'envoi du fichier: ${err.message}`);
              if (!res.headersSent) {
                res.status(500).json({ message: 'Erreur lors du téléchargement du fichier' });
              }
            } else {
              console.log(`Fichier envoyé avec succès: ${latestFile}`);
            }
          });
        }
      } else {
        console.log(`Répertoire uploads/modified n'existe pas`);
      }
      
      return res.status(404).json({ message: 'Fichier non trouvé sur le serveur' });
    }

    // Extraire le nom du fichier original
    const fileName = path.basename(filePath);
    
    // Définir les en-têtes pour le téléchargement
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    
    // Envoyer le fichier
    console.log(`Envoi du fichier exact en cours...`);
    res.download(filePath, fileName, (err) => {
      if (err) {
        console.error(`Erreur lors de l'envoi du fichier: ${err.message}`);
        // Si l'erreur n'a pas déjà été envoyée au client
        if (!res.headersSent) {
          res.status(500).json({ message: 'Erreur lors du téléchargement du fichier' });
        }
      } else {
        console.log(`Fichier envoyé avec succès: ${fileName}`);
      }
    });
  } catch (err) {
    console.error(`Erreur lors du téléchargement du fichier modifié: ${err.message}`);
    res.status(500).send('Erreur serveur');
  }
});

// @route   GET /api/ecu-files/download-direct-file
// @desc    Télécharger directement un fichier spécifique
// @access  Private
router.get('/download-direct-file', auth, async (req, res) => {
  try {
    console.log('Tentative de téléchargement direct du fichier spécifique');
    
    // Chemin du fichier spécifique
    const specificFilePath = path.join(__dirname, '../uploads/original/1741563488182-BMW_3-serie_2015_(F30-F31-F35-LCI)_18i_(1.5T)_136_hp_Bosch_MEVD17.2.3_OBD_VR lambda off (1).bin');
    console.log(`Tentative avec le chemin spécifique: ${specificFilePath}`);
    
    if (fs.existsSync(specificFilePath)) {
      console.log(`Fichier spécifique trouvé: ${specificFilePath}`);
      
      // Définir les en-têtes pour le téléchargement
      const specificFileName = path.basename(specificFilePath);
      res.setHeader('Content-Disposition', `attachment; filename="${specificFileName}"`);
      res.setHeader('Content-Type', 'application/octet-stream');
      
      // Envoyer le fichier
      console.log(`Envoi du fichier spécifique...`);
      return res.download(specificFilePath, specificFileName, (err) => {
        if (err) {
          console.error(`Erreur lors de l'envoi du fichier spécifique: ${err.message}`);
          // Si l'erreur n'a pas déjà été envoyée au client
          if (!res.headersSent) {
            res.status(500).json({ message: 'Erreur lors du téléchargement du fichier' });
          }
        } else {
          console.log(`Fichier spécifique envoyé avec succès: ${specificFileName}`);
        }
      });
    } else {
      console.log(`Fichier spécifique non trouvé: ${specificFilePath}`);
      return res.status(404).json({ message: 'Fichier spécifique non trouvé sur le serveur' });
    }
  } catch (err) {
    console.error(`Erreur lors du téléchargement du fichier spécifique: ${err.message}`);
    res.status(500).send('Erreur serveur');
  }
});

module.exports = router; 