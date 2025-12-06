# Homepage Design Redesign - Wireframe & Konzept

## 🎯 Ziele des Redesigns
- [ ] Modern & Professional Look
- [ ] Better Call-to-Action (CTA) Conversion
- [ ] Mobile-First Responsive
- [ ] Performance >85 Lighthouse Score
- [ ] Improved User Engagement

---

## Current Layout Analyse

### Probleme der aktuellen Homepage
1. **Hero-Section zu minimal**
   - Nur ein einfacher Title
   - Kein Visual Impact
   - Schwache CTA

2. **Portal-Bereich versteckt**
   - Nur ein kleiner Link
   - Portal-Link sollte prominent sein

3. **Referenzen Gallery zu statisch**
   - Keine Kategorien
   - Kein interaktives Filtern
   - Kleine Thumbnails

4. **Keine Social Proof**
   - Kundenzitate fehlen
   - Keine Bewertungen
   - Keine Case Studies

---

## Neues Layout Design

### Section 1: HERO SECTION
```
┌─────────────────────────────────────────┐
│                                         │
│  🎬 Full-Width Video/Slider Background │
│                                         │
│     "Professionelle Handwerksdienste"  │
│     für Wohnkomplexe & Immobilien      │
│                                         │
│     [📋 Angebot anfordern]              │
│     [💼 Zu Portal →]                    │
│                                         │
│                                         │
└─────────────────────────────────────────┘
```

**Komponenten:**
- Full-viewport Hero (Hero.tsx)
- Background Video/Image Carousel
- Gradient Overlay für Text-Lesbarkeit
- Two Primary CTAs

---

### Section 2: FEATURES / LEISTUNGEN
```
┌──────────────┬──────────────┬──────────────┐
│  🔧          │  ⏱️           │  💶          │
│              │              │              │
│  Spezialist  │  Effizient   │  Transparent │
│  Service     │  Abwicklung  │  Preise      │
│              │              │              │
│  Hochwertige │  Schnelle    │  Klare       │
│  Arbeiten    │  Termine     │  Kostenlosse │
│  mit bestem  │  einhalten   │  Angebote    │
│  Standard    │              │              │
└──────────────┴──────────────┴──────────────┘
```

**Komponenten:**
- 3-Column Grid (Desktop) / Stack (Mobile)
- Icon + Title + Description
- Hover Effects (Lift Animation)

---

### Section 3: KATEGORIEN / SERVICES
```
┌─────────────────────────────────────────┐
│  "Unsere Leistungen"                    │
├─────────────────────────────────────────┤
│                                         │
│ [Bad-Umbauten] [Montageservices]        │
│ [Objektpflege] [Hausmeisterdienste]     │
│                                         │
│ +3 more...                              │
│                                         │
└─────────────────────────────────────────┘
```

**Komponenten:**
- Category Tags als Buttons
- Onclick: Filters Referenzen

---

### Section 4: REFERENZEN / PORTFOLIO
```
┌────────────────────────────────────────┐
│ "Erfolgreiche Projekte"                │
├────────────────────────────────────────┤
│                                        │
│  [Bild1]  [Bild2]  [Bild3]            │
│   [Bild4]  [Bild5]  [Bild6]           │
│                                        │
│  ← Scroll oder Pagination →            │
│                                        │
└────────────────────────────────────────┘
```

**Komponenten:**
- Masonry Grid Layout (CSS Grid)
- Lazy-loaded Images
- Hover: Image Zoom + Title Overlay
- Responsive: 3 cols (desktop) → 1 col (mobile)

---

### Section 5: KUNDENZITATE / SOCIAL PROOF
```
┌────────────────────────────────────────┐
│ "Das sagen unsere Kunden"              │
├────────────────────────────────────────┤
│                                        │
│  ⭐⭐⭐⭐⭐                             │
│  "Sehr professionelle und zuverlässig" │
│  - Max Mustermann, Geschäftsführer    │
│                                        │
│  ⭐⭐⭐⭐⭐                             │
│  "Top Handwerk, faire Preise"         │
│  - Anna Schmidt, Projektmanager       │
│                                        │
└────────────────────────────────────────┘
```

**Komponenten:**
- Testimonial Carousel
- Star Rating Visual
- Auto-rotation + Manual Controls

---

### Section 6: CTA / PORTAL ACCESS
```
┌────────────────────────────────────────┐
│                                        │
│    "Bereit, loszulegen?"               │
│                                        │
│  [Jetzt Angebot anfordern]             │
│  [Kundenportal →]                      │
│  [Kontakt aufnehmen]                   │
│                                        │
│  Fragen? info@x-tool.de                │
│                                        │
└────────────────────────────────────────┘
```

**Komponenten:**
- 3 CTA Buttons
- Contact Info
- Subtle Background Gradient

---

### Section 7: FOOTER
```
┌──────────────┬──────────────┬──────────────┐
│ Unternehmen  │ Services     │ Kontakt      │
│ ├─ Über uns  │ ├─ Bad       │ ├─ Adresse   │
│ ├─ Kontakt   │ ├─ Montage   │ ├─ Phone     │
│ └─ Impressum │ └─ Objektp.  │ └─ Email     │
└──────────────┴──────────────┴──────────────┘
├─ Datenschutz | © 2025 PH-Services
└─ Social Links: LinkedIn, Instagram
```

---

## Design System Specifications

### Color Palette
```
Primary:    #2563EB (Blue - Actions)
Secondary:  #10B981 (Green - Success)
Accent:     #F59E0B (Amber - Highlights)
Neutral:    #6B7280 (Gray - Text)
─────────────────────────
Dark BG:    #1F2937 (For dark sections)
Light BG:   #FFFFFF (Main)
```

### Typography
```
Headlines (H1-H3):  'Geist Sans' (Bold, 700)
Body Text:          'Inter' (Regular, 400)
Button Text:        'Inter' (Medium, 600)
Monospace:          'Monaco' (für Code)
```

### Spacing Scale
```
xs: 4px
sm: 8px
md: 16px
lg: 24px
xl: 32px
2xl: 48px
3xl: 64px
```

### Component Styles
```
Buttons:
├─ Primary: Blue + White Text
├─ Secondary: Border + Blue Text
└─ Tertiary: Gray Text + Hover

Cards:
├─ Elevation: Box-shadow + Border-radius
├─ Hover: Scale 1.05 + Shadow Increase
└─ Padding: 24px (lg), 16px (md)

Inputs:
├─ Border: 1px Gray
├─ Focus: Blue Outline + Shadow
└─ Label: Above Input
```

---

## Responsive Breakpoints

| Device | Width | Columns | Behavior |
|--------|-------|---------|----------|
| Mobile | <640px | 1 | Stack vertical |
| Tablet | 640-1024px | 2 | Grid 2-column |
| Desktop | 1024px+ | 3+ | Full grid |

---

## Performance Optimizations für Homepage

### Images
- [ ] Lazy-load all images below fold
- [ ] WebP format with fallbacks
- [ ] Srcset for responsive sizes
- [ ] Blur-up placeholder effect

### Code
- [ ] Hero Section: Separate chunk (dynamic import)
- [ ] Testimonials: Carousel = Code-split
- [ ] Forms: Load on interaction only

### CSS
- [ ] Utility-first (Tailwind) for minimal CSS
- [ ] Critical CSS inlined in <head>
- [ ] Unused Tailwind classes purged

---

## Implementation Components to Create

```typescript
// New Components Needed:

1. HeroSection.tsx
   - Video/Image background
   - Gradient overlay
   - CTA buttons

2. FeaturesGrid.tsx
   - 3-column feature cards
   - Icons from lucide-react
   - Hover animations

3. ReferenzenGallery.tsx
   - Masonry grid
   - Category filtering
   - Lazy loading

4. TestimonialCarousel.tsx
   - Carousel with auto-rotation
   - Manual navigation
   - Star ratings

5. CTASection.tsx
   - Primary actions
   - Contact info
   - Gradient background

6. Footer.tsx (Updated)
   - Multi-column layout
   - Social links
   - Responsive layout
```

---

## Migration Plan

**Timeline (Nach Deploy-Fix):**
- Week 1: Design Mockups in Figma/Adobe XD
- Week 2: Component Development
- Week 3: Integration + Testing
- Week 4: Performance Audit + Launch

**Resources:**
- [ ] Designer für Mockups (optional)
- [ ] Frontend: 2-3 Developer Days
- [ ] QA/Testing: 1 Developer Day
- [ ] Performance: 1 Developer Day

---

## Success Metrics

Nach Launch-Redesign messen:
- [ ] Time on Page: +30%
- [ ] Bounce Rate: -20%
- [ ] CTA Clicks: +50%
- [ ] Portal Sign-ups: +25%
- [ ] Lighthouse Score: >85
- [ ] Mobile Usability: Perfect

