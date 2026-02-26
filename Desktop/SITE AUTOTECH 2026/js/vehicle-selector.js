// Test simple pour vérifier que le script est chargé
console.log('Script chargé');

// Fonction pour tester le chargement du fichier
async function testFileAccess() {
    try {
        const response = await fetch('data/marques.csv');
        console.log('Statut de la réponse:', response.status);
        const text = await response.text();
        console.log('Contenu du fichier (premiers 100 caractères):', text.substring(0, 100));
        return text;
    } catch (error) {
        console.error('Erreur d\'accès au fichier:', error);
        return null;
    }
}

// Fonction pour parser le contenu
function parseCSV(text) {
    const lines = text.split('\n');
    return lines;
}

// Fonction pour extraire les marques
function extractBrands(lines) {
    const brands = {
        cars: new Set(),
        motorcycles: new Set(),
        jetski: new Set(),
        quad: new Set(),
        trucks: new Set(),
        agricultural: new Set()
    };
    
    const typeMapping = {
        'VOITURE': 'cars',
        'Voiture': 'cars',
        'MOTO': 'motorcycles',
        'Moto': 'motorcycles',
        'JETSKI': 'jetski',
        'Jetski': 'jetski',
        'QUAD': 'quad',
        'Quad': 'quad',
        'CAMION': 'trucks',
        'Camion': 'trucks',
        'AGRICOLE & ENGIN': 'agricultural',
        'Agricole & Engin': 'agricultural',
        'agricole & engin': 'agricultural'
    };
    
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const columns = line.split(',');
        const brand = columns[0].trim();
        const rawType = columns[columns.length - 1].trim();
        
        const type = typeMapping[rawType];
        if (type && brands[type]) {
            brands[type].add(brand);
        }
    }
    
    const result = {};
    Object.entries(brands).forEach(([key, set]) => {
        result[key] = Array.from(set).map(name => ({
            name: name,
            logo: getLogoPath(name)
        }));
    });
    
    return result;
}

// Fonction pour obtenir le chemin des images selon l'environnement
function getImagePath(brand, model, version) {
    const isGitHubPages = window.location.hostname === 'simoroui.github.io';
    const cleanBrand = cleanFolderName(brand.toLowerCase());
    const cleanModel = cleanFolderName(model.toLowerCase());
    const cleanVersion = cleanFolderName(version.toLowerCase());
    
    return isGitHubPages 
        ? `https://simoroui.github.io/autotech-reprog/images/slideshow/${cleanBrand}/${cleanModel}/${cleanVersion}`
        : `images/slideshow/${cleanBrand}/${cleanModel}/${cleanVersion}`; // Chemin relatif pour l'environnement local
}

// Fonction pour obtenir le chemin du logo
function getLogoPath(brand) {
    const isGitHubPages = window.location.hostname === 'simoroui.github.io';
    const basePath = isGitHubPages ? '/autotech-reprog/images/logos' : 'images/logos';
    
    const cleanBrand = brand
        .trim()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('-');
    
    // Ajouter le suffixe "-min" pour utiliser les images optimisées
    return `${basePath}/${cleanBrand}-min.png`;
}

// Fonction pour afficher les marques
function displayBrands(brands, type) {
    const grid = document.getElementById(`${type}-grid`);
    if (!grid) return;
    
    grid.innerHTML = '';
    if (brands[type]) {
        brands[type].forEach((brand, index) => {
            const div = document.createElement('div');
            div.className = 'brand-item';
            div.style.setProperty('--item-index', index);
            
            div.addEventListener('click', () => handleBrandSelection(brand.name, type));
            
            const img = document.createElement('img');
            img.src = getLogoPath(brand.name);
            img.alt = brand.name;
            img.className = 'brand-logo';
            img.style.display = 'none';
            
            img.onload = function() {
                this.style.display = 'block';
            };
            
            img.onerror = function() {
                this.style.display = 'none';
            };
            
            const span = document.createElement('span');
            span.className = 'brand-name';
            span.textContent = brand.name;
            
            div.appendChild(img);
            div.appendChild(span);
            grid.appendChild(div);
        });
    }
}

// Fonction pour afficher toutes les marques
function displayAllBrands(brands) {
    displayBrands(brands, 'cars');
    displayBrands(brands, 'motorcycles');
    displayBrands(brands, 'jetski');
    displayBrands(brands, 'quad');
    displayBrands(brands, 'trucks');
    displayBrands(brands, 'agricultural');
}

// Fonction pour gérer le changement d'onglet
function handleTabClick(event, brands) {
    const type = event.target.closest('.tab-button').dataset.type;
    
    // Mettre à jour les classes active des onglets
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });
    event.target.closest('.tab-button').classList.add('active');
    
    // Cacher toutes les grilles et réinitialiser display (au cas où on revient de goToBrandList qui met des inline display)
    document.querySelectorAll('.brands-grid').forEach(grid => {
        grid.classList.remove('active');
        const isTarget = grid.id === `${type}-grid`;
        grid.style.display = isTarget ? '' : 'none';
    });
    
    // Afficher la grille correspondante et ses marques
    const targetGrid = document.getElementById(`${type}-grid`);
    if (targetGrid) {
        targetGrid.classList.add('active');
        // Afficher les marques uniquement pour le type sélectionné
        displayBrands(brands, type);

        // Synchroniser l'historique : l'état "liste" reflète l'onglet actif (pour le bouton Retour)
        if (!isRestoringFromHistory && window.history && typeof window.history.replaceState === 'function') {
            const currentState = window.history.state || {};
            if (currentState.step === 'list' || !currentState.step) {
                try {
                    window.history.replaceState({
                        step: 'list',
                        type: type,
                        brand: null,
                        model: null,
                        version: null,
                        engine: null
                    }, '', window.location.href);
                } catch (e) {
                    console.error('Erreur replaceState onglet:', e);
                }
            }
        }

        // Calculer la position de défilement
        const vehicleTabs = document.querySelector('.vehicle-tabs');
        const tabsHeight = vehicleTabs.offsetHeight;
        const tabsOffset = vehicleTabs.getBoundingClientRect().top + window.pageYOffset;
        const scrollTo = tabsOffset - tabsHeight - 20; // 20px de marge

        // Défilement fluide
        window.scrollTo({
            top: scrollTo,
            behavior: 'smooth'
        });
    }
}

// Libellés affichés pour le type dans le breadcrumb
const BREADCRUMB_TYPE_LABELS = {
    cars: 'Voitures',
    motorcycles: 'Motos',
    jetski: 'Jetski',
    quad: 'Quad',
    trucks: 'Camions',
    agricultural: 'Agricole'
};

// Ajouter au début du fichier
function updateBreadcrumb(selections = {}) {
    let breadcrumb = document.querySelector('.selection-breadcrumb');
    if (!breadcrumb) {
        breadcrumb = document.createElement('div');
        breadcrumb.className = 'selection-breadcrumb';
        document.querySelector('.section-container').insertBefore(breadcrumb, document.querySelector('.vehicle-tabs'));
    }

    const steps = [
        selections.type && { step: 'type', label: BREADCRUMB_TYPE_LABELS[selections.type] || selections.type },
        selections.brand && { step: 'brand', label: selections.brand },
        selections.model && { step: 'model', label: selections.model },
        selections.version && { step: 'version', label: selections.version },
        selections.engine && { step: 'engine', label: selections.engine }
    ].filter(Boolean);

    breadcrumb.innerHTML = steps.map(({ step, label }, index) => `
        <span class="breadcrumb-item breadcrumb-item-clickable" data-step="${step}">${escapeHtml(label)}</span>
        ${index < steps.length - 1 ? '<span class="breadcrumb-separator">></span>' : ''}
    `).join('');

    breadcrumb.querySelectorAll('.breadcrumb-item-clickable').forEach(el => {
        el.addEventListener('click', () => handleBreadcrumbClick(el.dataset.step));
    });

    // À partir de la sélection d'une marque : placer le breadcrumb dans la zone de sélection (au-dessus des cartes, à gauche de Retour)
    const slot = document.querySelector('.vehicle-details .breadcrumb-slot');
    const tabs = document.querySelector('.vehicle-tabs');
    if (selections.brand && slot) {
        slot.innerHTML = '';
        slot.appendChild(breadcrumb);
    } else if (tabs) {
        tabs.parentNode.insertBefore(breadcrumb, tabs);
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function handleBreadcrumbClick(step) {
    const s = currentSelection;
    if (!s.type) return;
    // Si on est sur la page résultats, la retirer du DOM avant de revenir à une étape
    const resultsPage = document.getElementById('vehicle-results-page');
    if (resultsPage) resultsPage.remove();
    document.querySelectorAll('.results-container').forEach(el => el.remove());
    switch (step) {
        case 'type':
            goToBrandList(s.type);
            break;
        case 'brand':
            goToBrandList(s.type);
            break;
        case 'model':
            if (s.brand) handleBrandSelection(s.brand, s.type);
            break;
        case 'version':
            if (s.brand && s.model) handleModelSelection(s.brand, s.type, s.model);
            break;
        case 'engine':
            if (s.brand && s.model && s.version) handleVersionSelection(s.brand, s.type, s.model, s.version);
            break;
    }
}

// Ajouter une variable pour suivre l'état de la sélection
let currentSelection = {
    brand: null,
    model: null,
    version: null,
    type: null,
    engine: null
};

// Indique si l'on est en train de restaurer l'état depuis l'historique
let isRestoringFromHistory = false;

// Cache des marques par type (pour restauration depuis l'historique)
let cachedBrands = null;

// Pousser un état de sélection dans l'historique du navigateur
function pushSelectionState(step, overrides = {}) {
    if (isRestoringFromHistory || !window.history || typeof window.history.pushState !== 'function') {
        return;
    }

    const state = {
        step,
        type: currentSelection.type || null,
        brand: currentSelection.brand || null,
        model: currentSelection.model || null,
        version: currentSelection.version || null,
        engine: currentSelection.engine || null,
        ...overrides
    };

    try {
        window.history.pushState(state, '', window.location.href);
    } catch (e) {
        // En cas d'erreur (mode privé strict, etc.), on ne casse pas le flux
        console.error('Erreur lors de pushState:', e);
    }
}

// Ajouter une fonction d'optimisation pour limiter les appels fréquents
function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            func.apply(context, args);
        }, wait);
    };
}

// Optimiser le scroll avec requestAnimationFrame
function optimizedScroll(element, to, duration) {
    const start = element.scrollTop;
    const change = to - start;
    let currentTime = 0;
    const increment = 16; // ~60fps

    function animateScroll() {
        currentTime += increment;
        const val = easeInOutQuad(currentTime, start, change, duration);
        element.scrollTop = val;
        if (currentTime < duration) {
            requestAnimationFrame(animateScroll);
        }
    }

    function easeInOutQuad(t, b, c, d) {
        t /= d / 2;
        if (t < 1) return c / 2 * t * t + b;
        t--;
        return -c / 2 * (t * (t - 2) - 1) + b;
    }

    requestAnimationFrame(animateScroll);
}

// Optimiser la fonction scrollToStepCenter
function scrollToStepCenter(step) {
    // Récupérer l'élément de l'étape
    const stepElement = document.querySelector(`.step[data-step="${step}"]`);
    if (!stepElement) return;

    // Sur PC (écrans larges), centrer la vue sur la section de sélection
    if (window.innerWidth > 768) {
        const vehicleDetails = document.querySelector('.vehicle-details');
        if (vehicleDetails) {
            const headerHeight = document.querySelector('.header')?.offsetHeight || 0;
            const offset = vehicleDetails.getBoundingClientRect().top + window.scrollY - headerHeight - 20;
            
            // Utiliser une animation douce pour le défilement
            window.scrollTo({
                top: offset,
                behavior: 'smooth'
            });
        }
        return;
    }
    
    // Sur mobile, faire un défilement horizontal pour centrer l'étape dans la fenêtre
    const selectionSteps = document.querySelector('.selection-steps');
    if (selectionSteps) {
        // Si on demande de centrer sur "model", d'abord s'assurer que la première colonne est visible
        if (step === 'model') {
            // Attendre un court instant pour que le DOM soit prêt
    setTimeout(() => {
                // Trouver la position de l'élément dans le conteneur
                const stepRect = stepElement.getBoundingClientRect();
                const containerRect = selectionSteps.getBoundingClientRect();
                
                // Calculer la position pour centrer l'élément
                const scrollLeft = stepElement.offsetLeft - (window.innerWidth / 2) + (stepRect.width / 2);
                
                // Utiliser une animation douce pour le défilement
                selectionSteps.scrollTo({
                    left: scrollLeft,
                    behavior: 'smooth'
                });
            }, 100);
        }
    }
    
    // Faire aussi un défilement vertical pour s'assurer que la section est visible
        const headerHeight = document.querySelector('.header')?.offsetHeight || 0;
        const windowHeight = window.innerHeight;
    const stepHeight = stepElement.offsetHeight;
        
    // Calculer la position pour centrer l'étape dans la fenêtre
    const targetScroll = stepElement.getBoundingClientRect().top + window.scrollY - headerHeight - (windowHeight - stepHeight) / 2;

    // Utiliser une animation douce pour le défilement
        window.scrollTo({
        top: Math.max(0, targetScroll),
            behavior: 'smooth'
        });
}

// Revenir à la liste des marques (onglets + grilles). Si type est fourni, affiche uniquement cet onglet.
function goToBrandList(type) {
    const detailsSection = document.querySelector('.vehicle-details');
    if (detailsSection) {
        detailsSection.style.display = 'none';
    }
    const tabs = document.querySelector('.vehicle-tabs');
    if (tabs) {
        tabs.style.display = '';
    }
    const targetType = type || (currentSelection && currentSelection.type) || 'cars';
    // Un seul onglet actif et une seule grille visible
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.type === targetType);
    });
    document.querySelectorAll('.brands-grid').forEach(grid => {
        const isActive = grid.id === `${targetType}-grid`;
        grid.style.display = isActive ? '' : 'none';
        grid.classList.toggle('active', isActive);
    });
    if (cachedBrands && cachedBrands[targetType]) {
        displayBrands(cachedBrands, targetType);
    }
    currentSelection = { type: targetType, brand: null, model: null, version: null, engine: null };
    updateBreadcrumb({ type: targetType });
}

// Modifier handleBrandSelection pour utiliser la nouvelle fonction
function handleBrandSelection(brand, type) {
    currentSelection = {
        brand: brand,
        model: null,
        version: null,
        type: type,
        engine: null
    };

    // Mettre à jour le breadcrumb
    updateBreadcrumb({ type, brand });

    // Cacher toutes les grilles de marques
    document.querySelectorAll('.brands-grid').forEach(grid => {
        grid.style.display = 'none';
        grid.classList.remove('active');
    });
    
    // Cacher les onglets
    document.querySelector('.vehicle-tabs').style.display = 'none';
    
    // Récupérer tous les modèles pour cette marque
    const models = new Set();
    const lines = parseCSV(csvContent);
    
    for (let i = 1; i < lines.length; i++) {
        const columns = lines[i].split(',');
        if (columns[0].trim() === brand) {
            models.add(columns[1].trim());
        }
    }

    // Créer ou utiliser la section existante
    let detailsSection = document.querySelector('.vehicle-details');
    if (!detailsSection) {
        detailsSection = document.createElement('div');
        detailsSection.className = 'vehicle-details';
        document.querySelector('.section-container').appendChild(detailsSection);
    }

    // S'assurer que la section est visible
    detailsSection.style.display = 'block';

    // Mettre à jour le contenu avec un affichage en boîtes
    detailsSection.innerHTML = `
        <div class="vehicle-details-header">
            <div class="breadcrumb-slot"></div>
            <button class="back-button">Retour</button>
        </div>
        <div class="selection-page">
            <div class="selected-info">
                <div class="selected-item">
                    <div class="selected-label">Marque sélectionnée</div>
                    <div class="selected-value">
                        <img src="${getLogoPath(brand)}" alt="${brand}" class="brand-logo" 
                             onerror="this.onerror=null; this.src='images/logos/default.png';"
                             onload="this.style.display='block';">
                        <span class="brand-name">${brand}</span>
                    </div>
                </div>
            </div>
            <div class="selection-grid">
                <h3 class="selection-title">Sélectionnez un modèle</h3>
                <div class="selection-items">
                    ${Array.from(models).map(model => `
                        <div class="selection-item" data-model="${model}">${model}</div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;

    // Placer le breadcrumb dans l'en-tête de la zone de sélection (à gauche du bouton Retour)
    updateBreadcrumb({ type, brand });

    // Ajouter les écouteurs d'événements pour les modèles
    detailsSection.querySelectorAll('.selection-item[data-model]').forEach(item => {
        item.addEventListener('click', () => handleModelSelection(brand, type, item.dataset.model));
    });

    // Grille "Marque sélectionnée" cliquable → retour au choix des marques (première page de sélection)
    const selectedBrandCard = detailsSection.querySelector('.selected-info .selected-item');
    if (selectedBrandCard) {
        selectedBrandCard.style.cursor = 'pointer';
        selectedBrandCard.addEventListener('click', () => {
            goToBrandList(type);
        });
    }

    // Ajouter l'écouteur pour le bouton retour (synchronisé avec l'historique)
    detailsSection.querySelector('.back-button').addEventListener('click', () => {
        handleBack();
    });

    // Enregistrer l'étape dans l'historique (sélection de marque)
    pushSelectionState('brand', { type, brand });

    // Faire défiler jusqu'au titre "CHOISISSEZ VOTRE VÉHICULE"
    setTimeout(() => {
        // Trouver spécifiquement le titre "CHOISISSEZ VOTRE VÉHICULE"
        const sectionTitles = document.querySelectorAll('.section-title');
        let targetTitle = null;
        
        // Parcourir tous les titres pour trouver celui qui contient "CHOISISSEZ VOTRE VÉHICULE"
        for (const title of sectionTitles) {
            if (title.textContent.includes('CHOISISSEZ VOTRE VÉHICULE')) {
                targetTitle = title;
                break;
            }
        }
        
        if (targetTitle) {
            const headerHeight = document.querySelector('.header')?.offsetHeight || 0;
            
            // Calculer la position pour placer le titre en haut de l'écran
            const offset = targetTitle.getBoundingClientRect().top + window.scrollY - headerHeight - 20;
            
            // Utiliser une animation douce pour le défilement
            window.scrollTo({
                top: offset,
                behavior: 'smooth'
            });
        }
    }, 100);
}

// Fonction pour récupérer les modèles pour une marque donnée
function getModelsForBrand(brand, type) {
    // Vérifier si nous avons des données CSV
    if (!csvContent) return [];
    
    // Analyser le contenu CSV
    const lines = parseCSV(csvContent);
    const models = new Set();
    
    // Parcourir les lignes pour trouver les modèles correspondant à la marque
    for (let i = 1; i < lines.length; i++) {
        const columns = lines[i].split(',');
        if (columns[0].trim() === brand) {
            models.add(columns[1].trim());
        }
    }
    
    return Array.from(models);
}

// Fonction séparée pour ajouter les écouteurs d'événements
function addEventListeners(detailsSection, brand, type, models) {
    // Écouteur pour le scroll sur mobile lorsqu'on clique sur la marque sélectionnée
    const selectedBrand = detailsSection.querySelector('.selection-item.selected');
    if (selectedBrand) {
    selectedBrand.addEventListener('click', () => {
            // Uniquement sur mobile
            if (window.innerWidth <= 768) {
                // Trouver l'élément de l'étape "modèle"
        const modelStep = document.getElementById('model-step');
                if (modelStep) {
                    // Déclencher le défilement vers l'étape "modèle"
                    // Utiliser setTimeout pour s'assurer que le DOM est prêt
                    setTimeout(() => {
                        // Calculer la position pour centrer l'étape dans la fenêtre
                        const headerHeight = document.querySelector('.header')?.offsetHeight || 0;
        const windowHeight = window.innerHeight;
        const modelStepHeight = modelStep.offsetHeight;
                        const modelStepTop = modelStep.getBoundingClientRect().top + window.scrollY;
        
                        // Position pour centrer l'élément dans la fenêtre
                        const targetScroll = modelStepTop - headerHeight - (windowHeight - modelStepHeight) / 2;
        
                        // Utiliser une animation douce pour le défilement
        window.scrollTo({
                            top: Math.max(0, targetScroll),
            behavior: 'smooth'
        });
                    }, 50);
                }
            }
    });
    }

    // Écouteur pour le bouton retour (synchronisé avec l'historique)
    detailsSection.querySelector('.back-button').addEventListener('click', () => {
        handleBack();
    });

    // Écouteurs pour les modèles
    detailsSection.querySelectorAll('.selection-item[data-model]').forEach(item => {
        item.addEventListener('click', () => handleModelSelection(brand, type, item.dataset.model));
    });
}

// Modifier handleModelSelection pour centrer la sélection de version
function handleModelSelection(brand, type, model) {
    // Mettre à jour la sélection courante
    currentSelection = {
        brand: brand,
        model: model,
        version: null,
        type: type,
        engine: null
    };

    // Mettre à jour le breadcrumb
    updateBreadcrumb(currentSelection);

    // Récupérer toutes les versions pour cette marque et ce modèle
    const versions = new Set();
    const lines = parseCSV(csvContent);
    
    for (let i = 1; i < lines.length; i++) {
        const columns = lines[i].split(',');
        if (columns[0].trim() === brand && columns[1].trim() === model) {
            versions.add(columns[2].trim());
        }
    }

    // Mettre à jour le contenu de la page avec un affichage en boîtes
    const detailsSection = document.querySelector('.vehicle-details');
    
    // S'assurer que la section est visible
    detailsSection.style.display = 'block';
    
    detailsSection.innerHTML = `
        <div class="vehicle-details-header">
            <div class="breadcrumb-slot"></div>
            <button class="back-button">Retour</button>
        </div>
        <div class="selection-page">
            <div class="selected-info">
                <div class="selected-item">
                    <div class="selected-label">Marque sélectionnée</div>
                    <div class="selected-value">
                        <img src="${getLogoPath(brand)}" alt="${brand}" class="brand-logo" 
                             onerror="this.onerror=null; this.src='images/logos/default.png';"
                             onload="this.style.display='block';">
                        <span class="brand-name">${brand}</span>
                    </div>
                </div>
                <div class="selected-item">
                    <div class="selected-label">Modèle sélectionné</div>
                    <div class="selected-value">
                        <span class="model-name">${model}</span>
                    </div>
                </div>
            </div>
            <div class="selection-grid">
                <h3 class="selection-title">Sélectionnez une version</h3>
                <div class="selection-items">
            ${Array.from(versions).map(version => `
                <div class="selection-item" data-version="${version}">${version}</div>
            `).join('')}
                </div>
            </div>
        </div>
    `;

    // Placer le breadcrumb dans l'en-tête de la zone de sélection
    updateBreadcrumb(currentSelection);

    // Ajouter les écouteurs d'événements pour les versions
    detailsSection.querySelectorAll('.selection-item[data-version]').forEach(item => {
        item.addEventListener('click', () => handleVersionSelection(brand, type, model, item.dataset.version));
    });

    // Rendre la grille "Marque sélectionnée" cliquable pour changer de marque
    const selectedBrandCard = detailsSection.querySelector('.selected-item:nth-child(1)');
    if (selectedBrandCard) {
        selectedBrandCard.style.cursor = 'pointer';
        selectedBrandCard.addEventListener('click', () => {
            goToBrandList(type);
        });
    }

    // Rendre la grille "Modèle sélectionné" cliquable pour changer de modèle
    const selectedModelCard = detailsSection.querySelector('.selected-item:nth-child(2)');
    if (selectedModelCard) {
        selectedModelCard.style.cursor = 'pointer';
        selectedModelCard.addEventListener('click', () => {
            handleBrandSelection(brand, type);
        });
    }

    // Ajouter l'écouteur pour le bouton retour (synchronisé avec l'historique)
    detailsSection.querySelector('.back-button').addEventListener('click', () => {
        handleBack();
    });
    
    // Faire défiler la page : sur PC, afficher les grilles de récap en haut ; sur mobile, centrer la liste
    setTimeout(() => {
        const headerHeight = document.querySelector('.header')?.offsetHeight || 0;
        if (window.innerWidth > 768) {
            // PC : placer le haut de la section en haut de la vue pour que les 3 grilles soient visibles
            const sectionTop = detailsSection.getBoundingClientRect().top + window.scrollY - headerHeight - 20;
            window.scrollTo({
                top: Math.max(0, sectionTop),
                behavior: 'smooth'
            });
        } else {
            const selectionGrid = detailsSection.querySelector('.selection-grid');
            if (selectionGrid) {
                const offset = selectionGrid.getBoundingClientRect().top + window.scrollY - headerHeight - 20;
                window.scrollTo({
                    top: offset,
                    behavior: 'smooth'
                });
            }
        }
    }, 100);

    // Enregistrer l'étape dans l'historique (sélection de modèle)
    pushSelectionState('model', { type, brand, model });
}

// Modifier handleVersionSelection pour centrer la sélection de motorisation
function handleVersionSelection(brand, type, model, version) {
    // Mettre à jour la sélection courante
    currentSelection = {
        brand: brand,
        model: model,
        version: version,
        type: type,
        engine: null
    };

    // Mettre à jour le breadcrumb
    updateBreadcrumb(currentSelection);

    // Récupérer tous les moteurs pour cette marque, ce modèle et cette version
    const engines = [];
    const lines = parseCSV(csvContent);
    
    for (let i = 1; i < lines.length; i++) {
        const columns = lines[i].split(',');
        if (columns[0].trim() === brand && columns[1].trim() === model && columns[2].trim() === version) {
            const engine = {
                type: columns[3]?.trim() || 'N/A',
                energy: columns[4]?.trim() || 'N/A',
                powerOriginal: columns[5]?.trim() || 'N/A',
                torqueOriginal: columns[6]?.trim() || 'N/A',
                powerStage1: columns[7]?.trim() || 'N/A',
                torqueStage1: columns[8]?.trim() || 'N/A',
                engineCode: columns[9]?.trim() || 'N/A',
                displacement: columns[10]?.trim() || 'N/A',
                engineInfo: columns[13]?.trim() || ''
            };

            // Calculer les gains
            const powerGain = parseInt(engine.powerStage1) - parseInt(engine.powerOriginal);
            const torqueGain = parseInt(engine.torqueStage1) - parseInt(engine.torqueOriginal);
            engine.powerGain = powerGain;
            engine.torqueGain = torqueGain;

            if (!engines.some(e => e.type === engine.type)) {
                engines.push(engine);
            }
        }
    }

    // Extraire les types d'énergie disponibles
    const energyTypes = [...new Set(engines.map(engine => engine.energy))];

    // Mettre à jour le contenu de la page avec un affichage en boîtes
    const detailsSection = document.querySelector('.vehicle-details');
    
    // S'assurer que la section est visible
    detailsSection.style.display = 'block';
    
    detailsSection.innerHTML = `
        <div class="vehicle-details-header">
            <div class="breadcrumb-slot"></div>
            <button class="back-button">Retour</button>
        </div>
        <div class="selection-page">
            <div class="selected-info">
                <div class="selected-item">
                    <div class="selected-label">Marque sélectionnée</div>
                    <div class="selected-value">
                        <img src="${getLogoPath(brand)}" alt="${brand}" class="brand-logo" 
                             onerror="this.onerror=null; this.src='images/logos/default.png';"
                             onload="this.style.display='block';">
                        <span class="brand-name">${brand}</span>
                    </div>
                </div>
                <div class="selected-item">
                    <div class="selected-label">Modèle sélectionné</div>
                    <div class="selected-value">
                        <span class="model-name">${model}</span>
                    </div>
                </div>
                <div class="selected-item">
                    <div class="selected-label">Version sélectionnée</div>
                    <div class="selected-value">
                        <span class="version-name">${version}</span>
                    </div>
                </div>
            </div>
            <div class="selection-grid">
                <h3 class="selection-title">Sélectionnez une motorisation</h3>
                <div class="energy-filter">
                    <div class="filter-label">Filtrer par énergie:</div>
                    <div class="filter-buttons">
                        <button class="filter-btn active" data-energy="all">Toutes</button>
                        ${energyTypes.map(energy => `
                            <button class="filter-btn" data-energy="${energy}">${energy}</button>
                        `).join('')}
                    </div>
                </div>
                <div class="selection-items engine-items">
            ${engines.map(engine => `
                <div class="selection-item engine-item" data-energy="${engine.energy}" data-engine='${JSON.stringify(engine)}'>
                        <div class="engine-info">
                            <div class="engine-type">${engine.type}</div>
                            <div class="engine-details">
                                <div class="detail-item">
                                <span class="detail-label">Puissance:</span>
                                        <span class="detail-value">${engine.powerOriginal.toString().includes('Hp') ? engine.powerOriginal : `${engine.powerOriginal} Hp`}</span>
                                </div>
                                <div class="detail-item">
                                <span class="detail-label">Cylindrée:</span>
                                    <span class="detail-value">${engine.displacement}</span>
                                </div>
                            <div class="detail-item">
                                <span class="detail-label">Energie:</span>
                                <span class="detail-value">${engine.energy}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Code moteur:</span>
                                <span class="detail-value ${engine.engineInfo ? 'tooltip' : ''}" 
                                    ${engine.engineInfo ? `data-tooltip="ECU: ${engine.engineInfo}"` : ''}>
                                    ${engine.engineCode}
                                </span>
                        </div>
                    </div>
                    </div>
                </div>
            `).join('')}
                </div>
            </div>
        </div>
    `;

    // Placer le breadcrumb dans l'en-tête de la zone de sélection
    updateBreadcrumb(currentSelection);

    // Ajouter les écouteurs d'événements pour les filtres d'énergie
    detailsSection.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            // Retirer la classe active de tous les boutons
            detailsSection.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            // Ajouter la classe active au bouton cliqué
            btn.classList.add('active');
            
            const selectedEnergy = btn.dataset.energy;
            const engineItems = detailsSection.querySelectorAll('.engine-item');
            
            engineItems.forEach(item => {
                if (selectedEnergy === 'all' || item.dataset.energy === selectedEnergy) {
                    item.style.display = 'block';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    });

    // Ajouter les écouteurs d'événements pour les motorisations
    detailsSection.querySelectorAll('.selection-item[data-engine]').forEach(item => {
        item.addEventListener('click', () => {
            try {
                const engineData = JSON.parse(item.dataset.engine);
                handleEngineSelection(brand, type, model, version, engineData);
            } catch (error) {
                console.error('Erreur lors de la sélection du moteur:', error);
            }
        });
    });

    // Grille "Marque sélectionnée" cliquable → changement de marque
    const selectedBrandCard = detailsSection.querySelector('.selected-item:nth-child(1)');
    if (selectedBrandCard) {
        selectedBrandCard.style.cursor = 'pointer';
        selectedBrandCard.addEventListener('click', () => {
            goToBrandList(type);
        });
    }

    // Grille "Modèle sélectionné" cliquable → changement de modèle
    const selectedModelCard = detailsSection.querySelector('.selected-item:nth-child(2)');
    if (selectedModelCard) {
        selectedModelCard.style.cursor = 'pointer';
        selectedModelCard.addEventListener('click', () => {
            handleModelSelection(brand, type, model);
        });
    }

    // Grille "Version sélectionnée" cliquable → changement de version
    const selectedVersionCard = detailsSection.querySelector('.selected-item:nth-child(3)');
    if (selectedVersionCard) {
        selectedVersionCard.style.cursor = 'pointer';
        selectedVersionCard.addEventListener('click', () => {
            handleModelSelection(brand, type, model);
        });
    }

    // Ajouter l'écouteur pour le bouton retour (synchronisé avec l'historique)
    detailsSection.querySelector('.back-button').addEventListener('click', () => {
        handleBack();
    });
    
    // Faire défiler la page : sur PC, afficher les grilles de récap en haut ; sur mobile, centrer la liste
    setTimeout(() => {
        const headerHeight = document.querySelector('.header')?.offsetHeight || 0;
        if (window.innerWidth > 768) {
            // PC : placer le haut de la section en haut de la vue pour que les 3 grilles soient visibles
            const sectionTop = detailsSection.getBoundingClientRect().top + window.scrollY - headerHeight - 20;
            window.scrollTo({
                top: Math.max(0, sectionTop),
                behavior: 'smooth'
            });
        } else {
            const selectionGrid = detailsSection.querySelector('.selection-grid');
            if (selectionGrid) {
                const offset = selectionGrid.getBoundingClientRect().top + window.scrollY - headerHeight - 20;
                window.scrollTo({
                    top: offset,
                    behavior: 'smooth'
                });
            }
        }
    }, 100);

    // Enregistrer l'étape dans l'historique (sélection de version)
    pushSelectionState('version', { type, brand, model, version });
}

function handleEngineSelection(brand, type, model, version, engineData) {
    // S'assurer que toutes les données sont présentes
    if (!engineData || typeof engineData !== 'object') {
        console.error('Données moteur invalides dans handleEngineSelection:', engineData);
        engineData = {
            type: 'Moteur non spécifié',
            powerOriginal: "00",
            powerStage1: "00",
            torqueOriginal: "00",
            torqueStage1: "00"
        };
    }
    
    // S'assurer que le type de moteur est défini
    const engineType = engineData.engineType || engineData.type || 'Moteur non spécifié';
    
    // Mettre à jour la sélection courante
    currentSelection = {
                brand: brand,
                model: model,
                version: version,
        type: type,
        engine: engineType,
        powerOriginal: engineData.powerOriginal,
        powerStage1: engineData.powerStage1,
        torqueOriginal: engineData.torqueOriginal,
        torqueStage1: engineData.torqueStage1
    };

    // Mettre à jour le breadcrumb
    updateBreadcrumb(currentSelection);

    // Enregistrer l'étape "résultats" dans l'historique
    pushSelectionState('result', {
        type,
        brand,
        model,
        version,
        engine: engineType,
        powerOriginal: engineData.powerOriginal,
        powerStage1: engineData.powerStage1,
        torqueOriginal: engineData.torqueOriginal,
        torqueStage1: engineData.torqueStage1
    });

    // Créer la page de résultats (sans encore l'ajouter au DOM)
    const container = showResultPage({
        brand,
        model,
        version,
        engineType: engineType,
        powerOriginal: engineData.powerOriginal,
        powerStage1: engineData.powerStage1,
        torqueOriginal: engineData.torqueOriginal,
        torqueStage1: engineData.torqueStage1
    });

    // Ajouter la page de résultats au DOM en supprimant d'éventuels résultats précédents
    const mainContent = document.querySelector('.section-container');
    if (mainContent && container) {
        const existingResults = mainContent.querySelectorAll('.results-container');
        existingResults.forEach(el => el.remove());
        mainContent.appendChild(container);
    }
}

// Ajouter la fonction de nettoyage des noms
function cleanFolderName(name) {
    return name
        .replace(/[<>:"\/\\|?*\.]/g, '')
        .replace(/\s*->\s*/g, '-')
        .replace(/\s+/g, '_')
        .replace(/_{2,}/g, '_')
        .replace(/^-+|-+$/g, '')
        .replace(/-+$/, '')
        .replace(/_+$/, '')
        .trim();
}

// Fonction pour vérifier l'existence d'une image
function checkImageExists(url) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            console.log('Image chargée avec succès:', url);
            resolve(true);
        };
        img.onerror = () => {
            console.log('Erreur de chargement de l\'image:', url);
            resolve(false);
        };
        img.src = url;
    });
}

// Fonction pour vérifier les images
async function checkForImages(brand, model, version) {
    const basePath = getImagePath(brand, model, version);
    console.log('Chemin de base:', basePath);
    
    const imageFiles = ['1.jpg', '2.jpg', '3.jpg'];  // Réduit à 3 images
    const existingImages = [];

    for (const file of imageFiles) {
        const imageUrl = `${basePath}/${file}`;
        console.log('Tentative de chargement:', imageUrl);
        try {
            const response = await fetch(imageUrl, { 
                method: 'HEAD',
                cache: 'no-cache'
            });
            if (response.ok) {
                existingImages.push(imageUrl);
                console.log('Image trouvée:', imageUrl);
            }
        } catch (error) {
            console.log('Erreur de chargement:', error);
        }
    }

    return existingImages;
}

// Fonction pour créer le diaporama
async function createSlideshow(brand, model, version) {
    // Nettoyer les noms pour les chemins
    const cleanBrand = cleanFolderName(brand.toLowerCase());
    const cleanModel = cleanFolderName(model.toLowerCase());
    const cleanVersion = cleanFolderName(version.toLowerCase());

    // Construire le chemin de base
    const basePath = window.location.hostname === 'simoroui.github.io'
        ? `/autotech-reprog/images/slideshow/${cleanBrand}/${cleanModel}/${cleanVersion}`
        : `images/slideshow/${cleanBrand}/${cleanModel}/${cleanVersion}`;

    // Vérifier quelles images existent
    const images = await checkForImages(brand, model, version);
    
    // Si aucune image n'existe, retourner null
    if (images.length === 0) {
        console.log('Aucune image trouvée pour:', brand, model, version);
        return null;
    }

    // Créer l'élément du diaporama seulement si des images existent
    const slideshow = document.createElement('div');
    slideshow.className = 'vehicle-slideshow';
    slideshow.innerHTML = `
        <h3 style="
            color: white;
            text-align: center;
            margin-bottom: 15px;
            font-size: 1.2rem;
        ">Photos prises dans notre atelier</h3>
        <div class="slideshow-container" style="
            position: relative;
            width: 100%;
            height: 400px;
            background: rgba(0, 0, 0, 0.2);
            border-radius: 8px;
            overflow: hidden;
            margin: 20px 0;
        ">
            ${images.map((imageUrl, index) => `
                <div class="slide" style="
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    opacity: ${index === 0 ? '1' : '0'};
                ">
                    <img src="${imageUrl}" alt="${brand} ${model}" style="
                        width: 100%;
                        height: 100%;
                        object-fit: contain;
                        background: rgba(0, 0, 0, 0.5);
                    ">
                </div>
            `).join('')}

            ${images.length > 1 ? `
                <button class="slide-nav prev" style="
                    position: absolute;
                    left: 20px;
                    top: 50%;
                    transform: translateY(-50%);
                    z-index: 10;
                    background: rgba(227, 6, 19, 0.8);
                    color: white;
                    border: none;
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    cursor: pointer;
                    font-size: 20px;
                ">❮</button>
                <button class="slide-nav next" style="
                    position: absolute;
                    right: 20px;
                    top: 50%;
                    transform: translateY(-50%);
                    z-index: 10;
                    background: rgba(227, 6, 19, 0.8);
                    color: white;
                    border: none;
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    cursor: pointer;
                    font-size: 20px;
                ">❯</button>
                
                <div class="slide-dots">
                    ${images.map((_, index) => `
                        <button class="dot" data-index="${index}" style="
                            width: 12px;
                            height: 12px;
                            border-radius: 50%;
                            background: ${index === 0 ? 'white' : 'rgba(255, 255, 255, 0.5)'};
                            border: none;
                            cursor: pointer;
                        "></button>
                    `).join('')}
            </div>
            ` : ''}
        </div>
    `;

    return slideshow;
}

// Variables globales pour stocker les valeurs initiales
let initialValues = {
    powerOriginal: 0,
    torqueOriginal: 0,
    powerStage1: 0,
    torqueStage1: 0
};

// Indique si les données de performance sont absentes (reprog en cours de développement)
function isPerformanceDataMissing(powerOriginal, powerStage1, torqueOriginal, torqueStage1) {
    const invalid = (v) => {
        const s = String(v || '').trim();
        return s === '' || s === '00' || s.toUpperCase() === 'N/A' || isNaN(parseInt(s, 10));
    };
    return invalid(powerOriginal) || invalid(powerStage1) || invalid(torqueOriginal) || invalid(torqueStage1);
}

// Dans showResultPage, stockons les valeurs
function showResultPage(vehicleData) {
    // S'assurer que toutes les données nécessaires sont disponibles
    if (!vehicleData || !vehicleData.brand || !vehicleData.model || !vehicleData.version || !vehicleData.engineType) {
        console.error('Données insuffisantes pour afficher la page de résultats', vehicleData);
        return;
    }
    
    // Extraire les données avec valeurs par défaut au cas où
    const brand = vehicleData.brand || 'Marque non spécifiée';
    const model = vehicleData.model || 'Modèle non spécifié';
    const version = vehicleData.version || 'Version non spécifiée';
    const engineType = vehicleData.engineType || 'Moteur non spécifié';
    const powerOriginal = vehicleData.powerOriginal || "00";
    const powerStage1 = vehicleData.powerStage1 || "00";
    const torqueOriginal = vehicleData.torqueOriginal || "00";
    const torqueStage1 = vehicleData.torqueStage1 || "00";
    
    const enCoursDeDeveloppement = isPerformanceDataMissing(powerOriginal, powerStage1, torqueOriginal, torqueStage1);
    
    console.log('Affichage des résultats avec les données:', {
        brand, model, version, engineType,
        powerOriginal, powerStage1, torqueOriginal, torqueStage1,
        enCoursDeDeveloppement
    });

    // Stocker les valeurs initiales
    initialValues = {
        powerOriginal: powerOriginal === "00" ? "00" : (parseInt(powerOriginal) || "00"),
        torqueOriginal: torqueOriginal === "00" ? "00" : (parseInt(torqueOriginal) || "00"),
        powerStage1: powerStage1 === "00" ? "00" : (parseInt(powerStage1) || "00"),
        torqueStage1: torqueStage1 === "00" ? "00" : (parseInt(torqueStage1) || "00")
    };
    
    // Stocker les données complètes dans localStorage pour les récupérer après actualisation
    localStorage.setItem('vehicleResultData', JSON.stringify({
        brand,
        model,
        version,
        engineType,
        powerOriginal,
        powerStage1,
        torqueOriginal,
        torqueStage1,
        timestamp: Date.now(), // Pour l'expiration éventuelle des données
        url: window.location.href // Stocker l'URL associée à ces données
    }));

    // Créer le conteneur (id unique pour le retirer au retour)
    const container = document.createElement('div');
    container.className = 'results-container';
    container.id = 'vehicle-results-page';
    
    // Ajouter les paramètres à l'URL pour pouvoir les récupérer lors du retour
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('brand', brand);
    currentUrl.searchParams.set('model', model);
    currentUrl.searchParams.set('version', version);
    currentUrl.searchParams.set('engine', engineType);
    
    // Ajouter aussi les valeurs de performance dans l'URL pour les liens partagés
    currentUrl.searchParams.set('po', powerOriginal);
    currentUrl.searchParams.set('ps', powerStage1);
    currentUrl.searchParams.set('to', torqueOriginal);
    currentUrl.searchParams.set('ts', torqueStage1);
    
    // Supprimer les paramètres techniques qui ne devraient pas être dans l'URL
    currentUrl.searchParams.delete('powerOrig');
    currentUrl.searchParams.delete('powerStage1');
    currentUrl.searchParams.delete('torqueOrig');
    currentUrl.searchParams.delete('torqueStage1');
    
    // Construire le hash correct pour la page de résultats
    const type = currentSelection.type || 'cars'; // Utiliser 'cars' par défaut si non défini
    const cleanBrand = (brand || '').toLowerCase().replace(/\s+/g, '-');
    const cleanModel = (model || '').toLowerCase().replace(/\s+/g, '-');
    const cleanVersion = (version || '').toLowerCase().replace(/\s+/g, '-');
    const newHash = `reprogrammation/${type}/${cleanBrand}/${cleanModel}/${cleanVersion}`;
    
    // Mettre à jour l'URL (hash + query) sans recharger la page
    currentUrl.hash = newHash;
    
    // Conserver l'état courant (step, sélection) tout en mettant à jour l'URL
    try {
        const currentState = window.history.state || {};
        window.history.replaceState(currentState, '', currentUrl);
    } catch (e) {
        console.error('Erreur lors de replaceState dans showResultPage:', e);
    }
    
    // Calculer les différences pour l'affichage (uniquement si données valides)
    let powerDiff = "00";
    let torqueDiff = "00";
    
    if (!enCoursDeDeveloppement) {
        if (powerOriginal !== "00" && powerStage1 !== "00") {
            powerDiff = parseInt(powerStage1, 10) - parseInt(powerOriginal, 10);
        }
        if (torqueOriginal !== "00" && torqueStage1 !== "00") {
            torqueDiff = parseInt(torqueStage1, 10) - parseInt(torqueOriginal, 10);
        }
    }
    
    const messageEnCoursDeDev = `L'optimisation moteur pour le "${brand} ${model} ${version} ${engineType}" n'est pas encore possible étant encore en cours de développement. Vous souhaitez être informé lorsque la modification sera possible ? Merci d'envoyer vos coordonnées et nous vous recontacterons dès qu'elle le sera.`;
    
    // Ajouter le contenu HTML (vue "en cours de développement" ou vue complète avec tableau)
    if (enCoursDeDeveloppement) {
        container.innerHTML = `
        <div class="results-container">
            <button class="back-button" onclick="handleBack()">Retour</button>
            <div class="title-container" style="display: flex; flex-direction: column; align-items: center; justify-content: center; margin-bottom: 30px; width: 100%;">
                <div class="logos-container" style="display: flex; align-items: center; justify-content: center; margin-bottom: 20px; width: 100%; max-width: 300px;">
                    <div style="flex: 1; display: flex; align-items: center; justify-content: center; padding: 0 10px;">
                        <img src="${getLogoPath(brand)}" alt="Logo ${brand}" class="brand-logo" style="max-height: 70px; max-width: 100%; width: auto; object-fit: contain;" 
                             onerror="this.onerror=null; this.src='https://via.placeholder.com/120x70?text=${brand}';">
                    </div>
                    <div style="flex: 1; display: flex; align-items: center; justify-content: center; padding: 0 10px;">
                        <img src="images/logo-minResult.png" alt="AutoTech Logo" class="company-logo" style="max-height: 70px; max-width: 100%; width: auto; object-fit: contain;"
                             onerror="this.onerror=null; this.src='https://via.placeholder.com/120x70?text=AutoTech';">
                    </div>
                </div>
                <h1 class="vehicle-title" style="text-align: center; width: 100%;">${brand} ${model} ${version}</h1>
                <h2 class="engine-type" style="text-align: center; width: 100%;">${engineType}</h2>
            </div>
            <div class="dev-in-progress-message">
                <p>${escapeHtml(messageEnCoursDeDev)}</p>
            </div>
        </div>
        `;
        // Défilement vers la page de résultats (comme pour le cas avec tableau)
        setTimeout(() => {
            const resultsPage = document.getElementById('vehicle-results-page');
            if (resultsPage) {
                const headerHeight = document.querySelector('.header')?.offsetHeight || 0;
                const offset = resultsPage.getBoundingClientRect().top + window.scrollY - headerHeight - 20;
                window.scrollTo({ top: Math.max(0, offset), behavior: 'smooth' });
            }
        }, 150);
    } else {
    container.innerHTML = `
        <div class="results-container">
            <button class="back-button" onclick="handleBack()">Retour</button>
            
            <div class="title-container" style="display: flex; flex-direction: column; align-items: center; justify-content: center; margin-bottom: 30px; width: 100%;">
                <div class="logos-container" style="display: flex; align-items: center; justify-content: center; margin-bottom: 20px; width: 100%; max-width: 300px;">
                    <div style="flex: 1; display: flex; align-items: center; justify-content: center; padding: 0 10px;">
                        <img src="${getLogoPath(brand)}" alt="Logo ${brand}" class="brand-logo" style="max-height: 70px; max-width: 100%; width: auto; object-fit: contain;" 
                             onerror="this.onerror=null; this.src='https://via.placeholder.com/120x70?text=${brand}';">
                    </div>
                    <div style="flex: 1; display: flex; align-items: center; justify-content: center; padding: 0 10px;">
                        <img src="images/logo-minResult.png" alt="AutoTech Logo" class="company-logo" style="max-height: 70px; max-width: 100%; width: auto; object-fit: contain;"
                             onerror="this.onerror=null; this.src='https://via.placeholder.com/120x70?text=AutoTech';">
                    </div>
                </div>
            <h1 class="vehicle-title" style="text-align: center; width: 100%;">${brand} ${model} ${version}</h1>
            <h2 class="engine-type" style="text-align: center; width: 100%;">${engineType}</h2>
            </div>

            <style>
                /* Styles pour supprimer le symbole ✔️ */
                .advantage-item.no-check::before {
                    content: none !important;
                }
                
                /* Si le symbole est ajouté via content */
                .advantage-item.no-check::before {
                    display: none !important;
                }
                
                /* Si le symbole est ajouté via background-image */
                .advantage-item.no-check {
                    background-image: none !important;
                    padding-left: 0 !important;
                }
                
                /* Si le symbole est ajouté via text-indent et un pseudo-élément */
                .advantage-item.no-check {
                    text-indent: 0 !important;
                    padding-left: 10px !important;
                }
            </style>

            <div class="stage-selector">
                <button class="stage-btn active" data-stage="1">Stage 1</button>
                <button class="stage-btn" data-stage="2">Stage 2</button>
            </div>

            <div class="stage-info" style="text-align: center; margin: 15px 0; padding: 10px; background: rgba(0,0,0,0.3); border-radius: 8px;">
                <div class="stage1-info" style="display: block;">
                    <span style="color: #fff; font-size: 0.9rem;">
                        ℹ️ Le Stage 1 est un simple débridage électronique, aucune modification mécanique n'est nécessaire
                    </span>
                </div>
                <div class="stage2-info" style="display: none;">
                    <span style="color: #fff; font-size: 0.9rem;">
                        ⚠️ Le Stage 2 nécessite une préparation mécanique : système d'échappement et/ou système d'admission et/ou injection
                    </span>
                </div>
            </div>

            <div class="results-table">
                <div class="table-header">
                    <div class="label"></div>
                    <div class="stage-column">ORIGINE</div>
                    <div class="stage-column">STAGE1</div>
                    <div>DIFFÉRENCE</div>
                </div>
                <div class="table-content">
                    <div class="table-row">
                        <div class="label">Puissance</div>
                        <div class="value">${powerOriginal.toString().includes('Hp') ? powerOriginal : `${powerOriginal} Hp`}</div>
                        <div class="value stage-value">${powerStage1.toString().includes('Hp') ? powerStage1 : `${powerStage1} Hp`}</div>
                        <div class="diff power-diff"><span>+${powerDiff} Hp</span></div>
                    </div>
                    <div class="table-row">
                        <div class="label">Couple</div>
                        <div class="value">${torqueOriginal.toString().includes('Nm') ? torqueOriginal : `${torqueOriginal} Nm`}</div>
                        <div class="value stage-value">${torqueStage1.toString().includes('Nm') ? torqueStage1 : `${torqueStage1} Nm`}</div>
                        <div class="diff torque-diff"><span>+${torqueDiff} Nm</span></div>
                    </div>
                </div>
            </div>

            <div class="performance-graph">
                <canvas id="performanceChart"></canvas>
            </div>

            <!-- Autres sections de la page de résultats -->
            <div class="advantages-list">
                <div class="advantage-item no-check">
                    Reprog sur banc de puissance (dyno)
                    </div>
                <div class="advantage-item no-check">
                    Reprog sur fichier d'origine
                    </div>
                <div class="advantage-item no-check">
                    Log des valeurs (avant et après reprog)
                </div>
                <div class="advantage-item no-check">
                    Diagnostic détaillé (avant et après reprog)
                </div>
                <div class="advantage-item no-check">
                    Garantie Logiciel 5ans
                </div>
                <div class="advantage-item no-check">
                    Reprogrammation en respectant les tolérances du constructeur
                </div>
                <div class="advantage-item no-check">
                    Normes Antipollution respectées
                </div>
                <div class="advantage-item no-check">
                    Possibilité de réinstaller le programme d'origine à tout moment
            </div>
                <div class="advantage-item no-check">
                    Reprogrammation par la prise OBD, sans ouverture du calculateur
                    </div>
                <div class="advantage-item no-check">
                    Aucun code défaut ni témoins allumés
                </div>
            </div>

            <div class="pricing-grid">
                <div class="price-info">
                    <span class="stage-label">Stage 1 : </span>
                    <span class="price-amount">700 DT</span>
                    <span class="price-tax">HT</span>
                </div>
                <div class="price-info">
                    <span class="stage-label">Stage 2 : </span>
                    <span class="price-amount">Sur devis</span>
                    <span class="price-tax">!</span>
                </div>
                <button class="reserve-btn" onclick="handleReservation('${brand}', '${model}', '${version}', '${engineType}')">
                    Réserver maintenant
                </button>
                </div>
            </div>
        </div>
    `;
    }

    // Initialiser le graphique et le reste uniquement si données disponibles
    if (!enCoursDeDeveloppement) {
    setTimeout(() => {
        const canvas = document.getElementById('performanceChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            // Convertir les valeurs "00" en zéro pour le graphique
            const powerOriginalValue = initialValues.powerOriginal === "00" ? 0 : initialValues.powerOriginal;
            const powerStage1Value = initialValues.powerStage1 === "00" ? 0 : initialValues.powerStage1;
            const torqueOriginalValue = initialValues.torqueOriginal === "00" ? 0 : initialValues.torqueOriginal;
            const torqueStage1Value = initialValues.torqueStage1 === "00" ? 0 : initialValues.torqueStage1;
            
            const chart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['Puissance', 'Couple'],
                    datasets: [{
                        label: 'Origine',
                        data: [powerOriginalValue, torqueOriginalValue],
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        borderColor: 'rgba(255, 255, 255, 0.8)',
                        borderWidth: 1,
                        barPercentage: 0.8
                    }, {
                        label: 'Stage 1',
                        data: [powerStage1Value, torqueStage1Value],
                        backgroundColor: function(context) {
                            const chart = context.chart;
                            const {ctx, chartArea} = chart;
                            
                            if (!chartArea) {
                                return 'rgba(227, 6, 19, 0.4)';
                            }

                            const gradient = ctx.createLinearGradient(chartArea.left, 0, chartArea.right, 0);
                            const time = Date.now() * 0.001;
                            const position = (Math.sin(time * 2) + 1) / 2;

                            gradient.addColorStop(0, 'rgba(227, 6, 19, 0.4)');
                            gradient.addColorStop(Math.max(0, position - 0.1), 'rgba(227, 6, 19, 0.4)');
                            gradient.addColorStop(position, 'rgba(255, 255, 255, 0.9)');
                            gradient.addColorStop(Math.min(1, position + 0.1), 'rgba(227, 6, 19, 0.4)');
                            gradient.addColorStop(1, 'rgba(227, 6, 19, 0.4)');

                            requestAnimationFrame(() => chart.draw());

                            return gradient;
                        },
                        borderColor: 'rgba(227, 6, 19, 0.8)',
                        borderWidth: 2,
                        barPercentage: 0.8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    indexAxis: 'y',
                    animation: {
                        duration: 1
                    },
                    plugins: {
                        legend: {
                            labels: {
                                color: 'white',
                                font: { size: 12 }
                            }
                        },
                        tooltip: {
                            enabled: false
                        }
                    },
                    scales: {
                        x: {
                            beginAtZero: true,
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            },
                            ticks: { 
                                color: 'white',
                                callback: function(value) {
                                    return value;
                                }
                            }
                        },
                        y: {
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            },
                            ticks: { color: 'white' }
                        }
                    }
                }
            });

            // Fonction d'animation
            function animate() {
                chart.update('none');
                requestAnimationFrame(animate);
            }

            // Démarrer l'animation
            animate();
        }
    }, 100);

    // Centrer le tableau des résultats
    setTimeout(() => {
        const resultsTable = container.querySelector('.results-table');
        if (resultsTable) {
            const headerHeight = document.querySelector('.header')?.offsetHeight || 0;
            const windowHeight = window.innerHeight;
            const tableHeight = resultsTable.offsetHeight;
            
            // Calculer la position pour centrer le tableau
            const targetScroll = resultsTable.getBoundingClientRect().top + window.scrollY - 
                               (windowHeight - tableHeight) / 2 - headerHeight;

            // Scroll avec animation
            window.scrollTo({
                top: Math.max(0, targetScroll),
                behavior: 'smooth'
            });
        }
    }, 100);

    // Ajouter le diaporama
    const resultsTable = container.querySelector('.results-table');
    if (resultsTable) {
        createSlideshow(brand, model, version).then(slideshow => {
            resultsTable.insertAdjacentElement('afterend', slideshow);
            initializeSlideshow();
        });
    }

    // Ajouter les écouteurs d'événements pour les boutons de stage
    const stageButtons = container.querySelectorAll('.stage-btn');
    const stage1Info = container.querySelector('.stage1-info');
    const stage2Info = container.querySelector('.stage2-info');

    stageButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Mettre à jour les classes actives
            stageButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            // Afficher/masquer les infos correspondantes
            if (button.dataset.stage === '1') {
                stage1Info.style.display = 'block';
                stage2Info.style.display = 'none';
            } else {
                stage1Info.style.display = 'none';
                stage2Info.style.display = 'block';
            }

            // Mettre à jour le tableau et le graphique selon le stage
            const isStage2 = button.dataset.stage === '2';
            updatePerformanceData(isStage2);
        });
    });
    }

    return container;
}

// Nouvelle version de la fonction initializeSlideshow
function initializeSlideshow() {
    const slideshow = document.querySelector('.vehicle-slideshow');
    if (!slideshow) return;

    const slides = Array.from(slideshow.querySelectorAll('.slide'));
    const dots = Array.from(slideshow.querySelectorAll('.dot'));
    const prevBtn = slideshow.querySelector('.prev');
    const nextBtn = slideshow.querySelector('.next');
    let currentIndex = 0;
    let slideInterval; // Variable pour stocker l'intervalle de défilement automatique

    function updateSlides(newIndex) {
        slides.forEach((slide, index) => {
            slide.style.opacity = index === newIndex ? '1' : '0';
            slide.style.zIndex = index === newIndex ? '1' : '0';
        });

        dots.forEach((dot, index) => {
            dot.style.background = index === newIndex ? 'white' : 'rgba(255, 255, 255, 0.5)';
        });

        currentIndex = newIndex;
    }

    // Fonction pour passer à la slide suivante
    function nextSlide() {
        const newIndex = (currentIndex + 1) % slides.length;
        updateSlides(newIndex);
    }

    // Démarrer le défilement automatique
    function startAutoSlide() {
        // Arrêter tout intervalle existant
        if (slideInterval) {
            clearInterval(slideInterval);
        }
        // Démarrer un nouvel intervalle (toutes les 5 secondes)
        slideInterval = setInterval(nextSlide, 5000);
    }

    // Arrêter le défilement automatique (lors d'une interaction utilisateur)
    function stopAutoSlide() {
        if (slideInterval) {
            clearInterval(slideInterval);
        }
    }

    // Ajouter des gestionnaires d'événements pour les boutons
    if (prevBtn) {
        prevBtn.onclick = () => {
            stopAutoSlide(); // Arrêter le défilement automatique
            const newIndex = (currentIndex - 1 + slides.length) % slides.length;
            updateSlides(newIndex);
            startAutoSlide(); // Redémarrer le défilement automatique
        };
    }

    if (nextBtn) {
        nextBtn.onclick = () => {
            stopAutoSlide(); // Arrêter le défilement automatique
            nextSlide();
            startAutoSlide(); // Redémarrer le défilement automatique
        };
    }

    // Ajouter des gestionnaires d'événements pour les points
    dots.forEach((dot, index) => {
        dot.onclick = () => {
            stopAutoSlide(); // Arrêter le défilement automatique
            updateSlides(index);
            startAutoSlide(); // Redémarrer le défilement automatique
        };
    });

    // Ajouter des gestionnaires d'événements pour mettre en pause au survol
    slideshow.addEventListener('mouseenter', stopAutoSlide);
    slideshow.addEventListener('mouseleave', startAutoSlide);

    // Initialiser avec la première slide
    updateSlides(0);
    
    // Démarrer le défilement automatique
    startAutoSlide();
}

// Fonction pour gérer le retour (bouton "Retour" interne)
function handleBack() {
    // Si l'historique contient au moins une entrée précédente, utiliser le mécanisme natif
    if (window.history && window.history.length > 1) {
        window.history.back();
    } else {
        // Fallback : revenir à la section de sélection sur la page principale
        window.location.href = 'index.html#boost';
    }
}

// Restaurer l'interface en fonction de l'état de l'historique
window.addEventListener('popstate', (event) => {
    const state = event.state;

    isRestoringFromHistory = true;
    try {
        // Si on quitte la page de résultats, supprimer tout le bloc résultats du DOM
        if (!state || state.step !== 'result') {
            const byId = document.getElementById('vehicle-results-page');
            if (byId) byId.remove();
            const mainContent = document.querySelector('.section-container');
            if (mainContent) {
                mainContent.querySelectorAll('.results-container').forEach(el => el.remove());
            }
        }

        // S'il n'y a pas d'état structuré, on s'arrête ici
        if (!state || !state.step) {
            return;
        }

        switch (state.step) {
            case 'list':
                // Revenir à la liste des marques avec le bon onglet (Voiture, Camion, etc.)
                goToBrandList(state.type || 'cars');
                break;
            case 'brand':
                handleBrandSelection(state.brand, state.type);
                break;
            case 'model':
                handleModelSelection(state.brand, state.type, state.model);
                break;
            case 'version':
                handleVersionSelection(state.brand, state.type, state.model, state.version);
                break;
            case 'result':
                // Reconstruire la page de résultats à partir de l'état stocké
                handleEngineSelection(state.brand, state.type, state.model, state.version, {
                    type: state.engine || 'Moteur non spécifié',
                    engineType: state.engine || 'Moteur non spécifié',
                    powerOriginal: state.powerOriginal || '00',
                    powerStage1: state.powerStage1 || '00',
                    torqueOriginal: state.torqueOriginal || '00',
                    torqueStage1: state.torqueStage1 || '00'
                });
                break;
            default:
                // Vue initiale : onglets + grilles, on laisse le DOM tel quel
                break;
        }
    } finally {
        isRestoringFromHistory = false;
    }
});

// Variable globale pour stocker le contenu CSV
let csvContent = '';

// Mise en cache des données
let csvCache = null;

async function fetchCSV() {
    try {
    if (csvCache) {
        return csvCache;
    }
    
        const response = await fetch('data/vehicles.csv');
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        csvCache = await response.text();
        return csvCache;
    } catch (error) {
        console.error('Erreur lors du chargement du CSV:', error);
        return '';
    }
}

// Initialisation
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('data/marques.csv');
        if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
        
        csvContent = await response.text();
        const lines = parseCSV(csvContent);
        const brands = extractBrands(lines);
        cachedBrands = brands;
        
        const defaultTab = document.querySelector('.tab-button.active');
        if (defaultTab) {
            const defaultType = defaultTab.dataset.type;
            displayBrands(brands, defaultType);

            // Définir l'état initial dans l'historique si absent
            if (!window.history.state || !window.history.state.step) {
                try {
                    window.history.replaceState({
                        step: 'list',
                        type: defaultType,
                        brand: null,
                        model: null,
                        version: null,
                        engine: null
                    }, '', window.location.href);
                } catch (e) {
                    console.error('Erreur lors de replaceState initial:', e);
                }
            }
        }
        
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (event) => {
                handleTabClick(event, brands);
            });
        });
        
        // Vérifier s'il y a des sélections précédentes à restaurer
        const savedType = sessionStorage.getItem('selectedType');
        const savedBrand = sessionStorage.getItem('selectedBrand');
        const savedModel = sessionStorage.getItem('selectedModel');
        const savedVersion = sessionStorage.getItem('selectedVersion');
        
        if (savedType && savedBrand) {
            // Simuler un clic sur l'onglet correspondant au type
            const tabButton = document.querySelector(`.tab-button[data-type="${savedType}"]`);
            if (tabButton) {
                tabButton.click();
                
                // Attendre un peu pour que les marques se chargent
                setTimeout(() => {
                    // Trouver et cliquer sur la marque sauvegardée
                    const brandElement = document.querySelector(`#${savedType}-grid .brand-item[data-brand="${savedBrand}"]`);
                    if (brandElement) {
                        brandElement.click();
                        
                        // Si un modèle était sélectionné, attendre et cliquer dessus
                        if (savedModel) {
                            setTimeout(() => {
                                const modelElement = document.querySelector(`.model-item[data-model="${savedModel}"]`);
                                if (modelElement) {
                                    modelElement.click();
                                    
                                    // Si une version était sélectionnée, attendre et cliquer dessus
                                    if (savedVersion) {
                                        setTimeout(() => {
                                            const versionElement = document.querySelector(`.version-item[data-version="${savedVersion}"]`);
                                            if (versionElement) {
                                                versionElement.click();
                                            }
                                        }, 300);
                                    }
                                }
                            }, 300);
                        }
                    }
                }, 300);
            }
            
            // Nettoyer le sessionStorage après restauration
            sessionStorage.removeItem('selectedType');
            sessionStorage.removeItem('selectedBrand');
            sessionStorage.removeItem('selectedModel');
            sessionStorage.removeItem('selectedVersion');
        }
    } catch (error) {
        // Gérer l'erreur silencieusement
    }
});

// Améliorer la mise en cache
const CACHE_VERSION = 'v1';
const CACHE_NAME = `autotech-${CACHE_VERSION}`;

async function cacheResources() {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll([
        '/css/style.css',
        '/css/results.css',
        '/images/logos/*',
        'data/marques.csv'
    ]);
}

// Mise en cache des données fréquemment utilisées
async function cacheData(key, data) {
    try {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(key, new Response(JSON.stringify(data)));
    } catch (error) {
        console.error('Erreur de cache:', error);
    }
}

// Fonction pour mettre à jour les données de performance en fonction du stage sélectionné
function updatePerformanceData(isStage2) {
    // Récupérer les éléments
    const powerStageCell = document.querySelector('.table-row:first-child .stage-value');
    const torqueStageCell = document.querySelector('.table-row:last-child .stage-value');
    const powerDiffCell = document.querySelector('.power-diff span');
    const torqueDiffCell = document.querySelector('.torque-diff span');
    const stageColumn = document.querySelector('.stage-column:nth-child(3)');
    
    // Vérifier si les valeurs sont "00"
    const powerOriginalIsZero = initialValues.powerOriginal === "00";
    const torqueOriginalIsZero = initialValues.torqueOriginal === "00";
    const powerStage1IsZero = initialValues.powerStage1 === "00";
    const torqueStage1IsZero = initialValues.torqueStage1 === "00";
    
    // Convertir en nombres si possible
    const powerOriginal = powerOriginalIsZero ? 0 : parseInt(initialValues.powerOriginal);
    const torqueOriginal = torqueOriginalIsZero ? 0 : parseInt(initialValues.torqueOriginal);
    const powerStage1 = powerStage1IsZero ? 0 : parseInt(initialValues.powerStage1);
    const torqueStage1 = torqueStage1IsZero ? 0 : parseInt(initialValues.torqueStage1);
    
    if (isStage2) {
        // Calculer les valeurs Stage 2
        const powerStage2 = powerStage1IsZero ? "00" : (powerStage1 + 10);  // +10 Hp par rapport au Stage 1
        const torqueStage2 = torqueStage1IsZero ? "00" : (torqueStage1 + 20);  // +20 Nm par rapport au Stage 1

        // Mettre à jour le titre
        stageColumn.textContent = 'STAGE2';
        
        // Mettre à jour les valeurs
        powerStageCell.textContent = powerStage2 === "00" ? "00 Hp" : `${powerStage2} Hp`;
        torqueStageCell.textContent = torqueStage2 === "00" ? "00 Nm" : `${torqueStage2} Nm`;
        
        // Calculer et mettre à jour les différences
        if (powerOriginalIsZero || powerStage2 === "00") {
            powerDiffCell.textContent = "+00 Hp";
        } else {
            powerDiffCell.textContent = `+${powerStage2 - powerOriginal} Hp`;
        }
        
        if (torqueOriginalIsZero || torqueStage2 === "00") {
            torqueDiffCell.textContent = "+00 Nm";
        } else {
            torqueDiffCell.textContent = `+${torqueStage2 - torqueOriginal} Nm`;
        }
        
        // Mettre à jour le graphique
        const chart = Chart.getChart('performanceChart');
        if (chart) {
            chart.data.datasets[1].data = [
                powerStage2 === "00" ? 0 : powerStage2, 
                torqueStage2 === "00" ? 0 : torqueStage2
            ];
            chart.data.datasets[1].label = 'Stage 2';
            chart.update();
        }
    } else {
        // Restaurer Stage 1
        stageColumn.textContent = 'STAGE1';
        powerStageCell.textContent = powerStage1IsZero ? "00 Hp" : `${powerStage1} Hp`;
        torqueStageCell.textContent = torqueStage1IsZero ? "00 Nm" : `${torqueStage1} Nm`;
        
        // Calculer et mettre à jour les différences
        if (powerOriginalIsZero || powerStage1IsZero) {
            powerDiffCell.textContent = "+00 Hp";
        } else {
            powerDiffCell.textContent = `+${powerStage1 - powerOriginal} Hp`;
        }
        
        if (torqueOriginalIsZero || torqueStage1IsZero) {
            torqueDiffCell.textContent = "+00 Nm";
        } else {
            torqueDiffCell.textContent = `+${torqueStage1 - torqueOriginal} Nm`;
        }

        // Restaurer le graphique
        const chart = Chart.getChart('performanceChart');
        if (chart) {
            chart.data.datasets[1].data = [
                powerStage1IsZero ? 0 : powerStage1, 
                torqueStage1IsZero ? 0 : torqueStage1
            ];
            chart.data.datasets[1].label = 'Stage 1';
            chart.update();
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM chargé, vérification des paramètres d\'URL...');
    
    // Vérifier d'abord les paramètres d'URL
    const paramsProcessed = checkURLParamsAndShowResults();
    
    // Si les paramètres n'ont pas été traités, vérifier le hash
    if (!paramsProcessed) {
        // Attendre que tout soit initialisé
        setTimeout(handleHashChange, 1000);
    }
    
    // Ajouter des écouteurs d'événements pour tous les liens de navigation
    // afin de supprimer les données de résultats du localStorage
    document.querySelectorAll('a:not([href^="#resultat"])').forEach(link => {
        link.addEventListener('click', function(e) {
            // Supprimer les données du localStorage
            localStorage.removeItem('vehicleResultData');
            console.log('Données de résultats supprimées du localStorage');
            // Laisser l'événement se poursuivre normalement
    });
});

    // Gérer aussi les clics sur le logo ou les liens de navigation principale
    document.querySelectorAll('header a, .logo a, nav a').forEach(link => {
        link.addEventListener('click', function(e) {
            localStorage.removeItem('vehicleResultData');
        });
    });
    
    // Ajouter un écouteur pour la touche Échap
    document.addEventListener('keydown', function(e) {
        if (e.key === "Escape") {
            localStorage.removeItem('vehicleResultData');
            console.log('Données de résultats supprimées par touche Échap');
            // Rediriger vers la page d'accueil si nous sommes sur une page de résultats
            if (document.querySelector('.results-container')) {
                window.location.href = 'index.html';
            }
        }
    });
});

// Fonction pour récupérer les données du moteur à partir d'une base de données simulée
function getEngineData(brand, model, version, engineType) {
    console.log('Recherche des données moteur pour:', brand, model, version, engineType);
    
    // S'assurer que tous les paramètres sont définis
    if (!brand || !model || !version || !engineType) {
        console.error('Paramètres incomplets pour getEngineData:', { brand, model, version, engineType });
        // Retourner "00" comme valeurs par défaut
        return { 
            powerOriginal: "00", 
            powerStage1: "00", 
            torqueOriginal: "00", 
            torqueStage1: "00",
            engineType: engineType || "Moteur non spécifié"
        };
    }

    // Nettoyer les paramètres pour éviter les problèmes de casse et d'espaces
    const cleanBrand = brand.trim();
    const cleanModel = model.trim();
    const cleanVersion = version.trim();
    const cleanEngineType = engineType.trim();
    
    // Simuler une base de données de moteurs
    const engineDatabase = {
        'BMW': {
            '1 Serie Sedan': {
                'F52 - 2018 ->': {
                    '118i 136hp': { powerOriginal: 136, powerStage1: 170, torqueOriginal: 220, torqueStage1: 300 },
                    '120i 192hp': { powerOriginal: 192, powerStage1: 230, torqueOriginal: 280, torqueStage1: 350 }
                }
            },
            '1 serie': {
                'E87 - 2007 - 2011': {
                    '116i 122hp': { powerOriginal: 122, powerStage1: 145, torqueOriginal: 185, torqueStage1: 230 },
                    '118i 143hp': { powerOriginal: 143, powerStage1: 175, torqueOriginal: 190, torqueStage1: 240 },
                    '120i 170hp': { powerOriginal: 170, powerStage1: 200, torqueOriginal: 210, torqueStage1: 260 }
                },
                'F20 - 2015 - 2018': {
                    '114D 95hp (1496cc)': { powerOriginal: 95, powerStage1: 140, torqueOriginal: 235, torqueStage1: 335 }
                }
            }
        },
        'Audi': {
            'A3': {
                '8V - 2012 - 2020': {
                    '1.4 TFSI 122hp': { powerOriginal: 122, powerStage1: 150, torqueOriginal: 200, torqueStage1: 250 },
                    '1.8 TFSI 180hp': { powerOriginal: 180, powerStage1: 210, torqueOriginal: 250, torqueStage1: 320 }
                }
            }
        },
        // Valeurs par défaut pour tous les autres cas
        'default': {
            'default': {
                'default': {
                    'default': { powerOriginal: "00", powerStage1: "00", torqueOriginal: "00", torqueStage1: "00" }
                }
            }
        }
    };
    
    // Essayer de récupérer les données du moteur
    try {
        // Rechercher dans la base de données
        let engineData;
        
        if (engineDatabase[cleanBrand] && 
            engineDatabase[cleanBrand][cleanModel] && 
            engineDatabase[cleanBrand][cleanModel][cleanVersion] && 
            engineDatabase[cleanBrand][cleanModel][cleanVersion][cleanEngineType]) {
            
            // Récupérer les données du moteur
            engineData = engineDatabase[cleanBrand][cleanModel][cleanVersion][cleanEngineType];
        } else {
            // Utiliser des valeurs par défaut
            console.warn('Données moteur non trouvées, utilisation des valeurs par défaut');
            engineData = engineDatabase['default']['default']['default']['default'];
        }
        
        // S'assurer que les valeurs sont des nombres valides ou "00" si non trouvées
        const result = {
            powerOriginal: engineData.powerOriginal === "00" ? "00" : (parseInt(engineData.powerOriginal) || "00"),
            powerStage1: engineData.powerStage1 === "00" ? "00" : (parseInt(engineData.powerStage1) || "00"),
            torqueOriginal: engineData.torqueOriginal === "00" ? "00" : (parseInt(engineData.torqueOriginal) || "00"),
            torqueStage1: engineData.torqueStage1 === "00" ? "00" : (parseInt(engineData.torqueStage1) || "00"),
            engineType: cleanEngineType
        };
        
        console.log('Données moteur trouvées:', result);
        return result;
    } catch (error) {
        console.error('Erreur lors de la récupération des données du moteur:', error);
        // Retourner "00" comme valeurs par défaut en cas d'erreur
        return { 
            powerOriginal: "00", 
            powerStage1: "00", 
            torqueOriginal: "00", 
            torqueStage1: "00",
            engineType: cleanEngineType
        };
    }
}

// Fonction pour gérer les URL avec hash
function handleHashChange() {
    const hash = window.location.hash.substring(1); // Enlever le # du début
    if (!hash) return;

    const parts = hash.split('/').filter(part => part);
    
    // Format attendu: reprogrammation/type/marque/modele/version
    if (parts.length >= 2 && parts[0] === 'reprogrammation') {
        const type = parts[1];
        const brand = parts[2] ? decodeURIComponent(parts[2].replace(/-/g, ' ')) : null;
        const model = parts[3] ? decodeURIComponent(parts[3].replace(/-/g, ' ')) : null;
        const version = parts[4] ? decodeURIComponent(parts[4].replace(/-/g, ' ')) : null;
        
        console.log('URL hash détecté:', { type, brand, model, version });
        
        // Si nous avons au moins le type et la marque, simuler la sélection
        if (type && brand) {
            // Attendre que les données soient chargées
        setTimeout(() => {
                // Simuler le clic sur l'onglet du type
                const tabButton = document.querySelector(`.tab-button[data-type="${type}"]`);
                if (tabButton) {
                    tabButton.click();
                    
                    // Simuler le clic sur la marque
                    setTimeout(() => {
                        const brandItems = document.querySelectorAll('.brand-item');
                        for (const item of brandItems) {
                            if (item.querySelector('.brand-name').textContent.trim().toLowerCase() === brand.toLowerCase()) {
                                item.click();
                                
                                // Si nous avons un modèle, simuler sa sélection
                                if (model) {
                                    setTimeout(() => {
                                        const modelItems = document.querySelectorAll('.selection-item[data-model]');
                                        for (const item of modelItems) {
                                            if (item.dataset.model.toLowerCase() === model.toLowerCase()) {
                                                item.click();
                                                
                                                // Si nous avons une version, simuler sa sélection
                                                if (version) {
                                                    setTimeout(() => {
                                                        const versionItems = document.querySelectorAll('.selection-item[data-version]');
                                                        for (const item of versionItems) {
                                                            if (item.dataset.version.toLowerCase() === version.toLowerCase()) {
                                                                item.click();
                                                                break;
                                                            }
                                                        }
                                                    }, 500);
                                                }
                                                break;
                                            }
                                        }
                                    }, 500);
                                }
                                break;
                            }
                        }
                    }, 500);
                }
            }, 1000);
        }
    }
}

// Écouter les changements de hash
window.addEventListener('hashchange', handleHashChange);

// Vérifier le hash au chargement initial
document.addEventListener('DOMContentLoaded', () => {
    // Attendre que tout soit initialisé
    setTimeout(handleHashChange, 1500);
});

// Utiliser IntersectionObserver pour charger les images de marque à la demande
document.addEventListener('DOMContentLoaded', function() {
    // Créer un observateur pour charger les images quand elles deviennent visibles
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                const dataSrc = img.getAttribute('data-src');
                if (dataSrc) {
                    img.src = dataSrc;
                    img.removeAttribute('data-src');
                }
                observer.unobserve(img);
            }
        });
    }, {
        rootMargin: '50px 0px',
        threshold: 0.1
    });
    
    // Appliquer l'observateur aux images de marque
    function setupLazyLoading() {
        document.querySelectorAll('.brand-logo[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }
    
    // Configurer le chargement paresseux après le chargement des marques
    const originalLoadBrands = window.loadBrands;
    if (originalLoadBrands) {
        window.loadBrands = function(type) {
            originalLoadBrands(type);
            setupLazyLoading();
        };
    }
    
    // Optimiser les gestionnaires d'événements avec debounce
    const resizeHandler = debounce(function() {
        // Recalculer les dimensions si nécessaire
        }, 100);
    
    window.addEventListener('resize', resizeHandler);
});

// Fonction pour vérifier les paramètres d'URL et afficher directement les résultats si nécessaire
function checkURLParamsAndShowResults() {
    // Vérifions d'abord si nous sommes sur une page autre que la page de résultats
    // Si l'URL contient certains identifiants spécifiques de pages, nous ne traitons pas les résultats
    const currentPath = window.location.pathname.toLowerCase();
    if (currentPath.includes('contact.html') || 
        currentPath.includes('merci.html') || 
        currentPath.includes('qui-sommes-nous.html') ||
        currentPath.includes('echapp.html') ||
        currentPath.includes('dyno.html') ||
        currentPath.includes('options-reprog.html')) {
        
        // On est sur une autre page, donc on nettoie le localStorage et on ne traite pas les résultats
        localStorage.removeItem('vehicleResultData');
        return false;
    }
    
    // D'abord, vérifions les paramètres dans l'URL actuelle
    // Récupérer les paramètres de l'URL
    const urlParams = new URLSearchParams(window.location.search);
    const brand = urlParams.get('brand');
    const model = urlParams.get('model');
    const version = urlParams.get('version');
    const engineType = urlParams.get('engine');
    
    // Récupérer aussi les valeurs de performance si elles sont disponibles dans l'URL
    const powerOriginal = urlParams.get('po');
    const powerStage1 = urlParams.get('ps');
    const torqueOriginal = urlParams.get('to');
    const torqueStage1 = urlParams.get('ts');
    
    // Vérifier si nous avons tous les paramètres de base dans l'URL actuelle
    const hasCurrentURLParams = brand && model && version && engineType;
    
    // Récupérer le hash pour déterminer le type de véhicule
    const hash = window.location.hash.substring(1);
    const parts = hash.split('/').filter(part => part);
    
    // Si l'URL contient tous les paramètres nécessaires, traiter en priorité cette URL
    if (hasCurrentURLParams && parts.length >= 2 && parts[0] === 'reprogrammation') {
        const type = parts[1]; // cars, motorcycles, etc.
        
        console.log('Paramètres d\'URL détectés:', { brand, model, version, type, engineType });
        
        // Effacer les anciens résultats du localStorage pour éviter les conflits
        localStorage.removeItem('vehicleResultData');
        
        // Attendre que le DOM soit complètement chargé
        setTimeout(() => {
            try {
                // Vérifier si nous avons les valeurs de performance dans l'URL
                let engineData;
                
                if (powerOriginal && powerStage1 && torqueOriginal && torqueStage1) {
                    // Si toutes les valeurs sont dans l'URL, les utiliser directement
                    console.log('Utilisation des valeurs de performance depuis l\'URL');
                    engineData = {
                        powerOriginal: parseInt(powerOriginal) || "00",
                        powerStage1: parseInt(powerStage1) || "00",
                        torqueOriginal: parseInt(torqueOriginal) || "00",
                        torqueStage1: parseInt(torqueStage1) || "00",
                        engineType: engineType
                    };
    } else {
                    // Sinon, récupérer les données du moteur depuis la base de données
                    engineData = getEngineData(brand, model, version, engineType);
                }
                
                // S'assurer que engineData contient les propriétés nécessaires
                if (!engineData || typeof engineData !== 'object') {
                    throw new Error('Données moteur invalides');
                }
                
                // Mettre à jour la sélection courante
                currentSelection = {
                    brand: brand,
                    model: model,
                    version: version,
                    type: type,
                    engine: engineType,
                    powerOriginal: engineData.powerOriginal,
                    powerStage1: engineData.powerStage1,
                    torqueOriginal: engineData.torqueOriginal,
                    torqueStage1: engineData.torqueStage1
                };
                
                // Stocker ces données dans localStorage pour une meilleure persistance
                localStorage.setItem('vehicleResultData', JSON.stringify({
                    brand,
                    model,
                    version,
                    engineType,
                    powerOriginal: engineData.powerOriginal,
                    powerStage1: engineData.powerStage1,
                    torqueOriginal: engineData.torqueOriginal,
                    torqueStage1: engineData.torqueStage1,
                    timestamp: Date.now(),
                    url: window.location.href // Stocker l'URL associée à ces données
                }));
                
                // Pour les URL partagées, s'assurer que l'engineType est toujours défini correctement
                if (!engineData.engineType) {
                    engineData.engineType = engineType;
                }
                
                // Simuler la sélection du moteur pour afficher la page de résultats
                handleEngineSelection(brand, type, model, version, engineData);
                
                console.log('Page de résultats affichée directement depuis l\'URL');
                
                return true; // Indiquer que nous avons traité les paramètres d'URL
            } catch (error) {
                console.error('Erreur lors de l\'affichage de la page de résultats:', error);
            }
        }, 500);
        
        return true; // Indiquer que nous avons traité les paramètres d'URL
    }
    
    // Si on n'a pas de paramètres dans l'URL actuelle, utiliser le localStorage en dernier recours
    try {
        const storedData = localStorage.getItem('vehicleResultData');
        if (storedData) {
            const data = JSON.parse(storedData);
            // Vérifier si les données ne sont pas trop anciennes (24h max)
            const now = Date.now();
            const dataAge = now - (data.timestamp || 0);
            
            // Vérifier si l'URL actuelle correspond à celle stockée
            const currentURL = window.location.href;
            const storedURL = data.url || '';
            
            // Si l'URL stockée existe et ne correspond pas à l'URL actuelle, ne pas utiliser les données stockées
            if (storedURL && storedURL !== currentURL) {
                console.log('L\'URL actuelle ne correspond pas à l\'URL stockée, suppression des données');
                localStorage.removeItem('vehicleResultData');
                return false;
            }
            
            if (dataAge < 24 * 60 * 60 * 1000) {
                console.log('Utilisation des données stockées pour afficher les résultats');
                
                // Vérifier que toutes les données nécessaires sont présentes
                if (data.brand && data.model && data.version && data.engineType) {
                    // Utiliser directement les données stockées
                    currentSelection = {
                        brand: data.brand,
                        model: data.model,
                        version: data.version,
                        type: getVehicleTypeFromURL() || 'cars',
                        engine: data.engineType,
                        powerOriginal: data.powerOriginal || "00",
                        powerStage1: data.powerStage1 || "00",
                        torqueOriginal: data.torqueOriginal || "00",
                        torqueStage1: data.torqueStage1 || "00"
                    };
                    
                    // Simuler la sélection du moteur pour afficher la page de résultats
                    handleEngineSelection(data.brand, currentSelection.type, data.model, data.version, {
                        type: data.engineType,
                        powerOriginal: data.powerOriginal || "00",
                        powerStage1: data.powerStage1 || "00",
                        torqueOriginal: data.torqueOriginal || "00",
                        torqueStage1: data.torqueStage1 || "00",
                        engineType: data.engineType
                    });
                    
                    return true;
                } else {
                    console.error('Données localStorage incomplètes, suppression');
                    localStorage.removeItem('vehicleResultData');
                }
            } else {
                // Les données sont trop anciennes, les supprimer
                console.log('Données localStorage expirées, suppression');
                localStorage.removeItem('vehicleResultData');
            }
        }
    } catch (error) {
        console.error('Erreur lors de la récupération des données stockées:', error);
        localStorage.removeItem('vehicleResultData');
    }
    
    return false; // Indiquer que nous n'avons pas traité les paramètres d'URL
}

// Fonction pour gérer le clic sur le bouton "Réserver maintenant"
function handleReservation(brand, model, version, engineType) {
    console.log("handleReservation appelée avec:", brand, model, version, engineType);
    
    // Récupérer les valeurs de puissance et de couple depuis initialValues
    // Vérifier si initialValues est défini correctement
    console.log("initialValues:", initialValues);
    
    let powerOriginal = 0;
    let powerStage1 = 0;
    let torqueOriginal = 0;
    let torqueStage1 = 0;
    
    // Utiliser les valeurs de initialValues si elles sont définies
    if (initialValues && typeof initialValues === 'object') {
        powerOriginal = initialValues.powerOriginal || 0;
        powerStage1 = initialValues.powerStage1 || 0;
        torqueOriginal = initialValues.torqueOriginal || 0;
        torqueStage1 = initialValues.torqueStage1 || 0;
    }
    
    // Calculer les gains
    const powerGain = powerStage1 - powerOriginal;
    const torqueGain = torqueStage1 - torqueOriginal;
    
    // Créer un message préformaté avec les détails du véhicule et les performances
    const prefilledMessage = `Demande de reprogrammation pour :
- Marque : ${brand}
- Modèle : ${model}
- Version : ${version}
- Motorisation : ${engineType}

Performances :
- Puissance d'origine : ${powerOriginal} Hp
- Puissance après reprog Stage 1 : ${powerStage1} Hp (Gain : +${powerGain} Hp)
- Couple d'origine : ${torqueOriginal} Nm
- Couple après reprog Stage 1 : ${torqueStage1} Nm (Gain : +${torqueGain} Nm)

Merci de me contacter pour plus d'informations.`;

    console.log("Message préformaté:", prefilledMessage);
    
    // Stocker le message dans le localStorage
    localStorage.setItem('prefilledMessage', prefilledMessage);
    
    // Rediriger vers la section contact
    window.location.href = 'index.html#contact';
}

// Fonction pour remplir le formulaire de contact avec les données stockées
function fillContactForm() {
    console.log("fillContactForm appelée");
    
    // Vérifier si nous sommes sur la page avec le formulaire de contact
    const contactForm = document.getElementById('contactForm');
    if (!contactForm) {
        console.log("Formulaire de contact non trouvé");
        return;
    }
    
    // Vérifier si nous avons un message préformaté dans le localStorage
    const prefilledMessage = localStorage.getItem('prefilledMessage');
    if (!prefilledMessage) {
        console.log("Pas de message préformaté trouvé dans localStorage");
        return;
    }
    
    console.log("Message préformaté trouvé:", prefilledMessage);
    
    // Remplir le champ message
    const messageField = document.getElementById('message');
    if (messageField) {
        console.log("Champ message trouvé, remplissage en cours...");
        messageField.value = prefilledMessage;
        
        // Sélectionner "Reprogrammation" dans le menu déroulant
        const subjectField = document.getElementById('subject');
        if (subjectField) {
            console.log("Champ sujet trouvé, sélection de 'reprog'");
            subjectField.value = 'reprog';
    } else {
            console.log("Champ sujet non trouvé");
        }
        
        // Supprimer le message du localStorage après utilisation
        console.log("Suppression du message du localStorage");
        localStorage.removeItem('prefilledMessage');
    } else {
        console.log("Champ message non trouvé");
    }
}

// Ajouter l'événement au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOMContentLoaded - Appel de fillContactForm");
    fillContactForm();
    
    // Vérifier si l'URL contient l'ancre #contact
    if (window.location.hash === '#contact') {
        console.log("Ancre #contact détectée, appel de fillContactForm");
        // Attendre un peu que la page se charge complètement
        setTimeout(fillContactForm, 500);
    }
});

// Ajouter un écouteur pour les changements de hash dans l'URL
window.addEventListener('hashchange', function() {
    console.log("Changement de hash détecté:", window.location.hash);
    if (window.location.hash === '#contact') {
        console.log("Ancre #contact détectée après changement de hash, appel de fillContactForm");
        // Attendre un peu que la section se charge
        setTimeout(fillContactForm, 500);
    }
});

// Initialiser le sélecteur de véhicule
function initVehicleSelector() {
    // Vérifier si nous devons restaurer une sélection précédente
    const urlParams = new URLSearchParams(window.location.search);
    const shouldRestore = urlParams.get('restore') === 'true';
    const returnToEngines = urlParams.get('returnToEngines') === 'true';
    
    // Vérifier si nous devons restaurer spécifiquement à la page des motorisations
    if (returnToEngines && localStorage.getItem('navState')) {
        try {
            const navState = JSON.parse(localStorage.getItem('navState'));
            
            if (navState.step === 'engines' && navState.brand && navState.model && navState.version && navState.type) {
                // Attendre que le DOM soit complètement chargé
                setTimeout(() => {
                    // Sélectionner le type de véhicule
                    const typeSelector = document.querySelector(`[data-vehicle-type="${navState.type}"]`);
                    if (typeSelector) {
                        typeSelector.click();
                        
                        // Puis restaurer la sélection de marque
                        setTimeout(() => {
                            handleBrandSelection(navState.brand, navState.type);
                            
                            // Puis restaurer la sélection de modèle
                            setTimeout(() => {
                                handleModelSelection(navState.brand, navState.type, navState.model);
                                
                                // Puis restaurer la sélection de version pour arriver à la liste des motorisations
                                setTimeout(() => {
                                    handleVersionSelection(navState.brand, navState.type, navState.model, navState.version);
                                    
                                    // Nettoyer l'état de navigation après restauration
                                    localStorage.removeItem('navState');
                                }, 300);
                            }, 300);
                        }, 300);
                    }
                }, 300);
            }
        } catch (error) {
            console.error('Erreur lors de la restauration à l\'étape des motorisations:', error);
            localStorage.removeItem('navState');
        }
        return; // Sortir de la fonction après avoir traité le cas spécial
    }
    
    if (shouldRestore && localStorage.getItem('previousSelection')) {
        // Code existant pour la restauration générale
        try {
            const previousSelection = JSON.parse(localStorage.getItem('previousSelection'));
            
            // Attendre que le DOM soit complètement chargé avant de restaurer la sélection
            setTimeout(() => {
                // Sélectionner le type de véhicule
                if (previousSelection.type) {
                    const typeSelector = document.querySelector(`[data-vehicle-type="${previousSelection.type}"]`);
                    if (typeSelector) {
                        typeSelector.click();
                        
                        // Attendre que les marques soient chargées
                        setTimeout(() => {
                            // Sélectionner la marque
                            if (previousSelection.brand) {
                                const brandElements = document.querySelectorAll('.brand-item');
                                for (const brandEl of brandElements) {
                                    if (brandEl.getAttribute('data-brand').trim() === previousSelection.brand.trim()) {
                                        brandEl.click();
                                        
                                        // Attendre que les modèles soient chargés
                                        setTimeout(() => {
                                            // Sélectionner le modèle
                                            if (previousSelection.model) {
                                                const modelElements = document.querySelectorAll('.model-item');
                                                for (const modelEl of modelElements) {
                                                    if (modelEl.getAttribute('data-model').trim() === previousSelection.model.trim()) {
                                                        modelEl.click();
                                                        
                                                        // Attendre que les versions soient chargées
                                                        setTimeout(() => {
                                                            // Sélectionner la version
                                                            if (previousSelection.version) {
                                                                const versionElements = document.querySelectorAll('.version-item');
                                                                for (const versionEl of versionElements) {
                                                                    if (versionEl.getAttribute('data-version').trim() === previousSelection.version.trim()) {
                                                                        versionEl.click();
                                                                        
                                                                        // Si nous avons aussi le type de moteur, attendre et le sélectionner
                                                                        if (previousSelection.engineType) {
                                                                            setTimeout(() => {
                                                                                const engineElements = document.querySelectorAll('.engine-item');
                                                                                for (const engineEl of engineElements) {
                                                                                    if (engineEl.getAttribute('data-type').trim() === previousSelection.engineType.trim()) {
                                                                                        // Ne pas cliquer car cela nous ramènerait aux résultats
                                                                                        // Mais plutôt mettre en évidence cette option
                                                                                        engineEl.classList.add('selected');
                                                                                        break;
                                                                                    }
                                                                                }
                                                                            }, 300);
                                                                        }
                                                                        
                                                                        // Effacer la sélection précédente
                                                                        localStorage.removeItem('previousSelection');
                                                                        break;
                                                                    }
                                                                }
                                                            }
                                                        }, 300);
                                                        break;
                                                    }
                                                }
                                            }
                                        }, 300);
                                        break;
                                    }
                                }
                            }
                        }, 300);
                    }
                }
            }, 300);
        } catch (error) {
            console.error('Erreur lors de la restauration de la sélection:', error);
            localStorage.removeItem('previousSelection');
        }
    }
    
    // Vérifie s'il y a une sélection à afficher directement depuis l'URL
    checkUrlForSelection();

    // Ajouter des écouteurs d'événements pour les interactions
    addEventListeners();

    // Charger les données depuis le fichier CSV
    loadCsvData();

    // Charger les explications des options
    loadOptionExplanations();
}

// Ajouter un écouteur pour le chargement du DOM
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM chargé, vérification de l'URL");
    
    // Vérifier si nous sommes sur la section #boost
    if (window.location.hash === '#boost' || window.location.hash === '' || window.location.hash === '#') {
        console.log("Section #boost détectée ou page d'accueil, initialisation du sélecteur de véhicule");
        // Initialiser le sélecteur de véhicule
        initVehicleSelector();
    }
});

// Ajouter un écouteur pour les changements de hash dans l'URL
window.addEventListener('hashchange', function() {
    console.log("Changement de hash détecté:", window.location.hash);
    
    // Vérifier si nous sommes sur la section #boost
    if (window.location.hash === '#boost') {
        console.log("Section #boost détectée après changement de hash, initialisation du sélecteur de véhicule");
        // Initialiser le sélecteur de véhicule
        initVehicleSelector();
    }
});

// Fonction pour déterminer le type de véhicule à partir de l'URL
function getVehicleTypeFromURL() {
    const hash = window.location.hash.substring(1);
    const parts = hash.split('/').filter(part => part);
    
    if (parts.length >= 2 && parts[0] === 'reprogrammation') {
        return parts[1]; // cars, motorcycles, etc.
    }
    
    return null;
}
