const mongoose = require('mongoose');
const Notification = require('../models/Notification');

async function checkNotifications() {
  try {
    console.log('Connexion à MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/autotech');
    console.log('Connecté à MongoDB');

    // Compter les notifications
    const count = await Notification.countDocuments();
    console.log(`Nombre total de notifications: ${count}`);

    // Récupérer quelques notifications pour vérification
    if (count > 0) {
      const notifications = await Notification.find().limit(5);
      console.log('Exemples de notifications:');
      notifications.forEach(notification => {
        console.log(`- ID: ${notification._id}`);
        console.log(`  User: ${notification.user}`);
        console.log(`  Message: ${notification.message}`);
        console.log(`  Type: ${notification.type}`);
        console.log(`  Lu: ${notification.read}`);
        console.log(`  Date: ${notification.createdAt}`);
        console.log('---');
      });
    }

  } catch (err) {
    console.error('Erreur:', err);
  } finally {
    mongoose.disconnect();
    console.log('Déconnecté de MongoDB');
  }
}

checkNotifications(); 