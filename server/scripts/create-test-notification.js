const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const User = require('../models/User');

async function createTestNotification() {
  try {
    console.log('Connexion à MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/autotech');
    console.log('Connecté à MongoDB');

    // Trouver les utilisateurs
    const users = await User.find({}, '_id name role');
    
    if (users.length === 0) {
      console.log('Aucun utilisateur trouvé dans la base de données');
      return;
    }

    console.log('Utilisateurs disponibles:');
    users.forEach(user => {
      console.log(`- ID: ${user._id}, Nom: ${user.name}, Rôle: ${user.role}`);
    });

    // Créer une notification pour chaque utilisateur
    for (const user of users) {
      const newNotification = new Notification({
        user: user._id,
        message: `Notification de test pour ${user.name}`,
        type: 'system',
        read: false,
        createdAt: new Date()
      });

      await newNotification.save();
      console.log(`Notification créée pour ${user.name} (${user._id})`);
    }

    // Vérifier les notifications créées
    const count = await Notification.countDocuments();
    console.log(`Nombre total de notifications après création: ${count}`);

  } catch (err) {
    console.error('Erreur:', err);
  } finally {
    mongoose.disconnect();
    console.log('Déconnecté de MongoDB');
  }
}

createTestNotification(); 