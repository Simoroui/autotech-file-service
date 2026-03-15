// Fonction pour créer les circuits électroniques
function createCircuits() {
    const container = document.getElementById('techCircuit');
    if (!container) return;
    
    // Vider le conteneur
    container.innerHTML = '';
    
    // Créer des lignes horizontales
    for (let i = 0; i < 10; i++) {
        const line = document.createElement('div');
        line.className = 'circuit-line horizontal';
        
        const top = Math.random() * 100 + '%';
        const left = Math.random() * 40 + '%';
        const width = Math.random() * 60 + 40 + 'px';
        
        line.style.top = top;
        line.style.left = left;
        line.style.width = width;
        line.style.animationDelay = (Math.random() * 4) + 's';
        
        container.appendChild(line);
    }
    
    // Créer des lignes verticales
    for (let i = 0; i < 10; i++) {
        const line = document.createElement('div');
        line.className = 'circuit-line vertical';
        
        const top = Math.random() * 40 + '%';
        const left = Math.random() * 100 + '%';
        const height = Math.random() * 60 + 40 + 'px';
        
        line.style.top = top;
        line.style.left = left;
        line.style.height = height;
        line.style.animationDelay = (Math.random() * 4) + 's';
        
        container.appendChild(line);
    }
    
    // Créer des noeuds
    for (let i = 0; i < 15; i++) {
        const node = document.createElement('div');
        node.className = 'circuit-node';
        
        const top = Math.random() * 100 + '%';
        const left = Math.random() * 100 + '%';
        
        node.style.top = top;
        node.style.left = left;
        node.style.animationDelay = (Math.random() * 2) + 's';
        
        container.appendChild(node);
    }
}

// Fonction pour créer les particules technologiques
function createTechParticles() {
    const container = document.getElementById('techParticles');
    if (!container) return;
    
    // Vider le conteneur
    container.innerHTML = '';
    
    // Créer des particules
    for (let i = 0; i < 30; i++) {
        const particle = document.createElement('div');
        particle.className = 'tech-particle';
        
        // Position et animation aléatoires
        const startX = Math.random() * 100 + 'vw';
        const startY = Math.random() * 100 + 'vh';
        const endX = Math.random() * 100 + 'vw';
        const endY = Math.random() * 100 + 'vh';
        const duration = (Math.random() * 20 + 10) + 's';
        const delay = (Math.random() * 5) + 's';
        const opacity = Math.random() * 0.5 + 0.3;
        
        // Appliquer les variables CSS personnalisées
        particle.style.setProperty('--startX', startX);
        particle.style.setProperty('--startY', startY);
        particle.style.setProperty('--endX', endX);
        particle.style.setProperty('--endY', endY);
        particle.style.setProperty('--duration', duration);
        particle.style.setProperty('--delay', delay);
        particle.style.setProperty('--opacity', opacity);
        
        // Taille et position aléatoires
        particle.style.left = Math.random() * 100 + 'vw';
        particle.style.top = Math.random() * 100 + 'vh';
        particle.style.width = (Math.random() * 3 + 1) + 'px';
        particle.style.height = (Math.random() * 3 + 1) + 'px';
        particle.style.animationDelay = delay;
        
        container.appendChild(particle);
    }
}

// Fonction pour gérer l'écran de démarrage (splash screen)
function initializeSplashScreen() {
    const splashScreen = document.getElementById('splash-screen');
    const loadingBar = document.querySelector('.loading-bar');
    const pageWrapper = document.querySelector('.page-wrapper');
    
    if (!splashScreen || !loadingBar || !pageWrapper) {
        console.error('Éléments du splash screen non trouvés');
        return;
    }
    
    // Créer les particules technologiques
    createTechParticles();
    
    // Créer les circuits électroniques
    createCircuits();
    
    // Masquer la page principale pendant le chargement
    pageWrapper.style.visibility = 'hidden';
    
    // Liste des éléments à précharger
    const imagesToLoad = [
        'images/logo-min.png',
        'images/Logo-H.png',
        'images/apropos.jpg',
        'images-optimized/hero-bg.jpg'
    ];
    
    // Liste des ressources CSS et JS
    const resourcesToLoad = [
        'css/style.css',
        'css/header.css',
        'css/footer.css',
        'js/header.js',
        'js/vehicle-selector.js',
        'js/slideshow.js'
    ];
    
    // Combiner toutes les ressources
    const allResources = [...imagesToLoad, ...resourcesToLoad];
    let loadedCount = 0;
    
    // Fonction pour mettre à jour la barre de progression
    function updateProgressBar() {
        const progress = (loadedCount / allResources.length) * 100;
        loadingBar.style.width = `${progress}%`;
        
        if (loadedCount === allResources.length) {
            // Toutes les ressources sont chargées
            setTimeout(() => {
                // Afficher la page principale
                pageWrapper.style.visibility = 'visible';
                
                // Masquer le splash screen avec une transition
                splashScreen.classList.add('hidden');
                
                // Retirer complètement le splash screen après la transition
                setTimeout(() => {
                    splashScreen.style.display = 'none';
                }, 500);
            }, 800); // Petit délai pour voir la barre à 100%
        }
    }
    
    // Précharger les images
    imagesToLoad.forEach(src => {
        const img = new Image();
        img.onload = () => {
            loadedCount++;
            updateProgressBar();
        };
        img.onerror = () => {
            console.error(`Erreur de chargement de l'image: ${src}`);
            loadedCount++;
            updateProgressBar();
        };
        img.src = src;
    });
    
    // Simuler le chargement des autres ressources
    resourcesToLoad.forEach(resource => {
        // Simuler différents temps de chargement pour les ressources
        setTimeout(() => {
            loadedCount++;
            updateProgressBar();
        }, Math.random() * 1500 + 500);
    });
    
    // Si toutes les ressources ne se chargent pas dans un délai raisonnable,
    // forcer l'affichage du site après 8 secondes
    setTimeout(() => {
        if (loadedCount < allResources.length) {
            console.warn('Chargement forcé après délai d\'attente');
            loadedCount = allResources.length;
            updateProgressBar();
        }
    }, 8000);
}

// Fonction pour le diaporama dans la section À propos
function initializeSlideshow() {
    console.log('Initialisation du diaporama...');
    const slides = document.querySelectorAll('.slideshow-slide .about-image');
    console.log('Nombre de slides trouvées:', slides.length);
    
    if (slides.length === 0) {
        console.log('Aucune slide trouvée');
        return;
    }
    
    let currentSlide = 0;
    
    function showNextSlide() {
        // Masquer la slide active actuelle
        slides[currentSlide].classList.remove('active');
        
        // Passer à la slide suivante (ou revenir à la première)
        currentSlide = (currentSlide + 1) % slides.length;
        
        // Afficher la nouvelle slide active
        slides[currentSlide].classList.add('active');
        console.log('Changement vers la slide', currentSlide);
    }
    
    // Changer de slide toutes les 5 secondes
    setInterval(showNextSlide, 5000);
}

// Exécuter les fonctions une fois que le DOM est chargé
document.addEventListener('DOMContentLoaded', function() {
    // Initialiser le splash screen en premier
    initializeSplashScreen();
    
    // Initialiser le diaporama (sera exécuté même pendant que le splash screen est affiché)
    initializeSlideshow();
    
    // ... autres fonctions d'initialisation existantes ...
}); 