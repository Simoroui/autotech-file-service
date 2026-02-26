const fs = require('fs');
const path = require('path');

// Fonction pour nettoyer les noms de dossiers
function cleanFolderName(name) {
    return name
        .replace(/[<>:"\/\\|?*\.]/g, '') // Supprime les caractères interdits
        .replace(/\s*->\s*/g, '-')     // Remplace les flèches par des tirets
        .replace(/\s+/g, '_')          // Remplace les espaces par des underscores
        .replace(/_{2,}/g, '_')        // Remplace les underscores multiples par un seul
        .replace(/^-+|-+$/g, '')       // Supprime les tirets au début et à la fin
        .replace(/-+$/, '')            // Supprime les tirets à la fin
        .replace(/_+$/, '')            // Supprime les underscores à la fin
        .trim();                        // Supprime les espaces début/fin
}

// Script pour créer la structure des dossiers
function createFolderStructure() {
    try {
        // Lire le contenu du CSV
        const csvContent = fs.readFileSync('data/marques.csv', 'utf-8');
        const lines = csvContent.split('\n');

        // Créer les dossiers principaux
        const vehiclesDir = path.join('images', 'vehicles');
        const slideshowDir = path.join('images', 'slideshow');
        
        [vehiclesDir, slideshowDir].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });

        // Set pour éviter les doublons
        const folderStructure = new Set();

        // Parcourir chaque ligne du CSV (en ignorant l'en-tête)
        for (let i = 1; i < lines.length; i++) {
            const columns = lines[i].split(',');
            if (columns.length >= 3) {
                const brand = cleanFolderName(columns[0].trim().toLowerCase());
                const model = cleanFolderName(columns[1].trim().toLowerCase());
                const version = cleanFolderName(columns[2].trim().toLowerCase());

                // Chemins pour vehicles et slideshow
                const vehiclePath = path.join(vehiclesDir, brand, model, version);
                const slideshowPath = path.join(slideshowDir, brand, model, version);
                
                folderStructure.add(vehiclePath);
                folderStructure.add(slideshowPath);
            }
        }

        // Créer tous les dossiers et ajouter .gitkeep
        folderStructure.forEach(folderPath => {
            if (!fs.existsSync(folderPath)) {
                fs.mkdirSync(folderPath, { recursive: true });
                fs.writeFileSync(path.join(folderPath, '.gitkeep'), '');
                console.log(`Dossier créé : ${folderPath}`);
            }
        });

        console.log('Structure des dossiers créée avec succès !');

    } catch (error) {
        console.error('Erreur lors de la création des dossiers:', error);
    }
}

// Exécuter la fonction
createFolderStructure(); 