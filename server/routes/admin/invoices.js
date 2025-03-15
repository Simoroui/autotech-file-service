const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const admin = require('../../middleware/admin');
const Invoice = require('../../models/Invoice');
const User = require('../../models/User');
const { createInvoicePDF } = require('../../utils/pdfGenerator');
const createCsvStringifier = require('csv-writer').createObjectCsvStringifier;

/**
 * @route   GET api/admin/invoices
 * @desc    Récupérer toutes les factures (admin seulement)
 * @access  Admin
 */
router.get('/', [auth, admin], async (req, res) => {
  try {
    const invoices = await Invoice.find()
      .populate('user', 'name email')
      .sort({ date: -1 });
    
    res.json(invoices);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erreur serveur');
  }
});

/**
 * @route   GET api/admin/invoices/stats
 * @desc    Récupérer les statistiques des factures (admin seulement)
 * @access  Admin
 */
router.get('/stats', [auth, admin], async (req, res) => {
  try {
    // Nombre total de factures
    const totalInvoices = await Invoice.countDocuments();
    
    // Nombre de factures payées
    const paidInvoices = await Invoice.countDocuments({ status: 'payé' });
    
    // Nombre de factures en attente
    const pendingInvoices = await Invoice.countDocuments({ status: 'en attente' });
    
    // Montant total des factures payées
    const paidInvoicesData = await Invoice.find({ status: 'payé' });
    const totalRevenue = paidInvoicesData.reduce((total, invoice) => total + invoice.total, 0);
    
    // Montant total des factures en attente
    const pendingInvoicesData = await Invoice.find({ status: 'en attente' });
    const pendingRevenue = pendingInvoicesData.reduce((total, invoice) => total + invoice.total, 0);
    
    res.json({
      totalInvoices,
      paidInvoices,
      pendingInvoices,
      totalRevenue,
      pendingRevenue
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erreur serveur');
  }
});

/**
 * @route   GET api/admin/invoices/clients
 * @desc    Récupérer la liste des clients avec factures (admin seulement)
 * @access  Admin
 */
router.get('/clients', [auth, admin], async (req, res) => {
  try {
    const users = await User.find({ role: 'client' })
      .select('name email');
    
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erreur serveur');
  }
});

/**
 * @route   GET api/admin/invoices/client/:userId
 * @desc    Récupérer les factures d'un client spécifique (admin seulement)
 * @access  Admin
 */
router.get('/client/:userId', [auth, admin], async (req, res) => {
  try {
    const invoices = await Invoice.find({ user: req.params.userId })
      .populate('user', 'name email')
      .sort({ date: -1 });
    
    res.json(invoices);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erreur serveur');
  }
});

/**
 * @route   PUT api/admin/invoices/:id/status
 * @desc    Mettre à jour le statut d'une facture (admin seulement)
 * @access  Admin
 */
router.put('/:id/status', [auth, admin], async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ msg: 'Le statut est requis' });
    }
    
    if (!['payé', 'en attente', 'annulé'].includes(status)) {
      return res.status(400).json({ msg: 'Statut invalide' });
    }
    
    const invoice = await Invoice.findById(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({ msg: 'Facture non trouvée' });
    }
    
    // Si la facture passe de "en attente" à "payé", ajouter les crédits à l'utilisateur
    if (invoice.status !== 'payé' && status === 'payé') {
      const creditAmount = invoice.items.reduce((total, item) => {
        if (item.description.toLowerCase().includes('crédit')) {
          return total + item.quantity;
        }
        return total;
      }, 0);
      
      if (creditAmount > 0) {
        const user = await User.findById(invoice.user);
        if (user) {
          user.credits += creditAmount;
          await user.save();
        }
      }
    }
    
    // Si la facture passe de "payé" à un autre statut, retirer les crédits à l'utilisateur
    if (invoice.status === 'payé' && status !== 'payé') {
      const creditAmount = invoice.items.reduce((total, item) => {
        if (item.description.toLowerCase().includes('crédit')) {
          return total + item.quantity;
        }
        return total;
      }, 0);
      
      if (creditAmount > 0) {
        const user = await User.findById(invoice.user);
        if (user && user.credits >= creditAmount) {
          user.credits -= creditAmount;
          await user.save();
        }
      }
    }
    
    invoice.status = status;
    await invoice.save();
    
    res.json(invoice);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erreur serveur');
  }
});

// @route   GET /api/admin/invoices/:id
// @desc    Récupérer une facture spécifique (administrateur)
// @access  Admin
router.get('/:id', [auth, admin], async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ 
      invoiceNumber: req.params.id
    }).populate('user', 'name email');
    
    if (!invoice) {
      return res.status(404).json({ msg: 'Facture non trouvée' });
    }
    
    // Transformer la facture pour correspondre au format attendu par le frontend
    const formattedInvoice = {
      id: invoice.invoiceNumber,
      date: invoice.date,
      amount: invoice.amount,
      status: invoice.status,
      items: invoice.items,
      paymentMethod: invoice.paymentMethod,
      userId: invoice.user._id,
      userName: invoice.user.name,
      userEmail: invoice.user.email,
      billingInfo: invoice.billingInfo
    };
    
    res.json(formattedInvoice);
  } catch (err) {
    console.error('Erreur lors de la récupération de la facture admin:', err.message);
    res.status(500).send('Erreur serveur');
  }
});

// @route   GET /api/admin/invoices/:id/download
// @desc    Télécharger une facture au format PDF (administrateur)
// @access  Admin
router.get('/:id/download', [auth, admin], async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ 
      invoiceNumber: req.params.id
    }).populate('user', 'name email billingInfo');
    
    if (!invoice) {
      return res.status(404).json({ msg: 'Facture non trouvée' });
    }
    
    // Récupérer les informations de la société
    const companyInfo = {
      name: 'Autotech Tuning',
      address: 'Rue de Tunis',
      city: 'Tunis',
      postalCode: '1000',
      country: 'Tunisie',
      phone: '+216 50720660',
      email: 'contact@autotech-tuning.tn',
      website: 'www.autotech-tuning.tn',
      logo: 'logo.png'
    };
    
    // Créer le PDF de la facture
    const pdfBuffer = await createInvoicePDF(invoice, companyInfo);
    
    // En-têtes pour le téléchargement du PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="facture-${invoice.invoiceNumber}.pdf"`);
    
    // Envoyer le PDF
    res.send(pdfBuffer);
  } catch (err) {
    console.error('Erreur lors de la génération du PDF de la facture:', err.message);
    res.status(500).send('Erreur serveur');
  }
});

// @route   GET /api/admin/invoices/export
// @desc    Exporter toutes les factures au format CSV
// @access  Admin
router.get('/export', [auth, admin], async (req, res) => {
  try {
    // Récupérer toutes les factures avec les informations des utilisateurs
    const invoices = await Invoice.find()
      .populate('user', 'name email')
      .sort({ date: -1 });
    
    // Préparer les données pour le CSV
    const csvData = invoices.map(invoice => ({
      'N° Facture': invoice.invoiceNumber,
      'Date': new Date(invoice.date).toLocaleDateString('fr-FR'),
      'Client': invoice.user.name,
      'Email': invoice.user.email,
      'Montant (DT ht)': invoice.amount,
      'Statut': invoice.status === 'paid' ? 'Payée' : (invoice.status === 'pending' ? 'En attente' : 'Annulée'),
      'Méthode de paiement': invoice.paymentMethod === 'card' ? 'Carte bancaire' : 
                              (invoice.paymentMethod === 'paypal' ? 'PayPal' : 'Virement bancaire'),
      'Crédits achetés': invoice.creditsAmount
    }));
    
    // Créer le CSV
    const csvStringifier = createCsvStringifier({
      header: [
        { id: 'N° Facture', title: 'N° Facture' },
        { id: 'Date', title: 'Date' },
        { id: 'Client', title: 'Client' },
        { id: 'Email', title: 'Email' },
        { id: 'Montant (DT ht)', title: 'Montant (DT ht)' },
        { id: 'Statut', title: 'Statut' },
        { id: 'Méthode de paiement', title: 'Méthode de paiement' },
        { id: 'Crédits achetés', title: 'Crédits achetés' }
      ]
    });
    
    const csvContent = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(csvData);
    
    // En-têtes pour le téléchargement du CSV
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="export-factures-${new Date().toISOString().slice(0, 10)}.csv"`);
    
    // Envoyer le CSV
    res.send(csvContent);
  } catch (err) {
    console.error('Erreur lors de l\'exportation des factures:', err.message);
    res.status(500).send('Erreur serveur');
  }
});

module.exports = router; 