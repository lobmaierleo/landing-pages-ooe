document.addEventListener('DOMContentLoaded', () => {

    // Initialize Supabase (same instance as client sites)
    const supabaseUrl = 'https://apchqzlmhnwgnwpofemf.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwY2hxemxtaG53Z253cG9mZW1mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzNjI5OTYsImV4cCI6MjA4NTkzODk5Nn0.cV2Y9D1cEzJ1tQgS_MfxPDaEqK65KNHep95-fi33cak';

    // Create Supabase client if supabase object exists globally
    let supabaseClient = null;
    if (typeof supabase !== 'undefined' && supabase.createClient) {
        supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);
    }

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


    // 4. Contact Form Handling - Direct to Supabase (like client sites)
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerHTML;

            // Retrieve form data
            const formData = new FormData(contactForm);
            const data = {
                client: 'landing-pages-ooe',
                name: formData.get('name'),
                email: formData.get('email'),
                phone: formData.get('phone') || null,
                message: formData.get('message')
            };

            // UI Feedback: Loading
            submitBtn.innerHTML = 'Wird gesendet...';
            submitBtn.disabled = true;
            submitBtn.classList.add('opacity-75', 'cursor-not-allowed');

            try {
                // Check if Supabase client is available
                if (!supabaseClient) {
                    throw new Error('Supabase nicht verfügbar');
                }

                // Insert directly into Supabase leads table
                const { error } = await supabaseClient
                    .from('leads')
                    .insert([data]);

                if (error) throw error;

                showNotification('Vielen Dank! Ihre Nachricht wurde erfolgreich gesendet. Ich melde mich innerhalb von 24h.', 'success');
                contactForm.reset();

            } catch (error) {
                console.error('Error submitting form:', error);
                showNotification('Es gab einen Fehler beim Senden. Bitte versuchen Sie es später erneut.', 'error');
            } finally {
                // Restore button state
                submitBtn.innerHTML = originalBtnText;
                submitBtn.disabled = false;
                submitBtn.classList.remove('opacity-75', 'cursor-not-allowed');
            }
        });
    }

    // Notification Helper
    function showNotification(message, type) {
        // Remove existing notifications
        const existing = document.querySelector('.form-notification');
        if (existing) existing.remove();

        const notification = document.createElement('div');
        notification.className = `form-notification ${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button onclick="this.parentElement.remove()">×</button>
        `;

        const form = document.getElementById('contact-form');
        form.parentElement.insertBefore(notification, form.nextSibling);

        // Auto-remove after 5 seconds
        setTimeout(() => notification.remove(), 5000);
    }

    // 5. Navbar Scroll Effect (Glassmorphism enhancement)
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navContainer.classList.add('scrolled');
        } else {
            navContainer.classList.remove('scrolled');
        }
    });

    // =====================================================
    // NEW FEATURES
    // =====================================================

    // 6. Cookie Banner
    const cookieBanner = document.getElementById('cookie-banner');
    const cookieAccept = document.getElementById('cookie-accept');
    const cookieDecline = document.getElementById('cookie-decline');

    // Check if user has already made a choice
    if (!localStorage.getItem('cookie-consent')) {
        // Show banner after a short delay for better UX
        setTimeout(() => {
            cookieBanner.classList.add('visible');
        }, 1500);
    }

    if (cookieAccept) {
        cookieAccept.addEventListener('click', () => {
            localStorage.setItem('cookie-consent', 'accepted');
            cookieBanner.classList.remove('visible');
            // Enable analytics if needed
            console.log('Cookies accepted');
        });
    }

    if (cookieDecline) {
        cookieDecline.addEventListener('click', () => {
            localStorage.setItem('cookie-consent', 'essential');
            cookieBanner.classList.remove('visible');
            console.log('Only essential cookies');
        });
    }

    // 7. Back to Top Button
    const backToTopBtn = document.getElementById('back-to-top');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 500) {
            backToTopBtn.classList.add('visible');
        } else {
            backToTopBtn.classList.remove('visible');
        }
    });

    if (backToTopBtn) {
        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // 8. Parallax Effect for Hero
    const hero = document.querySelector('.hero');

    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const heroHeight = hero ? hero.offsetHeight : 0;

        if (scrolled < heroHeight && hero) {
            const parallaxValue = scrolled * 0.3;
            hero.style.setProperty('--parallax-y', `${parallaxValue}px`);
        }
    });

    // 9. Image Lazy Loading Enhancement
    const lazyImages = document.querySelectorAll('img[loading="lazy"]');

    lazyImages.forEach(img => {
        // Add skeleton class while loading
        img.parentElement.classList.add('skeleton-loader');

        img.addEventListener('load', () => {
            img.parentElement.classList.remove('skeleton-loader');
            img.style.opacity = '1';
        });

        // If already loaded (cached)
        if (img.complete) {
            img.parentElement.classList.remove('skeleton-loader');
            img.style.opacity = '1';
        }
    });

    // 10. Form Validation Feedback
    const formInputs = document.querySelectorAll('.form-group input, .form-group textarea');

    formInputs.forEach(input => {
        // Real-time validation feedback
        input.addEventListener('blur', () => {
            if (input.value.trim() !== '' && !input.validity.valid) {
                input.classList.add('shake');
                setTimeout(() => input.classList.remove('shake'), 500);
            }
        });
    });

});
