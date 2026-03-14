// Gestion du défilement vers la section boost
document.addEventListener('DOMContentLoaded', () => {
    const boostButton = document.querySelector('.boost-button');
    if (boostButton) {
        boostButton.addEventListener('click', function(e) {
            e.preventDefault();
            if (window.innerWidth <= 768) {
                // Version mobile
                const vehicleSelector = document.querySelector('.vehicle-selector');
                const sectionTitle = vehicleSelector.querySelector('.section-title:nth-of-type(2)');
                
                if (sectionTitle) {
                    // Calcul de la position absolue
                    let offset = 0;
                    let element = sectionTitle;
                    
                    while (element) {
                        offset += element.offsetTop;
                        element = element.offsetParent;
                    }
                    
                    // Augmenter le décalage du header pour la version mobile
                    offset -= 100; // Augmenté de 60 à 100 pour assurer que le titre soit visible
                    
                    // Forcer le défilement
                    setTimeout(() => {
                        window.scrollTo({
                            top: offset,
                            behavior: 'smooth'
                        });
                    }, 100);
                }
            } else {
                // Version PC - comportement inchangé
                const targetSection = document.getElementById('boost');
                if (targetSection) {
                    const headerHeight = 80;
                    const elementPosition = targetSection.getBoundingClientRect().top + window.pageYOffset;
                    const offsetPosition = elementPosition - headerHeight;

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                }
            }
        });
    }

    // Garder la partie existante pour la version PC
    if (window.innerWidth > 768) {
        const scrollTarget = localStorage.getItem('scrollTarget');
        if (scrollTarget) {
            setTimeout(() => {
                const element = document.getElementById(scrollTarget);
                if (element) {
                    const headerHeight = 80;
                    const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
                    const offsetPosition = elementPosition - headerHeight;

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'instant'
                    });
                }
                localStorage.removeItem('scrollTarget');
            }, 0);
        }
    }

    // Bouton de retour en haut de page
    const scrollToTopButton = document.querySelector('.scroll-to-top');
    
    if (scrollToTopButton) {
        // Afficher/masquer le bouton en fonction du défilement
        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 300) {
                scrollToTopButton.classList.add('visible');
            } else {
                scrollToTopButton.classList.remove('visible');
            }
        });
        
        // Défilement vers le haut lors du clic
        scrollToTopButton.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
}); 