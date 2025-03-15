const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// Fonction utilitaire pour lire le fichier CSV
const readCsvFile = () => {
  return new Promise((resolve, reject) => {
    const results = [];
    const csvFilePath = path.join(__dirname, '../data/vehicules.csv');

    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (data) => {
        // Vérifier que les données sont correctement lues
        if (results.length === 0) {
          console.log('Premier élément du CSV:', data);
          console.log('Noms des colonnes:', Object.keys(data));
        }
        results.push(data);
      })
      .on('end', () => {
        console.log(`Nombre total d'éléments lus: ${results.length}`);
        // Afficher quelques exemples pour déboguer
        if (results.length > 0) {
          console.log('Exemple d\'élément 1:', results[0]);
          console.log('Exemple d\'élément 2:', results[1]);
          console.log('Exemple d\'élément 3:', results[2]);
        }
        resolve(results);
      })
      .on('error', (error) => reject(error));
  });
};

// @route   GET /api/vehicle-data
// @desc    Récupérer toutes les données des véhicules
// @access  Public
router.get('/', async (req, res) => {
  try {
    const results = await readCsvFile();
    res.json(results);
  } catch (err) {
    console.error('Erreur lors de la lecture du fichier CSV:', err);
    res.status(500).json({ message: 'Erreur lors de la lecture des données des véhicules' });
  }
});

// @route   GET /api/vehicle-data/types
// @desc    Récupérer les types de véhicules uniques
// @access  Public
router.get('/types', async (req, res) => {
  try {
    // Retourner directement les types de véhicules prédéfinis
    const vehicleTypes = ['Voiture', 'Moto', 'Quad', 'Agricole & Engin', 'Camion', 'Jetski'];
    console.log('Types de véhicules:', vehicleTypes);
    
    res.json(vehicleTypes);
  } catch (err) {
    console.error('Erreur lors de la lecture du fichier CSV:', err);
    res.status(500).json({ message: 'Erreur lors de la lecture des données des véhicules' });
  }
});

// @route   GET /api/vehicle-data/manufacturers
// @desc    Récupérer les constructeurs uniques pour un type de véhicule donné
// @access  Public
router.get('/manufacturers', async (req, res) => {
  try {
    const results = await readCsvFile();
    const vehicleType = req.query.type;
    
    console.log('Type de véhicule demandé:', vehicleType);
    
    // Si un type de véhicule est spécifié, filtrer par ce type
    let filteredResults = results;
    if (vehicleType) {
      console.log('Avant filtrage:', results.length, 'éléments');
      filteredResults = results.filter(item => {
        const itemType = item['Type véhicule'];
        console.log('Type de véhicule dans l\'élément:', itemType, 'Correspond:', itemType === vehicleType);
        return itemType === vehicleType;
      });
      console.log('Après filtrage:', filteredResults.length, 'éléments');
    }
    
    // Extraire les constructeurs uniques
    const manufacturers = [...new Set(filteredResults.map(item => item.Constructeur))].filter(Boolean).sort();
    console.log(`Constructeurs pour ${vehicleType || 'tous les types'}:`, manufacturers.length);
    
    res.json(manufacturers);
  } catch (err) {
    console.error('Erreur lors de la lecture du fichier CSV:', err);
    res.status(500).json({ message: 'Erreur lors de la lecture des données des véhicules' });
  }
});

// @route   GET /api/vehicle-data/models/:manufacturer
// @desc    Récupérer les modèles uniques pour un constructeur donné
// @access  Public
router.get('/models/:manufacturer', async (req, res) => {
  try {
    const results = await readCsvFile();
    const manufacturer = decodeURIComponent(req.params.manufacturer);
    const vehicleType = req.query.type ? decodeURIComponent(req.query.type) : null;

    console.log('Constructeur demandé:', manufacturer);
    console.log('Type de véhicule demandé:', vehicleType);

    // Filtrer par constructeur
    console.log('Avant filtrage par constructeur:', results.length, 'éléments');
    let filteredResults = results.filter(item => item.Constructeur === manufacturer);
    console.log('Après filtrage par constructeur:', filteredResults.length, 'éléments');
    
    // Afficher quelques exemples des résultats filtrés
    if (filteredResults.length > 0) {
      console.log('Exemple de résultat filtré 1:', filteredResults[0]);
      console.log('Propriétés disponibles:', Object.keys(filteredResults[0]));
    }
    
    // Filtrer par type de véhicule si spécifié
    if (vehicleType) {
      console.log('Avant filtrage par type de véhicule:', filteredResults.length, 'éléments');
      filteredResults = filteredResults.filter(item => {
        const itemType = item['Type véhicule'];
        return itemType === vehicleType;
      });
      console.log('Après filtrage par type de véhicule:', filteredResults.length, 'éléments');
    }

    // Extraire les modèles uniques
    const models = [...new Set(
      filteredResults.map(item => {
        console.log('Item pour extraction de modèle:', item);
        return item.Modèle || item.Modele;
      })
    )].filter(Boolean).sort();
    
    console.log(`Modèles pour ${manufacturer} (${vehicleType || 'tous types'})`, models.length, 'modèles trouvés');
    console.log('Modèles trouvés:', models);
    
    res.json(models);
  } catch (err) {
    console.error('Erreur lors de la lecture du fichier CSV:', err);
    res.status(500).json({ message: 'Erreur lors de la lecture des données des véhicules' });
  }
});

// @route   GET /api/vehicle-data/years/:manufacturer/:model
// @desc    Récupérer les années uniques pour un constructeur et un modèle donnés
// @access  Public
router.get('/years/:manufacturer/:model', async (req, res) => {
  try {
    const results = await readCsvFile();
    const manufacturer = decodeURIComponent(req.params.manufacturer);
    const model = decodeURIComponent(req.params.model);
    const vehicleType = req.query.type ? decodeURIComponent(req.query.type) : null;

    console.log('Constructeur demandé:', manufacturer);
    console.log('Modèle demandé:', model);
    console.log('Type de véhicule demandé:', vehicleType);

    // Filtrer par constructeur et modèle
    console.log('Avant filtrage par constructeur et modèle:', results.length, 'éléments');
    let filteredResults = results.filter(item => 
      item.Constructeur === manufacturer && 
      (item.Modèle === model || item.Modele === model)
    );
    console.log('Après filtrage par constructeur et modèle:', filteredResults.length, 'éléments');
    
    // Afficher quelques exemples des résultats filtrés
    if (filteredResults.length > 0) {
      console.log('Exemple de résultat filtré 1:', filteredResults[0]);
      console.log('Propriétés disponibles:', Object.keys(filteredResults[0]));
    }
    
    // Filtrer par type de véhicule si spécifié
    if (vehicleType) {
      console.log('Avant filtrage par type de véhicule:', filteredResults.length, 'éléments');
      filteredResults = filteredResults.filter(item => {
        const itemType = item['Type véhicule'];
        return itemType === vehicleType;
      });
      console.log('Après filtrage par type de véhicule:', filteredResults.length, 'éléments');
    }

    // Extraire les années uniques
    const years = [...new Set(
      filteredResults.map(item => item.Année || item.Annee)
    )].filter(Boolean).sort();
    
    console.log(`Années pour ${manufacturer} ${model} (${vehicleType || 'tous types'})`, years.length, 'années trouvées');
    console.log('Années trouvées:', years);
    
    res.json(years);
  } catch (err) {
    console.error('Erreur lors de la lecture du fichier CSV:', err);
    res.status(500).json({ message: 'Erreur lors de la lecture des données des véhicules' });
  }
});

// @route   GET /api/vehicle-data/engines/:manufacturer/:model/:year
// @desc    Récupérer les moteurs uniques pour un constructeur, un modèle et une année donnés
// @access  Public
router.get('/engines/:manufacturer/:model/:year', async (req, res) => {
  try {
    const results = await readCsvFile();
    const manufacturer = decodeURIComponent(req.params.manufacturer);
    const model = decodeURIComponent(req.params.model);
    const year = decodeURIComponent(req.params.year);
    const vehicleType = req.query.type ? decodeURIComponent(req.query.type) : null;

    console.log('Constructeur demandé:', manufacturer);
    console.log('Modèle demandé:', model);
    console.log('Année demandée:', year);
    console.log('Type de véhicule demandé:', vehicleType);

    // Filtrer par constructeur, modèle et année
    console.log('Avant filtrage par constructeur, modèle et année:', results.length, 'éléments');
    let filteredResults = results.filter(item => 
      item.Constructeur === manufacturer && 
      (item.Modèle === model || item.Modele === model) && 
      (item.Année === year || item.Annee === year)
    );
    console.log('Après filtrage par constructeur, modèle et année:', filteredResults.length, 'éléments');
    
    // Afficher quelques exemples des résultats filtrés
    if (filteredResults.length > 0) {
      console.log('Exemple de résultat filtré 1:', filteredResults[0]);
      console.log('Propriétés disponibles:', Object.keys(filteredResults[0]));
    } else {
      console.log('Aucun résultat trouvé pour les critères spécifiés');
    }
    
    // Filtrer par type de véhicule si spécifié
    if (vehicleType) {
      console.log('Avant filtrage par type de véhicule:', filteredResults.length, 'éléments');
      filteredResults = filteredResults.filter(item => {
        const itemType = item['Type véhicule'];
        return itemType === vehicleType;
      });
      console.log('Après filtrage par type de véhicule:', filteredResults.length, 'éléments');
    }

    // Extraire les moteurs uniques
    const engines = [...new Set(
      filteredResults.map(item => item.Moteur)
    )].filter(Boolean).sort();
    
    console.log(`Moteurs pour ${manufacturer} ${model} ${year} (${vehicleType || 'tous types'})`, engines.length, 'moteurs trouvés');
    console.log('Moteurs trouvés:', engines);
    
    res.json(engines);
  } catch (err) {
    console.error('Erreur lors de la lecture du fichier CSV:', err);
    res.status(500).json({ message: 'Erreur lors de la lecture des données des véhicules' });
  }
});

// @route   GET /api/vehicle-data/transmissions/:manufacturer/:model/:year/:engine
// @desc    Récupérer les transmissions uniques pour un constructeur, un modèle, une année et un moteur donnés
// @access  Public
router.get('/transmissions/:manufacturer/:model/:year/:engine', async (req, res) => {
  try {
    // Décoder les paramètres d'URL (même si nous ne les utilisons pas dans cette route)
    const manufacturer = decodeURIComponent(req.params.manufacturer);
    const model = decodeURIComponent(req.params.model);
    const year = decodeURIComponent(req.params.year);
    const engine = decodeURIComponent(req.params.engine);
    
    console.log('Paramètres décodés:', { manufacturer, model, year, engine });
    
    // Retourner directement les deux types de transmission
    const transmissions = ['Automatique', 'Manuelle'];
    console.log('Transmissions disponibles:', transmissions);
    
    res.json(transmissions);
  } catch (err) {
    console.error('Erreur lors de la lecture du fichier CSV:', err);
    res.status(500).json({ message: 'Erreur lors de la lecture des données des véhicules' });
  }
});

module.exports = router; 