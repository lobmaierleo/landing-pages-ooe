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

    // --- Cursor Spotlight Effect ---
    const cursorGlow = document.querySelector('.cursor-glow');
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    if (!isTouchDevice && cursorGlow) {
        document.addEventListener('mousemove', (e) => {
            requestAnimationFrame(() => {
                document.documentElement.style.setProperty('--mouse-x', e.clientX + 'px');
                document.documentElement.style.setProperty('--mouse-y', e.clientY + 'px');
            });
        });
    } else if (cursorGlow) {
        cursorGlow.style.display = 'none';
    }


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
            
            const nameVal = formData.get('name') ? formData.get('name').trim() : '';
            const emailVal = formData.get('email') ? formData.get('email').trim() : '';
            const messageVal = formData.get('message') ? formData.get('message').trim() : '';

            // Frontend Validierung: Keine reinen Leerzeichen in Pflichtfeldern
            if (!nameVal || !emailVal || !messageVal) {
                showNotification('Bitte füllen Sie alle Pflichtfelder gültig aus (keine reinen Leerzeichen).', 'error');
                return;
            }

            const data = {
                client: 'landing-pages-ooe',
                name: nameVal,
                email: emailVal,
                phone: formData.get('phone') || null,
                message: messageVal
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

    // 8.5 Container Scroll Animation
    const heroScrollSection = document.getElementById('hero-scroll-section');
    const containerScrollHeader = document.getElementById('container-scroll-header');
    const containerScrollCard = document.getElementById('container-scroll-card');

    // Remove entrance animation after it completes so inline opacity works
    if (containerScrollHeader) {
        containerScrollHeader.addEventListener('animationend', () => {
            containerScrollHeader.style.animation = 'none';
            containerScrollHeader.style.opacity = '1';
        }, { once: true });
    }
    const heroShowcaseContainer = document.querySelector('.hero-showcase-container');
    if (heroShowcaseContainer) {
        heroShowcaseContainer.addEventListener('animationend', () => {
            heroShowcaseContainer.style.animation = 'none';
            heroShowcaseContainer.style.opacity = '1';
        }, { once: true });
    }

    if (heroScrollSection && containerScrollHeader && containerScrollCard) {
        let isMobile = window.innerWidth <= 768;

        window.addEventListener('resize', () => {
            isMobile = window.innerWidth <= 768;
        });

        function easeOutCubic(t) {
            return 1 - Math.pow(1 - t, 3);
        }

        window.addEventListener('scroll', () => {
            const rect = heroScrollSection.getBoundingClientRect();
            const windowHeight = window.innerHeight;

            const totalScrollableDistance = heroScrollSection.offsetHeight - windowHeight;
            let scrollProgress = 0;

            if (totalScrollableDistance > 0) {
                scrollProgress = Math.max(0, -rect.top) / totalScrollableDistance;
            } else {
                scrollProgress = 1;
            }

            const progress = Math.min(Math.max(scrollProgress, 0), 1);
            const easedProgress = easeOutCubic(progress);

            // --- HEADER: fast fade-out + move up ---
            // Fades out completely by ~40% scroll so card never overlaps visible text/CTA
            const headerTranslateY = easedProgress * -150;
            const headerOpacity = 1 - (progress * 2.5); // Gone by 40%
            const clampedHeaderOpacity = Math.max(0, Math.min(1, headerOpacity));

            // Disable pointer-events when nearly invisible to prevent ghost clicks
            containerScrollHeader.style.pointerEvents = clampedHeaderOpacity < 0.1 ? 'none' : 'auto';

            // --- CARD: physically correct lifting animation ---
            // Card moves up past the (now invisible) header to center in viewport
            const cardTranslateY = isMobile
                ? 0 + (easedProgress * -240)    // Mobile: 0 → -240
                : 0 + (easedProgress * -380);   // Desktop: 0 → -380

            // Rotation: 50deg (lying flat) → 0deg (facing viewer)
            const rotateX = 50 - (easedProgress * 50);

            // Subtle Y rotation for parallax depth — peaks at ~40% scroll
            const rotateY = Math.sin(progress * Math.PI) * -1.5;

            // Scale: card GROWS as it approaches viewer (physically correct)
            let scale;
            if (isMobile) {
                scale = 0.8 + (easedProgress * 0.2);  // 0.8 → 1.0
            } else {
                scale = 0.92 + (easedProgress * 0.08); // 0.92 → 1.0
            }

            // --- SHADOW: grows as card lifts AWAY from surface ---
            // When flat (progress=0): tight shadow, close to surface
            // When upright (progress=1): large, diffuse shadow = card is high up
            const liftProgress = easedProgress;
            const shadowY = 5 + (liftProgress * 50);            // 5 → 55px offset
            const shadowBlur = 15 + (liftProgress * 90);        // 15 → 105px blur
            const shadowSpread = 5 + (liftProgress * 30);       // 5 → 35px spread
            const shadowOpacity = 0.15 + (liftProgress * 0.45); // 0.15 → 0.6
            const goldGlow = liftProgress * 0.12;                // 0 → 0.12

            // Apply transforms
            containerScrollHeader.style.transform = `translateY(${headerTranslateY}px)`;
            containerScrollHeader.style.opacity = clampedHeaderOpacity;

            containerScrollCard.style.transform = `translateY(${cardTranslateY}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scale})`;
            containerScrollCard.style.boxShadow = `
                0 ${shadowY}px ${shadowBlur}px rgba(0, 0, 0, ${shadowOpacity}),
                0 ${Math.round(shadowY * 0.4)}px ${Math.round(shadowBlur * 0.3)}px rgba(0, 0, 0, ${shadowOpacity * 0.5}),
                0 0 ${shadowSpread * 2}px rgba(212, 160, 23, ${goldGlow})
            `;
        });

        // Trigger once to set initial state correctly on load
        window.dispatchEvent(new Event('scroll'));
    }

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
