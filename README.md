# Medellin Rewards

React + TypeScript + Vite application for the Medellin Rewards member, business, and admin platform backed by Supabase.

Checkout is currently a labeled demo flow for rewards testing. No real payment is processed.

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

## Database Setup

Apply the Supabase migrations before using the app locally. The launch-critical flows now depend on database RPCs for checkout, reward redemption, reward-point adjustments, and reward-credit consumption.

```bash
supabase db reset
```

## Verification

```bash
npm run lint
npm run test
npm run build
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
```bash
vercel
```
