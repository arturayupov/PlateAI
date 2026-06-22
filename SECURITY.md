# Security Policy

## Reporting a vulnerability

If you discover a security issue, please **do not open a public issue**. Instead, email the
maintainer or use GitHub's private vulnerability reporting (Security → Report a vulnerability).
We'll respond as quickly as we can.

## Secrets

- No secrets are stored in this repository. `.env*` files are gitignored; only `.env.example`
  (placeholders) is tracked.
- When self-hosting, keep keys in `.env.local` locally and in your platform's secret manager
  in production (e.g. Google Secret Manager, Render/Railway env vars).
- If you fork or deploy this project, use **your own** API keys and rotate any key that is ever
  exposed.

## Recommended hardening for public forks

- Enable GitHub **Secret Scanning** and **Push Protection**.
- Keep `STRIPE_SECRET_KEY` and `GEMINI_API_KEY` server-side only — never ship them to the client.
