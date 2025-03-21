const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const mongoose = require('mongoose');
const User = require('./models/User');
const { sendSummaryEmail } = require('./utils/emailService');
const fs = require('fs');

// Charger les variables d'environnement
try {
  const dotenvResult = dotenv.config();
  if (dotenvResult.error) {
    console.log('Erreur lors du chargement de .env, utilisation des variables d\'environnement système');
  } else {
    console.log('Chargement de .env: Succès');
  }
} catch (error) {
  console.log('Exception lors du chargement de .env, utilisation des variables d\'environnement système');
}

// Vérifier et définir les variables d'environnement critiques
if (!process.env.JWT_SECRET) {
  console.log('JWT_SECRET non défini ou vide, utilisation de la valeur par défaut');
  process.env.JWT_SECRET = 'autotech_secret_key_2024';
} else {
  console.log('JWT_SECRET est défini');
}

// Initialiser l'application Express
const app = express();

// Configuration CORS plus permissive
const corsOptions = {
  origin: '*', // Permet toutes les origines
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-auth-token', 'Authorization'],
  credentials: true
};

// Middleware
app.use(cors(corsOptions));
console.log('CORS configuré avec options permissives:', corsOptions);

app.use(express.json({ extended: false }));
app.use(express.urlencoded({ extended: true }));

// Servir les fichiers statiques du répertoire uploads avec des options spécifiques
app.use('/uploads', (req, res, next) => {
  console.log(`Accès au fichier statique: ${req.path}`);
  next();
}, express.static(path.join(__dirname, 'uploads')));

// Configurer des routes spécifiques pour les différents types de fichiers
app.use('/uploads/original', express.static(path.join(__dirname, 'uploads/original'), {
  setHeaders: (res, path, stat) => {
    console.log(`Accès au fichier original: ${path}`);
    res.set('Content-Type', 'application/octet-stream');
    res.set('Content-Disposition', `attachment; filename="${path.split('/').pop()}"`);
  }
}));

app.use('/uploads/modified', express.static(path.join(__dirname, 'uploads/modified'), {
  setHeaders: (res, path, stat) => {
    console.log(`Accès au fichier modifié: ${path}`);
    res.set('Content-Type', 'application/octet-stream');
    res.set('Content-Disposition', `attachment; filename="${path.split('/').pop()}"`);
  }
}));

// Pour les images, servir normalement avec le bon type MIME
app.use('/uploads/images', express.static(path.join(__dirname, 'uploads/images')));

// Pour les photos de profil
app.use('/uploads/profile-photos', express.static(path.join(__dirname, 'uploads/profile-photos')));

// Servir les fichiers statiques du répertoire public
app.use('/public', express.static(path.join(__dirname, 'public')));

// En production, servir les fichiers statiques du build React
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, '../client/build');
  
  // Vérifier si le répertoire client/build existe
  try {
    if (fs.existsSync(clientBuildPath)) {
      console.log(`Répertoire client/build trouvé: ${clientBuildPath}`);
      
      // Servir les fichiers statiques du dossier build
      app.use(express.static(clientBuildPath));
      
      // Pour toutes les routes non-API, renvoyer index.html
      app.get('*', (req, res, next) => {
        // Ne pas intercepter les routes API
        if (!req.path.startsWith('/api/') && !req.path.startsWith('/uploads/')) {
          const indexHtmlPath = path.resolve(clientBuildPath, 'index.html');
          
          if (fs.existsSync(indexHtmlPath)) {
            res.sendFile(indexHtmlPath);
          } else {
            console.error(`Fichier index.html non trouvé: ${indexHtmlPath}`);
            res.status(404).send('Fichier index.html non trouvé');
          }
        } else {
          next();
        }
      });
      
      console.log('Configuration pour la production activée');
    } else {
      console.error(`Répertoire client/build non trouvé: ${clientBuildPath}`);
      console.log('Fonctionnement en mode API uniquement (sans interface utilisateur)');
    }
  } catch (err) {
    console.error(`Erreur lors de la vérification du répertoire client/build: ${err.message}`);
    console.log('Fonctionnement en mode API uniquement (sans interface utilisateur)');
  }
}

// Connexion à MongoDB
console.log('Tentative de connexion à MongoDB avec URI:', process.env.MONGO_URI ? `${process.env.MONGO_URI.substring(0, 25)}...` : 'non définie');
try {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI non définie dans les variables d\'environnement');
    console.log('Utilisation d\'une URI par défaut pour le développement local');
    process.env.MONGO_URI = 'mongodb://localhost:27017/autotech-file-service';
  }
  
  const mongoOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000
  };
  
  mongoose.connect(process.env.MONGO_URI, mongoOptions)
    .then(() => {
      console.log('MongoDB connecté avec succès');
      
      // Initialiser les services qui dépendent de la base de données
      if (process.env.NODE_ENV === 'production') {
        // Planification des emails récapitulatifs
        console.log('Planification des emails récapitulatifs configurée');
        scheduleEmailSummaries();
      }
    })
    .catch(err => {
      console.error('Erreur de connexion à MongoDB:', err.message);
      if (err.message.includes('bad auth') || err.message.includes('authentication failed')) {
        console.error('Problème d\'authentification MongoDB. Vérifiez vos identifiants.');
      }
      console.log('Le serveur continue à fonctionner pour les tests.');
    });
} catch (err) {
  console.error('Exception lors de la connexion à MongoDB:', err.message);
  console.log('Le serveur continue à fonctionner pour les tests.');
}

// Définir les routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/ecu-files', require('./routes/ecuFiles'));
app.use('/api/vehicle-data', require('./routes/vehicleData'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/credits', require('./routes/credits'));
app.use('/api/invoices', require('./routes/invoices'));
app.use('/api/admin/invoices', require('./routes/admin/invoices'));

// Log pour vérifier que les routes sont bien enregistrées
console.log('Routes enregistrées:');
console.log('- /api/auth');
console.log('- /api/users');
console.log('- /api/ecu-files');
console.log('- /api/vehicle-data');
console.log('- /api/admin (incluant /api/admin/files/:id/send-to-client)');
console.log('- /api/notifications');
console.log('- /api/credits');
console.log('- /api/invoices');
console.log('- /api/admin/invoices');

// Ajout d'une route de test spécifique pour le problème d'envoi au client
app.post('/api/test-client-send/:id', (req, res) => {
  console.log('Route test-client-send accédée avec ID:', req.params.id);
  console.log('Corps de la requête:', req.body);
  console.log('Headers:', req.headers);
  
  res.json({
    message: 'Route de test accédée avec succès',
    id: req.params.id,
    requestBody: req.body
  });
});

// Route spéciale pour télécharger directement un fichier
app.get('/download-file', (req, res) => {
  try {
    console.log('Tentative de téléchargement direct');
    
    // Utiliser un fichier spécifique pour tester
    const filePath = path.join(__dirname, 'uploads/original/1741550186954-BMW_3-serie_2015_(F30-F31-F35-LCI)_18i_(1.5T)_136_hp_Bosch_MEVD17.2.3_OBD_VR lambda off (1).bin');
    console.log(`Chemin du fichier: ${filePath}`);
    
    // Vérifier si le fichier existe
    if (!fs.existsSync(filePath)) {
      console.log(`Fichier non trouvé: ${filePath}`);
      return res.status(404).send('Fichier non trouvé');
    }
    
    console.log(`Fichier trouvé, envoi en cours: ${filePath}`);
    
    // Définir les en-têtes pour le téléchargement
    const filename = path.basename(filePath);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    
    // Envoyer le fichier
    res.sendFile(filePath);
  } catch (err) {
    console.error(`Erreur lors du téléchargement direct: ${err.message}`);
    res.status(500).send('Erreur serveur');
  }
});

// Route de base
app.get('/api', (req, res) => {
  res.json({ message: 'Bienvenue sur l\'API Autotech File Service' });
});

// Route pour lister tous les fichiers disponibles
app.get('/files-list', (req, res) => {
  try {
    console.log('Listing des fichiers disponibles');
    
    const uploadsDir = path.join(__dirname, 'uploads/original');
    
    // Vérifier si le répertoire existe
    if (!fs.existsSync(uploadsDir)) {
      console.log(`Répertoire non trouvé: ${uploadsDir}`);
      return res.status(404).send('Répertoire non trouvé');
    }
    
    // Lire le contenu du répertoire
    const files = fs.readdirSync(uploadsDir);
    console.log(`Fichiers trouvés: ${files.length}`);
    
    // Créer une page HTML avec la liste des fichiers
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Liste des fichiers disponibles</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #333; }
          ul { list-style-type: none; padding: 0; }
          li { margin: 10px 0; padding: 10px; border: 1px solid #ddd; border-radius: 4px; }
          a { color: #0066cc; text-decoration: none; }
          a:hover { text-decoration: underline; }
        </style>
      </head>
      <body>
        <h1>Liste des fichiers disponibles</h1>
        <ul>
    `;
    
    files.forEach(file => {
      html += `<li><a href="/download-specific/${encodeURIComponent(file)}">${file}</a></li>`;
    });
    
    html += `
        </ul>
      </body>
      </html>
    `;
    
    res.send(html);
  } catch (err) {
    console.error(`Erreur lors du listing des fichiers: ${err.message}`);
    res.status(500).send('Erreur serveur');
  }
});

// Route pour télécharger un fichier spécifique
app.get('/download-specific/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    console.log(`Tentative de téléchargement du fichier spécifique: ${filename}`);
    
    const filePath = path.join(__dirname, 'uploads/original', filename);
    console.log(`Chemin du fichier: ${filePath}`);
    
    // Vérifier si le fichier existe
    if (!fs.existsSync(filePath)) {
      console.log(`Fichier non trouvé: ${filePath}`);
      return res.status(404).send('Fichier non trouvé');
    }
    
    console.log(`Fichier trouvé, envoi en cours: ${filePath}`);
    
    // Définir les en-têtes pour le téléchargement
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    
    // Envoyer le fichier
    res.sendFile(filePath);
  } catch (err) {
    console.error(`Erreur lors du téléchargement du fichier spécifique: ${err.message}`);
    res.status(500).send('Erreur serveur');
  }
});

// Planification des tâches pour les emails récapitulatifs
const scheduleEmailSummaries = async () => {
  try {
    // Fonction pour envoyer les résumés quotidiens
    const sendDailySummaries = async () => {
      console.log('Envoi des résumés quotidiens...');
      const users = await User.find({
        'notificationPreferences.emailFrequency': 'daily',
        'notificationPreferences.fileStatusUpdates': true
      });
      
      for (const user of users) {
        await sendSummaryEmail(user._id, 'daily');
      }
    };
    
    // Fonction pour envoyer les résumés hebdomadaires
    const sendWeeklySummaries = async () => {
      console.log('Envoi des résumés hebdomadaires...');
      const users = await User.find({
        'notificationPreferences.emailFrequency': 'weekly',
        'notificationPreferences.fileStatusUpdates': true
      });
      
      for (const user of users) {
        await sendSummaryEmail(user._id, 'weekly');
      }
    };
    
    // Planifier l'envoi des résumés quotidiens (à minuit)
    const scheduleDailySummaries = () => {
      const now = new Date();
      const night = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1, // demain
        0, 0, 0 // minuit
      );
      
      const timeToMidnight = night.getTime() - now.getTime();
      
      setTimeout(() => {
        sendDailySummaries();
        // Planifier le prochain envoi dans 24 heures
        setInterval(sendDailySummaries, 24 * 60 * 60 * 1000);
      }, timeToMidnight);
    };
    
    // Planifier l'envoi des résumés hebdomadaires (le dimanche à minuit)
    const scheduleWeeklySummaries = () => {
      const now = new Date();
      const daysUntilSunday = 7 - now.getDay();
      const nextSunday = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + daysUntilSunday,
        0, 0, 0 // minuit
      );
      
      const timeToSunday = nextSunday.getTime() - now.getTime();
      
      setTimeout(() => {
        sendWeeklySummaries();
        // Planifier le prochain envoi dans 7 jours
        setInterval(sendWeeklySummaries, 7 * 24 * 60 * 60 * 1000);
      }, timeToSunday);
    };
    
    // Démarrer la planification
    scheduleDailySummaries();
    scheduleWeeklySummaries();
    
    console.log('Planification des emails récapitulatifs configurée');
  } catch (error) {
    console.error('Erreur lors de la planification des emails récapitulatifs:', error);
  }
};

// Définir le port
const PORT = process.env.PORT || 5000;

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`Serveur en cours d'exécution sur le port ${PORT}`);
});

module.exports = app; 