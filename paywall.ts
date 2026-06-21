/**
 * PlateAI paywall & abuse-protection module.
 *
 * Strategy (freemium, no accounts):
 *  - Free users can generate a limited number of AI food photos per IP/day.
 *  - Every free preview is returned WATERMARKED + the clean original is kept
 *    server-side in a short-lived cache keyed by a random id.
 *  - A one-time $19 Stripe Checkout payment issues a signed entitlement token
 *    (HMAC, no DB) bound to a projectId. With that token the client can fetch
 *    the clean (watermark-free) originals it already generated.
 *
 * This file is intentionally dependency-light: Stripe SDK + jimp + node:crypto.
 */
import crypto from "crypto";
import Stripe from "stripe";
import { Jimp } from "jimp";

// ----------------------------- Config -----------------------------
export const PRICE_ID = process.env.STRIPE_PRICE_ID || "price_1TkezH1YBNV9pI4HEqVJnqY2";
export const APP_URL = process.env.APP_URL || "http://localhost:3000";
export const FREE_GENERATION_LIMIT = Number(process.env.FREE_GENERATION_LIMIT || 6);
const WINDOW_MS = 24 * 60 * 60 * 1000; // 24h rolling window
const CLEAN_TTL_MS = 6 * 60 * 60 * 1000; // keep clean originals 6h
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // entitlement valid 24h after purchase

// Secret used to sign entitlement tokens. Falls back to a stable dev secret,
// but in production MUST be provided via env (set during deploy).
const ENTITLEMENT_SECRET =
  process.env.ENTITLEMENT_SECRET || "plateai-dev-entitlement-secret-change-me";

// ----------------------------- Stripe -----------------------------
let _stripe: Stripe | null = null;
export function getStripe(): Stripe | null {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  _stripe = new Stripe(key);
  return _stripe;
}
export function stripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}

// ------------------------ Entitlement tokens ----------------------
// Compact signed token: base64url(payload).hex(hmac). No external JWT dep.
function b64url(buf: Buffer | string): string {
  return Buffer.from(buf).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function fromB64url(s: string): Buffer {
  return Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}
export function signEntitlement(projectId: string): string {
  const payload = { p: projectId, exp: Date.now() + TOKEN_TTL_MS };
  const body = b64url(JSON.stringify(payload));
  const sig = crypto.createHmac("sha256", ENTITLEMENT_SECRET).update(body).digest("hex");
  return `${body}.${sig}`;
}
export function verifyEntitlement(token: string | undefined, projectId?: string): boolean {
  if (!token || typeof token !== "string" || !token.includes(".")) return false;
  const [body, sig] = token.split(".");
  const expected = crypto.createHmac("sha256", ENTITLEMENT_SECRET).update(body).digest("hex");
  // timing-safe compare
  if (sig.length !== expected.length) return false;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false;
  try {
    const payload = JSON.parse(fromB64url(body).toString("utf8"));
    if (!payload?.exp || Date.now() > payload.exp) return false;
    if (projectId && payload.p !== projectId) return false;
    return true;
  } catch {
    return false;
  }
}

// ------------------------ Free-tier rate limit --------------------
type Bucket = { count: number; resetAt: number };
const ipBuckets = new Map<string, Bucket>();
export function consumeGeneration(ip: string): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  let b = ipBuckets.get(ip);
  if (!b || now > b.resetAt) {
    b = { count: 0, resetAt: now + WINDOW_MS };
    ipBuckets.set(ip, b);
  }
  if (b.count >= FREE_GENERATION_LIMIT) {
    return { allowed: false, remaining: 0, resetAt: b.resetAt };
  }
  b.count += 1;
  return { allowed: true, remaining: Math.max(0, FREE_GENERATION_LIMIT - b.count), resetAt: b.resetAt };
}
export function remainingGenerations(ip: string): number {
  const b = ipBuckets.get(ip);
  if (!b || Date.now() > b.resetAt) return FREE_GENERATION_LIMIT;
  return Math.max(0, FREE_GENERATION_LIMIT - b.count);
}
// Periodic cleanup
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of ipBuckets) if (now > v.resetAt) ipBuckets.delete(k);
}, 60 * 60 * 1000).unref?.();

// ------------------------ Clean-image cache -----------------------
type CleanEntry = { dataUrl: string; expiresAt: number };
const cleanStore = new Map<string, CleanEntry>();
export function putCleanImage(dataUrl: string): string {
  const id = crypto.randomBytes(16).toString("hex");
  cleanStore.set(id, { dataUrl, expiresAt: Date.now() + CLEAN_TTL_MS });
  return id;
}
export function getCleanImage(id: string): string | null {
  const e = cleanStore.get(id);
  if (!e) return null;
  if (Date.now() > e.expiresAt) {
    cleanStore.delete(id);
    return null;
  }
  return e.dataUrl;
}
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of cleanStore) if (now > v.expiresAt) cleanStore.delete(k);
}, 30 * 60 * 1000).unref?.();

// ------------------------------ Watermark -------------------------
// Tile a diagonal "PLATEAI · PREVIEW" watermark across the image so it cannot
// be trivially cropped out. Returns a PNG data URL.
export async function applyWatermark(dataUrl: string): Promise<string> {
  try {
    const match = dataUrl.match(/^data:([^;]+);base64,(.*)$/);
    const base64 = match ? match[2] : dataUrl;
    const buf = Buffer.from(base64, "base64");
    const img = await Jimp.read(buf);
    const w = img.width;
    const h = img.height;

    // Build a semi-transparent watermark tile and composite repeatedly.
    const fontSize = Math.max(16, Math.round(w / 22));
    const text = "PLATEAI  ·  PREVIEW";
    // jimp v1 ships bitmap fonts; load a white one and dim via opacity.
    // We draw onto a rotated overlay layer.
    const overlay = new Jimp({ width: w, height: h, color: 0x00000000 });
    // Use loadFont from jimp
    const { loadFont } = await import("jimp");
    // FONT constants live in jimp/fonts; fall back gracefully.
    let font: any = null;
    try {
      const fonts: any = await import("jimp/fonts");
      const key = fontSize > 40 ? "SANS_64_WHITE" : fontSize > 28 ? "SANS_32_WHITE" : "SANS_16_WHITE";
      font = await loadFont((fonts as any)[key]);
    } catch {
      font = null;
    }
    if (font) {
      const stepY = Math.max(60, Math.round(h / 6));
      const stepX = Math.max(220, Math.round(w / 2));
      for (let y = -stepY; y < h + stepY; y += stepY) {
        for (let x = -stepX; x < w + stepX; x += stepX) {
          (overlay as any).print({ font, x, y, text });
        }
      }
      (overlay as any).rotate(30);
      (overlay as any).opacity(0.28);
      // center overlay over image
      const ox = Math.round((overlay.width - w) / 2);
      const oy = Math.round((overlay.height - h) / 2);
      (img as any).composite(overlay, -ox, -oy);
    } else {
      // Fallback: darken a thin diagonal band so it's clearly a preview
      const band = new Jimp({ width: w, height: Math.round(h / 8), color: 0x000000a0 });
      (img as any).composite(band, 0, Math.round(h / 2 - h / 16));
    }

    const out = await (img as any).getBuffer("image/png");
    return `data:image/png;base64,${out.toString("base64")}`;
  } catch (e) {
    // On any failure, return original (never block generation on watermarking).
    console.warn("[paywall] watermark failed, returning original:", (e as any)?.message || e);
    return dataUrl;
  }
}

// --------------------------- Client IP ----------------------------
export function clientIp(req: any): string {
  const xf = (req.headers["x-forwarded-for"] || "").toString().split(",")[0].trim();
  return xf || req.socket?.remoteAddress || req.ip || "unknown";
}
