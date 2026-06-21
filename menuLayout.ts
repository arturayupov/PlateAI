/**
 * PlateAI AI menu layout engine.
 * Gemini generates a complete, print-ready HTML menu; Puppeteer renders it to PDF.
 */
import { GoogleGenAI } from "@google/genai";

export interface LayoutDish {
  name: string;
  category?: string;
  description?: string;
  price?: number;
  currency?: string;
  keyIngredients?: string[];
  imageUrl?: string;
}

export interface LayoutOptions {
  restaurantName: string;
  restaurantTagline?: string;
  dishes: LayoutDish[];
  style?: string;       // e.g. "Classic Bistro", "Swiss Minimalist"
  paper?: "a4" | "letter";
  withPhotos?: boolean;
  instruction?: string; // a revision request from the user
  currentHtml?: string; // existing HTML to revise
}

const STYLE_GUIDE: Record<string, string> = {
  classic: "Classic Bistro: elegant serif headings, thin ivory borders, dotted price leaders, warm cream paper, a restrained gold accent.",
  minimalist: "Swiss Minimalist: clean sans-serif typography, generous whitespace used efficiently, no borders, crisp alignment, monochrome with a single accent.",
  cozy: "Botanical Cozy: warm sage-green styling, soft serif, subtle organic dividers, inviting and handcrafted feel.",
  luxury: "Michelin Gold: obsidian and gold, ultra-luxury fine-dining tone, refined serif, lots of negative space.",
  modern: "Modern Cafe: friendly contemporary sans, rounded accents, bright and clean, great for cafes and coffee shops.",
};

export function resolveStyle(style?: string): string {
  if (!style) return STYLE_GUIDE.classic;
  const key = style.toLowerCase();
  for (const k of Object.keys(STYLE_GUIDE)) if (key.includes(k)) return STYLE_GUIDE[k];
  return style; // allow a free-form style description
}

function stripFences(s: string): string {
  return s
    .replace(/^```html\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
}

export function buildLayoutPrompt(opts: LayoutOptions): string {
  const paper = opts.paper === "letter" ? "US Letter" : "A4";
  const style = resolveStyle(opts.style);
  const dishesJson = JSON.stringify(
    opts.dishes.map((d) => ({
      name: d.name,
      category: d.category || "Menu",
      description: d.description || "",
      price: d.price,
      currency: d.currency || "USD",
      ...(opts.withPhotos && d.imageUrl ? { imageUrl: d.imageUrl } : {}),
    })),
    null,
    0
  );

  if (opts.instruction && opts.currentHtml) {
    return `You are a senior print menu designer. Revise the following print-ready HTML menu according to the user's instruction.

USER INSTRUCTION: "${opts.instruction}"

Keep it a COMPLETE, self-contained, print-ready HTML document (start with <!doctype html>, all CSS embedded). Output ONLY raw HTML — no markdown, no code fences, no commentary. Preserve overall quality, density, and print-correctness (@page ${paper}). Do not lose menu items unless explicitly told to.

CURRENT HTML:
${opts.currentHtml}`;
  }

  return `You are a senior print menu designer. Produce a COMPLETE, self-contained, print-ready HTML document for the restaurant menu below.

RESTAURANT: ${opts.restaurantName}${opts.restaurantTagline ? " — " + opts.restaurantTagline : ""}
STYLE: ${style}
PAPER: ${paper} portrait.

DISHES (JSON):
${dishesJson}

HARD REQUIREMENTS:
- Output ONLY raw HTML (start with <!doctype html>). No markdown, no code fences, no commentary.
- Embed ALL CSS in a <style> tag. Google Fonts via <link> is allowed.
- Print-optimized: @page { size: ${paper}; margin: 14mm; }. DENSE, professional layout — aim ~10-16 items per page, never 3.
- Group items by their category with elegant category headers. Use a TWO-COLUMN layout for item lists to maximize density. Keep each item together (break-inside: avoid). Let content flow naturally across multiple pages for long menus.
- Each item: name (bold) and price right-aligned with a dotted leader between them; description in smaller muted text below. Omit ingredients for density unless they are short.
- First-page header: restaurant name (display serif/appropriate to style) + tagline, elegant and subtle.
- Typography sized for PRINT: item names ~10-11pt, descriptions ~8-9pt, category headers ~12-13pt. Compact, not oversized.
${opts.withPhotos ? "- Include small, tasteful dish photos from imageUrl where provided (rounded thumbnails), without breaking density." : "- This is a text-forward classic menu; do not invent images."}
- Cohesive, premium, restaurant-grade aesthetic matching the STYLE.`;
}

export async function generateLayout(ai: GoogleGenAI, opts: LayoutOptions): Promise<string> {
  const prompt = buildLayoutPrompt(opts);
  const res = await ai.models.generateContent({ model: "gemini-3.5-flash", contents: prompt });
  const html = stripFences(res.text || "");
  if (!html || !/<html|<!doctype/i.test(html)) {
    throw new Error("The designer did not return a valid HTML layout.");
  }
  return html;
}

// Lazy puppeteer so the server cold-starts fast; Chromium only loads on PDF export.
export async function renderPdf(html: string, paper: "a4" | "letter" = "a4"): Promise<Buffer> {
  const puppeteer = (await import("puppeteer")).default;
  const launchOpts: any = {
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    headless: true,
  };
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    launchOpts.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
  }
  const browser = await puppeteer.launch(launchOpts);
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load", timeout: 30000 });
    // Ensure web fonts are ready before printing.
    try { await page.evaluate(() => (document as any).fonts?.ready); } catch {}
    const pdf = await page.pdf({
      format: paper === "letter" ? "letter" : "a4",
      printBackground: true,
      margin: { top: "0", bottom: "0", left: "0", right: "0" },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
