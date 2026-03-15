// Message initial pour confirmer que le script est chargé
console.log('%c=== Initialisation du Menu Hamburger ===', 'background: #222; color: #bada55; padding: 5px;');

// Déclarer les variables
let hamburgerMenu;
let navLinks;
let body;
let header;

// Fonction pour initialiser la navigation une fois le DOM chargé
function initNavigation() {
    hamburgerMenu = document.querySelector('.hamburger-menu');
    navLinks = document.querySelector('.nav-container');
    body = document.body;
    header = document.querySelector('.header');

    if (hamburgerMenu) {
        hamburgerMenu.addEventListener('click', function() {
            hamburgerMenu.classList.toggle('active');
            navLinks.classList.toggle('active');
            body.classList.toggle('menu-open');
        });
    }

    // Ajout de la classe sticky au header lors du défilement
    window.addEventListener('scroll', handleScroll);
    
    // Gestion du scroll-to-top
    const scrollButton = document.querySelector('.scroll-button');
    if (scrollButton) {
        scrollButton.addEventListener('click', function(e) {
            e.preventDefault();
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
    
    // Exécuter le code uniquement si nous sommes sur la page d'accueil
    if (window.location.pathname === '/' || window.location.pathname.includes('index.html')) {
        // Code spécifique à la page d'accueil
        handleHomePageScripts();
    }
}

// Fonction pour gérer le header lors du défilement
function handleScroll() {
    if (!header) return;
    
    if (window.scrollY > 50) {
        header.classList.add('sticky');
    } else {
        header.classList.remove('sticky');
    }
}

// Fonction pour les scripts spécifiques à la page d'accueil
function handleHomePageScripts() {
    // Code spécifique à la page d'accueil
    // À exécuter seulement si nécessaire
}

// Utiliser requestIdleCallback ou setTimeout pour retarder l'initialisation des fonctionnalités non critiques
if ('requestIdleCallback' in window) {
    // Utiliser requestIdleCallback si disponible (meilleure performance)
    window.requestIdleCallback(function() {
        // Initialiser la navigation
        initNavigation();
    });
} else {
    // Fallback pour les navigateurs qui ne supportent pas requestIdleCallback
    setTimeout(function() {
        // Initialiser la navigation
        initNavigation();
    }, 50); // Un court délai pour permettre à la page de se rendre d'abord
}

// Vérifier si le DOM est déjà chargé
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        // Gérer les scripts critiques immédiatement
        if (header) {
            handleScroll();
        }
    });
} else {
    // Si le DOM est déjà chargé, exécuter immédiatement
    if (header) {
        handleScroll();
    }
}

// Fonction pour fermer le menu
const closeMenu = () => {
    hamburgerMenu.classList.remove('active');
    navLinks.classList.remove('active');
    body.classList.remove('menu-open');
    if (header) header.style.display = 'flex';
    console.log('Menu fermé');
};

// Fonction pour vérifier si nous sommes sur la page d'accueil
const isHomePage = () => {
    const path = window.location.pathname;
    return path.endsWith('index.html') || 
           path.endsWith('/') || 
           path.endsWith('/autotech-reprog/') || 
           path.endsWith('/autotech-reprog/index.html');
};

// Fonction pour gérer le scroll vers une ancre
const scrollToAnchor = (targetId) => {
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
        const headerHeight = document.querySelector('.header').offsetHeight;
        const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight;
        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
    }
};

// Fonction pour mettre à jour le lien actif
const updateActiveLink = () => {
    const path = window.location.pathname;
    const currentPage = path.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links > li > a').forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage || (isHomePage() && href === '#')) {
            link.parentElement.classList.add('current-page');
        } else {
            link.parentElement.classList.remove('current-page');
        }
    });
};

// Gestionnaire pour tous les liens du menu
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', (e) => {
        if (window.innerWidth <= 768) {
            const href = link.getAttribute('href');
            const isAnchorLink = href.includes('#');
            
            if (isHomePage() && isAnchorLink) {
                // Si on est sur la page d'accueil et que c'est un lien d'ancrage
                e.preventDefault();
                closeMenu();
                // Ajouter un petit délai pour le défilement
                setTimeout(() => {
                    const targetId = href.split('#')[1];
                    scrollToAnchor(targetId);
                }, 300);
            } else if (isAnchorLink && !isHomePage()) {
                // Si c'est un lien d'ancrage mais qu'on n'est pas sur la page d'accueil
                closeMenu();
                // Stocker l'ancre pour le scroll après le chargement de la page
                const targetId = href.split('#')[1];
                localStorage.setItem('scrollTarget', targetId);
            } else {
                // Pour les autres liens
                closeMenu();
            }
        }
    });
});

// Vérifier s'il y a une ancre à scroller au chargement
const scrollTarget = localStorage.getItem('scrollTarget');
if (scrollTarget && isHomePage()) {
    setTimeout(() => {
        scrollToAnchor(scrollTarget);
        localStorage.removeItem('scrollTarget');
    }, 500);
}

// Mettre à jour le lien actif au chargement
updateActiveLink();

// Mettre à jour le lien du logo
const logoLink = document.querySelector('.logo a');
if (logoLink) {
    const isGitHubPages = window.location.hostname === 'simoroui.github.io';
    logoLink.href = isGitHubPages 
        ? 'https://simoroui.github.io/autotech-reprog/'
        : '/';
}

console.log('[Menu] Initialisation terminée');

// Fonction pour corriger les liens du header avec les hash URL
function fixHeaderLinks() {
    // Obtenir le domaine de base
    const isGitHubPages = window.location.hostname === 'simoroui.github.io';
    const basePath = isGitHubPages ? '/autotech-reprog/' : '/';
    
    // Sélectionner tous les liens de la page
    const allLinks = document.querySelectorAll('a');
    
    allLinks.forEach(link => {
        const href = link.getAttribute('href');
        
        // Ne modifier que les liens relatifs simples (sans / au début)
        if (href && !href.startsWith('/') && !href.startsWith('http') && !href.startsWith('#')) {
            // Vérifier si c'est un lien vers une page HTML
            if (href.endsWith('.html')) {
                // Convertir les liens relatifs en liens absolus
                const absoluteHref = basePath + href;
                link.setAttribute('href', absoluteHref);
                
                // Ajouter un gestionnaire d'événements pour effacer le hash lors du clic
                link.addEventListener('click', function(e) {
                    // Si nous avons un hash dans l'URL actuelle, le supprimer avant de naviguer
                    if (window.location.hash) {
                        // Empêcher la navigation par défaut
                        e.preventDefault();
                        
                        // Naviguer vers le lien absolu sans le hash
                        window.location.href = absoluteHref;
                    }
                });
            }
        }
    });
    
    // Ajouter un gestionnaire spécial pour le logo qui doit toujours revenir à la page d'accueil
    const logoLinks = document.querySelectorAll('.logo a, .footer-logo a');
    logoLinks.forEach(link => {
        const homeHref = basePath;
        link.setAttribute('href', homeHref);
        
        // S'assurer que le clic sur le logo efface toujours le hash
        link.addEventListener('click', function(e) {
            if (window.location.hash) {
                e.preventDefault();
                window.location.href = homeHref;
            }
        });
    });
}

// Exécuter la fonction lorsque le DOM est chargé
document.addEventListener('DOMContentLoaded', fixHeaderLinks);

// Réappliquer la correction après un changement de hash
window.addEventListener('hashchange', fixHeaderLinks); 