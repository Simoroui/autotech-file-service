# Autotech File Service

Une plateforme pour la gestion de fichiers ECU pour l'automobile avec système de facturation.

## Fonctionnalités

- Authentification des utilisateurs (connexion, inscription)
- Gestion de profil utilisateur avec photo
- Téléchargement et traitement de fichiers ECU
- Système de notification
- Tableau de bord pour visualiser l'historique des fichiers
- Interface administrateur pour gérer les fichiers et les utilisateurs
- Système de crédits pour les téléchargements
- Gestion complète des factures (génération, visualisation, téléchargement PDF)
- Détails de facturation dans le profil utilisateur

## Technologies utilisées

### Frontend
- React
- React Bootstrap
- Context API pour la gestion d'état
- Axios pour les requêtes HTTP

### Backend
- Node.js
- Express
- MongoDB avec Mongoose
- JWT pour l'authentification
- Multer pour la gestion des fichiers
- PDFKit pour la génération de factures

## Installation

### Prérequis
- Node.js
- MongoDB

### Installation du backend
```bash
cd server
npm install
```

### Installation du frontend
```bash
cd client
npm install
```

## Configuration

Créez un fichier `.env` dans le dossier `server` avec les variables suivantes :
```
MONGO_URI=votre_uri_mongodb
JWT_SECRET=votre_jwt_secret
```

## Démarrage

### Backend
```bash
cd server
npm start
```

### Frontend
```bash
cd client
npm start
```

Le frontend sera accessible à l'adresse : http://localhost:3000
L'API backend sera accessible à l'adresse : http://localhost:5000

## Déploiement

### Frontend
Construire la version de production :
```bash
cd client
npm run build
```

### Backend
Le backend est configuré pour servir les fichiers statiques du frontend en production. 