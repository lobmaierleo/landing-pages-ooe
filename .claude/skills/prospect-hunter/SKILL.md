---
name: prospect-hunter
description: >
  Vollautomatischer Prospect-Research-und-Gmail-Draft-Skill für Webseiten OÖ.
  Findet kleine Firmen in Oberösterreich (oder ganz Österreich) ohne oder mit schlechter Website,
  verifiziert jeden einzelnen Prospect rigoros, und erstellt personalisierte Gmail-Entwürfe.
  Nutze diesen Skill IMMER wenn der User nach Prospects, Leads, Betrieben oder Firmen sucht,
  die eine schlechte oder keine Website haben — auch wenn er nicht explizit "prospect-hunter" sagt.
  Trigger-Phrasen: "Suche nach [Branche]", "Finde [Branche] ohne Website", "Prospect-Hunting",
  "Recherchiere [Branche] für Outreach", "Betriebe finden", "Kaltakquise-Recherche",
  "Gmail-Entwürfe erstellen für [Branche]", "Wer braucht eine Website in [Ort]".
  Ergänzt den customer-outreach Skill (der den tatsächlichen Versand via Resend übernimmt).
user_invocable: true
---

# Prospect Hunter — Webseiten OÖ

Finde kleine Betriebe ohne/mit schlechter Website in einer Region und erstelle personalisierte Gmail-Entwürfe.

## Schnellstart

```
Suche nach Tischlereien in Wels und erstelle Gmail-Entwürfe
```

Der Skill erwartet **Branche** und **Region**. Falls nicht angegeben, frage nach.

## Business-Kontext

- **Unternehmen:** Webseiten OÖ — https://landingpagesooe.app
- **Absender:** Leo Lobmaier, kontakt@landingpagesooe.app, +43 681 20874499
- **Zielgruppe:** Handwerker, Coaches, Fotografen, Friseure, Gastro, Ärzte, lokale Dienstleister
- **Region:** Primär Oberösterreich, optional ganz Österreich
- **Supabase Project ID:** `apchqzlmhnwgnwpofemf`

### Aktuelles Pricing (Stand März 2026)

| Leistung | Preis |
|----------|-------|
| **Der Refresh** (neue Webseite / Redesign) | ab 390 € einmalig |
| **KI-Chatbot** (24/7 Anfragen-Erfassung) | ab 290 € einmalig |
| **Blog-Feature** (SEO-optimiert) | ab 200 € einmalig |
| **Rundum-Sorglos Abo** (Hosting, Wartung, Support) | 15 €/Monat oder 150 €/Jahr |
| **Vorschau** | 0 € — kostenlos und unverbindlich |

Für die Emails: Lead mit der **kostenlosen Vorschau** (0 € Risiko), dann **ab 390 €** für die Webseite + **15 €/Monat** Abo. Jederzeit kündbar, keine versteckten Kosten. Immer https://landingpagesooe.app verlinken.

## 4-Stufen Pipeline

Die Pipeline läuft sequentiell. Gib nach jeder Stufe ein kurzes Status-Update.

---

### Stufe 1: Discovery — Betriebe finden

**Ziel:** 15-30+ Betriebe der angegebenen Branche/Region sammeln.

#### Quellenauswahl je nach Branche

**WKO-Mitglieder** (Handwerker, Gewerbe, Handel, Friseure, Gastro):
```
https://firmen.wko.at/<branche>/<ort>_gemeinde/
https://firmen.wko.at/<branche>/<bezirk>_bezirk/
```
Probiere mehrere Branchenvarianten! Z.B. für Tischlereien: `tischlerei`, `tischler`, `holzbau`.
Für Friseure: `friseur`, `frisör`, `friseursalon`, `haar`.

**Freiberufler** (Ärzte, Anwälte, Therapeuten, Notare — NICHT bei WKO):
- **DocFinder.at:** `https://www.docfinder.at/suche/<fachrichtung>/<ort>` (per WebFetch)
- **FirmenABC:** `https://www.firmenabc.at/firmen/ooe/<branche>_<code>` (per WebFetch)
- **Ärztekammer OÖ:** `https://arztsuche.aekooe.at/finder/search/land/OO`
- **WebSearch** mit gezielten Suchanfragen pro Bezirk

**Für alle Branchen ergänzend:**
- **WebSearch:** `<branche> <ort> Oberösterreich`
- **Gelbe Seiten** — nur via WebSearch, NICHT direkt fetchen
- **Herold.at NICHT direkt fetchen** — JS-rendered, liefert keine Daten via WebFetch

**Bei Region "Oberösterreich":** Suche in mehreren Städten/Bezirken für breite Abdeckung: Linz, Wels, Steyr, Vöcklabruck, Ried, Eferding, Gmunden, Braunau, Freistadt, Perg, Rohrbach, Kirchdorf, Schärding.

**Zu wenige Ergebnisse (<10)?** Erweitere: Nachbarbezirke einbeziehen, alternative Branchenbezeichnungen probieren, WebSearch mit Varianten durchführen.

**Parallelisierung:** Nutze parallele Tool-Aufrufe wo möglich — z.B. mehrere WKO-URLs oder WebSearches gleichzeitig abrufen.

**Output pro Betrieb:**
```json
{
  "business_name": "Tischlerei Huber",
  "address": "Musterstrasse 5",
  "location": "Wels",
  "phone": "+43 7242 12345",
  "email_if_found": "info@tischlerei-huber.at",
  "website_if_found": "https://tischlerei-huber.at",
  "source": "WKO Firmen A-Z"
}
```

Speichere als `discovery_results.json`. Dedupliziere: Wenn derselbe Betrieb in mehreren Quellen auftaucht, behalte den Eintrag mit den meisten Daten.

**Status-Update:** "Stufe 1 abgeschlossen: X Betriebe gefunden in [Region]"

---

### Stufe 2: Verification — Webseiten prüfen

**Ziel:** Für JEDEN Betrieb die Website-Situation beweiskräftig prüfen. Keine Annahmen — nur Fakten.

#### Wichtig: WebFetch ist NICHT dasselbe wie ein Browser!

WebFetch hat systematische Einschränkungen, die zu falschen Ergebnissen führen:
- **403 Forbidden** = oft Bot-Schutz (Cloudflare, WAF), NICHT eine kaputte Website
- **SSL-Fehler** = WebFetch interpretiert SSL strenger als moderne Browser. Eine "self-signed certificate"-Meldung bedeutet nicht zwingend, dass der User eine Warnung sieht
- **ECONNREFUSED** = kann temporär sein oder nur für automatisierte Anfragen gelten

Ein WebFetch-Fehler allein reicht NICHT aus, um eine Website als kaputt einzustufen. Du brauchst eine Gegenprüfung.

#### Prüflogik

**Betriebe OHNE Website-Eintrag:**
- Per WebSearch googeln: `"<Firmenname>" <Ort> website`
- Vielleicht gibt es eine, die im Verzeichnis nicht eingetragen ist

**Betriebe MIT Website-URL — zweistufige Prüfung:**

**Schritt 1:** WebFetch aufrufen und Ergebnis notieren.

**Schritt 2 (Gegenprüfung):** Wenn WebFetch einen Fehler liefert (403, SSL-Fehler, ECONNREFUSED, Timeout), führe eine Gegenprüfung per WebSearch durch:
- Suche: `site:<domain>` oder `"<domain>"` — wenn Google die Seite indexiert hat, funktioniert sie wahrscheinlich im Browser
- Suche: `"<Firmenname>" website` — prüfe ob in Suchergebnissen/Snippets eine funktionierende Seite beschrieben wird
- Wenn Google-Cache/Snippets eine aktuelle, funktionale Seite zeigen → Score 4-6 (rausfiltern), auch wenn WebFetch Fehler gibt

**Bei erfolgreicher WebFetch-Antwort** bewerten:
- viewport meta tag? (mobil-responsive)
- Copyright-Jahr / letztes Update (ein Copyright-Jahr >5 Jahre zurück = veraltet)
- Kontaktformular vorhanden?
- Gesamteindruck: Sieht die Seite professionell aus oder wie aus den 2000ern?

**Parallelisierung:** Rufe mehrere Websites gleichzeitig per WebFetch ab.

#### Scoring

| Score | Label | Bedeutung | Aktion |
|-------|-------|-----------|--------|
| 1 | keine | Keine Website gefunden, auch Google findet nichts | HEISSER PROSPECT |
| 2 | katastrophal | Website nachweislich kaputt UND Gegenprüfung bestätigt das | HEISSER PROSPECT |
| 3 | veraltet | Funktioniert, aber deutlich veraltet (Design/Copyright >5 Jahre alt) | WARMER PROSPECT |
| 4 | mittelmäßig | OK, nicht modern | Rausfiltern |
| 5 | gut | Ordentlich | Rausfiltern |
| 6 | modern | Professionell, aktuell | Rausfiltern |

Nur Score 1-3 weiter. Lieber zu streng als jemanden mit guter Website anschreiben.

**Entscheidungsbaum bei WebFetch-Fehlern:**
1. WebFetch gibt Fehler → Gegenprüfung per WebSearch
2. Google indexiert die Seite mit aktuellen Snippets → **Score 4-6** (Website funktioniert im Browser)
3. Google findet die Seite NICHT oder zeigt alte/kaputte Inhalte → **Score 1-2** (Website wirklich kaputt)
4. Unklar → **Lieber rausfiltern** (Score 4) als fälschlich anschreiben

Speichere als `verified_prospects.json`.

**Status-Update:** "Stufe 2 abgeschlossen: X von Y qualifiziert (Score 1-3)"

---

### Stufe 3: Enrichment — Kontaktdaten & Kontext

**Ziel:** Für jeden verifizierten Prospect die bestmöglichen Kontaktdaten sammeln. Die Email-Adresse ist der Schlüssel — ohne Email kein Entwurf.

#### Email finden — Qualität vor Quantität!

Eine falsche Email ist schlimmer als keine Email. Sie erzeugt einen Bounce, schadet der Absender-Reputation und verschwendet Zeit. Deshalb: nur Emails verwenden, die aus einer verlässlichen Quelle stammen.

**Verlässlichkeitsrang der Email-Quellen (beste zuerst):**

1. **Eigene Website des Betriebs** — Impressum oder Kontaktseite per WebFetch (`/impressum`, `/kontakt`, `/about`). Das ist die zuverlässigste Quelle.
2. **Google Maps / Google Business Profil** — `<Firmenname> <Ort>` per WebSearch, dann den Google-Eintrag prüfen. Emails dort werden vom Betrieb selbst gepflegt.
3. **Offizielle Social-Media-Profile** — Facebook "Info"/"Über uns", Instagram Bio. Vom Betrieb selbst verwaltet.
4. **WKO-Detailseite** — bei WKO-Mitgliedern die Firmenseite auf firmen.wko.at aufrufen. Relativ aktuell.
5. **DocFinder / Ärztekammer** — bei Ärzten, vom Arzt selbst gepflegte Profile.

**NICHT verwenden oder nur mit Vorsicht:**
- **Stadtbranchenbücher** (wels-neustadt.at, linz-stadt.at etc.) — oft veraltet, Emails existieren häufig nicht mehr
- **FirmenABC, Cylex, Gelbe Seiten** — Aggregatoren die Daten scrapen, oft veraltet. Nur als letzte Quelle verwenden und im Output als `"email_source": "aggregator"` markieren
- **Geratene Emails** (info@domain.at, office@domain.at) — NUR verwenden wenn die Domain nachweislich aktiv ist UND als `"email_guessed": true` markieren

Wenn nach den Top-5-Quellen keine Email gefunden wurde: den Prospect als Klasse C einstufen. Lieber telefonisch nachfassen als an eine nicht-existierende Adresse schreiben.

**Ansprechpartner finden:**
- Inhaber-Name aus Verzeichnis, Impressum, Facebook "Über uns"
- Geschlecht für korrekte Anrede (Herr/Frau)
- Bei Ärzten: akademischen Titel verwenden (Dr., DDr., etc.)

**Personalisierungs-Kontext:**
- Was macht der Betrieb? Spezialisierung?
- Besondere Merkmale ("Familienbetrieb seit 1985", "Spezialist für Altbau")
- Google-Bewertungen? (aktiver Betrieb = gutes Zeichen)

**Klassifizierung:**

| Klasse | Kriterien | Aktion |
|--------|-----------|--------|
| **A+** | Verifizierte Email (Quelle 1-3) + Score 1-2 + Ansprechpartner bekannt | TOP PRIORITÄT — Gmail-Entwurf |
| **A** | Verifizierte Email (Quelle 1-5) + Score 1-2 | Gmail-Entwurf |
| **B** | Verifizierte Email + Score 3 (veraltet) | Gmail-Entwurf, niedrigere Prio |
| **B-** | Email nur aus Aggregator-Quelle (Quelle 6+) | Gmail-Entwurf, aber mit Hinweis "Email ggf. veraltet" |
| **C** | Keine Email gefunden oder nur geraten | Report für manuelles Nachfassen (Telefon) |

Speichere als `enriched_prospects.json`, sortiert nach Klasse.

**Status-Update:** "Stufe 3 abgeschlossen: X kontaktierbare Prospects (A+: X, A: X, B: X, C: X)"

---

### Stufe 4: Gmail Drafts — Entwürfe erstellen

**Ziel:** Für jeden Klasse A+/A/B Prospect einen personalisierten Gmail-Entwurf erstellen.

#### DSGVO-Check (gebatcht)

Prüfe ALLE Emails auf einmal via Supabase MCP (`execute_sql`, project_id: `apchqzlmhnwgnwpofemf`):

```sql
SELECT email FROM outreach_optouts WHERE email IN ('email1@example.at', 'email2@example.at');
```

Falls die Tabelle nicht existiert ("relation does not exist"): Kein Problem — es gibt noch keine Opt-outs. Weitermachen.

Falls eine Email im Ergebnis auftaucht: diesen Prospect ÜBERSPRINGEN.

#### Email-Personalisierung

Jede Email muss einzigartig wirken und sich wie eine echte, persönliche Nachricht lesen — nicht wie ein Massen-Mailing.

**Betreffzeilen** (variieren, nicht alle gleich!):
- "Webpräsenz für {{business_name}}?"
- "Online-Sichtbarkeit in {{location}} — ein Gedanke"
- "Ihre Kunden suchen online nach Ihnen, {{business_name}}"
- "Kurze Frage an {{business_name}}"

**Anrede:**
- Mit Name: "Hallo Herr/Frau [Name]," (bei Ärzten: "Hallo Herr Dr. [Name],")
- Ohne Name: "Guten Tag,"

**Email-Body Struktur:**
1. **Einstieg** (1-2 Sätze): Zeige dass du den Betrieb kennst
2. **Problem ansprechen** (respektvoll):
   - MIT kaputter Website: Erwähne das konkrete Problem (SSL, offline, etc.)
   - OHNE Website: "Viele Ihrer potenziellen Kunden suchen online nach [Branche] in [Ort]"
3. **Branchenspezifischer Hook** — siehe `references/branchenhooks.md`
4. **Angebot:** Kostenlose Vorschau in 3 Tagen, ab 390 € + 15 €/Monat Abo
5. **Website-Link:** https://landingpagesooe.app
6. **CTA:** "Darf ich Ihnen eine solche Vorschau erstellen?"

**Signatur:**
```
Mit freundlichen Grüßen
Leo Lobmaier
Webseiten OÖ
https://landingpagesooe.app
kontakt@landingpagesooe.app
+43 681 20874499
```

**Ton:** Persönlich, kurz (<150 Wörter Fließtext), wie eine echte Email von einem lokalen Freelancer. Kein Verkaufsdruck, keine Marketing-Floskeln.

**Format:** HTML, aber minimalistisch — normaler Text mit `<br>` für Zeilenumbrüche und `<a>` für Links. Kein aufwändiges Design.

#### Konkretes Email-Beispiel

Hier ein Beispiel für einen Friseur ohne Website (Klasse A+):

```html
Hallo Frau Maier,<br><br>
ich bin auf Ihren Friseursalon in Wels aufmerksam geworden und wollte mich kurz vorstellen.<br><br>
Viele Ihrer potenziellen Neukunden suchen heute online nach einem Friseur in Wels — und finden dort aktuell noch keinen Webauftritt von Ihnen. Online-Terminbuchung, Preisliste, Eindrücke vom Salon — das erwarten Kunden mittlerweile einfach.<br><br>
Ich erstelle professionelle Webseiten für lokale Betriebe in Oberösterreich und würde Ihnen gerne kostenlos und unverbindlich innerhalb von 3 Tagen eine Vorschau für Ihre neue Webseite erstellen. Wenn sie Ihnen gefällt, starten die Kosten ab 390 € einmalig, dazu ein Abo für Hosting und Wartung um 15 €/Monat — jederzeit kündbar.<br><br>
Mehr über mein Angebot finden Sie auf <a href="https://landingpagesooe.app">landingpagesooe.app</a>.<br><br>
Darf ich Ihnen eine solche Vorschau erstellen?<br><br>
Mit freundlichen Grüßen<br>
Leo Lobmaier<br>
Webseiten OÖ<br>
<a href="https://landingpagesooe.app">landingpagesooe.app</a><br>
<a href="mailto:kontakt@landingpagesooe.app">kontakt@landingpagesooe.app</a><br>
+43 681 20874499
```

Dieses Beispiel zeigt die Struktur — kopiere es NICHT wörtlich. Personalisiere jede Email individuell basierend auf dem Betrieb, seiner Branche und seinem konkreten Problem.

#### Gmail-Entwurf erstellen

Nutze `gmail_create_draft` (Gmail MCP) für jeden Prospect:
- `to`: Email des Prospects
- `subject`: Personalisierte Betreffzeile
- `body`: HTML-Body der Email

**Rate Limit:** Max 20 Gmail-Entwürfe pro Durchlauf. Bei mehr: Top-20 erstellen (A+ > A > B), Rest im Report auflisten.

#### Prospects in Supabase speichern (optional)

Falls die `prospects` Tabelle existiert:
```sql
INSERT INTO prospects (business_name, contact_name, email, phone, industry, location, current_website, website_quality, notes, source)
VALUES ('<...>')
ON CONFLICT (email) DO NOTHING;
```
Falls nicht: überspringen, im Report erwähnen. Nicht abbrechen.

Speichere `outreach_report.json`.

**Status-Update:** "Stufe 4 abgeschlossen: X Gmail-Entwürfe erstellt"

---

## Workspace-Struktur

```
prospect-hunter-workspace/
└── runs/
    └── YYYY-MM-DD_<branche>-<ort>/
        ├── discovery_results.json
        ├── verified_prospects.json
        ├── enriched_prospects.json
        ├── outreach_report.json
        └── run_log.md
```

Die `run_log.md` enthält:
- Zusammenfassung: X gefunden → Y verifiziert → Z Entwürfe
- Alle Prospects mit Klasse und Status
- Klasse-C-Prospects mit Telefonnummer für manuelles Nachfassen
- Übersprungene Prospects mit Grund

## Abschluss-Report

```
Prospect-Hunting: [Branche] in [Region]

Stufe 1 — Discovery:    X Betriebe gefunden
Stufe 2 — Verification: Y qualifiziert (Score 1-3)
Stufe 3 — Enrichment:   Z kontaktierbar (A+: X, A: X, B: X)
                         W nur telefonisch (C)
Stufe 4 — Gmail Drafts: N Entwürfe erstellt

Die Entwürfe liegen in deinem Gmail-Postfach als Drafts.
Bitte prüfe sie vor dem Senden!
```
