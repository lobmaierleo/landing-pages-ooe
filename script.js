document.addEventListener('DOMContentLoaded', () => {

    // 1. Scroll Animations (Intersection Observer)
    const observerOptions = {
        threshold: 0.1, // Trigger when 10% of the element is visible
        rootMargin: '0px 0px -50px 0px' // Offset a bit so it triggers before bottom
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target); // Only animate once
            }
        });
    }, observerOptions);

    // Target elements with .fade-in-up class
    document.querySelectorAll('.fade-in-up').forEach(el => {
        observer.observe(el);
    });


    // 2. Mobile Navigation Toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    const navContainer = document.querySelector('.navbar');

    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            const isExpanded = mobileMenuBtn.getAttribute('aria-expanded') === 'true' || false;
            mobileMenuBtn.setAttribute('aria-expanded', !isExpanded);

            navLinks.classList.toggle('active');
            mobileMenuBtn.classList.toggle('active');
        });
    }

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!navContainer.contains(e.target) && navLinks.classList.contains('active')) {
            navLinks.classList.remove('active');
            mobileMenuBtn.classList.remove('active');
            mobileMenuBtn.setAttribute('aria-expanded', 'false');
        }
    });

    // 3. Smooth scroll for anchor links & Active link highlighting
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();

            // Close mobile menu if open
            if (navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
                mobileMenuBtn.classList.remove('active');
                mobileMenuBtn.setAttribute('aria-expanded', 'false');
            }

            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const headerOffset = 80; // Adjusted for new navbar height
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });


    // 4. Contact Form Handling
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerHTML;

            // Retrieve form data
            const formData = new FormData(contactForm);
            const data = Object.fromEntries(formData);

            // UI Feedback: Loading
            submitBtn.innerHTML = 'Wird gesendet...';
            submitBtn.disabled = true;
            submitBtn.classList.add('opacity-75', 'cursor-not-allowed');

            try {
                // Determine if we are developing locally or in production
                const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

                if (isLocalhost) {
                    console.log('Form submission data (Localhost):', data);
                    await new Promise(resolve => setTimeout(resolve, 1500)); // Fake delay
                    alert('Danke für Ihre Nachricht! (Demo-Modus)');
                } else {
                    // TODO: Connect to backend logic here
                    console.log('Form submission data:', data);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    alert('Danke für Ihre Nachricht! Ich werde mich bald melden.');
                }

                contactForm.reset();
            } catch (error) {
                console.error('Error submitting form:', error);
                alert('Es gab einen Fehler beim Senden. Bitte versuchen Sie es später erneut.');
            } finally {
                // Restore button state
                submitBtn.innerHTML = originalBtnText;
                submitBtn.disabled = false;
                submitBtn.classList.remove('opacity-75', 'cursor-not-allowed');
            }
        });
    }

    // 5. Navbar Scroll Effect (Glassmorphism enhancement)
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navContainer.classList.add('scrolled');
        } else {
            navContainer.classList.remove('scrolled');
        }
    });

});
