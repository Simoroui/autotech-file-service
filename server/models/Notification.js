const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['status_update', 'message', 'credit_update', 'file_assignment', 'system', 'new_file'],
    default: 'system'
  },
  read: {
    type: Boolean,
    default: false
  },
  fileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EcuFile',
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index pour trier par date et pour les requêtes par utilisateur
NotificationSchema.index({ createdAt: -1 });
NotificationSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', NotificationSchema); 