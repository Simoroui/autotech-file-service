const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Crée un PDF de facture à partir des données de la facture
 * @param {Object} invoice - L'objet facture de la base de données
 * @param {Object} companyInfo - Les informations de l'entreprise
 * @returns {Promise<Buffer>} - Le buffer du PDF généré
 */
const createInvoicePDF = (invoice, companyInfo) => {
  return new Promise((resolve, reject) => {
    try {
      // Créer un nouveau document PDF
      const doc = new PDFDocument({ margin: 50 });
      
      // Tableau pour stocker les chunks du PDF
      const chunks = [];
      
      // Écouter les données générées
      doc.on('data', chunk => chunks.push(chunk));
      
      // Résoudre la promesse lorsque le document est terminé
      doc.on('end', () => {
        const result = Buffer.concat(chunks);
        resolve(result);
      });
      
      // Gérer les erreurs
      doc.on('error', err => reject(err));
      
      // Ajouter le contenu au PDF
      doc.fontSize(20).text('FACTURE', { align: 'center' });
      doc.moveDown();
      
      // Informations de l'entreprise
      doc.fontSize(12).text(companyInfo.name, { align: 'left' });
      doc.fontSize(10).text(companyInfo.address, { align: 'left' });
      doc.text(`${companyInfo.postalCode} ${companyInfo.city}, ${companyInfo.country}`, { align: 'left' });
      doc.text(`Téléphone: ${companyInfo.phone}`, { align: 'left' });
      doc.text(`Email: ${companyInfo.email}`, { align: 'left' });
      doc.text(`Site web: ${companyInfo.website}`, { align: 'left' });
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
      if (invoice.dueDate) {
        doc.text(`Échéance: ${new Date(invoice.dueDate).toLocaleDateString('fr-FR')}`, { align: 'right' });
      }
      doc.text(`Statut: ${formatStatus(invoice.status)}`, { align: 'right' });
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
        doc.fontSize(10).text(item.description || item.name, 50, y);
        doc.text(item.quantity.toString(), 250, y);
        doc.text(`${(item.unitPrice || item.price).toFixed(2)} €`, 320, y);
        doc.text(`${item.total.toFixed(2)} €`, 450, y);
        y += 20;
      });
      
      // Ligne de séparation
      doc.moveTo(50, y).lineTo(550, y).stroke();
      y += 10;
      
      // Total
      doc.fontSize(10).text('Total:', 350, y);
      doc.text(`${(invoice.total || invoice.amount).toFixed(2)} €`, 450, y);
      
      // Méthode de paiement
      y += 40;
      doc.fontSize(10).text(`Méthode de paiement: ${formatPaymentMethod(invoice.paymentMethod)}`, 50, y);
      
      // Note de remerciement
      y += 40;
      doc.fontSize(10).text('Merci pour votre confiance!', 50, y);
      
      // Finaliser le PDF
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Formate le statut de la facture
 * @param {string} status - Le statut à formater
 * @returns {string} - Le statut formaté
 */
const formatStatus = (status) => {
  switch (status) {
    case 'paid':
      return 'Payée';
    case 'pending':
      return 'En attente';
    case 'cancelled':
      return 'Annulée';
    case 'payé':
      return 'Payée';
    case 'en attente':
      return 'En attente';
    case 'annulé':
      return 'Annulée';
    default:
      return status;
  }
};

/**
 * Formate la méthode de paiement
 * @param {string} method - La méthode à formater
 * @returns {string} - La méthode formatée
 */
const formatPaymentMethod = (method) => {
  switch (method) {
    case 'card':
    case 'carte':
      return 'Carte bancaire';
    case 'paypal':
      return 'PayPal';
    case 'transfer':
    case 'virement':
      return 'Virement bancaire';
    default:
      return method;
  }
};

module.exports = {
  createInvoicePDF
}; 