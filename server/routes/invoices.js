const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Invoice = require('../models/Invoice');
const PDFDocument = require('pdfkit');

/**
 * @route   GET api/invoices
 * @desc    Récupérer toutes les factures de l'utilisateur connecté
 * @access  Private
 */
router.get('/', auth, async (req, res) => {
  try {
    const invoices = await Invoice.find({ user: req.user.id })
      .sort({ date: -1 });
    
    res.json(invoices);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erreur serveur');
  }
});

/**
 * @route   GET api/invoices/:id
 * @desc    Récupérer une facture spécifique par ID
 * @access  Private
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({ msg: 'Facture non trouvée' });
    }

    // Vérifier que l'utilisateur a le droit d'accéder à cette facture
    if (invoice.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ msg: 'Non autorisé' });
    }

    res.json(invoice);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Facture non trouvée' });
    }
    res.status(500).send('Erreur serveur');
  }
});

/**
 * @route   GET api/invoices/:id/download
 * @desc    Télécharger une facture en PDF
 * @access  Private
 */
router.get('/:id/download', auth, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('user', 'name email');
    
    if (!invoice) {
      return res.status(404).json({ msg: 'Facture non trouvée' });
    }

    // Vérifier que l'utilisateur a le droit d'accéder à cette facture
    if (invoice.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ msg: 'Non autorisé' });
    }

    // Créer un PDF
    const doc = new PDFDocument({ margin: 50 });
    
    // Définir les en-têtes pour le téléchargement
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=facture-${invoice.invoiceNumber}.pdf`);
    
    // Pipe le PDF vers la réponse HTTP
    doc.pipe(res);
    
    // Ajouter le contenu au PDF
    doc.fontSize(20).text('FACTURE', { align: 'center' });
    doc.moveDown();
    
    // Informations de l'entreprise
    doc.fontSize(12).text('Auto Tech Services', { align: 'left' });
    doc.fontSize(10).text('123 Rue de la Technologie', { align: 'left' });
    doc.text('75000 Paris, France', { align: 'left' });
    doc.text('TVA: FR12345678901', { align: 'left' });
    doc.moveDown();
    
    // Informations de facturation
    doc.fontSize(12).text('Facturé à:', { align: 'left' });
    if (invoice.billingInfo) {
      doc.fontSize(10).text(`${invoice.billingInfo.name || invoice.user.name}`, { align: 'left' });
      if (invoice.billingInfo.vatNumber) doc.text(`TVA: ${invoice.billingInfo.vatNumber}`, { align: 'left' });
      if (invoice.billingInfo.address) doc.text(invoice.billingInfo.address, { align: 'left' });
      if (invoice.billingInfo.city && invoice.billingInfo.postalCode) {
        doc.text(`${invoice.billingInfo.postalCode} ${invoice.billingInfo.city}`, { align: 'left' });
      }
      if (invoice.billingInfo.country) doc.text(invoice.billingInfo.country, { align: 'left' });
    } else {
      doc.fontSize(10).text(`${invoice.user.name}`, { align: 'left' });
      doc.text(`${invoice.user.email}`, { align: 'left' });
    }
    doc.moveDown();
    
    // Informations de la facture
    doc.fontSize(12).text(`Facture N°: ${invoice.invoiceNumber}`, { align: 'right' });
    doc.fontSize(10).text(`Date: ${new Date(invoice.date).toLocaleDateString('fr-FR')}`, { align: 'right' });
    doc.text(`Échéance: ${new Date(invoice.dueDate).toLocaleDateString('fr-FR')}`, { align: 'right' });
    doc.text(`Statut: ${invoice.status}`, { align: 'right' });
    doc.moveDown();
    
    // Tableau des articles
    doc.fontSize(12).text('Détails', { align: 'left' });
    doc.moveDown(0.5);
    
    // En-têtes du tableau
    let y = doc.y;
    doc.fontSize(10).text('Description', 50, y);
    doc.text('Quantité', 250, y);
    doc.text('Prix unitaire', 320, y);
    doc.text('Total', 450, y);
    
    // Ligne de séparation
    y += 15;
    doc.moveTo(50, y).lineTo(550, y).stroke();
    
    // Articles
    y += 10;
    invoice.items.forEach(item => {
      doc.fontSize(10).text(item.description, 50, y);
      doc.text(item.quantity.toString(), 250, y);
      doc.text(`${item.unitPrice.toFixed(2)} €`, 320, y);
      doc.text(`${item.total.toFixed(2)} €`, 450, y);
      y += 20;
    });
    
    // Ligne de séparation
    doc.moveTo(50, y).lineTo(550, y).stroke();
    y += 10;
    
    // Total
    doc.fontSize(10).text('Total:', 350, y);
    doc.text(`${invoice.total.toFixed(2)} €`, 450, y);
    
    // Méthode de paiement
    y += 40;
    doc.fontSize(10).text(`Méthode de paiement: ${invoice.paymentMethod}`, 50, y);
    
    // Note de remerciement
    y += 40;
    doc.fontSize(10).text('Merci pour votre confiance!', 50, y);
    
    // Finaliser le PDF
    doc.end();
    
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Facture non trouvée' });
    }
    res.status(500).send('Erreur serveur');
  }
});

module.exports = router; 