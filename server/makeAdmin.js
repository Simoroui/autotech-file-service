const mongoose = require('mongoose');
const User = require('./models/User');

// Connexion à la base de données
mongoose.connect('mongodb://localhost:27017/autotech-file-service', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connexion à MongoDB réussie'))
.catch(err => console.error('Erreur de connexion à MongoDB:', err));

async function makeAdmin() {
  try {
    // Rechercher l'utilisateur par son nom
    const userName = 'ROUISSI Moncer';
    
    const user = await User.findOneAndUpdate(
      { name: userName },
      { role: 'admin' },
      { new: true }
    );
    
    if (user) {
      console.log(`L'utilisateur ${user.name} (${user.email}) est maintenant administrateur.`);
      console.log('Voici ses informations complètes:', user);
    } else {
      console.log(`Aucun utilisateur trouvé avec le nom "${userName}".`);
      
      // Chercher tous les utilisateurs pour aider au débogage
      const allUsers = await User.find({}, 'name email role');
      console.log('Utilisateurs disponibles dans la base de données:');
      console.log(allUsers);
    }
  } catch (err) {
    console.error('Erreur:', err);
  } finally {
    // Fermer la connexion à la base de données
    mongoose.disconnect();
    console.log('Connexion à MongoDB fermée');
  }
}

// Exécuter la fonction
makeAdmin(); 