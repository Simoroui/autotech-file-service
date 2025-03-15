const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Définition du schéma utilisateur
const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  username: {
    type: String,
    unique: true,
    sparse: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'expert', 'admin'],
    default: 'user'
  },
  date: {
    type: Date,
    default: Date.now
  },
  notifications: [
    {
      message: String,
      type: String,
      fileId: mongoose.Schema.Types.ObjectId,
      date: {
        type: Date,
        default: Date.now
      },
      read: {
        type: Boolean,
        default: false
      }
    }
  ]
});

// Enregistrer le modèle
const User = mongoose.model('User', UserSchema);

async function createAdmin() {
  try {
    console.log('Tentative de connexion à MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/autotech');
    console.log('Connecté à MongoDB');

    // Vérifier si l'utilisateur admin existe déjà
    const existingUser = await User.findOne({ email: 'autotechtunis@gmail.com' });
    if (existingUser) {
      console.log('Un utilisateur admin existe déjà avec cet email');
      console.log('Détails de l\'utilisateur:', existingUser);
      process.exit(0);
    }

    // Générer un hash du mot de passe
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('123456', salt);

    // Créer un nouvel utilisateur admin
    const newAdmin = new User({
      name: 'ROUISSI Moncer',
      email: 'autotechtunis@gmail.com',
      username: 'rouissi',
      password: hashedPassword,
      role: 'admin'
    });

    // Sauvegarder l'utilisateur dans la base de données
    await newAdmin.save();
    console.log('Utilisateur administrateur créé avec succès:');
    console.log({
      name: newAdmin.name,
      email: newAdmin.email,
      username: newAdmin.username,
      role: newAdmin.role,
      id: newAdmin._id
    });
    
    console.log('\nVous pouvez vous connecter avec:');
    console.log('Email: autotechtunis@gmail.com');
    console.log('Mot de passe: 123456');

  } catch (err) {
    console.error('Erreur lors de la création de l\'utilisateur admin:', err);
  } finally {
    mongoose.disconnect();
    console.log('Déconnecté de MongoDB');
  }
}

createAdmin(); 