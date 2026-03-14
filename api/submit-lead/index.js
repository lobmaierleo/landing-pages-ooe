import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Lead Submission API - Empfängt Kontaktformular-Daten und speichert sie in Supabase
 * 
 * Environment Variables benötigt:
 * - SUPABASE_URL: Supabase Projekt URL
 * - SUPABASE_ANON_KEY: Supabase Anon Key (oder Service Role Key)
 */

export const config = {
    runtime: 'edge',
};

export default async function handler(req) {
    // CORS Headers
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    if (req.method !== 'POST') {
        return new Response('Method not allowed', { status: 405, headers: corsHeaders });
    }

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        console.error('❌ Supabase credentials fehlen!');
        return new Response(JSON.stringify({ error: 'Server configuration error' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    try {
        const { name, email, message, phone, client } = await req.json();

        // Validierung und Trimmen (vermeidet reine Leerzeichen)
        const trimmedName = name ? name.trim() : '';
        const trimmedEmail = email ? email.trim() : '';
        const trimmedMessage = message ? message.trim() : '';

        if (!trimmedName || !trimmedEmail || !trimmedMessage) {
            return new Response(JSON.stringify({
                error: 'Name, E-Mail und Nachricht sind erforderlich und dürfen nicht leer sein'
            }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        console.log('📧 Neue Lead-Anfrage:', { name, email, client: client || 'landing-pages-ooe' });

        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

        // Lead in Supabase speichern
        const { data, error } = await supabase
            .from('leads')
            .insert([{
                name,
                email,
                phone: phone || null,
                message,
                client: client || 'landing-pages-ooe', // Default: Eigene Seite
                created_at: new Date().toISOString()
            }])
            .select();

        if (error) {
            console.error('❌ Supabase Insert Fehler:', error);
            return new Response(JSON.stringify({ error: error.message }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        console.log('✅ Lead gespeichert:', data);

        // Der Supabase Webhook trigger wird automatisch die send-lead-notification 
        // Edge Function aufrufen um die E-Mail zu senden

        return new Response(JSON.stringify({
            success: true,
            message: 'Anfrage wurde erfolgreich gesendet'
        }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('❌ API Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}
