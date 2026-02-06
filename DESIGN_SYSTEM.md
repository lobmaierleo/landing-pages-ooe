# Design System: Landing Pages OOE

Dieses Dokument definiert den Gold-Standard für alle Kunden-Seiten. 
Ziele: Premium, Modern, Vertrauenswürdig. Minimalistisch, aber warm.

## 🎨 Farben
Wir nutzen ein dynamisches CSS-Variablen System. Jede neue Seite muss diese Variablen in der `style.css` (Root) überschreiben, nicht hardcoded!

### Primary Colors (Individuell pro Kunde)
- **--primary-color**: Die Haupt-Markenfarbe des Kunden.
  - *Beispiel*: `#f97316` (Orange für Handwerker) oder `#0ea5e9` (Blau für Tech).
- **--primary-hover**: Eine 10% dunklere Version für Hover-Effekte.

### Neutrals (Global fixiert)
- **Background**: `#ffffff` (Weiß)
- **Text-Main**: `#1f2937` (Gray-800 - fast Schwarz, weicher als #000)
- **Text-Muted**: `#4b5563` (Gray-600)
- **Footer-Bg**: `#111827` (Gray-900)

### UI Elements
- **Trust-Bar**: Muss immer sticky sein (`sticky top-0`). Hintergrund: `--primary-color` mit 95% Opacity oder passender Kontrast.
- **Buttons**:
  - `border-radius: 9999px` (Pill Shape)
  - `transition: all 0.3s ease`
  - `box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1)`

## ✍️ Typografie & Content
- **Font-Family**: 'Inter', sans-serif (Google Fonts).
- **Headings**: Fett, kurz, knackig. "Ihr elektriker in Wels" statt "Willkommen auf der Homepage von Elektro Mayer".
- **Tone of Voice**:
  - Direkt & Persönlich ("Wir helfen Ihnen")
  - Lokal verwurzelt ("Aus Oberösterreich für Oberösterreich")
  - Lösungsorientiert ("Kein Stress mit der Installation")

## 🖼 Bildsprache
- **Hero-Section**: Immer ein hochwertiges Bild **ohne** Text-Overlay im Bild selbst (Text via HTML).
- **Stil**: Helle, freundliche Bilder. Echte Menschen bei der Arbeit bevorzugt. Keine "schmierigen" Stock-Fotos von Anzugträgern.

## 🧱 Komponenten-Bibliothek (HTML-Snippets)
Verwende immer diese Struktur für Konsistenz:

### Hero
```html
<section class="hero relative h-screen/70 flex items-center justify-center overflow-hidden">
  <img src="..." class="absolute w-full h-full object-cover">
  <div class="absolute inset-0 bg-black/50"></div> <!-- Overlay für Lesbarkeit -->
  <div class="relative z-10 text-center text-white p-4">
    <h1 class="text-5xl font-bold mb-4">LEITSATZ</h1>
    <a href="#kontakt" class="btn-primary">Kostenlose Anfrage</a>
  </div>
</section>
```
