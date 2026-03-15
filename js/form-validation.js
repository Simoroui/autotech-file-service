// Validation du formulaire de contact
document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.querySelector('.contact-form');
    
    if (contactForm) {
        // Ajouter des écouteurs d'événements pour les champs du formulaire
        const nameInput = contactForm.querySelector('input[name="name"]');
        const emailInput = contactForm.querySelector('input[name="email"]');
        const phoneInput = contactForm.querySelector('input[name="phone"]');
        const subjectSelect = contactForm.querySelector('select[name="subject"]');
        const messageTextarea = contactForm.querySelector('textarea[name="message"]');
        
        // Validation en temps réel pour le nom
        nameInput.addEventListener('blur', function() {
            if (!this.value.trim()) {
                showError(this, 'Veuillez entrer votre nom');
            } else {
                clearError(this);
            }
        });
        
        // Validation en temps réel pour l'email
        emailInput.addEventListener('blur', function() {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!this.value.trim() || !emailRegex.test(this.value.trim())) {
                showError(this, 'Veuillez entrer une adresse email valide');
            } else {
                clearError(this);
            }
        });
        
        // Validation en temps réel pour le téléphone
        phoneInput.addEventListener('blur', function() {
            if (this.value.trim() && !/^[0-9+\s-]{8,15}$/.test(this.value.trim())) {
                showError(this, 'Veuillez entrer un numéro de téléphone valide');
            } else {
                clearError(this);
            }
        });
        
        // Validation en temps réel pour le sujet
        subjectSelect.addEventListener('change', function() {
            if (this.value === '') {
                showError(this, 'Veuillez sélectionner un sujet');
            } else {
                clearError(this);
            }
        });
        
        // Validation en temps réel pour le message
        messageTextarea.addEventListener('blur', function() {
            if (!this.value.trim()) {
                showError(this, 'Veuillez entrer votre message');
            } else {
                clearError(this);
            }
        });
        
        // Validation finale avant soumission
        contactForm.addEventListener('submit', function(e) {
            // Vérifier tous les champs avant soumission
            let isValid = true;
            
            // Validation du nom
            if (!nameInput.value.trim()) {
                showError(nameInput, 'Veuillez entrer votre nom');
                isValid = false;
            }
            
            // Validation de l'email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailInput.value.trim() || !emailRegex.test(emailInput.value.trim())) {
                showError(emailInput, 'Veuillez entrer une adresse email valide');
                isValid = false;
            }
            
            // Validation du téléphone
            if (phoneInput.value.trim() && !/^[0-9+\s-]{8,15}$/.test(phoneInput.value.trim())) {
                showError(phoneInput, 'Veuillez entrer un numéro de téléphone valide');
                isValid = false;
            }
            
            // Validation du sujet
            if (subjectSelect.value === '') {
                showError(subjectSelect, 'Veuillez sélectionner un sujet');
                isValid = false;
            }
            
            // Validation du message
            if (!messageTextarea.value.trim()) {
                showError(messageTextarea, 'Veuillez entrer votre message');
                isValid = false;
            }
            
            // Si le formulaire n'est pas valide, empêcher la soumission
            if (!isValid) {
                e.preventDefault();
            } else {
                // Afficher un indicateur de chargement
                const submitButton = this.querySelector('.submit-button');
                const originalText = submitButton.innerHTML;
                submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi en cours...';
                submitButton.disabled = true;
                
                // Le formulaire sera soumis normalement via FormSubmit
            }
        });
        
        // Fonction pour afficher une erreur
        function showError(input, message) {
            // Supprimer l'erreur existante
            clearError(input);
            
            // Créer un élément d'erreur
            const errorElement = document.createElement('div');
            errorElement.className = 'error-message';
            errorElement.textContent = message;
            
            // Insérer l'erreur après l'input
            input.parentNode.insertBefore(errorElement, input.nextSibling);
            
            // Ajouter une classe d'erreur à l'input
            input.classList.add('error');
        }
        
        // Fonction pour supprimer une erreur
        function clearError(input) {
            // Supprimer la classe d'erreur
            input.classList.remove('error');
            
            // Supprimer le message d'erreur
            const errorElement = input.parentNode.querySelector('.error-message');
            if (errorElement) {
                errorElement.remove();
            }
        }
    }
}); 