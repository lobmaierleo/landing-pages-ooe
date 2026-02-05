document.addEventListener('DOMContentLoaded', () => {
    // Mobile Navigation Toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');

    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            
            // Hamburger animation
            const bars = mobileMenuBtn.querySelectorAll('.bar');
            if (navLinks.classList.contains('active')) {
                bars[0].style.transform = 'rotate(-45deg) translate(-5px, 6px)';
                bars[1].style.opacity = '0';
                bars[2].style.transform = 'rotate(45deg) translate(-5px, -6px)';
            } else {
                bars[0].style.transform = 'none';
                bars[1].style.opacity = '1';
                bars[2].style.transform = 'none';
            }
        });
    }

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            
            // Close mobile menu if open
            if (navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
                 const bars = mobileMenuBtn.querySelectorAll('.bar');
                 bars[0].style.transform = 'none';
                 bars[1].style.opacity = '1';
                 bars[2].style.transform = 'none';
            }

            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const headerOffset = 70;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Contact Form Handling (Supabase ready structure)
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = contactForm.querySelector('.btn-submit');
            const originalBtnText = submitBtn.innerText;
            
            // Retrieve form data
            const formData = new FormData(contactForm);
            const data = Object.fromEntries(formData);
            
            // UI Feedback: Loading
            submitBtn.innerText = 'Senden...';
            submitBtn.disabled = true;

            try {
                // Simulate success (Replace this with actual Supabase/Backend call)
                console.log('Form submission data:', data);
                
                await new Promise(resolve => setTimeout(resolve, 1000)); // Fake delay

                // UI Feedback: Success
                alert('Danke für Ihre Nachricht! Ich werde mich bald melden.');
                contactForm.reset();
            } catch (error) {
                console.error('Error submitting form:', error);
                alert('Es gab einen Fehler beim Senden. Bitte versuchen Sie es später erneut.');
            } finally {
                // Restore button state
                submitBtn.innerText = originalBtnText;
                submitBtn.disabled = false;
            }
        });
    }
});
