---
description: Erstellt eine neue Landing Page für einen Kunden (End-to-End mit Supabase & Vercel)
---

Dieser Workflow automatisiert die Erstellung einer neuen Seite basierend auf dem `handwerker-template` und nutzt MCP Tools für Backend & Design.

# Schritt 1: Parameter erfassen
Frage den User nach folgenden Daten, falls noch nicht angegeben:
- **Kunden-Name** (z.B. "Tischlerei Huber")
- **Slug** (z.B. "tischlerei-huber") -> Muss URL-freundlich sein!
- **Leitsatz/Motto** (für den Hero-Bereich)
- **Hauptfarbe** (z.B. "Dunkelgrün", "Orange")

# Schritt 2: Design-Inspiration mit Stitch
Falls der User unsicher beim Design ist oder spezielle Wünsche hat:
1. Nutze `mcp_stitch_generate_screen_from_text` um einen ersten Entwurf oder eine Komponente zu visualisieren.
   - Prompt-Beispiel: "Hero Section for a bakery, warm colors, trust badges"
2. Nutze dies als Referenz für die Anpassungen in Schritt 5.

# Schritt 3: Projekt-Ordner erstellen
1. Kopiere wenn es ein passendes Template gibt dieses nach nach `clients/[slug]`.
   - Befehl: `cp -r templates/handwerker-template clients/[slug]`
2. Prüfe, ob der Ordner existiert.

# Schritt 4: Technische Konfiguration
1. Öffne `clients/[slug]/script.js`.
2. Ändere die erste Zeile zu: `const client = '[slug]';`
   - **ACHTUNG:** Der String muss Exakt dem Slug entsprechen.

# Schritt 5: Design & Content Anpassung
1.  **Index.html**:
    - Ersetze den `<title>` mit dem Kunden-Namen.
    - Passe den Hero-Text (h1, p) an.
    - Tausche Platzhalter-Bilder aus (nutze Unsplash Keywords und gegebene Bilder vom Kundne  passend zum Handwerk).
    - Update die Meta-Description.
2.  **Style.css**:
    - Passe `--primary-color` an die gewünschte Hauptfarbe an.

# Schritt 6: Datenbank / Email Routing (Supabase MCP)
Benutze **zwingend** das Tool `mcp_supabase-mcp-server_execute_sql` um den Kunden anzulegen.
SQL Query:
```sql
INSERT INTO clients (slug, name, notification_email)
VALUES ('[slug]', '[Kunden-Name]', '[user-email-placeholder]');
```
*Frage den User vorher nach der korrekten Email-Adresse.*

# Schritt 7: Deployment (Vercel)
1. Führe die Git-Commands aus:
   ```bash
   git add .
   git commit -m "feat: Launch [Kunde]"
   git push origin master
   ```
2. Bestätige dem User: "Vercel Deployment wurde durch Push getriggert."
3. (Optional) Prüfe den Status, falls möglich, oder gib dem User den Link: `https://landing-pages-ooe.vercel.app/clients/[slug]/index.html`