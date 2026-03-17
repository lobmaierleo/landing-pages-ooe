# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Landing Pages OÖ – a web agency site and collection of client landing pages for small businesses (Handwerker, Coaches, Dienstleister) in Oberösterreich, Austria. The main site is at `landingpagesooe.app`. All content is **immer auf Deutsch**.

## Architecture

### Static site, no build step
Plain HTML/CSS/JS project. No bundler, no framework. Open HTML files directly in a browser for development.

### Directory structure
- **`/` (root)** – Main agency website (`index.html`, `style.css`, `script.js`)
- **`clients/<slug>/`** – Individual client landing pages, each self-contained with `index.html`, `style.css`, `script.js`, `images/`
- **`templates/`** – Starter templates by industry (handwerker, coach, dienstleister)
- **`shared/`** – Shared assets and components across client sites
- **`Anforderungen/`** – Client requirements docs (Markdown)
- **`DESIGN_SYSTEM.md`** – Authoritative design rules: colors, typography, component patterns

### Lead capture flow
1. Contact forms insert directly into Supabase `leads` table via `@supabase/supabase-js` (CDN)
2. Each lead includes a `client` slug (e.g. `tischler-wels`, `landing-pages-ooe`)
3. Supabase Database Webhook triggers `supabase/functions/send-lead-notification/index.ts`
4. Edge Function looks up `notification_email` from `clients` table, sends email via Resend API
5. `api/submit-lead/` is a Vercel Edge Function alternative that also inserts into Supabase

### Supabase tables
- **`leads`** – name, email, phone, message, client (slug)
- **`clients`** – slug, name, notification_email

### Key conventions
- CSS custom properties (`--primary-color`, `--primary-hover`) per client — see `DESIGN_SYSTEM.md`
- Tailwind-style utility classes via custom CSS, not actual Tailwind
- Fonts: Inter (body), Outfit (headings) via Google Fonts; Material Symbols Outlined for icons
- Analytics: Plausible (cookie-free, DSGVO-konform)
- Spam protection: frontend input trimming + validation before Supabase insert

## Notion Integration (wichtig!)

- Orientiere dich beim Erstellen einer Landing Page am vollständigen Inhalt und Workflow der Notion-Seite **"Landing Pages OE"**
- Nach Abschluss einer Aufgabe: aktualisiere den Status in **"Landing Pages OOE - Issue Tracker"** (Notion)

## Workflow: Neue Client-Site erstellen

### 1. Parameter erfassen
Frage nach (falls nicht angegeben):
- **Kunden-Name** (z.B. "Tischlerei Huber")
- **Slug** (z.B. `tischlerei-huber`) – muss URL-freundlich sein
- **Leitsatz/Motto** (für Hero-Bereich)
- **Hauptfarbe** (z.B. "Dunkelgrün", "Orange")

### 2. Projekt-Ordner erstellen
- Passendes Template nach `clients/[slug]` kopieren: `cp -r templates/handwerker-template clients/[slug]`

### 3. Technische Konfiguration
- In `clients/[slug]/script.js` den Client-Slug setzen: `const client = '[slug]';`
- **Der String muss exakt dem Slug entsprechen!**

### 4. Design & Content anpassen
- **index.html**: `<title>`, Hero-Text (h1, p), Platzhalter-Bilder, Meta-Description
- **style.css**: `--primary-color` auf gewünschte Hauptfarbe setzen

### 5. Datenbank: Client in Supabase anlegen
Via Supabase MCP (`execute_sql`):
```sql
INSERT INTO clients (slug, name, notification_email)
VALUES ('[slug]', '[Kunden-Name]', '[email]');
```
Vorher nach der korrekten Email-Adresse fragen.

### 6. Deployment
```bash
git add .
git commit -m "feat: Launch [Kunde]"
git push origin master
```
Vercel Deployment wird automatisch durch Push getriggert. Preview-URL: `https://landing-pages-ooe.vercel.app/clients/[slug]/index.html`

## Eigenes Repo pro Client

Jeder Client hat ein **eigenes Git-Repo** und **eigenes Vercel-Projekt** unter `clients/<slug>/`. So hat jeder Client ein unabhängiges Deployment und kann eine eigene Domain bekommen.

### Workflow: Client in eigenes Repo migrieren

1. **Client aus Monorepo-Tracking entfernen:**
   ```bash
   git rm -r --cached clients/[slug]/
   echo "clients/[slug]/" >> .gitignore
   git commit -m "chore: remove [slug] from monorepo tracking"
   git push
   ```

2. **form.js lokal einbinden:**
   ```bash
   cp shared/form.js clients/[slug]/form.js
   ```
   In `index.html` ändern: `<script src="/shared/form.js">` → `<script src="form.js">`

3. **Client-eigene `vercel.json` erstellen** (Security-Headers, Cache-Regeln)

4. **Git-Repo initialisieren + GitHub-Repo erstellen:**
   ```bash
   cd clients/[slug]/
   git init && git add . && git commit -m "feat: initial commit [slug]"
   gh repo create lobmaierleo/[slug] --public --source=. --push
   ```

5. **Vercel-Projekt:** Dashboard → New Project → GitHub-Repo importieren

6. **Custom Domain:** Vercel Dashboard → Settings → Domains → Domain hinzufügen, DNS: A-Record `76.76.21.21` oder CNAME `cname.vercel-dns.com`

### Bereits migrierte Clients
- `tischler-wels` → [github.com/lobmaierleo/tischler-wels](https://github.com/lobmaierleo/tischler-wels)

## Deployment (allgemein)

- Static hosting via Vercel – auto-deploy on push to master
- Supabase Edge Functions separat: `supabase functions deploy send-lead-notification`
- Env vars für Edge Functions: `RESEND_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
