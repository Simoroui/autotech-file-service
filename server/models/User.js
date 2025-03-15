const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'expert'],
    default: 'user'
  },
  credits: {
    type: Number,
    default: 0
  },
  notifications: [
    {
      type: {
        type: String,
        enum: ['status_update', 'message', 'credit_update', 'file_assignment', 'system'],
        required: true
      },
      message: {
        type: String,
        required: true
      },
      fileId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ecuFile'
      },
      createdAt: {
        type: Date,
        default: Date.now
      },
      read: {
        type: Boolean,
        default: false
      }
    }
  ],
  notificationPreferences: {
    fileStatusUpdates: {
      type: Boolean,
      default: true
    },
    newFeatures: {
      type: Boolean,
      default: true
    },
    promotions: {
      type: Boolean,
      default: false
    },
    emailFrequency: {
      type: String,
      enum: ['immediate', 'daily', 'weekly'],
      default: 'immediate'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  photoUrl: {
    type: String,
    default: null
  }
});

// Méthode pour hacher le mot de passe avant de sauvegarder
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Méthode pour comparer les mots de passe
UserSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    console.log('Comparaison de mot de passe pour:', this.email);
    console.log('Mot de passe candidat reçu:', candidatePassword ? 'Présent' : 'Absent');
    console.log('Mot de passe hashé stocké:', this.password ? 'Présent' : 'Absent');
    
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    console.log('Résultat de la comparaison:', isMatch);
    return isMatch;
  } catch (err) {
    console.error('Erreur lors de la comparaison des mots de passe:', err.message);
    return false;
  }
};

module.exports = mongoose.model('user', UserSchema); 