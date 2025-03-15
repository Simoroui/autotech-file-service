const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const CreditTransaction = require('../models/CreditTransaction');
const Invoice = require('../models/Invoice');
const { check, validationResult } = require('express-validator');

/**
 * @route   POST api/credits/purchase
 * @desc    Acheter des crédits et générer une facture
 * @access  Private
 */
router.post(
  '/purchase',
  [
    auth,
    check('creditAmount', 'Le montant de crédits est requis').isInt({ min: 1 }),
    check('paymentMethod', 'La méthode de paiement est requise').notEmpty(),
    check('billingInfo', 'Les informations de facturation sont requises').isObject()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { creditAmount, paymentMethod, billingInfo } = req.body;

    try {
      // Récupérer l'utilisateur
      const user = await User.findById(req.user.id);
      
      if (!user) {
        return res.status(404).json({ msg: 'Utilisateur non trouvé' });
      }

      // Calculer le montant en euros (ex: 1 crédit = 1 euro)
      const amountInEuros = creditAmount;
      
      // Détails des articles achetés
      const items = [
        {
          description: 'Achat de crédits',
          quantity: creditAmount,
          unitPrice: 1, // 1 euro par crédit
          total: amountInEuros
        }
      ];

      // Création de la facture
      const invoice = new Invoice({
        user: req.user.id,
        invoiceNumber: 'INV-' + Date.now(),
        date: Date.now(),
        dueDate: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 jours
        billingInfo,
        items,
        subtotal: amountInEuros,
        total: amountInEuros,
        status: 'payé', // Supposer que le paiement est validé immédiatement
        paymentMethod
      });

      await invoice.save();

      // Mise à jour des crédits de l'utilisateur
      user.credits += creditAmount;
      await user.save();

      return res.json({ 
        invoice,
        credits: user.credits,
        msg: 'Achat réussi! Vos crédits ont été ajoutés à votre compte.'
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Erreur serveur');
    }
  }
);

/**
 * @route   GET api/credits/balance
 * @desc    Obtenir le solde de crédits d'un utilisateur
 * @access  Private
 */
router.get('/balance', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('credits');
    
    if (!user) {
      return res.status(404).json({ msg: 'Utilisateur non trouvé' });
    }

    res.json({ credits: user.credits });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erreur serveur');
  }
});

// @route   GET /api/credits/transactions
// @desc    Obtenir l'historique des transactions de crédits
// @access  Private
router.get('/transactions', auth, async (req, res) => {
  try {
    const transactions = await CreditTransaction.find({ user: req.user.id })
      .sort({ createdAt: -1 });
    
    res.json(transactions);
  } catch (err) {
    console.error('Erreur lors de la récupération des transactions:', err.message);
    res.status(500).json({ msg: 'Erreur serveur' });
  }
});

module.exports = router; 