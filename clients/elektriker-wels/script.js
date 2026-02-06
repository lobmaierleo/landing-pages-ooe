
// Initialize Supabase
const supabaseUrl = 'https://apchqzlmhnwgnwpofemf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwY2hxemxtaG53Z253cG9mZW1mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzNjI5OTYsImV4cCI6MjA4NTkzODk5Nn0.cV2Y9D1cEzJ1tQgS_MfxPDaEqK65KNHep95-fi33cak'
const supabase = supabase.createClient(supabaseUrl, supabaseKey)

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

    // Contact Form Submission to Supabase
    const form = document.querySelector('form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const btn = form.querySelector('button[type="submit"]');
            const originalText = btn.innerHTML;

            // Get form data
            const formData = new FormData(form);
            const data = {
                client: 'elektriker-wels',
                name: formData.get('name'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                message: formData.get('message')
            };

            // Loading state
            btn.innerHTML = 'Sende...';
            btn.disabled = true;

            try {
                // Insert into Supabase
                const { error } = await supabase
                    .from('leads')
                    .insert([data]);

                if (error) throw error;

                // Success
                alert('Vielen Dank! Ihre Anfrage wurde gesendet. Wir melden uns in Kürze.');
                form.reset();

            } catch (error) {
                console.error('Error submitting form:', error);
                alert('Es gab einen Fehler beim Senden. Bitte versuchen Sie es später erneut oder rufen Sie uns an.');
            } finally {
                // Reset button
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
