import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Outreach Opt-Out Endpoint
 *
 * Empfängt GET-Requests mit signiertem Token und trägt die E-Mail
 * in die outreach_optouts Tabelle ein (DSGVO-konform).
 *
 * URL: https://landingpagesooe.app/api/outreach-optout?token=<base64>
 *
 * Environment Variables:
 * - OPTOUT_SECRET: HMAC-Signing Secret
 * - SUPABASE_URL: Supabase Projekt URL
 * - SUPABASE_ANON_KEY: Supabase Anon Key
 */

export const config = {
    runtime: 'edge',
};

async function createHmac(secret, message) {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign', 'verify']
    );
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
    return Array.from(new Uint8Array(signature))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

export default async function handler(req) {
    if (req.method !== 'GET') {
        return new Response('Method not allowed', { status: 405 });
    }

    const OPTOUT_SECRET = process.env.OPTOUT_SECRET;
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

    if (!OPTOUT_SECRET || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
        console.error('❌ Environment variables fehlen!');
        return htmlResponse('Fehler', 'Serverfehler. Bitte kontaktieren Sie uns direkt.', 500);
    }

    try {
        const url = new URL(req.url);
        const token = url.searchParams.get('token');

        if (!token) {
            return htmlResponse('Ungültiger Link', 'Der Abmelde-Link ist ungültig.', 400);
        }

        // Token dekodieren: base64(email):hmac
        const parts = token.split(':');
        if (parts.length !== 2) {
            return htmlResponse('Ungültiger Link', 'Der Abmelde-Link ist ungültig.', 400);
        }

        const [emailB64, signature] = parts;
        let email;
        try {
            email = atob(emailB64);
        } catch {
            return htmlResponse('Ungültiger Link', 'Der Abmelde-Link ist ungültig.', 400);
        }

        // HMAC verifizieren
        const expectedSignature = await createHmac(OPTOUT_SECRET, email);
        if (signature !== expectedSignature) {
            return htmlResponse('Ungültiger Link', 'Der Abmelde-Link ist ungültig oder abgelaufen.', 403);
        }

        // In Supabase eintragen
        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        const { error } = await supabase
            .from('outreach_optouts')
            .upsert({ email, opted_out_at: new Date().toISOString() }, { onConflict: 'email' });

        if (error) {
            console.error('❌ Supabase Fehler:', error);
            return htmlResponse('Fehler', 'Es gab einen Fehler. Bitte kontaktieren Sie uns direkt unter kontakt@landingpagesooe.app', 500);
        }

        console.log('✅ Opt-out erfolgreich:', email);

        return htmlResponse(
            'Erfolgreich abgemeldet',
            `Die E-Mail-Adresse <strong>${email}</strong> wurde erfolgreich abgemeldet. Sie erhalten keine weiteren Nachrichten von uns.`
        );

    } catch (error) {
        console.error('❌ Opt-out Error:', error);
        return htmlResponse('Fehler', 'Ein unerwarteter Fehler ist aufgetreten.', 500);
    }
}

function htmlResponse(title, message, status = 200) {
    const html = `<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} – Landing Pages OÖ</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0f172a;
            color: #e2e8f0;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .card {
            background: #1e293b;
            border-radius: 12px;
            padding: 48px;
            max-width: 480px;
            text-align: center;
            box-shadow: 0 25px 50px rgba(0,0,0,0.3);
        }
        h1 { font-size: 24px; margin-bottom: 16px; color: #fff; }
        p { font-size: 16px; line-height: 1.6; color: #94a3b8; }
        p strong { color: #3b82f6; }
        .footer { margin-top: 32px; font-size: 13px; color: #475569; }
        .footer a { color: #3b82f6; text-decoration: none; }
    </style>
</head>
<body>
    <div class="card">
        <h1>${title}</h1>
        <p>${message}</p>
        <p class="footer">
            <a href="https://landingpagesooe.app">Landing Pages OÖ</a> · kontakt@landingpagesooe.app
        </p>
    </div>
</body>
</html>`;
    return new Response(html, {
        status,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
}
