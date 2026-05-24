---
name: Neo-Brutalist Play
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f3'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1b1b1b'
  on-surface-variant: '#4d4632'
  inverse-surface: '#303030'
  inverse-on-surface: '#f1f1f1'
  outline: '#7f7660'
  outline-variant: '#d1c6ab'
  surface-tint: '#735c00'
  primary: '#735c00'
  on-primary: '#ffffff'
  primary-container: '#facc15'
  on-primary-container: '#6c5700'
  inverse-primary: '#eec200'
  secondary: '#6b38d4'
  on-secondary: '#ffffff'
  secondary-container: '#8455ef'
  on-secondary-container: '#fffbff'
  tertiary: '#a83639'
  on-tertiary: '#ffffff'
  tertiary-container: '#ffc2bf'
  on-tertiary-container: '#a13135'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffe083'
  primary-fixed-dim: '#eec200'
  on-primary-fixed: '#231b00'
  on-primary-fixed-variant: '#574500'
  secondary-fixed: '#e9ddff'
  secondary-fixed-dim: '#d0bcff'
  on-secondary-fixed: '#23005c'
  on-secondary-fixed-variant: '#5516be'
  tertiary-fixed: '#ffdad8'
  tertiary-fixed-dim: '#ffb3b0'
  on-tertiary-fixed: '#410006'
  on-tertiary-fixed-variant: '#881d24'
  background: '#f9f9f9'
  on-background: '#1b1b1b'
  surface-variant: '#e2e2e2'
typography:
  display-xl:
    fontFamily: Anybody
    fontSize: 80px
    fontWeight: '800'
    lineHeight: 88px
    letterSpacing: -0.04em
  display-xl-mobile:
    fontFamily: Anybody
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 52px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Anybody
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Anybody
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 30px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 24px
  label-bold:
    fontFamily: Space Grotesk
    fontSize: 14px
    fontWeight: '700'
    lineHeight: 20px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 48px
  border-width: 4px
---

## Brand & Style
This design system embodies a **Neo-Brutalist** aesthetic that is unapologetically bold, energetic, and highly functional. It targets a creative, tech-forward audience that values personality over corporate blandness. The visual language is defined by raw structural elements—thick borders, vibrant flat fills, and massive typography—softened by oversized rounded corners to maintain an approachable, "playful" vibe. 

The emotional response should be one of confidence and excitement. It uses high-contrast layouts to drive focus, discarding subtle gradients in favor of "ink-trap" inspired details and geometric clarity. It feels like a digital poster: tactile, structured, and vibrant.

## Colors
The palette is built on "Super-Saturated Primary" tones. We avoid tints and shades in favor of flat, full-strength hex codes to maximize visual impact.

- **Primary (Vibrant Yellow):** Used for main CTA backgrounds and hero highlight cards.
- **Secondary (Deep Purple):** Used for secondary actions and interactive accents.
- **Tertiary (Coral):** Reserved for destructive actions or attention-grabbing alerts.
- **Quaternary (Electric Blue):** Used for informational badges or alternative card states.
- **Neutral:** A true black (#000000) is used for all borders, shadows, and primary text to ensure maximum readability and "ink" feel.
- **Background:** A very light grey (#F4F4F5) or pure white to provide a clean stage for the heavy blocks of color.

## Typography
The typography is expressive and structural. **Anybody** serves as the display face, utilizing its variable width and heavy weights to create a "wall of text" effect for headlines. 

For body copy, **Plus Jakarta Sans** provides a friendly, geometric balance that remains legible even at smaller sizes. **Space Grotesk** is used for labels, navigation, and technical data, adding a slight futuristic, monospaced-adjacent character to the system. Headlines should always be set with tight letter-spacing to reinforce the bold, compact neo-brutalist look.

## Layout & Spacing
The design system utilizes a **Fixed Grid** model for desktop to maintain the "poster" aesthetic, centering content within a max-width container (typically 1280px). 

- **Grid:** A 12-column grid with generous 24px gutters.
- **Rhythm:** Spacing follows a strict 8px base unit. 
- **Borders as Spacing:** Because of the heavy 4px black borders, internal padding must be increased (min 24px) to prevent text from feeling "choked" by the frame.
- **Mobile:** On mobile, the grid collapses to 2 columns with 16px margins. Cards should bleed nearly to the edge to maximize the "blocky" feel.

## Elevation & Depth
This design system rejects ambient shadows and blur-based depth. Instead, it uses **Hard Geometric Shadows**:
- **Hard Shadows:** Use a solid black (#000000) offset shadow with 100% opacity and 0 blur. Standard offset is 4px or 8px.
- **Tonal Stacking:** Depth is achieved by placing high-contrast colored cards on top of neutral backgrounds.
- **Stroke Priority:** Every interactive or container element must have a 3px or 4px solid black border. This border acts as the primary "edge" definition, replacing shadows for most components.

## Shapes
While traditional brutalism uses sharp corners, this system utilizes **Roundedness Level 2** to create its "playful" character. 

- **Containers:** Large cards and hero sections use `rounded-xl` (1.5rem / 24px) to create a soft, friendly silhouette.
- **Buttons/Inputs:** Use `rounded-lg` (1rem / 16px) for a consistent tactile feel.
- **Accents:** Occasional pure circles (100% radius) are used for icons, badges, or "smile" graphics to break the grid's rigidity.

## Components
- **Buttons:** Solid primary color fill, 4px black border, and a 4px black hard shadow. On hover, the shadow disappears as the button "depresses" (translates XY by 4px).
- **Cards:** Thick black borders with heavy internal padding. Use "Inverted" cards (Black background, white text) for primary sections to create rhythm.
- **Inputs:** White background, 3px black border. On focus, the border thickness remains but the background changes to a very light version of the primary color or the shadow appears.
- **Chips:** Small, pill-shaped (`rounded-xl`) with 2px borders. Each category should have a unique flat color from the palette.
- **Geometric Accents:** Use hand-drawn style circles (like a marker) to highlight specific words or numbers within a text block.
