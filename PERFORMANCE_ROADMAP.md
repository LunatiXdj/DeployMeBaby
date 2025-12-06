# Performance & Design Roadmap

## Phase 1: Deploy-Fix ✅ (AKTUELLE PRIORITÄT)
**Status**: Migriert zu App Hosting (Next.js Server-Runtime)
- [ ] App Hosting Deployment erfolgreich
- [ ] Live-URL funktioniert ohne 404-Fehler
- [ ] GA-Tracking verifiziert

**URL**: `https://x-tool-ph-service.web.app`

---

## Phase 2: Performance-Optimierungen 🚀 (NACH DEPLOY)

### 2.1 Core Web Vitals Optimierung
**Komponenten:**
- [ ] Image Optimization mit Next.js Image Component
- [ ] Lazy-Loading für Below-the-fold Content
- [ ] Code-Splitting nach Routes

**Ziele:**
- Lighthouse Score: >85
- LCP (Largest Contentful Paint): <2.5s
- FID (First Input Delay): <100ms
- CLS (Cumulative Layout Shift): <0.1

### 2.2 Bundle-Size Reduktion
**Massnahmen:**
- [ ] Unused CSS/JS Analyse
- [ ] Tree-shaking aktivieren
- [ ] Dynamic Imports für große Features
- [ ] Bibliotheken-Audit (siehe Empfehlungen unten)

**Ziele:**
- JS-Bundle: <250 KB
- CSS-Bundle: <50 KB

### 2.3 Caching-Strategien
- [ ] Firestore Query-Caching (SWR/Tanstack Query)
- [ ] Image CDN Caching (Firebase Hosting + Cache-Control)
- [ ] Browser-Caching Headers
- [ ] Service Worker für Offline-Funktion

---

## Phase 3: Frontend-Design Redesign 🎨 (NACH DEPLOY + PERF)

### 3.1 Homepage Überhaul
**Aktuelle Probleme:**
- Portal-Sektion zu minimal
- CTA-Buttons nicht prominent genug
- Hero-Section braucht besseres Design

**Geplante Verbesserungen:**
```
┌─────────────────────────────────────┐
│  HERO: Großes Video/Slider          │
│  "Professionelle Handwerksdienste"  │
├─────────────────────────────────────┤
│  3-Column Feature Cards              │
│  • Materialien sparen                │
│  • Zeit effizient nutzen             │
│  • Kostentransparenz                 │
├─────────────────────────────────────┤
│  Referenzen Gallery (Grid)           │
│  Mit Kategorien-Filter               │
├─────────────────────────────────────┤
│  CTA Section: "Jetzt Angebot"        │
├─────────────────────────────────────┤
│  Social Proof / Kundenzitate         │
└─────────────────────────────────────┘
```

### 3.2 App-Design Updates
**Dashboard Verbesserungen:**
- [ ] Dark Mode Support
- [ ] Responsive Grid Layout
- [ ] Bessere Card-Designs mit Icons
- [ ] Improved Navigation Sidebar

**Komponenten-Audit:**
- [ ] Consistent Typography Scale
- [ ] Color Palette Überprüfung
- [ ] Icon-Set aktualisieren
- [ ] Button-States (Hover/Active/Disabled)

### 3.3 Mobile-Optimierung
- [ ] Touch-friendly Button Sizes (min 48px)
- [ ] Readable Font Sizes on Mobile
- [ ] Reduced Motion Support
- [ ] Bottom Navigation für Mobile

---

## Technische Schulden (Zu Beheben)

### Code Quality
- [ ] ESLint Regeln strenger
- [ ] TypeScript Strict Mode
- [ ] Unused Dependencies entfernen
- [ ] Type-Sicherheit: >95%

### Empfohlene Bibliotheks-Upgrades
```
Aktuell:          Empfohlen:
─────────────────────────────────
tailwindcss 3.x   → 4.x
react-hook-form   → Keep (leicht)
pdf-lib           → Keep (spezialisiert)
lucide-react      → Keep oder Heroicons
firebase          → Update minor versions
date-fns          → Keep (leicht, tree-shaking)
zustand/jotai     → Keep (gute Größe)
```

### Dependencies Zu Prüfen
```bash
npm ls  # Zeigt Duplikate
npm audit  # Security Audit
```

---

## Metriken zum Tracking

### Build-Time
- [ ] Current: ? (zu messen)
- [ ] Target: <60 Sekunden

### Runtime Performance
- [ ] FCP (First Contentful Paint): <1.5s
- [ ] TTI (Time to Interactive): <3s
- [ ] TTFB (Time to First Byte): <400ms

### Bundle Sizes
```
Current:          Target:
─────────────────────────────────
JS-Main: ?        → <150 KB
CSS: ?            → <40 KB
Total Libs: ?     → <300 KB
```

---

## Reihenfolge der Umsetzung

```
1. ✅ Deploy funktionsfähig machen
   ↓
2. 🔍 Aktuelle Performance messen (Lighthouse)
   ↓
3. 🚀 Core Web Vitals optimieren
   ↓
4. 📦 Bundle-Size analysieren & reduzieren
   ↓
5. 🎨 Homepage Redesign
   ↓
6. 🎯 App Design Updates
   ↓
7. 📱 Mobile-First Überprüfung
   ↓
8. ✨ Polish & Final Testing
```

---

## Nächste Schritte

**Sofort nach erfolgreichem Deploy:**
```bash
# Performance Baseline erstellen
lighthouse https://x-tool-ph-service.web.app --view

# Bundle-Analyse
npm install -D webpack-bundle-analyzer
npx next build --analyze
```

**Dann:**
- [ ] Lighthouse-Report analysieren
- [ ] Bottlenecks identifizieren
- [ ] Priorität setzen für Phase 2
- [ ] Design-Mockups erstellen für Phase 3

