# PlateAI — AI Menu Maker for Restaurants & Cafes

Turn a plain-text menu into a professionally designed, print-ready menu with **AI-generated food
photography**. Paste your dishes, and PlateAI writes gourmet descriptions, generates realistic
photos of each plate, and lays everything out using menu-engineering principles — then exports a
print-ready PDF or a full ZIP pack.

- 🧠 **AI menu parser & copywriter** — structures any plain-text menu and writes appetizing descriptions
- 📸 **AI food photography** — realistic dish photos via Google Gemini / Imagen, with style presets and prompt-based edits
- 🎨 **Menu-engineering layouts** — 9 print templates that guide attention to high-margin items
- 🖨️ **Export** — print-ready PDF (A4 / US Letter) and a full ZIP pack (images + data)

Built with React 19 + Vite + Tailwind on the front end and a small Node/Express server that keeps
your Gemini API key server-side.

---

## Two ways to use it

| | Hosted | Self-hosted (this repo) |
|---|---|---|
| Design & preview | Free (watermarked photos) | Free |
| Download (no watermark, HD, PDF, ZIP) | One-time **$19** per menu | **Free** — it's your instance |
| API costs | Covered by the host | Your own Gemini key |

The hosted paywall (Stripe) is **optional**. If you self-host and don't set `STRIPE_SECRET_KEY`,
downloads are simply free and the payment step is skipped.

---

## Quick start (self-host)

**Prerequisites:** Node.js 20+ and a Google Gemini API key (https://aistudio.google.com/apikey).

```bash
git clone https://github.com/arturayupov/PlateAI.git
cd PlateAI
npm install
cp .env.example .env.local      # then set GEMINI_API_KEY
npm run dev                      # http://localhost:3000
```

Production build:

```bash
npm run build
NODE_ENV=production node dist/server.cjs
```

### Environment variables

See [`.env.example`](.env.example). The only required value for self-hosting is `GEMINI_API_KEY`.
Stripe variables are needed only if you want to charge for downloads.

---

## Deploy

PlateAI is a standard Node server and ships with a `Dockerfile`. It runs anywhere that runs a
container or a Node process (Google Cloud Run, Render, Railway, Fly.io, a VPS, …).

**Google Cloud Run example:**

```bash
gcloud run deploy plateai \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars APP_URL=https://YOUR_URL,FREE_GENERATION_LIMIT=6 \
  --set-secrets GEMINI_API_KEY=GEMINI_API_KEY:latest,STRIPE_SECRET_KEY=STRIPE_SECRET_KEY:latest,STRIPE_PRICE_ID=STRIPE_PRICE_ID:latest,ENTITLEMENT_SECRET=ENTITLEMENT_SECRET:latest
```

---

## How the paywall works (hosted mode)

No accounts, no logins. Free visitors get a limited number of **watermarked** AI photo previews
(`FREE_GENERATION_LIMIT` per IP); the clean originals stay on the server. A one-time Stripe Checkout
payment issues a short-lived, signed **entitlement token** that releases the clean, watermark-free
images for that menu — which the client then exports to PDF/ZIP. This bounds API cost (rate limit)
and prevents free clean downloads (watermark + server-held originals).

---

## Architecture

```
src/                 React app (Vite)
  App.tsx            Studio, designer, paywall wiring
  components/        Landing page, designer canvas, paywall modal
  pdfGenerator.ts    Client-side PDF export (jsPDF)
  paywallClient.ts   Checkout / confirm / unlock helpers
server.ts            Express server: Gemini endpoints + paywall (Stripe)
paywall.ts           Watermark, rate limit, entitlement tokens, clean-image cache
```

---

## License

MIT — see [LICENSE](LICENSE).
