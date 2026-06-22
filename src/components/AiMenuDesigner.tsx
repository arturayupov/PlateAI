import React, { useState, useEffect, useRef } from "react";
import { Sparkles, Loader2, RefreshCw, Printer, Wand2, Image as ImageIcon, FileText, Plus, Trash2, BookOpen, LayoutList } from "lucide-react";
import { Dish } from "../types";
import { getStoredToken, getProjectId, unlockImages } from "../paywallClient";

// Replace {{IMG_n}} / {{COVER_n}} placeholders in the generated HTML with actual image URLs.
function substitute(raw: string, dishUrl: (i: number) => string | undefined, coverUrl: (i: number) => string | undefined): string {
  return raw
    .replace(/\{\{IMG_(\d+)\}\}/g, (_m, i) => dishUrl(Number(i)) || "")
    .replace(/\{\{COVER_(\d+)\}\}/g, (_m, i) => coverUrl(Number(i)) || "");
}

interface PageUI {
  id: string;
  kind: "cover" | "content";
  title: string;
  subtitle: string;
  categories: string[];
  withPhotos: boolean;
}

interface AiMenuDesignerProps {
  dishes: Dish[];
  restaurantName: string;
  setRestaurantName: (s: string) => void;
  restaurantTagline: string;
  setRestaurantTagline: (s: string) => void;
  ensureUnlocked: (action: () => void) => void;
}

const STYLES = [
  { id: "Classic Bistro", desc: "Elegant serif, cream paper" },
  { id: "Swiss Minimalist", desc: "Clean sans, lots of air" },
  { id: "Botanical Cozy", desc: "Warm sage, handcrafted" },
  { id: "Michelin Gold", desc: "Obsidian & gold luxury" },
  { id: "Modern Cafe", desc: "Friendly, bright, rounded" },
];

export const AiMenuDesigner: React.FC<AiMenuDesignerProps> = ({
  dishes,
  restaurantName,
  setRestaurantName,
  restaurantTagline,
  setRestaurantTagline,
  ensureUnlocked,
}) => {
  const [style, setStyle] = useState("Classic Bistro");
  const [paper, setPaper] = useState<"a4" | "letter">("a4");
  const [withPhotos, setWithPhotos] = useState(false);
  const [mode, setMode] = useState<"auto" | "custom">("auto");
  const [pages, setPages] = useState<PageUI[]>([]);
  const [html, setHtml] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [instruction, setInstruction] = useState("");
  const [exporting, setExporting] = useState(false);
  const hasGenerated = useRef(false);

  const categories: string[] = Array.from(new Set(dishes.map((d) => d.category || "Menu")));

  // Seed a sensible default page plan the first time the user switches to custom.
  const ensurePagesSeeded = () => {
    if (pages.length === 0) {
      setPages([
        { id: "p" + Date.now(), kind: "cover", title: restaurantName, subtitle: restaurantTagline, categories: [], withPhotos: false },
        { id: "p" + (Date.now() + 1), kind: "content", title: "", subtitle: "", categories: [...categories], withPhotos: false },
      ]);
    }
  };

  const addPage = (kind: "cover" | "content") =>
    setPages((p) => [...p, { id: "p" + Date.now(), kind, title: kind === "cover" ? restaurantName : "", subtitle: kind === "cover" ? restaurantTagline : "", categories: kind === "content" ? [] : [], withPhotos: false }]);
  const removePage = (id: string) => setPages((p) => p.filter((x) => x.id !== id));
  const updatePage = (id: string, patch: Partial<PageUI>) => setPages((p) => p.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const toggleCat = (id: string, cat: string) =>
    setPages((p) => p.map((x) => (x.id === id ? { ...x, categories: x.categories.includes(cat) ? x.categories.filter((c) => c !== cat) : [...x.categories, cat] } : x)));

  const generate = async (revise = false) => {
    if (dishes.length === 0) { setError("Add some dishes in the Studio first."); return; }
    setLoading(true);
    setError("");
    try {
      const body: any = {
        dishes: dishes.map((d) => ({
          name: d.name, category: d.category, description: d.description,
          price: d.price, currency: d.currency, keyIngredients: d.keyIngredients,
          imageUrl: d.imageUrl,
        })),
        restaurantName, restaurantTagline, style, paper, withPhotos,
      };
      if (mode === "custom" && pages.length > 0) {
        body.pages = pages.map((pg) =>
          pg.kind === "cover"
            ? { kind: "cover", title: pg.title || restaurantName, subtitle: pg.subtitle || restaurantTagline }
            : { kind: "content", categories: pg.categories, withPhotos: pg.withPhotos }
        );
        body.withPhotos = pages.some((p) => p.withPhotos) || withPhotos;
      }
      if (revise && instruction.trim() && html) { body.instruction = instruction.trim(); body.currentHtml = html; }

      const r = await fetch("/api/menu/layout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await r.json();
      if (!r.ok || !data.html) throw new Error(data.error || "Could not design the menu.");
      setHtml(data.html);
      hasGenerated.current = true;
      if (revise) setInstruction("");
    } catch (e: any) {
      setError(e?.message || "Design failed.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!hasGenerated.current && dishes.length > 0) generate(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const previewHtml = html ? substitute(html, (i) => dishes[i]?.imageUrl, () => undefined) : "";

  const doExportPdf = () => {
    ensureUnlocked(async () => {
      if (!html) return;
      setExporting(true);
      try {
        let finalHtml = html;
        if (/\{\{IMG_\d+\}\}/.test(html)) {
          const ids = dishes.map((d) => d.imageId).filter(Boolean) as string[];
          let clean: Record<string, string | null> = {};
          try { clean = await unlockImages(getStoredToken() || "", getProjectId(), ids); } catch {}
          finalHtml = substitute(html, (i) => { const d = dishes[i]; return (d?.imageId && clean[d.imageId]) || d?.imageUrl; }, () => undefined);
        }
        const r = await fetch("/api/menu/pdf", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ html: finalHtml, paper, token: getStoredToken(), projectId: getProjectId() }) });
        if (!r.ok) { const err = await r.json().catch(() => ({})); throw new Error(err.error || "PDF export failed."); }
        const blob = await r.blob();
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `plateai-menu-${new Date().toISOString().slice(0, 10)}.pdf`;
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
      } catch (e: any) { alert(e?.message || "Export failed."); }
      finally { setExporting(false); }
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* LEFT: controls */}
      <section className="lg:col-span-4 space-y-5">
        {/* Step 1: style & identity */}
        <div className="bg-white/95 border border-[#CCD7CD] rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 text-[#1E4D2B] font-extrabold text-sm uppercase tracking-wide">
            <Wand2 className="h-4 w-4" /> 1 · Style &amp; brand
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-[#255437] uppercase block">Restaurant name</label>
            <input value={restaurantName} onChange={(e) => setRestaurantName(e.target.value)} className="w-full text-sm bg-[#F7FAF8] border border-[#CAD2CD] rounded-lg px-3 py-2 focus:outline-none focus:border-[#255437]" />
            <input value={restaurantTagline} onChange={(e) => setRestaurantTagline(e.target.value)} placeholder="Tagline (optional)" className="w-full text-xs bg-[#F7FAF8] border border-[#CAD2CD] rounded-lg px-3 py-2 focus:outline-none focus:border-[#255437]" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[#255437] uppercase block">Style</label>
            {STYLES.map((s) => (
              <button key={s.id} onClick={() => setStyle(s.id)} className={`w-full text-left px-3 py-2 rounded-lg border text-xs transition cursor-pointer ${style === s.id ? "bg-[#255437] text-white border-transparent" : "bg-[#F7FAF8] border-[#CAD2CD] hover:bg-[#EAEFEA] text-[#1C2C1D]"}`}>
                <span className="font-bold">{s.id}</span>
                <span className={`block text-[10px] ${style === s.id ? "text-white/70" : "text-[#819084]"}`}>{s.desc}</span>
              </button>
            ))}
          </div>
          <div>
            <label className="text-[10px] font-bold text-[#255437] uppercase block mb-1">Paper</label>
            <select value={paper} onChange={(e) => setPaper(e.target.value as any)} className="w-full text-xs bg-[#F7FAF8] border border-[#CAD2CD] rounded-lg px-2 py-2 focus:outline-none focus:border-[#255437]">
              <option value="a4">A4</option>
              <option value="letter">US Letter</option>
            </select>
          </div>
        </div>

        {/* Step 2: pages */}
        <div className="bg-white/95 border border-[#CCD7CD] rounded-2xl p-5 space-y-3 shadow-sm">
          <div className="flex items-center gap-2 text-[#1E4D2B] font-extrabold text-sm uppercase tracking-wide">
            <LayoutList className="h-4 w-4" /> 2 · Pages
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setMode("auto")} className={`px-3 py-2 rounded-lg border text-xs font-bold transition cursor-pointer ${mode === "auto" ? "bg-[#255437] text-white border-transparent" : "bg-[#F7FAF8] border-[#CAD2CD] text-[#1C2C1D]"}`}>Auto layout</button>
            <button onClick={() => { setMode("custom"); ensurePagesSeeded(); }} className={`px-3 py-2 rounded-lg border text-xs font-bold transition cursor-pointer ${mode === "custom" ? "bg-[#255437] text-white border-transparent" : "bg-[#F7FAF8] border-[#CAD2CD] text-[#1C2C1D]"}`}>Custom pages</button>
          </div>

          {mode === "auto" ? (
            <label className="flex items-center gap-2 cursor-pointer text-xs text-[#1C2C1D] font-semibold pt-1">
              <input type="checkbox" checked={withPhotos} onChange={(e) => setWithPhotos(e.target.checked)} className="accent-[#255437]" />
              <ImageIcon className="h-3.5 w-3.5" /> Include dish photos
            </label>
          ) : (
            <div className="space-y-2.5">
              {pages.map((pg, idx) => (
                <div key={pg.id} className="border border-[#CAD2CD] rounded-xl p-3 bg-[#F7FAF8] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#255437]">
                      {pg.kind === "cover" ? <BookOpen className="h-3.5 w-3.5" /> : <LayoutList className="h-3.5 w-3.5" />}
                      Page {idx + 1} · {pg.kind === "cover" ? "Cover" : "Content"}
                    </div>
                    <button onClick={() => removePage(pg.id)} className="text-stone-400 hover:text-red-600 cursor-pointer" title="Remove page"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                  {pg.kind === "cover" ? (
                    <div className="space-y-1.5">
                      <input value={pg.title} onChange={(e) => updatePage(pg.id, { title: e.target.value })} placeholder="Cover title" className="w-full text-xs bg-white border border-[#CAD2CD] rounded px-2 py-1.5 focus:outline-none focus:border-[#255437]" />
                      <input value={pg.subtitle} onChange={(e) => updatePage(pg.id, { subtitle: e.target.value })} placeholder="Cover subtitle" className="w-full text-xs bg-white border border-[#CAD2CD] rounded px-2 py-1.5 focus:outline-none focus:border-[#255437]" />
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-[#819084] font-semibold">Sections on this page:</span>
                      <div className="grid grid-cols-1 gap-1">
                        {categories.map((cat) => (
                          <label key={cat} className="flex items-center gap-2 text-[11px] text-[#1C2C1D] cursor-pointer">
                            <input type="checkbox" checked={pg.categories.includes(cat)} onChange={() => toggleCat(pg.id, cat)} className="accent-[#255437]" />
                            {cat}
                          </label>
                        ))}
                      </div>
                      <label className="flex items-center gap-2 text-[11px] text-[#1C2C1D] cursor-pointer pt-1 font-semibold">
                        <input type="checkbox" checked={pg.withPhotos} onChange={(e) => updatePage(pg.id, { withPhotos: e.target.checked })} className="accent-[#255437]" />
                        <ImageIcon className="h-3 w-3" /> Photos on this page
                      </label>
                    </div>
                  )}
                </div>
              ))}
              <div className="flex gap-2">
                <button onClick={() => addPage("content")} className="flex-1 text-[11px] font-bold py-1.5 rounded-lg border border-[#BACCC0] bg-[#EAEFEA] hover:bg-[#DEE7DE] text-[#1C2521] flex items-center justify-center gap-1 cursor-pointer"><Plus className="h-3 w-3" /> Content page</button>
                <button onClick={() => addPage("cover")} className="flex-1 text-[11px] font-bold py-1.5 rounded-lg border border-[#BACCC0] bg-[#EAEFEA] hover:bg-[#DEE7DE] text-[#1C2521] flex items-center justify-center gap-1 cursor-pointer"><Plus className="h-3 w-3" /> Cover page</button>
              </div>
            </div>
          )}

          <button onClick={() => generate(false)} disabled={loading} className="w-full bg-[#255437] hover:bg-[#1C422B] disabled:opacity-60 text-white font-bold rounded-xl py-2.5 text-sm flex items-center justify-center gap-2 transition cursor-pointer mt-1">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {html ? "Regenerate design" : "Design my menu"}
          </button>
          {error && <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
        </div>

        {/* Refine */}
        {html && (
          <div className="bg-white/95 border border-[#CCD7CD] rounded-2xl p-5 space-y-3 shadow-sm">
            <div className="flex items-center gap-2 text-[#1E4D2B] font-extrabold text-xs uppercase tracking-wide"><Sparkles className="h-3.5 w-3.5" /> Refine with a sentence</div>
            <textarea value={instruction} onChange={(e) => setInstruction(e.target.value)} rows={2} placeholder="e.g. Put desserts on their own page, two columns, smaller descriptions" className="w-full text-xs bg-[#F7FAF8] border border-[#CAD2CD] rounded-lg px-3 py-2 focus:outline-none focus:border-[#255437] resize-none" />
            <button onClick={() => generate(true)} disabled={loading || !instruction.trim()} className="w-full bg-[#EAEFEA] hover:bg-[#DEE7DE] border border-[#BACCC0] disabled:opacity-50 text-[#1C2521] font-bold rounded-xl py-2 text-xs flex items-center justify-center gap-2 transition cursor-pointer">
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />} Apply change
            </button>
          </div>
        )}

        {/* Export */}
        {html && (
          <div className="bg-white/95 border border-[#CCD7CD] rounded-2xl p-5 shadow-sm">
            <button onClick={doExportPdf} disabled={exporting} className="w-full bg-[#255437] hover:bg-[#1C422B] disabled:opacity-60 text-white font-bold rounded-xl py-2.5 text-sm flex items-center justify-center gap-2 transition cursor-pointer">
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />} Download print-ready PDF
            </button>
          </div>
        )}
      </section>

      {/* RIGHT: live print preview */}
      <section className="lg:col-span-8">
        <div className="bg-[#E6ECE8] border border-[#CCD7CD] rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#255437] font-extrabold">Print preview</span>
            <span className="text-[10px] text-[#819084] font-mono">{paper.toUpperCase()} · {style}{mode === "custom" ? ` · ${pages.length} pages` : ""}</span>
          </div>
          <div className="bg-white rounded-xl overflow-hidden border border-[#CCD7CD] shadow-inner" style={{ minHeight: 700 }}>
            {loading && !html ? (
              <div className="h-[700px] flex flex-col items-center justify-center text-[#5C6E5F] gap-3"><Loader2 className="h-7 w-7 animate-spin text-[#255437]" /><p className="text-xs font-semibold">Designing your menu…</p></div>
            ) : html ? (
              <iframe title="Menu preview" srcDoc={previewHtml} className="w-full" style={{ height: 1050, border: "none", background: "white" }} />
            ) : (
              <div className="h-[700px] flex flex-col items-center justify-center text-[#819084] gap-2"><Wand2 className="h-7 w-7" /><p className="text-xs font-semibold">Pick a style and click “Design my menu”.</p></div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
