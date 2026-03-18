# Outreach Research — Anleitung

## Schnellstart

```
/customer-outreach research tischler wels
```

Das startet den 4-Stufen Research-Workflow für Tischlereien in Wels.

## Aufruf-Format

```
/customer-outreach research <branche> <ort>
```

**Branchen-Beispiele:** tischler, friseur, installateur, maler, elektriker, coach, gastro, arzt
**Ort-Beispiele:** wels, linz, steyr, gmunden, vöcklabruck, ried

## Was passiert nach dem Aufruf?

### Stufe 1 — Betriebe finden
Claude durchsucht WKO Firmen A-Z nach Betrieben der angegebenen Branche/Ort.
Du musst nichts tun — läuft automatisch.

### Stufe 2 — Websites verifizieren
Für jeden gefundenen Betrieb wird geprüft, ob tatsächlich eine Website existiert.
Auch wenn WKO "keine Website" sagt, wird gegoogelt.

### Stufe 3 — Emails finden
Betriebe ohne Email in WKO werden zusätzlich recherchiert (Google, Facebook, Impressum).

### Stufe 4 — Ergebnis-Tabelle
Du bekommst eine Tabelle mit klassifizierten Prospects:

| Klasse | Bedeutung | Was du tun kannst |
|--------|-----------|-------------------|
| **A** | Hat Email, keine/veraltete Website | Direkt kontaktierbar — Claude fragt ob du senden willst |
| **B** | Hat Email, aber moderne Website | Kein Target, wird übersprungen |
| **C** | Keine Email gefunden | Gespeichert, aber kein Outreach möglich |

## Danach: Email senden

Wenn du einen Klasse-A-Prospect kontaktieren willst:

```
/customer-outreach send
```

Oder direkt mit Daten:

```
/customer-outreach send Tischlerei Huber info@huber.at handwerker
```

Claude zeigt dir die Email immer zuerst zur Bestätigung.

## Follow-ups prüfen

```
/customer-outreach followups
```

Zeigt dir alle fälligen Follow-ups (7 Tage nach Erstmail, 14 Tage nach Follow-up 1).

## Batch-Versand

Falls du eine CSV mit mehreren Prospects hast:

```
/customer-outreach batch pfad/zur/datei.csv
```

CSV-Format:
```csv
business_name,contact_name,email,phone,industry,location,current_website,notes
Tischlerei Huber,Herr Huber,info@tischlerei-huber.at,,handwerker,Wels,,Alte Website
```

## Limits

- Max 10 Emails pro Tag
- 2 Minuten Pause zwischen Emails im Batch
- Nur Mo–Do senden (idealerweise 08:00–10:00)
- Jede Email wird vor dem Versand zur Bestätigung angezeigt
