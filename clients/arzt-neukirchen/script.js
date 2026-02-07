const client = 'arzt-neukirchen';

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

    // Contact Form Submission
    const form = document.getElementById('contact-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
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
                const btn = form.querySelector('button');
                const originalText = btn.innerHTML;

                btn.innerHTML = 'Wird gesendet...';
                btn.disabled = true;

                // Collect form data
                const formData = {
                    client: client,
                    name: form.querySelector('[name="name"]').value,
                    email: form.querySelector('[name="email"]').value,
                    phone: form.querySelector('[name="phone"]')?.value || '',
                    message: form.querySelector('[name="message"]').value
                };

                try {
                    const response = await fetch('/api/contact', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(formData)
                    });

                    if (response.ok) {
                        alert('Vielen Dank für Ihre Nachricht! Wir melden uns in Kürze bei Ihnen.');
                        form.reset();
                    } else {
                        throw new Error('Fehler beim Senden');
                    }
                } catch (error) {
                    console.error('Error:', error);
                    alert('Leider konnte Ihre Nachricht nicht gesendet werden. Bitte versuchen Sie es später erneut oder rufen Sie uns direkt an.');
                }

                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        });
    }

    // Header Scroll Effect
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
