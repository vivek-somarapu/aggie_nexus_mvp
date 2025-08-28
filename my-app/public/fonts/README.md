# Google Fonts for Aggie Nexus

This application uses the following Google Fonts for the Aggie Nexus branding:

## Font Selection

1. **Montserrat** (Display Font)
   - Used for the logo and display text
   - A modern geometric sans-serif with a clean, bold appearance
   - Imported via Google Fonts API

2. **Playfair Display** (Heading Font)
   - Used for headings and subheadings
   - An elegant serif font with high contrast and classic feel
   - Imported via Google Fonts API

3. **Inter** (Body Font)
   - Used for body text and UI elements
   - A highly readable sans-serif designed for screens
   - Imported via Google Fonts API

## Implementation

All fonts are imported directly via Next.js's built-in font handling using:

```typescript
import { Inter, Montserrat, Playfair_Display } from "next/font/google"
```

This ensures optimal loading and font display behavior, including:
- Proper fallbacks
- Font subsetting (loading only the characters needed)
- Preloading capabilities
- Reduced layout shift

## Usage

To use these fonts in your components:

- Display/Logo: `style={{ fontFamily: "var(--font-montserrat)" }}`
- Headings: `style={{ fontFamily: "var(--font-playfair)" }}`
- Body text: `style={{ fontFamily: "var(--font-inter)" }}`

You can also use the utility classes for these fonts, as they're configured in globals.css.