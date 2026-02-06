import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const payload = await req.json()
        console.log("Received payload:", payload)

        // Support both direct calls and webhook payloads
        // Webhook record is inside `record`
        const record = payload.record || payload

        if (!record || !record.client) {
            console.error("Missing record or client slug. Payload:", payload);
            // Don't throw to avoid retries on malformed data, just return 400
            return new Response(JSON.stringify({ error: 'Missing record or client slug' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            })
        }

        console.log(`Processing lead for client: ${record.client}`)

        // Initialize Supabase Client
        if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
            console.error("Supabase environment variables missing.");
            throw new Error("Internal Server Error: Supabase config missing.");
        }

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

        // Lookup Client
        const { data: clientConfig, error: clientError } = await supabase
            .from('clients')
            .select('notification_email, name')
            .eq('slug', record.client)
            .single()

        if (clientError || !clientConfig) {
            console.error('Client lookup failed:', clientError)
            throw new Error(`Client configuration not found for slug: ${record.client}`)
        }

        const recipientEmail = clientConfig.notification_email
        const clientName = clientConfig.name

        console.log(`Found config: Send to ${recipientEmail} for ${clientName}`)

        // CHECK FOR API KEY
        if (!RESEND_API_KEY) {
            // GRACEFUL FALLBACK: Log what would have happened
            console.warn("⚠️  RESEND_API_KEY is missing. Email will NOT be sent.");
            console.log(`[SIMULATION] Sending email to: ${recipientEmail}`);
            console.log(`[SIMULATION] Subject: Neue Anfrage für ${clientName}`);
            console.log(`[SIMULATION] Body: ${record.message}`);

            return new Response(JSON.stringify({
                message: "Email simulated (API Key missing)",
                recipient: recipientEmail,
                status: "simulated"
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            })
        }

        // REAL SENDING
        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
                from: 'Landing Pages OOE <onboarding@resend.dev>',
                to: [recipientEmail],
                subject: `Neue Anfrage für ${clientName}`,
                html: `
          <h1>Neue Anfrage erhalten!</h1>
          <p><strong>Kunde:</strong> ${record.name}</p>
          <p><strong>Email:</strong> ${record.email}</p>
          <p><strong>Telefon:</strong> ${record.phone || '-'}</p>
          <p><strong>Nachricht:</strong></p>
          <blockquote style="background: #f9f9f9; padding: 10px; border-left: 4px solid #ccc;">
            ${record.message}
          </blockquote>
          <hr>
          <p><small>Diese Nachricht wurde automatisch von Landing Pages OOE gesendet.</small></p>
        `,
            }),
        })

        const data = await res.json()

        if (!res.ok) {
            console.error('Resend API Error:', data);
            throw new Error('Failed to send email via Resend');
        }

        return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error) {
        console.error('Function error:', error)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500, // Return 500 so webhook might retry if configured, or just fail visibility
        })
    }
})
