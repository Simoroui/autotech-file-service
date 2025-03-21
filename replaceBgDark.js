const fs = require('fs');
const path = require('path');

// Fonction pour parcourir récursivement les répertoires et trouver les fichiers JS
function findJsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !filePath.includes('node_modules')) {
      fileList = findJsFiles(filePath, fileList);
    } else if (path.extname(file) === '.js') {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Fonction pour remplacer bg-dark par bg-light et text-white par text-dark
function replaceInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Comptez les occurrences avant le remplacement
    const bgDarkCount = (content.match(/bg-dark/g) || []).length;
    const textWhiteCount = (content.match(/text-white/g) || []).length;
    const variantDarkCount = (content.match(/variant="dark"/g) || []).length;
    
    // Si nous avons trouvé des occurrences, effectuez le remplacement
    if (bgDarkCount > 0 || textWhiteCount > 0 || variantDarkCount > 0) {
      content = content.replace(/bg-dark/g, 'bg-light');
      content = content.replace(/text-white/g, 'text-dark');
      content = content.replace(/variant="dark"/g, 'variant="light"');
      
      // Écrire le fichier modifié
      fs.writeFileSync(filePath, content, 'utf8');
      
      console.log(`${filePath}: Remplacé ${bgDarkCount} "bg-dark", ${textWhiteCount} "text-white", ${variantDarkCount} 'variant="dark"'`);
      return { bgDarkCount, textWhiteCount, variantDarkCount };
    }
  } catch (error) {
    console.error(`Erreur lors du traitement du fichier ${filePath}:`, error);
  }
  
  return { bgDarkCount: 0, textWhiteCount: 0, variantDarkCount: 0 };
}

// Répertoire de base
const baseDir = path.join(__dirname, 'client/src');

// Trouver tous les fichiers JS récursivement
console.log('Recherche des fichiers JS...');
const jsFiles = findJsFiles(baseDir);
console.log(`${jsFiles.length} fichiers JS trouvés.`);

// Statistiques globales
let totalBgDark = 0;
let totalTextWhite = 0;
let totalVariantDark = 0;
let modifiedFiles = 0;

// Traiter chaque fichier
jsFiles.forEach(filePath => {
  const { bgDarkCount, textWhiteCount, variantDarkCount } = replaceInFile(filePath);
  
  if (bgDarkCount > 0 || textWhiteCount > 0 || variantDarkCount > 0) {
    modifiedFiles++;
    totalBgDark += bgDarkCount;
    totalTextWhite += textWhiteCount;
    totalVariantDark += variantDarkCount;
  }
});

// Afficher les statistiques finales
console.log('\nStatistiques de remplacement:');
console.log(`Total des remplacements: ${totalBgDark + totalTextWhite + totalVariantDark}`);
console.log(`- bg-dark → bg-light: ${totalBgDark}`);
console.log(`- text-white → text-dark: ${totalTextWhite}`);
console.log(`- variant="dark" → variant="light": ${totalVariantDark}`);
console.log(`Fichiers modifiés: ${modifiedFiles} sur ${jsFiles.length}`);
console.log('\nConversion du mode sombre au mode clair terminée!'); 