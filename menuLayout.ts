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

export interface PageSpec {
  kind: "cover" | "content";
  title?: string;
  subtitle?: string;
  categories?: string[];   // content pages: which categories appear
  withPhotos?: boolean;
  coverImage?: string;     // placeholder string for a cover background image (e.g. "{{COVER_0}}")
}

export interface LayoutOptions {
  restaurantName: string;
  restaurantTagline?: string;
  dishes: LayoutDish[];
  style?: string;       // e.g. "Classic Bistro", "Swiss Minimalist"
  paper?: "a4" | "letter";
  withPhotos?: boolean;
  pages?: PageSpec[];   // optional explicit page composition
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
  const includePhotos = opts.withPhotos || (opts.pages?.some((p) => p.withPhotos) ?? false);
  // IMPORTANT: never embed base64 image data in the prompt (it blows the token limit).
  // Photos are referenced as lightweight placeholders and substituted on the client.
  const dishesJson = JSON.stringify(
    opts.dishes.map((d, i) => ({
      name: d.name,
      category: d.category || "Menu",
      description: d.description || "",
      price: d.price,
      currency: d.currency || "USD",
      ...(includePhotos && d.imageUrl ? { photo: `{{IMG_${i}}}` } : {}),
    })),
    null,
    0
  );

  // ---- Multi-page composition ----
  if (opts.pages && opts.pages.length > 0) {
    const pagesDesc = opts.pages
      .map((pg, idx) => {
        if (pg.kind === "cover") {
          return `PAGE ${idx + 1} = COVER PAGE. A full-page cover. Title (display): "${pg.title || opts.restaurantName}". Subtitle: "${pg.subtitle || opts.restaurantTagline || ""}". ${
            pg.coverImage
              ? `Use ${pg.coverImage} as a FULL-BLEED background image covering the whole page, with a tasteful dark gradient overlay so the title stays readable in light type.`
              : `Design an elegant cover background appropriate to the STYLE (color, subtle motif), no photo.`
          } The cover must fill the entire page on its own.`;
        }
        const cats = pg.categories && pg.categories.length ? pg.categories.join(", ") : "all categories not shown on other pages";
        return `PAGE ${idx + 1} = CONTENT PAGE. Include ONLY these categories: ${cats}. ${
          pg.withPhotos ? "Include each dish photo using its {{IMG_n}} placeholder as <img src>." : "Text only — do not include dish photos."
        } Use a dense, elegant two-column layout for the items.`;
      })
      .join("\n");

    return `You are a senior print menu designer. Produce a COMPLETE, self-contained, print-ready, MULTI-PAGE HTML document.

RESTAURANT: ${opts.restaurantName}${opts.restaurantTagline ? " — " + opts.restaurantTagline : ""}
STYLE: ${style}
PAPER: ${paper} portrait.

PAGE PLAN (render the pages in EXACTLY this order, each as its own printed page):
${pagesDesc}

DISHES (JSON, assign each to the page whose category list includes it):
${dishesJson}

HARD REQUIREMENTS:
- Output ONLY raw HTML (start with <!doctype html>). No markdown, no code fences, no commentary.
- Embed ALL CSS in a <style> tag. Google Fonts via <link> allowed.
- @page { size: ${paper}; margin: 0; }. Give each PAGE its own container sized to the full page (e.g. width:100%, min-height:100vh, with inner padding ~14mm) and force a hard page break between pages (page-break-after: always; break-after: page) — except after the last page.
- Each category header is elegant; items show name + price (dotted leader) + small muted description. Dense two-column item lists on content pages.
- Use the {{IMG_n}} and {{COVER_n}} placeholder strings VERBATIM as image src / background-image url — never alter them.
- Item-name ~10-11pt, description ~8-9pt, category headers ~12-13pt.
- Output ONLY the restaurant's menu. Do NOT add disclaimers, allergen/foodborne warnings, footnotes, page numbers, legal notes, or any system/technical text.
- Cohesive, premium, restaurant-grade aesthetic matching the STYLE.`;
  }

  if (opts.instruction && opts.currentHtml) {
    return `You are a senior print menu designer. Revise the following print-ready HTML menu according to the user's instruction.

USER INSTRUCTION: "${opts.instruction}"

Keep it a COMPLETE, self-contained, print-ready HTML document (start with <!doctype html>, all CSS embedded). Output ONLY raw HTML — no markdown, no code fences, no commentary. Preserve overall quality, density, and print-correctness (@page ${paper}). Do not lose menu items unless explicitly told to. Do NOT add disclaimers, allergen/foodborne warnings, footnotes, or any system/technical text. Preserve any {{IMG_n}} image placeholders exactly.

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
${opts.withPhotos ? "- For items that have a `photo` field, render it as a small rounded thumbnail: <img src=\"<the exact photo value>\" alt=\"\">. Use the placeholder string verbatim as the src. Do not break density." : "- This is a text-forward classic menu; do not invent images."}
- Output ONLY the restaurant's menu. Do NOT add disclaimers, allergen or foodborne-illness warnings (e.g. "consuming raw or undercooked..."), footnotes, page numbers, legal notes, or ANY system/technical text that the restaurant did not provide.
- Cohesive, premium, restaurant-grade aesthetic matching the STYLE.`;
}

export async function generateLayout(ai: GoogleGenAI, opts: LayoutOptions): Promise<string> {
  const prompt = buildLayoutPrompt(opts);
  const res = await ai.models.generateContent({ model: "gemini-3.5-flash", contents: prompt });
  let html = stripFences(res.text || "");
  // Drop any trailing commentary the model may add after the document.
  const endIdx = html.toLowerCase().lastIndexOf("</html>");
  if (endIdx !== -1) html = html.slice(0, endIdx + "</html>".length);
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
