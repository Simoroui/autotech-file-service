function addSocialIcons() {
    // Vérifier si les icônes existent déjà
    if (document.querySelector('.header-social')) {
        return; // Ne rien faire si les icônes sont déjà présentes
    }

    const header = document.querySelector('.header-container');
    if (header) {
        const socialIcons = document.createElement('div');
        socialIcons.className = 'header-social';
        socialIcons.style.cssText = `
            display: flex;
            gap: 15px;
            margin-left: auto;
            margin-right: 30px;
            padding-left: 50px;
            border-left: 1px solid rgba(255, 255, 255, 0.1);
            margin-left: 50px;
        `;

        socialIcons.innerHTML = `
            <a href="https://www.facebook.com/autotechreprogrammation" 
               class="social-icon" 
               target="_blank"
               style="
                color: white;
                font-size: 1.2rem;
                transition: color 0.3s ease;
                text-decoration: none;
                padding: 5px;
            ">
                <i class="fab fa-facebook-f"></i>
            </a>
            <a href="https://www.instagram.com/autotech_reprog/" 
               class="social-icon"
               target="_blank" 
               style="
                color: white;
                font-size: 1.2rem;
                transition: color 0.3s ease;
                text-decoration: none;
                padding: 5px;
            ">
                <i class="fab fa-instagram"></i>
            </a>
            <a href="https://www.youtube.com/@autotechtunis2888" 
               class="social-icon"
               target="_blank" 
               style="
                color: white;
                font-size: 1.2rem;
                transition: color 0.3s ease;
                text-decoration: none;
                padding: 5px;
            ">
                <i class="fab fa-youtube"></i>
            </a>
        `;

        // Ajouter les icônes après le logo et avant la navigation
        const navMain = header.querySelector('.nav-main');
        navMain.insertBefore(socialIcons, navMain.querySelector('.nav-container'));

        // Ajouter les styles hover
        const socialLinks = socialIcons.querySelectorAll('.social-icon');
        socialLinks.forEach(link => {
            link.addEventListener('mouseover', () => {
                link.style.color = '#E30613';
            });
            link.addEventListener('mouseout', () => {
                link.style.color = 'white';
            });
        });

        // Ajouter les styles responsives pour mobile
        const mediaQuery = window.matchMedia('(max-width: 768px)');
        function handleMobileChange(e) {
            if (e.matches) {
                // Styles pour mobile
                socialIcons.style.cssText = `
                    display: flex;
                    gap: 15px;
                    justify-content: center;
                    align-items: center;
                    width: 100%;
                    margin: 10px 0;
                    padding: 10px 0;
                    border-left: none;
                    border-top: 1px solid rgba(255, 255, 255, 0.1);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                `;
            } else {
                // Styles pour desktop
                socialIcons.style.cssText = `
                    display: flex;
                    gap: 15px;
                    margin-left: auto;
                    margin-right: 30px;
                    padding-left: 50px;
                    border-left: 1px solid rgba(255, 255, 255, 0.1);
                    margin-left: 50px;
                `;
            }
        }

        // Appliquer les styles initiaux
        handleMobileChange(mediaQuery);
        // Écouter les changements de taille d'écran
        mediaQuery.addListener(handleMobileChange);
    }
}

// Exécuter quand le DOM est chargé
document.addEventListener('DOMContentLoaded', addSocialIcons); 