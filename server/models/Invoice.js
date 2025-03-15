const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const InvoiceSchema = new Schema({
  // Utilisateur associé à la facture
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  
  // Numéro de facture (généré automatiquement)
  invoiceNumber: {
    type: String,
    required: true,
    unique: true
  },
  
  // Date de création de la facture
  date: {
    type: Date,
    default: Date.now
  },
  
  // Date d'échéance de la facture
  dueDate: {
    type: Date,
    required: true
  },
  
  // Informations de facturation de l'utilisateur
  billingInfo: {
    name: {
      type: String
    },
    vatNumber: {
      type: String
    },
    address: {
      type: String
    },
    city: {
      type: String
    },
    postalCode: {
      type: String
    },
    country: {
      type: String
    }
  },
  
  // Produits/services achetés (items de ligne)
  items: [
    {
      description: {
        type: String,
        required: true
      },
      quantity: {
        type: Number,
        required: true
      },
      unitPrice: {
        type: Number,
        required: true
      },
      total: {
        type: Number,
        required: true
      }
    }
  ],
  
  // Sous-total de la facture
  subtotal: {
    type: Number,
    required: true
  },
  
  // Taxe de la facture
  tax: {
    type: Number,
    default: 0
  },
  
  // Montant total de la facture
  total: {
    type: Number,
    required: true
  },
  
  // Statut de la facture (payée, en attente, annulée)
  status: {
    type: String,
    enum: ['payé', 'en attente', 'annulé'],
    default: 'en attente'
  },
  
  // Méthode de paiement
  paymentMethod: {
    type: String,
    enum: ['carte', 'virement', 'paypal'],
    required: true
  },
  
  // Notes associées à la facture
  notes: {
    type: String
  },
  
  // Champs pour le suivi et l'audit
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Méthode pour générer le numéro de facture automatiquement
InvoiceSchema.statics.generateInvoiceNumber = async function() {
  const currentYear = new Date().getFullYear();
  
  // Trouver la dernière facture pour obtenir le dernier numéro séquentiel
  const lastInvoice = await this.findOne({
    invoiceNumber: { $regex: `FACT-${currentYear}-` }
  }).sort({ invoiceNumber: -1 });
  
  let sequentialNumber = 1;
  
  if (lastInvoice) {
    // Extraire le numéro séquentiel de la dernière facture
    const lastNumber = lastInvoice.invoiceNumber.split('-')[2];
    sequentialNumber = parseInt(lastNumber, 10) + 1;
  }
  
  // Formater le numéro séquentiel avec des zéros à gauche (ex: 001, 002, etc.)
  const paddedNumber = String(sequentialNumber).padStart(3, '0');
  
  // Retourner le numéro de facture complet
  return `FACT-${currentYear}-${paddedNumber}`;
};

// Avant de sauvegarder, générer le numéro de facture si nécessaire
InvoiceSchema.pre('save', async function(next) {
  // Si c'est une nouvelle facture sans numéro
  if (this.isNew && !this.invoiceNumber) {
    this.invoiceNumber = await this.constructor.generateInvoiceNumber();
  }
  
  // Mettre à jour le champ updatedAt
  this.updatedAt = Date.now();
  
  next();
});

module.exports = mongoose.model('invoice', InvoiceSchema); 