/**
 * Shared form handler for all client landing pages.
 *
 * Usage: Add data-client="slug" to your <form> element.
 * Include Supabase CDN and this script in your HTML:
 *   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
 *   <script src="/shared/form.js"></script>
 */

(function () {
    'use strict';

    var SUPABASE_URL = 'https://apchqzlmhnwgnwpofemf.supabase.co';
    var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwY2hxemxtaG53Z253cG9mZW1mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzNjI5OTYsImV4cCI6MjA4NTkzODk5Nn0.cV2Y9D1cEzJ1tQgS_MfxPDaEqK65KNHep95-fi33cak';

    var sb = null;
    if (typeof supabase !== 'undefined' && supabase.createClient) {
        sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }

    document.addEventListener('DOMContentLoaded', function () {

        // --- Smooth Scrolling ---
        document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
            anchor.addEventListener('click', function (e) {
                var targetId = this.getAttribute('href');
                if (targetId === '#') return;
                var el = document.querySelector(targetId);
                if (el) {
                    e.preventDefault();
                    el.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });

        // --- Header Scroll Effect ---
        var header = document.querySelector('header');
        if (header) {
            window.addEventListener('scroll', function () {
                if (window.scrollY > 20) {
                    header.classList.add('shadow-md');
                } else {
                    header.classList.remove('shadow-md');
                }
            });
        }

        // --- Contact Form Submission ---
        var form = document.querySelector('form[data-client]') || document.getElementById('contact-form') || document.querySelector('form');
        if (!form) return;

        var clientSlug = form.getAttribute('data-client') || document.body.getAttribute('data-client') || '';

        form.addEventListener('submit', async function (e) {
            e.preventDefault();

            // Validate required fields
            var inputs = form.querySelectorAll('input, textarea');
            var isValid = true;
            inputs.forEach(function (input) {
                if (input.hasAttribute('required') && !input.value.trim()) {
                    isValid = false;
                    input.classList.add('border-red-500');
                } else {
                    input.classList.remove('border-red-500');
                }
            });

            if (!isValid) {
                alert('Bitte füllen Sie alle Pflichtfelder aus.');
                return;
            }

            var btn = form.querySelector('button[type="submit"]');
            var originalText = btn ? btn.innerHTML : '';
            if (btn) {
                btn.innerHTML = 'Wird gesendet...';
                btn.disabled = true;
            }

            var nameVal = (form.querySelector('[name="name"]') || {}).value || '';
            var emailVal = (form.querySelector('[name="email"]') || {}).value || '';
            var phoneVal = (form.querySelector('[name="phone"]') || {}).value || '';
            var messageVal = (form.querySelector('[name="message"]') || {}).value || '';

            var data = {
                client: clientSlug,
                name: nameVal.trim(),
                email: emailVal.trim(),
                phone: phoneVal.trim(),
                message: messageVal.trim()
            };

            // Final trim validation
            if (!data.name || !data.email || !data.message) {
                alert('Bitte füllen Sie alle Pflichtfelder gültig aus (keine reinen Leerzeichen).');
                if (btn) { btn.innerHTML = originalText; btn.disabled = false; }
                return;
            }

            try {
                if (!sb) throw new Error('Supabase nicht verfügbar');

                var result = await sb.from('leads').insert([data]);
                if (result.error) throw result.error;

                alert('Vielen Dank! Ihre Anfrage wurde gesendet. Wir melden uns in Kürze.');
                form.reset();
            } catch (err) {
                console.error('Formular-Fehler:', err);
                alert('Es gab einen Fehler beim Senden. Bitte versuchen Sie es später erneut oder rufen Sie uns direkt an.');
            } finally {
                if (btn) {
                    btn.innerHTML = originalText;
                    btn.disabled = false;
                }
            }
        });
    });
})();
