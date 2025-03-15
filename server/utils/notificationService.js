const Notification = require('../models/Notification');
const User = require('../models/User');
const EcuFile = require('../models/EcuFile');

/**
 * Ajoute une notification à un utilisateur
 * @param {string} userId - ID de l'utilisateur à notifier
 * @param {string} type - Type de notification ('status_update', 'message', 'credit_update', 'file_assignment', 'system')
 * @param {string} message - Message de la notification
 * @param {string} [fileId] - ID du fichier associé (optionnel)
 * @returns {Promise<object>} La notification créée
 */
const addNotification = async (userId, type, message, fileId = null) => {
  try {
    console.log(`DEBUG addNotification - Début: userId=${userId}, type=${type}, fileId=${fileId}`);
    
    // Vérifier que l'utilisateur existe
    const user = await User.findById(userId);
    if (!user) {
      console.error(`Impossible d'ajouter une notification: utilisateur ${userId} non trouvé`);
      return null;
    }
    
    console.log(`DEBUG addNotification - Utilisateur trouvé: ${user.name}, ${user.email}`);

    // Créer la notification
    const newNotification = new Notification({
      user: userId,
      type,
      message,
      fileId,
      read: false,
      createdAt: new Date()
    });

    // Sauvegarder la notification
    await newNotification.save();
    
    console.log(`DEBUG addNotification - Notification créée avec succès: ${newNotification._id}`);
    console.log(`Notification ajoutée pour l'utilisateur ${userId} (${user.name}): ${message}`);
    return newNotification;
  } catch (err) {
    console.error('Erreur lors de l\'ajout d\'une notification:', err);
    return null;
  }
};

/**
 * Notifie les utilisateurs concernés d'un changement de statut d'un fichier
 * @param {string} fileId - ID du fichier ECU
 * @param {string} status - Nouveau statut
 * @param {string} [comment] - Commentaire optionnel expliquant le changement
 */
const notifyFileStatusChange = async (fileId, status, comment = '') => {
  try {
    console.log(`DEBUG notifyFileStatusChange - Début: fileId=${fileId}, status=${status}`);
    
    // Récupérer le fichier
    const file = await EcuFile.findById(fileId)
      .populate('user', 'name email')
      .populate('assignedTo', 'name email');
    
    if (!file) {
      console.error(`Impossible de notifier: fichier ${fileId} non trouvé`);
      return;
    }
    
    console.log(`DEBUG notifyFileStatusChange - Fichier trouvé: ${file._id}, propriétaire=${file.user ? file.user.name : 'non défini'}`);

    // Construire le message selon le statut
    let message = '';
    switch (status) {
      case 'pending':
        message = `Votre demande d'analyse a été bien reçue !`;
        break;
      case 'processing':
      case 'in_progress':
        message = `Votre fichier est en cours d'analyse.`;
        break;
      case 'completed':
        message = `Votre fichier est prêt !`;
        break;
      case 'rejected':
        message = `Votre demande a été rejetée.`;
        break;
      default:
        message = `Le statut de votre fichier a été mis à jour: ${status}.`;
    }

    // Ajouter le commentaire s'il est fourni
    if (comment) {
      message += ` Commentaire: ${comment}`;
    }
    
    console.log(`DEBUG notifyFileStatusChange - Message préparé: ${message}`);

    // Notifier le propriétaire du fichier
    if (file.user && file.user._id) {
      console.log(`DEBUG notifyFileStatusChange - Notification au propriétaire: ${file.user._id}, ${file.user.name}`);
      await addNotification(file.user._id, 'status_update', message, fileId);
    } else {
      console.error(`DEBUG notifyFileStatusChange - Impossible de notifier le propriétaire, données manquantes`);
    }

    // Notifier l'expert assigné si présent
    if (file.assignedTo && file.assignedTo._id) {
      console.log(`DEBUG notifyFileStatusChange - Notification à l'expert: ${file.assignedTo._id}, ${file.assignedTo.name}`);
      let expertMessage = '';
      
      switch (status) {
        case 'pending':
          expertMessage = `Un nouveau fichier est en attente d'analyse.`;
          break;
        case 'processing':
        case 'in_progress':
          expertMessage = `Le fichier est en cours d'analyse.`;
          break;
        case 'completed':
          expertMessage = `L'analyse du fichier est terminée.`;
          break;
        case 'rejected':
          expertMessage = `Le fichier a été rejeté.`;
          break;
        default:
          expertMessage = `Le statut du fichier a été mis à jour: ${status}.`;
      }
      
      await addNotification(file.assignedTo._id, 'status_update', expertMessage, fileId);
    }
    
    console.log(`DEBUG notifyFileStatusChange - Terminé avec succès pour fileId=${fileId}`);
  } catch (err) {
    console.error('Erreur lors de la notification de changement de statut:', err);
  }
};

/**
 * Notifie les utilisateurs concernés d'un nouveau commentaire
 * @param {string} fileId - ID du fichier ECU
 * @param {string} senderId - ID de l'utilisateur qui a envoyé le commentaire
 * @param {string} comment - Contenu du commentaire
 */
const notifyNewComment = async (fileId, senderId, comment) => {
  try {
    // Récupérer le fichier
    const file = await EcuFile.findById(fileId)
      .populate('user', 'name email')
      .populate('assignedTo', 'name email');
    
    if (!file) {
      console.error(`Impossible de notifier: fichier ${fileId} non trouvé`);
      return;
    }

    // Récupérer l'expéditeur
    const sender = await User.findById(senderId);
    if (!sender) {
      console.error(`Impossible de notifier: expéditeur ${senderId} non trouvé`);
      return;
    }

    // Déterminer le nom de l'expéditeur à afficher
    const senderName = sender.role === 'admin' ? 'Administrateur' : sender.role === 'expert' ? 'Expert technique' : sender.name;
    
    // Préparer le message
    const message = `Nouveau commentaire de ${senderName} concernant votre fichier.`;
    
    // Notifier le propriétaire du fichier si ce n'est pas lui qui a commenté
    if (file.user && file.user._id && file.user._id.toString() !== senderId) {
      await addNotification(file.user._id, 'message', message, fileId);
    }

    // Notifier l'expert assigné si ce n'est pas lui qui a commenté
    if (file.assignedTo && file.assignedTo._id && file.assignedTo._id.toString() !== senderId) {
      const expertMessage = `Nouveau commentaire de ${senderName} concernant le fichier assigné.`;
      await addNotification(file.assignedTo._id, 'message', expertMessage, fileId);
    }

    // Si l'expéditeur n'est ni le propriétaire ni l'expert, notifier l'administrateur
    if (sender.role !== 'admin' && (!file.assignedTo || file.assignedTo._id.toString() !== senderId)) {
      // Récupérer tous les administrateurs
      const admins = await User.find({ role: 'admin' });
      
      for (const admin of admins) {
        if (admin._id.toString() !== senderId) {
          const adminMessage = `Nouveau commentaire de ${senderName} sur un fichier.`;
          await addNotification(admin._id, 'message', adminMessage, fileId);
        }
      }
    }
  } catch (err) {
    console.error('Erreur lors de la notification de nouveau commentaire:', err);
  }
};

/**
 * Notifie les utilisateurs concernés de l'assignation d'un fichier
 * @param {string} fileId - ID du fichier ECU
 * @param {string} expertId - ID de l'expert assigné
 * @param {string} assignedBy - ID de l'administrateur qui a fait l'assignation
 */
const notifyFileAssignment = async (fileId, expertId, assignedBy) => {
  try {
    // Récupérer le fichier
    const file = await EcuFile.findById(fileId).populate('user', 'name _id');
    
    if (!file) {
      console.error(`Impossible de notifier: fichier ${fileId} non trouvé`);
      return;
    }

    // Récupérer les informations sur l'admin
    const admin = await User.findById(assignedBy, 'name');
    if (!admin) {
      console.error(`Impossible de notifier: administrateur ${assignedBy} non trouvé`);
      return;
    }

    // Notifier l'expert
    const expertMessage = `Vous avez été assigné au fichier "${file.originalName}" par ${admin.name}.`;
    await addNotification(expertId, 'file_assignment', expertMessage, fileId);

    // Notifier le propriétaire du fichier
    const ownerMessage = `Un expert a été assigné à votre fichier "${file.originalName}".`;
    await addNotification(file.user._id, 'file_assignment', ownerMessage, fileId);
  } catch (err) {
    console.error('Erreur lors de la notification d\'assignation de fichier:', err);
  }
};

/**
 * Notifie les administrateurs lorsqu'un nouveau fichier est uploadé
 * @param {string} fileId - ID du fichier ECU qui vient d'être uploadé
 */
const notifyNewFileUpload = async (fileId) => {
  try {
    console.log(`DEBUG notifyNewFileUpload - Début: fileId=${fileId}`);
    
    // Récupérer le fichier
    const file = await EcuFile.findById(fileId).populate('user', 'name email');
    
    if (!file) {
      console.error(`Impossible de notifier: fichier ${fileId} non trouvé`);
      return;
    }
    
    console.log(`DEBUG notifyNewFileUpload - Fichier trouvé: ${file._id}, propriétaire=${file.user ? file.user.name : 'non défini'}`);

    // Récupérer tous les administrateurs
    const admins = await User.find({ role: 'admin' });
    
    if (admins.length === 0) {
      console.error(`Aucun administrateur trouvé pour envoyer la notification`);
      return;
    }
    
    // Créer le message de notification
    const message = `Un nouveau fichier a été soumis par ${file.user.name}.`;
    
    // Notifier tous les administrateurs
    for (const admin of admins) {
      console.log(`DEBUG notifyNewFileUpload - Notification à l'administrateur: ${admin._id}, ${admin.name}`);
      await addNotification(admin._id, 'new_file', message, fileId);
    }
    
    console.log(`DEBUG notifyNewFileUpload - Terminé avec succès pour fileId=${fileId}`);
  } catch (err) {
    console.error('Erreur lors de la notification de nouvel upload de fichier:', err);
  }
};

module.exports = {
  addNotification,
  notifyFileStatusChange,
  notifyNewComment,
  notifyFileAssignment,
  notifyNewFileUpload
}; 