# Contributing to PlateAI

Thanks for your interest in improving PlateAI! 🍽️

## Getting started

```bash
git clone https://github.com/arturayupov/PlateAI.git
cd PlateAI
npm install
cp .env.example .env.local      # set GEMINI_API_KEY
npm run dev
```

## Before you open a PR

- Run the type check and build: `npm run lint && npm run build` — both must pass.
- Keep changes focused; open an issue first for anything large.
- Don't commit secrets. `.env*` is gitignored — only `.env.example` (placeholders) is tracked.
- Match the existing code style (TypeScript, functional React components, Tailwind).

## Project layout

```
src/                 React app (Vite)
  App.tsx            Studio + designer + paywall wiring
  components/        Landing, AI menu designer, paywall modal
  paywallClient.ts   Checkout / confirm / unlock helpers
server.ts            Express server: Gemini endpoints + paywall + menu layout/PDF
menuLayout.ts        AI layout prompt engine + Puppeteer PDF
paywall.ts           Watermark, rate limit, entitlement tokens, clean-image cache
```

## Good first issues

- New menu styles / font pairings in `menuLayout.ts`.
- Additional export formats.
- Accessibility and mobile polish.

By contributing you agree your contributions are licensed under the MIT License.
