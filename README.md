# Loyalty Rewards Program

React + TypeScript + Vite application for a coffee loyalty and rewards platform with customer and admin flows backed by Supabase.

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Create a local env file from `.env.example` and set:

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. Start the dev server:

```bash
npm run dev
```

## Production Build

```bash
npm run build
```

The production output is written to `dist/`.

## Vercel Deployment

This repo is configured for Vercel with:

- Vite framework build output in `dist/`
- SPA fallback to `index.html` so React Router routes work on refresh and direct URL access

Set these environment variables in the Vercel project before deploying:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Recommended Vercel settings:

- Framework Preset: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`

After adding the env vars, deploy with either the Vercel dashboard or:

asd
```bash
vercel
```
