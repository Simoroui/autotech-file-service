// Gestion du diaporama
document.addEventListener('DOMContentLoaded', () => {
    // Gestion des diaporamas standard
    const slideshowContainers = document.querySelectorAll('.slideshow-container');
    
    slideshowContainers.forEach(container => {
        const slides = container.querySelectorAll('.slide');
        const prevBtn = container.querySelector('.prev-btn');
        const nextBtn = container.querySelector('.next-btn');
        
        if (slides.length === 0) return;
        
        let slideIndex = 0;
        let slideTimer;
        
        // Fonction pour afficher une diapositive spécifique
        function showSlide(index) {
            // Masquer toutes les diapositives
            slides.forEach(slide => {
                slide.style.opacity = '0';
            });
            
            // Gérer l'index circulaire
            if (index >= slides.length) {
                slideIndex = 0;
            } else if (index < 0) {
                slideIndex = slides.length - 1;
            } else {
                slideIndex = index;
            }
            
            // Afficher la diapositive actuelle
            slides[slideIndex].style.opacity = '1';
        }
        
        // Fonction pour passer à la diapositive suivante
        function nextSlide() {
            showSlide(slideIndex + 1);
            resetTimer();
        }
        
        // Fonction pour passer à la diapositive précédente
        function prevSlide() {
            showSlide(slideIndex - 1);
            resetTimer();
        }
        
        // Fonction pour réinitialiser le minuteur
        function resetTimer() {
            clearTimeout(slideTimer);
            slideTimer = setTimeout(nextSlide, 5000); // Changer de diapositive toutes les 5 secondes
        }
        
        // Ajouter des écouteurs d'événements pour les boutons
        if (prevBtn) {
            prevBtn.addEventListener('click', prevSlide);
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', nextSlide);
        }
        
        // Démarrer le diaporama
        showSlide(slideIndex);
        resetTimer();
    });

    // Gestion du diaporama de la section À propos
    const aboutSlides = document.querySelectorAll('.slideshow-slide .about-image');
    console.log('Diaporama À propos: ' + aboutSlides.length + ' images trouvées');

    if (aboutSlides.length > 0) {
        // Vérification de chaque image du diaporama
        aboutSlides.forEach((slide, index) => {
            console.log(`Image ${index}: ${slide.src}, classe: ${slide.className}, visible: ${slide.style.opacity || 'non défini'}`);
            
            // Vérifier si l'image est chargée correctement
            slide.addEventListener('load', () => {
                console.log(`Image ${index} chargée correctement`);
            });
            
            slide.addEventListener('error', () => {
                console.error(`Erreur de chargement de l'image ${index}: ${slide.src}`);
                // En cas d'erreur, masquer l'image
                slide.style.display = 'none';
            });
        });
        
        let currentAboutSlide = 0;

        // S'assurer que la première diapo est visible au démarrage
        aboutSlides[0].classList.add('active');
        
        function showNextAboutSlide() {
            try {
                // Masquer la slide active actuelle
                aboutSlides[currentAboutSlide].classList.remove('active');
                
                // Passer à la slide suivante (ou revenir à la première)
                currentAboutSlide = (currentAboutSlide + 1) % aboutSlides.length;
                
                // Afficher la nouvelle slide active
                aboutSlides[currentAboutSlide].classList.add('active');
                console.log('Changement vers la slide À propos #' + currentAboutSlide);
            } catch (e) {
                console.error('Erreur dans le diaporama:', e);
            }
        }
        
        // Changer de slide toutes les 4 secondes
        setInterval(showNextAboutSlide, 4000);
        
        // Création de contrôles manuels pour le diaporama
        const aboutContainer = document.querySelector('.slideshow-container');
        if (aboutContainer) {
            // Créer les boutons de navigation
            const prevButton = document.createElement('button');
            prevButton.className = 'slideshow-nav prev';
            prevButton.innerHTML = '&lt;';
            prevButton.setAttribute('aria-label', 'Précédent');
            
            const nextButton = document.createElement('button');
            nextButton.className = 'slideshow-nav next';
            nextButton.innerHTML = '&gt;';
            nextButton.setAttribute('aria-label', 'Suivant');
            
            // Ajouter les boutons au conteneur
            aboutContainer.appendChild(prevButton);
            aboutContainer.appendChild(nextButton);
            
            // Ajouter les événements aux boutons
            prevButton.addEventListener('click', () => {
                // Masquer la slide active actuelle
                aboutSlides[currentAboutSlide].classList.remove('active');
                
                // Passer à la slide précédente
                currentAboutSlide = (currentAboutSlide - 1 + aboutSlides.length) % aboutSlides.length;
                
                // Afficher la nouvelle slide active
                aboutSlides[currentAboutSlide].classList.add('active');
            });
            
            nextButton.addEventListener('click', () => {
                // Masquer la slide active actuelle
                aboutSlides[currentAboutSlide].classList.remove('active');
                
                // Passer à la slide suivante
                currentAboutSlide = (currentAboutSlide + 1) % aboutSlides.length;
                
                // Afficher la nouvelle slide active
                aboutSlides[currentAboutSlide].classList.add('active');
            });
        }
    }
}); 