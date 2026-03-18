import { Resend } from 'resend';

/**
 * Resend Webhook Handler - E-Mail Empfang & Weiterleitung
 * 
 * Empfängt eingehende E-Mails an kontakt@landingpagesooe.app
 * und leitet sie automatisch an die konfigurierte private E-Mail weiter.
 * 
 * Environment Variables benötigt:
 * - RESEND_API_KEY: API Key von https://resend.com/api-keys
 * - FORWARD_EMAIL: Private E-Mail für Weiterleitung
 */

export const config = {
    runtime: 'edge',
};

export default async function handler(req) {
    // Nur POST Requests akzeptieren
    if (req.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const FORWARD_EMAIL = process.env.FORWARD_EMAIL || 'leolobmaierstadlbauer@gmail.com';

    if (!RESEND_API_KEY) {
        console.error('❌ RESEND_API_KEY fehlt!');
        return new Response(JSON.stringify({ error: 'Server configuration error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const payload = await req.json();

        console.log('📧 Webhook empfangen:', {
            type: payload.type,
            timestamp: new Date().toISOString()
        });

        // Resend wraps inbound email data in payload.data
        const emailData = payload.data || payload;
        const { from, to, subject, html, text, attachments } = emailData;

        // --- SPAM PROTECTION: Leere E-Mails ignorieren ---
        const hasTextContent = text && text.trim().length > 0;
        const hasHtmlContent = html && html.trim().length > 0;
        const hasAttachments = attachments && attachments.length > 0;

        if (!hasTextContent && !hasHtmlContent && !hasAttachments) {
            console.log('🛑 E-Mail verworfen (Kein Inhalt):', subject);
            // Wir geben 200 OK zurück, damit Resend es nicht erneut versucht (Retry)
            return new Response(JSON.stringify({
                success: true,
                message: 'E-Mail ohne Inhalt verworfen'
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        // -------------------------------------------------

        const resend = new Resend(RESEND_API_KEY);

        // E-Mail an private Adresse weiterleiten
        const emailPayload = {
            from: 'Landing Pages OÖ <kontakt@landingpagesooe.app>',
            to: FORWARD_EMAIL,
            subject: `[Forwarded] ${subject || '(Kein Betreff)'}`,
            html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%); padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="color: #fff; margin: 0; font-size: 18px;">📧 Weitergeleitete E-Mail</h2>
          </div>
          
          <div style="background: #f8fafc; padding: 16px; border-left: 4px solid #3b82f6;">
            <p style="margin: 0 0 8px 0; color: #475569;"><strong>Von:</strong> ${from || 'Unbekannt'}</p>
            <p style="margin: 0 0 8px 0; color: #475569;"><strong>An:</strong> ${to || 'kontakt@landingpagesooe.app'}</p>
            <p style="margin: 0; color: #475569;"><strong>Betreff:</strong> ${subject || '(Kein Betreff)'}</p>
          </div>
          
          <div style="background: #fff; padding: 24px; border: 1px solid #e2e8f0; border-top: none;">
            ${html || `<p style="white-space: pre-wrap; color: #1e293b;">${text || '(Kein Inhalt)'}</p>`}
          </div>
          
          <div style="background: #f1f5f9; padding: 12px; border-radius: 0 0 8px 8px; text-align: center;">
            <p style="margin: 0; font-size: 12px; color: #64748b;">
              Diese E-Mail wurde automatisch von Landing Pages OÖ weitergeleitet.
            </p>
          </div>
        </div>
      `,
        };

        // Attachments hinzufügen falls vorhanden
        if (attachments && attachments.length > 0) {
            emailPayload.attachments = attachments.map(att => ({
                filename: att.filename,
                content: att.content,
            }));
        }

        const { data, error } = await resend.emails.send(emailPayload);

        if (error) {
            console.error('❌ Fehler beim Weiterleiten:', error);
            return new Response(JSON.stringify({ error: error.message }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        console.log('✅ E-Mail erfolgreich weitergeleitet:', data);

        return new Response(JSON.stringify({
            success: true,
            forwarded: true,
            messageId: data.id
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('❌ Webhook Error:', error);
        return new Response(JSON.stringify({
            error: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
