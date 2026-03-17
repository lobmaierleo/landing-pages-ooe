# Workflow: Neuen Kunden aufnehmen (komplett)

Jeder Kunde bekommt ein **eigenes Git-Repo**, **eigenes Vercel-Projekt** und **eigene Domain**. Der Ordner liegt unter `clients/<slug>/` in diesem Monorepo, wird aber eigenständig versioniert und deployed.

## 1. Parameter erfassen
Frage nach (falls nicht angegeben):
- **Kunden-Name** (z.B. "Tischlerei Huber")
- **Slug** (z.B. `tischlerei-huber`) – muss URL-freundlich sein
- **Leitsatz/Motto** (für Hero-Bereich)
- **Hauptfarbe** (z.B. "Dunkelgrün", "Orange")
- **Notification-Email** – wohin sollen Leads gesendet werden?

## 2. Projekt-Ordner erstellen
```bash
cp -r templates/handwerker-template clients/[slug]
```

## 3. Design & Content anpassen
- **index.html**: `<title>`, Hero-Text (h1, p), Bilder, Meta-Description
- **style.css**: `--primary-color` auf gewünschte Hauptfarbe setzen

## 4. Kontaktformular einrichten (KRITISCH)

Das Formular muss korrekt konfiguriert sein, damit Leads in Supabase ankommen:

**a) `data-client` Attribut setzen — PFLICHT:**
```html
<form data-client="[slug]">
```
Ohne `data-client` wird der Lead keinem Kunden zugeordnet!

**b) Formularfelder mit korrekten `name`-Attributen:**
```html
<input name="name" required />
<input name="email" type="email" required />
<input name="phone" type="tel" />
<textarea name="message" required></textarea>
<button type="submit">Anfrage senden</button>
```

**c) Scripts am Ende der HTML (in dieser Reihenfolge):**
```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="form.js"></script>
```

**d) KEINE doppelte Form-Logik in `script.js`!**
Die `form.js` übernimmt: Smooth Scrolling, Header-Effekt, Formular-Submit + Supabase-Insert.
Wenn `script.js` existiert, darf sie KEINE eigene Form-Submit-Logik oder eigene Supabase-Initialisierung enthalten.

## 5. form.js + vercel.json einrichten
```bash
cp shared/form.js clients/[slug]/form.js
```
`vercel.json` im Client-Ordner erstellen:
```json
{
  "headers": [
    {
      "source": "/(.*)\\.html",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" }
      ]
    },
    {
      "source": "/images/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ]
}
```

## 6. Datenbank: Client in Supabase anlegen
Via Supabase MCP (`execute_sql`):
```sql
INSERT INTO clients (slug, name, notification_email)
VALUES ('[slug]', '[Kunden-Name]', '[email]');
```
**Ohne diesen Eintrag kommt keine E-Mail-Benachrichtigung bei neuen Leads!**

## 7. Eigenes Repo + Deployment

**a) Client aus Monorepo-Tracking entfernen:**
```bash
git rm -r --cached clients/[slug]/
echo "clients/[slug]/" >> .gitignore
git commit -m "chore: remove [slug] from monorepo tracking"
git push
```

**b) Eigenes Git-Repo initialisieren + GitHub-Repo erstellen:**
```bash
cd clients/[slug]/
git init && git add . && git commit -m "feat: initial commit [slug]"
gh repo create lobmaierleo/[slug] --public --source=. --push
```

**c) Vercel-Projekt:** Dashboard → New Project → GitHub-Repo importieren

**d) Custom Domain:** Vercel Settings → Domains → Domain hinzufügen, DNS: A-Record `76.76.21.21` oder CNAME `cname.vercel-dns.com`

## 8. Checkliste vor Go-Live

- [ ] `data-client="[slug]"` auf dem `<form>` Tag
- [ ] `name`-Attribute auf allen Formularfeldern (name, email, phone, message)
- [ ] Supabase CDN + `form.js` eingebunden (in dieser Reihenfolge)
- [ ] Keine doppelte Form-Logik in `script.js`
- [ ] Client in Supabase `clients` Tabelle angelegt (slug + notification_email)
- [ ] `vercel.json` mit Security-Headers im Client-Ordner
- [ ] Vercel-Projekt erstellt + Domain konfiguriert
- [ ] Testformular absenden → Lead erscheint in Supabase `leads` Tabelle
- [ ] E-Mail-Benachrichtigung kommt an

## Wartung

- Änderungen direkt in `clients/[slug]/` machen, `git push` aus dem Client-Ordner → Vercel deployt automatisch
- Bei Updates an `shared/form.js`: manuell in jeden Client-Ordner kopieren
- Kunden-Email ändern: `UPDATE clients SET notification_email = '[neue-email]' WHERE slug = '[slug]';`

## Bereits migrierte Clients
- `tischler-wels` → [github.com/lobmaierleo/tischler-wels](https://github.com/lobmaierleo/tischler-wels) (Testprojekt, Formular nicht aktiv)
