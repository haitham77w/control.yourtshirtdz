# YourTshirtDZ - Fashion Store

## Overview
A React-based fashion/t-shirt e-commerce store with bilingual support (English/Arabic). Built with Vite, React 19, TypeScript, and Tailwind CSS (CDN). Uses Supabase as the backend for product data and storage.

## Recent Changes
- 2026-02-21: Initial import and Replit environment setup. Configured Vite to run on port 5000 with allowed hosts for Replit proxy.

## Project Architecture
- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS (via CDN script in index.html)
- **Backend**: Supabase (hosted, external)
- **Routing**: react-router-dom v7
- **Animation**: motion (Framer Motion)
- **Icons**: lucide-react

### Key Files
- `index.html` - Entry HTML with Tailwind config
- `index.tsx` - React entry point
- `App.tsx` - Main app component with routing
- `vite.config.ts` - Vite configuration (port 5000, host 0.0.0.0)
- `lib/supabase.ts` - Supabase client configuration
- `pages/` - Page components (Home, Products, ProductDetails, Checkout, About)
- `components/` - Shared components (Navbar, CartDrawer)
- `contexts/` - React contexts (Language, Settings)
- `constants.ts` - App constants
- `types.ts` - TypeScript type definitions
- `supabase_schema.sql` - Database schema reference

### Deployment
- Static site deployment (Vite build output in `dist/`)
- Build command: `npm run build`
