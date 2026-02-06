document.addEventListener('DOMContentLoaded', () => {

    // Smooth Scrolling for Anchor Links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // Contact Form Validation
    const form = document.querySelector('form'); // Assuming there is one form
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            // Basic validation
            const inputs = form.querySelectorAll('input, textarea');
            let isValid = true;

            inputs.forEach(input => {
                if (input.hasAttribute('required') && !input.value.trim()) {
                    isValid = false;
                    input.classList.add('border-red-500');
                } else {
                    input.classList.remove('border-red-500');
                }
            });

            if (isValid) {
                // Determine if it represents sending (demo)
                const client = 'tischler-wels';
                const btn = form.querySelector('button');
                const originalText = btn.innerHTML;

                btn.innerHTML = 'Wird gesendet...';
                btn.disabled = true;

                // Simulate API call
                setTimeout(() => {
                    alert('Vielen Dank für Ihre Anfrage! Wir melden uns in Kürze.');
                    form.reset();
                    btn.innerHTML = originalText;
                    btn.disabled = false;
                }, 1500);
            }
        });
    }

    // Header Scroll Effect (Optional but good for sticky headers)
    const header = document.querySelector('header');
    if (header) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 20) {
                header.classList.add('shadow-md');
            } else {
                header.classList.remove('shadow-md');
            }
        });
    }
});
