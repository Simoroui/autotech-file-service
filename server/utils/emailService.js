const nodemailer = require('nodemailer');
const User = require('../models/User');

// Créer un transporteur pour l'envoi d'emails
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/**
 * Envoie un email de notification pour un changement de statut de fichier
 * @param {Object} ecuFile - Le fichier ECU
 * @param {String} status - Le nouveau statut
 * @param {String} comment - Commentaire optionnel
 */
const sendStatusUpdateEmail = async (ecuFile, status, comment = '') => {
  try {
    // Récupérer l'utilisateur
    const user = await User.findById(ecuFile.user);
    
    // Vérifier si l'utilisateur existe et s'il a activé les notifications de statut
    if (!user || !user.notificationPreferences.fileStatusUpdates) {
      return;
    }
    
    // Préparer le contenu de l'email
    let statusText = '';
    let subject = '';
    
    switch (status) {
      case 'pending':
        statusText = 'en attente de traitement';
        subject = 'Votre fichier a été reçu';
        break;
      case 'processing':
        statusText = 'en cours de traitement';
        subject = 'Traitement de votre fichier en cours';
        break;
      case 'completed':
        statusText = 'traité avec succès';
        subject = 'Votre fichier est prêt à être téléchargé';
        break;
      default:
        statusText = 'mis à jour';
        subject = 'Mise à jour de votre fichier';
    }
    
    // Construire le corps de l'email
    const vehicleInfo = `${ecuFile.vehicleInfo.manufacturer} ${ecuFile.vehicleInfo.model} ${ecuFile.vehicleInfo.year} ${ecuFile.vehicleInfo.engine}`;
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: `AutoTech File Service - ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #d9534f;">AutoTech File Service</h1>
          </div>
          
          <p>Bonjour ${user.name},</p>
          
          <p>Votre fichier pour <strong>${vehicleInfo}</strong> est maintenant <strong>${statusText}</strong>.</p>
          
          ${comment ? `<p><strong>Commentaire:</strong> ${comment}</p>` : ''}
          
          ${status === 'completed' ? `
          <p>Votre fichier modifié est maintenant prêt à être téléchargé. Connectez-vous à votre compte pour le récupérer.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard" style="background-color: #d9534f; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Accéder à mon tableau de bord
            </a>
          </div>
          ` : ''}
          
          <p>Merci de faire confiance à AutoTech File Service pour l'optimisation de votre véhicule.</p>
          
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
          
          <p style="font-size: 12px; color: #777;">
            Vous recevez cet email car vous avez activé les notifications pour les mises à jour de statut de vos fichiers.
            Pour modifier vos préférences de notification, accédez à votre profil dans l'application.
          </p>
        </div>
      `
    };
    
    // Envoyer l'email
    await transporter.sendMail(mailOptions);
    
    // Enregistrer la notification dans le fichier ECU
    ecuFile.notifications.push({
      type: 'status_update',
      message: `Statut mis à jour: ${statusText}`,
      sent: true,
      sentAt: new Date()
    });
    
    await ecuFile.save();
    
    console.log(`Email de notification envoyé à ${user.email} pour le fichier ${ecuFile._id}`);
    
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email de notification:', error);
    return false;
  }
};

/**
 * Envoie un email de notification pour un nouveau commentaire
 * @param {Object} ecuFile - Le fichier ECU
 * @param {String} comment - Le commentaire
 * @param {String} author - L'auteur du commentaire (nom ou rôle)
 */
const sendCommentNotificationEmail = async (ecuFile, comment, author) => {
  try {
    // Récupérer l'utilisateur
    const user = await User.findById(ecuFile.user);
    
    // Vérifier si l'utilisateur existe et s'il a activé les notifications
    if (!user || !user.notificationPreferences.fileStatusUpdates) {
      return;
    }
    
    const vehicleInfo = `${ecuFile.vehicleInfo.manufacturer} ${ecuFile.vehicleInfo.model} ${ecuFile.vehicleInfo.year} ${ecuFile.vehicleInfo.engine}`;
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: `AutoTech File Service - Nouveau commentaire sur votre fichier`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #d9534f;">AutoTech File Service</h1>
          </div>
          
          <p>Bonjour ${user.name},</p>
          
          <p>Un nouveau commentaire a été ajouté à votre fichier pour <strong>${vehicleInfo}</strong>.</p>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0;"><strong>${author}:</strong> ${comment}</p>
          </div>
          
          <p>Connectez-vous à votre compte pour répondre ou voir plus de détails.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/files/${ecuFile._id}" style="background-color: #d9534f; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Voir les détails du fichier
            </a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
          
          <p style="font-size: 12px; color: #777;">
            Vous recevez cet email car vous avez activé les notifications pour les mises à jour de vos fichiers.
            Pour modifier vos préférences de notification, accédez à votre profil dans l'application.
          </p>
        </div>
      `
    };
    
    // Envoyer l'email
    await transporter.sendMail(mailOptions);
    
    // Enregistrer la notification dans le fichier ECU
    ecuFile.notifications.push({
      type: 'comment',
      message: `Nouveau commentaire de ${author}`,
      sent: true,
      sentAt: new Date()
    });
    
    await ecuFile.save();
    
    console.log(`Email de notification de commentaire envoyé à ${user.email} pour le fichier ${ecuFile._id}`);
    
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email de notification de commentaire:', error);
    return false;
  }
};

/**
 * Envoie un email de résumé quotidien ou hebdomadaire des mises à jour
 * @param {String} userId - ID de l'utilisateur
 * @param {String} frequency - Fréquence ('daily' ou 'weekly')
 */
const sendSummaryEmail = async (userId, frequency) => {
  try {
    // Récupérer l'utilisateur
    const user = await User.findById(userId);
    
    // Vérifier si l'utilisateur existe et si la fréquence correspond à ses préférences
    if (!user || user.notificationPreferences.emailFrequency !== frequency) {
      return;
    }
    
    // Déterminer la période de temps pour le résumé
    const now = new Date();
    let startDate;
    
    if (frequency === 'daily') {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 1);
    } else if (frequency === 'weekly') {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
    } else {
      return;
    }
    
    // Récupérer les fichiers mis à jour pendant cette période
    const updatedFiles = await EcuFile.find({
      user: userId,
      updatedAt: { $gte: startDate }
    }).sort({ updatedAt: -1 });
    
    // S'il n'y a pas de fichiers mis à jour, ne pas envoyer d'email
    if (updatedFiles.length === 0) {
      return;
    }
    
    // Construire le contenu de l'email
    let filesHtml = '';
    
    updatedFiles.forEach(file => {
      const vehicleInfo = `${file.vehicleInfo.manufacturer} ${file.vehicleInfo.model} ${file.vehicleInfo.year} ${file.vehicleInfo.engine}`;
      const statusText = file.status === 'pending' ? 'En attente' : file.status === 'processing' ? 'En cours' : 'Terminé';
      const statusColor = file.status === 'pending' ? '#ffc107' : file.status === 'processing' ? '#17a2b8' : '#28a745';
      
      filesHtml += `
        <div style="margin-bottom: 15px; padding: 15px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <p><strong>Véhicule:</strong> ${vehicleInfo}</p>
          <p><strong>Statut:</strong> <span style="color: ${statusColor};">${statusText}</span></p>
          <p><strong>Dernière mise à jour:</strong> ${new Date(file.updatedAt).toLocaleString('fr-FR')}</p>
          <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/files/${file._id}" style="color: #d9534f;">Voir les détails</a>
        </div>
      `;
    });
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: `AutoTech File Service - Résumé ${frequency === 'daily' ? 'quotidien' : 'hebdomadaire'} de vos fichiers`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #d9534f;">AutoTech File Service</h1>
          </div>
          
          <p>Bonjour ${user.name},</p>
          
          <p>Voici un résumé des mises à jour de vos fichiers ${frequency === 'daily' ? 'des dernières 24 heures' : 'de la semaine dernière'} :</p>
          
          <div style="margin: 20px 0;">
            ${filesHtml}
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard" style="background-color: #d9534f; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Accéder à mon tableau de bord
            </a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
          
          <p style="font-size: 12px; color: #777;">
            Vous recevez cet email car vous avez choisi de recevoir des résumés ${frequency === 'daily' ? 'quotidiens' : 'hebdomadaires'} des mises à jour de vos fichiers.
            Pour modifier vos préférences de notification, accédez à votre profil dans l'application.
          </p>
        </div>
      `
    };
    
    // Envoyer l'email
    await transporter.sendMail(mailOptions);
    
    console.log(`Email de résumé ${frequency} envoyé à ${user.email}`);
    
    return true;
  } catch (error) {
    console.error(`Erreur lors de l'envoi de l'email de résumé ${frequency}:`, error);
    return false;
  }
};

module.exports = {
  sendStatusUpdateEmail,
  sendCommentNotificationEmail,
  sendSummaryEmail
}; 