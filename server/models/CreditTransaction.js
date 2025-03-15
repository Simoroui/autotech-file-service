const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CreditTransactionSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['purchase', 'usage', 'refund', 'admin_adjustment'],
    required: true
  },
  description: {
    type: String
  },
  relatedFile: {
    type: Schema.Types.ObjectId,
    ref: 'ecuFile',
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index pour les requêtes fréquentes
CreditTransactionSchema.index({ user: 1, createdAt: -1 });
CreditTransactionSchema.index({ createdAt: -1 });

module.exports = mongoose.model('creditTransaction', CreditTransactionSchema); 