---
name: customer-outreach
description: Personalisierte Kaltakquise-Emails an potenzielle Kunden senden, Prospects recherchieren und Follow-ups verwalten
user_invocable: true
---

# Cold Outreach Skill — Landing Pages OÖ

Dieser Skill versendet personalisierte Akquise-Emails an potenzielle Kunden (kleine Unternehmen in OÖ) über die Resend API von `kontakt@landingpagesooe.app`.

## Aufruf-Modi

Der User gibt einen Modus an. Falls keiner angegeben, frage nach.

### `send` — Einzelne Email senden
Argumente (können auch interaktiv abgefragt werden):
- `business_name` (Pflicht)
- `email` (Pflicht)
- `industry` (Pflicht): handwerker, coach, dienstleister, gastro, friseur, arzt, etc.
- `contact_name` (optional)
- `location` (optional)
- `current_website` (optional)

### `batch <csv-pfad>` — Batch-Versand aus CSV
CSV-Format:
```csv
business_name,contact_name,email,phone,industry,location,current_website,notes
Tischlerei Huber,Herr Huber,info@tischlerei-huber.at,,handwerker,Wels,https://tischlerei-huber.at,Alte Website
```

### `followups` — Fällige Follow-ups prüfen
Prüft `outreach_emails` auf:
- Erstmail ≥7 Tage alt → `followup_1` fällig
- Follow-up 1 ≥14 Tage alt → `followup_2` fällig

### `add` — Prospect nur in DB speichern (kein Versand)

### `research <branche> <ort>` — Web-Recherche nach Prospects

4-Stufen Research-Workflow:

#### Stufe 1 — Betriebe finden (WKO als Primärquelle)
- WKO Firmen A-Z per WebFetch abrufen (funktioniert zuverlässig):
  - `https://firmen.wko.at/<branche>/<ort>_gemeinde/`
  - `https://firmen.wko.at/<branche>/<bezirk>_bezirk/`
  - Beispiele: `firmen.wko.at/tischlerei/wels_gemeinde/`, `firmen.wko.at/friseur/linz_gemeinde/`
- Liefert: Firmenname, Adresse, teils Email und Website
- **NICHT Herold.at verwenden** — ist JS-rendered, WebFetch bekommt keine nutzbaren Daten
- Ergänzend WebSearch nutzen: `<branche> <ort> Oberösterreich`

#### Stufe 2 — Website-Existenz VERIFIZIEREN (PFLICHT für jeden Prospect!)
Für JEDEN gefundenen Betrieb:
- Falls WKO "keine Website" sagt → trotzdem per WebSearch googeln: `"<Firmenname>" <Ort> website`
- Falls WKO eine Website-URL listet → per WebFetch prüfen ob sie erreichbar und aktuell ist
- **Ohne Verifizierung NIEMALS als "keine Website" einstufen**

#### Stufe 3 — Email-Adressen finden
Für Prospects ohne Email in WKO:
- WebSearch: `"<Firmenname>" <Ort> email kontakt`
- WebFetch auf Impressum, Facebook-Seite oder Google Maps Eintrag
- Prospect ohne findbare Email → in DB speichern mit `notes: "keine Email gefunden"`, aber NICHT für Outreach verwenden

#### Stufe 4 — Prospect-Qualität klassifizieren
| Klasse | Kriterien | Aktion |
|--------|-----------|--------|
| **A** | Email vorhanden + keine/veraltete Website | Sofort kontaktierbar — dem User vorlegen |
| **B** | Email vorhanden + moderne Website | Kein Target — überspringen |
| **C** | Keine Email gefunden | Speichern, aber nicht kontaktierbar |

Nur Klasse-A-Prospects dem User zur Bestätigung vorlegen.

## Workflow pro Email

### 1. Umgebung vorbereiten
```bash
# .env.local lesen für RESEND_API_KEY
source <(grep RESEND_API_KEY .env.local)
```

### 2. DSGVO-Checks (PFLICHT — niemals überspringen!)
Prüfe via Supabase MCP (`mcp__claude_ai_Supabase__execute_sql`, project_id: `apchqzlmhnwgnwpofemf`):

```sql
-- Opt-out Check
SELECT email FROM outreach_optouts WHERE email = '<recipient>';

-- Duplikat-Check
SELECT oe.email_type, oe.sent_at
FROM outreach_emails oe
JOIN prospects p ON oe.prospect_id = p.id
WHERE p.email = '<recipient>';
```

**STOPP** wenn die Email in `outreach_optouts` steht oder der email_type bereits gesendet wurde.

### 3. Prospect recherchieren (optional)
Falls `current_website` angegeben, bewerte die Seite. Tool-Priorität:
1. **WebFetch** — für direkte URL-Abfragen (bevorzugt)
2. **WebSearch** — für Suche nach zusätzlichen Infos
3. **mcp__claude-in-chrome__*** — nur wenn verbunden, als Bonus für JS-heavy Seiten

Notiere:
- Ist die Seite mobil-optimiert?
- Ladezeit/Design veraltet?
- Fehlende Kontaktmöglichkeiten?

### 4. Prospect in DB speichern
```sql
INSERT INTO prospects (business_name, contact_name, email, phone, industry, location, current_website, website_quality, notes, source)
VALUES ('<...>') ON CONFLICT (email) DO NOTHING RETURNING id;
```

### 5. Email generieren
Nutze die HTML-Templates aus `templates/outreach/` als Grundstruktur. Fülle die Platzhalter:

- `{{anrede}}`: "Hallo Herr/Frau [Name]" oder "Guten Tag" wenn kein Name bekannt
- `{{personalisierter_einstieg}}`: 1-2 Sätze die zeigen, dass du das Unternehmen kennst
- `{{branchenspezifischer_hook}}`: Branchenspezifisches Argument warum eine Webseite wichtig ist
- `{{business_name}}`: Firmenname
- `{{value_proposition}}`: Konkretes Angebot (Follow-up 1)
- `{{optout_link}}`: Generierter Opt-out Link (siehe unten)

**Opt-out Link generieren:**
```bash
# Email base64-kodieren und HMAC erstellen
EMAIL="<recipient>"
EMAIL_B64=$(echo -n "$EMAIL" | base64)
HMAC=$(echo -n "$EMAIL" | openssl dgst -sha256 -hmac "$OPTOUT_SECRET" | cut -d' ' -f2)
OPTOUT_LINK="https://landingpagesooe.app/api/outreach-optout?token=${EMAIL_B64}:${HMAC}"
```

Falls `OPTOUT_SECRET` nicht in `.env.local` steht, frage den User danach oder generiere eines und empfehle es in Vercel Env Vars einzutragen.

**Betreffzeilen:**
- Initial: "Webpräsenz für {{business_name}}?" oder "Ihre Online-Sichtbarkeit – ein kurzer Gedanke"
- Follow-up 1: "Re: Webpräsenz für {{business_name}}?"
- Follow-up 2: "Letzte Nachricht von mir"

**Ton:** Persönlich, kurz (<150 Wörter Fließtext), nicht werblich. Wie eine echte Email von einem Freelancer.

### 6. Email dem User zeigen — BESTÄTIGUNG EINHOLEN
**KRITISCH:** Zeige die komplette Email (Betreff + HTML-Body als Vorschau) und frage explizit:
> "Soll ich diese Email an [email] senden? (ja/nein/bearbeiten)"

Sende NIEMALS ohne Bestätigung.

### 7. Versenden via Resend API
```bash
curl -s -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer $RESEND_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "Landing Pages OÖ <kontakt@landingpagesooe.app>",
    "to": ["<recipient>"],
    "subject": "<betreff>",
    "html": "<html-body>"
  }'
```

Speichere die `id` aus der Response als `resend_message_id`.

### 8. In DB tracken
```sql
INSERT INTO outreach_emails (prospect_id, email_type, subject, body_html, resend_message_id)
VALUES ('<prospect_id>', '<type>', '<subject>', '<html>', '<resend_id>');
```

### 9. Bestätigung
Zeige dem User: "✅ Email an [empfänger] gesendet (Resend ID: [id])"

## Limits & Regeln

- **Max 10 Emails pro Tag** — zähle via: `SELECT count(*) FROM outreach_emails WHERE sent_at > now() - interval '24 hours'`
- **2 Minuten Pause** zwischen Sends im Batch-Modus
- **Nur Mo-Do senden**, empfohlen 08:00-10:00 CET
- **Follow-up Timing:** 7 Tage nach Initial, 14 Tage nach Follow-up 1
- Wenn das Tageslimit erreicht ist, informiere den User und stoppe

## Branchenspezifische Hooks (Beispiele)

**Handwerker:** "Viele Ihrer Kunden suchen heute online nach einem Handwerker in der Nähe. Ohne Webseite gehen diese Aufträge an die Konkurrenz."

**Coach/Berater:** "Eine professionelle Online-Präsenz schafft Vertrauen — gerade bei persönlichen Dienstleistungen ist der erste Eindruck entscheidend."

**Gastro:** "Öffnungszeiten, Speisekarte, Reservierung — Ihre Gäste erwarten das online zu finden."

**Friseur:** "Die meisten neuen Kunden googeln 'Friseur in [Ort]'. Mit einer eigenen Webseite sind Sie dort sichtbar."

**Arzt/Gesundheit:** "Patienten informieren sich vorab online über Praxen. Eine moderne Webseite mit Ordinationszeiten und Leistungen spart Ihnen Telefonanrufe."

## Supabase-Konfiguration

- **Project ID:** `apchqzlmhnwgnwpofemf`
- **Tabellen:** `prospects`, `outreach_emails`, `outreach_optouts`
- Für SQL-Abfragen nutze: `mcp__claude_ai_Supabase__execute_sql`

## Bekannte URL-Patterns für Research

```
# WKO Firmen A-Z (funktioniert mit WebFetch)
https://firmen.wko.at/<branche>/<ort>_gemeinde/
https://firmen.wko.at/<branche>/<bezirk>_bezirk/

# Herold (NICHT verwenden — JS-rendered, liefert keine Daten via WebFetch)
# herold.at/gelbe-seiten/... → nur als Referenz-Link für den User

# Google Maps (via WebSearch)
"<Firmenname> <Ort>" site:google.com/maps
```

## Dateien

- Templates: `templates/outreach/initial.html`, `followup1.html`, `followup2.html`
- Opt-out Endpoint: `api/outreach-optout/index.js`
- Resend API Key: `.env.local` → `RESEND_API_KEY`
