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

## Neuen Kunden aufnehmen

Vollständiger Workflow: **`.claude/workflows/neuer-kunde.md`** — lies diese Datei wenn ein neuer Kunde erstellt oder der Workflow gebraucht wird.

Kurzfassung: Jeder Kunde bekommt ein eigenes Git-Repo + Vercel-Projekt unter `clients/<slug>/`. Details, Checkliste und Wartungshinweise stehen im Workflow-Dokument.

## Deployment (allgemein)

- Static hosting via Vercel – auto-deploy on push to master
- Supabase Edge Functions separat: `supabase functions deploy send-lead-notification`
- Env vars für Edge Functions: `RESEND_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
