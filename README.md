# William Valdez - Portfolio Website

Professional portfolio website showcasing platform engineering, SRE, and cloud infrastructure expertise.

## Overview

A sleek, Vercel-style portfolio built with Astro and TypeScript featuring:
- Dark mode default with light mode toggle
- Responsive design optimized for all devices
- Architecture diagrams for featured projects
- Smooth animations and transitions
- SEO optimized with proper meta tags

## Tech Stack

- **Framework**: Astro 4.x
- **Language**: TypeScript
- **Styling**: CSS (no frameworks)
- **Fonts**: Inter (Google Fonts)
- **Deployment**: Vercel Edge Network

## Features

### Sections
- **Hero** - Introduction with animated code window
- **Skills** - 8 skill categories with certifications
- **Projects** - 6 featured projects with architecture diagrams
- **Experience** - Professional timeline and stats
- **Contact** - Multiple contact methods and CTA

### Design
- CSS custom properties for theming
- Glass morphism effects
- Gradient backgrounds
- Responsive grid layouts
- Accessible color contrast

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Deployment

### Vercel (Recommended)

1. Import repository in Vercel
2. Framework preset: Astro
3. Build command: `npm run build`
4. Output directory: `dist`

### Manual

```bash
npm run build
# Upload dist/ to any static host
```

## Project Structure

```
portfolio-site/
├── src/
│   ├── components/
│   │   ├── Hero.astro
│   │   ├── Skills.astro
│   │   ├── Projects.astro
│   │   ├── Experience.astro
│   │   └── Contact.astro
│   ├── layouts/
│   │   └── Layout.astro
│   ├── pages/
│   │   └── index.astro
│   └── env.d.ts
├── astro.config.mjs
├── package.json
├── tsconfig.json
└── vercel.json
```

## Customization

### Colors
Edit CSS custom properties in `src/layouts/Layout.astro`:

```css
:root {
  --accent: #3b82f6;
  --bg-primary: #0a0a0a;
  /* ... */
}
```

### Content
Update component files to modify:
- Skills and certifications
- Project listings
- Experience timeline
- Contact information

## License

**PROPRIETARY - ALL RIGHTS RESERVED**

See [LICENSE](../LICENSE) for full terms.
