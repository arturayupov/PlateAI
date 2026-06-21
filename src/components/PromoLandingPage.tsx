import React, { useState } from "react";
import { motion } from "motion/react";
import {
  Sparkles,
  Printer,
  ChevronRight,
  TrendingUp,
  Sliders,
  Palette,
  CheckCircle2,
  HelpCircle,
  FileText,
  Camera,
  Wand2,
  ChevronDown,
  ArrowRight,
  Github,
  Lock,
  Archive,
} from "lucide-react";
import { BrandStyles } from "../types";

interface PromoLandingPageProps {
  onStartCreating: (presetKey?: string) => void;
  brandStyles: BrandStyles;
}

const GITHUB_URL = "https://github.com/arturayupov/PlateAI";

// PlateAI cloche logo (matches the in-app header mark)
const PlateLogo: React.FC<{ className?: string }> = ({ className = "h-5 w-5" }) => (
  <svg viewBox="0 0 24 24" className={className} xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M3 16h18" strokeLinecap="round" />
    <path d="M6 19c3 1.5 9 1.5 12 0" strokeLinecap="round" opacity="0.8" />
    <path d="M5 16a7 7 0 0 1 14 0" strokeLinecap="round" />
    <circle cx="12" cy="8" r="1.5" fill="currentColor" />
    <path d="M12 3v2M9.5 4.5l1 1M14.5 4.5l-1 1" strokeLinecap="round" opacity="0.9" />
  </svg>
);

const Wordmark: React.FC<{ className?: string }> = ({ className = "" }) => (
  <span className={`font-serif font-black tracking-tight ${className}`}>
    Plate<span className="text-[#255437]">AI</span>
  </span>
);

export const PromoLandingPage: React.FC<PromoLandingPageProps> = ({ onStartCreating }) => {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Live playground state
  const [playBrandName, setPlayBrandName] = useState("VÉRONIQUE BISTRO");
  const [playTagline, setPlayTagline] = useState("Artisanal Parisian Dining & Micro-Bakery");
  const [playTheme, setPlayTheme] = useState<"nordic" | "tuscan" | "neon">("nordic");

  const toggleFaq = (index: number) => setActiveFaq(activeFaq === index ? null : index);

  const playStyles = {
    nordic: {
      cardBg: "bg-[#EEF1EE] text-[#1C2C1D]",
      border: "border-[#BACCC0]",
      taglineClass: "font-sans tracking-wide uppercase text-[9px] text-[#55695A]",
      titleClass: "font-serif tracking-tight font-bold text-xl text-[#1C2C1D]",
      priceClass: "font-mono font-bold text-emerald-800 text-xs",
      dishName: "Smoked Beet Tartare",
      dishDesc: "Cold-smoked organic baby golden beets, fresh dill emulsion, wild mustard pearls, toasted Nordic rye.",
      dishPrice: "$16",
    },
    tuscan: {
      cardBg: "bg-[#F9F4EE] text-[#2C1D11]",
      border: "border-[#E1D1C1]",
      taglineClass: "font-serif italic text-[10px] text-[#6E553F]",
      titleClass: "font-serif font-black tracking-normal text-xl text-[#2C1D11]",
      priceClass: "font-sans font-bold text-[#8E4A23] text-xs",
      dishName: "White Truffle Tagliolini",
      dishDesc: "Hand-rolled farm-egg pasta ribbons, 36-month aged mountain butter, freshly shaved Umbrian white truffle.",
      dishPrice: "$34",
    },
    neon: {
      cardBg: "bg-[#0E131F] text-[#F3F4F6]",
      border: "border-[#2D3142]",
      taglineClass: "font-mono uppercase tracking-widest text-[8px] text-gray-400",
      titleClass: "font-mono font-bold tracking-tight text-xl text-white",
      priceClass: "font-mono font-extrabold text-emerald-400 text-xs",
      dishName: "A5 Wagyu Kushiyaki",
      dishDesc: "Thinly sliced Miyazaki beef skewers seared over binchotan charcoal, brushed with black-garlic shoyu glaze.",
      dishPrice: "$24",
    },
  };
  const curPlay = playStyles[playTheme];

  const faqs = [
    {
      q: "Is PlateAI free to use?",
      a: "Yes — designing and previewing is free with no sign-up. You can paste your menu, generate gourmet descriptions, and create AI food photos (shown as watermarked previews). You only pay a one-time $19 fee when you want to download your finished menu without the watermark.",
    },
    {
      q: "What exactly does the $19 unlock?",
      a: "A single one-time payment (no subscription) removes the watermark from your photos and unlocks downloads: high-resolution images, a print-ready PDF menu, and the full ZIP pack (images + data). It applies to the menu you built in this session, and you can re-download it.",
    },
    {
      q: "Do I need any design skills?",
      a: "None. Paste or upload your menu as plain text and PlateAI structures it, writes appetizing descriptions, and lays it out using menu-engineering principles. Pick from nine print templates — classic, minimalist, cozy, Michelin-style and more.",
    },
    {
      q: "How are the food photos made?",
      a: "PlateAI uses Google's Gemini image models to generate realistic, restaurant-grade food photography from your dish descriptions. Choose a styling look — Rustic/Dark, Bright/Modern, or Social Media flatlay — and re-roll or edit any shot with a text prompt.",
    },
    {
      q: "Can I self-host it for free?",
      a: "Yes. PlateAI is open source. Clone the repository, add your own Google Gemini API key, and run it yourself with no watermark and no usage fees. The hosted version exists for people who'd rather not set anything up.",
    },
    {
      q: "Does menu design really increase sales?",
      a: "Well-structured menus guide attention to high-margin items. Industry research (e.g. Samsung Business) has associated professional menu layouts with average-order-value lifts of up to 28%. PlateAI bakes these layout principles into every template.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#EEF1EE] text-[#1C2C1D] relative overflow-hidden font-sans pb-16">
      {/* Background ornaments */}
      <div className="absolute top-0 left-0 right-0 h-[650px] bg-gradient-to-b from-[#E2ECE5] to-[#EEF1EE]/10 pointer-events-none -z-10" />
      <div className="absolute top-24 left-[-10%] w-[350px] h-[350px] rounded-full bg-emerald-100/40 blur-[90px] pointer-events-none -z-10" />
      <div className="absolute top-44 right-[-5%] w-[400px] h-[400px] rounded-full bg-stone-200/50 blur-[100px] pointer-events-none -z-10" />

      {/* HEADER */}
      <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex items-center justify-between bg-white/70 backdrop-blur-md px-6 py-4 rounded-2xl border border-[#CCD7CD] shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-[#255437] flex items-center justify-center shadow-md text-white">
              <PlateLogo className="h-5 w-5 stroke-white" />
            </div>
            <div className="flex items-center gap-2">
              <Wordmark className="text-base text-[#1C2C1D]" />
              <span className="text-[9px] bg-[#E5EEE9] text-[#1E4D2B] font-mono px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                Menu Studio
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8 text-xs font-semibold text-[#4F5B51]">
            <a href="#playground" className="hover:text-[#1C2C1D] transition-colors">Live Demo</a>
            <a href="#features" className="hover:text-[#1C2C1D] transition-colors">Features</a>
            <a href="#pricing" className="hover:text-[#1C2C1D] transition-colors">Pricing</a>
            <a href="#opensource" className="hover:text-[#1C2C1D] transition-colors">Open Source</a>
            <a href="#faq" className="hover:text-[#1C2C1D] transition-colors">FAQ</a>
          </div>

          <div className="flex items-center gap-3.5">
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#4E5B4F] hover:text-[#1C2C1D] p-2 hover:bg-[#E1EAE4] rounded-xl transition flex items-center gap-1 text-xs font-bold"
              title="PlateAI on GitHub"
            >
              <Github className="h-4 w-4" />
              <span className="hidden sm:inline">GitHub</span>
            </a>
            <button
              onClick={() => onStartCreating()}
              className="bg-[#255437] hover:bg-[#1C422B] text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              Create your menu
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12 text-center relative">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="space-y-6">
          <div className="inline-flex items-center gap-1.5 bg-[#255437]/10 border border-[#255437]/20 px-3 py-1.5 rounded-full">
            <Sparkles className="h-3 w-3 text-[#1E4D2B]" />
            <span className="text-[10px] uppercase font-bold text-[#1E4D2B] tracking-wider font-mono">
              AI Menu Maker for Restaurants &amp; Cafes
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-serif text-[#1C2C1D] tracking-tight font-black max-w-4xl mx-auto leading-tight">
            Turn your menu into stunning
            <span className="text-[#255437] italic font-medium"> AI food photography</span> — in minutes.
          </h1>

          <p className="text-sm sm:text-base text-[#4F5B51] max-w-2xl mx-auto leading-relaxed">
            Paste your dishes and PlateAI writes gourmet descriptions, generates realistic food photos, and lays out a
            print-ready menu. <b>Design and preview for free</b> — pay a <b>one-time $19</b> only when you download the
            finished menu. Prefer to run it yourself? It&apos;s <b>open source and free to self-host</b>.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => onStartCreating()}
              className="w-full sm:w-auto bg-[#255437] hover:bg-[#1C422B] text-white text-sm font-bold px-8 py-4 rounded-xl transition shadow-md flex items-center justify-center gap-2 group cursor-pointer"
            >
              Create your menu — free
              <motion.span animate={{ x: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 1.2 }}>
                <ArrowRight className="h-4 w-4" />
              </motion.span>
            </button>
            <a
              href="#pricing"
              className="w-full sm:w-auto bg-[#EAEFEA] hover:bg-[#DEE7DE] border border-[#BACCC0] text-[#1C2521] text-sm font-bold px-8 py-4 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
            >
              See pricing
            </a>
          </div>

          <div className="pt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] text-[#55695A] font-semibold">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-[#255437]" /> No sign-up to start</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-[#255437]" /> One-time $19 — no subscription</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-[#255437]" /> Open source &amp; self-hostable</span>
          </div>
        </motion.div>
      </section>

      {/* INTERACTIVE PLAYGROUND */}
      <section id="playground" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative scroll-mt-6">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#CCD7CD] shadow-lg space-y-6 relative">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-[#255437] font-extrabold uppercase tracking-widest block bg-[#E5EEE9] px-2 py-0.5 rounded">
                Live preview
              </span>
              <span className="text-[9px] text-stone-400 font-mono">Type and switch themes — it updates instantly</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-extrabold text-[#1C2C1D]">Pick a menu style:</h2>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <button
              onClick={() => setPlayTheme("nordic")}
              className={`py-3.5 px-3 rounded-2xl border text-xs font-bold transition flex flex-col items-center gap-1.5 cursor-pointer ${playTheme === "nordic" ? "bg-[#255437] text-white border-transparent shadow-md" : "bg-[#EEF1EE]/60 hover:bg-[#E1EAE4] border-[#CAD2CD] text-[#1C2C1D]"}`}
            >
              <Palette className="h-4 w-4" />
              <span>Nordic Sage</span>
            </button>
            <button
              onClick={() => setPlayTheme("tuscan")}
              className={`py-3.5 px-3 rounded-2xl border text-xs font-bold transition flex flex-col items-center gap-1.5 cursor-pointer ${playTheme === "tuscan" ? "bg-[#8E4A23] text-white border-transparent shadow-md" : "bg-[#EEF1EE]/60 hover:bg-[#E1EAE4] border-[#CAD2CD] text-[#1C2C1D]"}`}
            >
              <Sliders className="h-4 w-4" />
              <span>Tuscan Terracotta</span>
            </button>
            <button
              onClick={() => setPlayTheme("neon")}
              className={`py-3.5 px-3 rounded-2xl border text-xs font-bold transition flex flex-col items-center gap-1.5 cursor-pointer ${playTheme === "neon" ? "bg-[#0E131F] text-[#4AD391] border-transparent shadow-md" : "bg-[#EEF1EE]/60 hover:bg-[#E1EAE4] border-[#CAD2CD] text-[#1C2C1D]"}`}
            >
              <Sparkles className="h-4 w-4" />
              <span>Tokyo Cyber</span>
            </button>
          </div>

          <div className="bg-[#EEF1EE]/30 p-4 sm:p-6 rounded-2xl border border-[#CCD7CD]/60 flex flex-col md:flex-row gap-6 items-center">
            <div className="w-full md:w-[40%] space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Restaurant name</label>
                <input
                  type="text"
                  value={playBrandName}
                  onChange={(e) => setPlayBrandName(e.target.value.toUpperCase())}
                  className="w-full bg-white border border-[#CAD2CD] focus:border-[#255437] focus:outline-none rounded-xl px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Tagline / concept</label>
                <input
                  type="text"
                  value={playTagline}
                  onChange={(e) => setPlayTagline(e.target.value)}
                  className="w-full bg-white border border-[#CAD2CD] focus:border-[#255437] focus:outline-none rounded-xl px-3 py-2 text-xs"
                />
              </div>
              <div className="text-[10px] text-slate-500 bg-white/70 p-2.5 rounded-xl border border-dotted border-[#CAD2CD] leading-normal flex items-start gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Typography, spacing and colors adapt automatically — no manual tweaking.</span>
              </div>
            </div>

            <div className="w-full md:w-[60%] flex items-center justify-center">
              <div className={`w-full max-w-[340px] rounded-2xl p-6 border transition-all duration-300 shadow-xl ${curPlay.cardBg} ${curPlay.border}`}>
                <div className="text-center pb-3 border-b border-current/10 space-y-1">
                  <span className={curPlay.taglineClass}>{playTagline || "Gastronomist House"}</span>
                  <h3 className={curPlay.titleClass}>{playBrandName || "VÉRONIQUE"}</h3>
                </div>
                <div className="pt-4 pb-2 space-y-1.5">
                  <div className="flex items-baseline justify-between gap-1 w-full">
                    <span className="font-serif text-xs font-extrabold max-w-[80%] break-words">{curPlay.dishName}</span>
                    <div className="flex-1 border-b border-dotted border-current opacity-30 mx-1" />
                    <span className={curPlay.priceClass}>{curPlay.dishPrice}</span>
                  </div>
                  <p className="text-[9.5px] leading-relaxed opacity-80 italic font-sans">{curPlay.dishDesc}</p>
                </div>
                <div className="pt-2 border-t border-current/10 text-center opacity-40">
                  <span className="text-[8px] tracking-widest font-mono">PLATEAI · MENU STUDIO</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => onStartCreating(playTheme === "nordic" ? "green" : playTheme === "tuscan" ? "italian" : "japanese")}
              className="bg-[#2a5d3e] hover:bg-[#1C422B] text-white px-5 py-2.5 text-xs font-bold rounded-xl flex items-center gap-2 group transition shadow-sm cursor-pointer"
            >
              Open this style in the builder
              <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-1.5 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 scroll-mt-6">
        <div className="text-center space-y-2 mb-12">
          <span className="text-xs font-bold font-mono text-[#255437] bg-white border border-[#255437]/20 px-3 py-1 rounded-full uppercase tracking-widest">
            What PlateAI does
          </span>
          <h2 className="text-2xl sm:text-4xl font-serif font-black tracking-tight text-[#1C2C1D]">
            From plain text to a menu that sells.
          </h2>
          <p className="text-xs sm:text-sm text-[#4F5B51] max-w-xl mx-auto">
            No designer, no Photoshop. PlateAI handles the writing, the photography and the layout.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* AI food photography */}
          <div className="bg-gradient-to-br from-[#0E131F] to-[#121A2E] text-white border border-transparent rounded-3xl p-6 md:col-span-8 flex flex-col justify-between shadow-lg relative overflow-hidden">
            <div className="space-y-2 relative z-10">
              <div className="h-10 w-10 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-[#4AD391]">
                <Camera className="h-5 w-5" />
              </div>
              <h3 className="font-serif font-extrabold text-[#F3F4F6] text-lg">AI food photography (Gemini)</h3>
              <p className="text-xs text-gray-300 leading-relaxed max-w-lg">
                Generate realistic, restaurant-grade photos of every dish from its description. Choose a styling look —
                Rustic/Dark, Bright/Modern, or Social-Media flatlay — re-roll shots, or edit any photo with a text prompt.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-mono font-bold mt-6 relative z-10">
              <span>Powered by Google Gemini &amp; Imagen</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
          </div>

          {/* AI copywriter */}
          <div className="bg-white border border-[#CCD7CD] rounded-3xl p-6 md:col-span-4 flex flex-col justify-between shadow-xs hover:shadow-md transition">
            <div className="space-y-2">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#1E4D2B]">
                <Wand2 className="h-5 w-5" />
              </div>
              <h3 className="font-serif font-extrabold text-lg text-[#1C2C1D]">AI menu copywriter</h3>
              <p className="text-xs text-[#4F5B51] leading-relaxed">
                Paste rough dish names and get polished, appetizing descriptions plus the key ingredients to highlight — in seconds.
              </p>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-[#1E4D2B] font-extrabold mt-6">
              <span>Parses any plain-text menu</span>
              <FileText className="h-3.5 w-3.5" />
            </div>
          </div>

          {/* Menu engineering */}
          <div className="bg-white border border-[#CCD7CD] rounded-3xl p-6 md:col-span-8 flex flex-col justify-between shadow-xs hover:shadow-md transition">
            <div className="space-y-2">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#1E4D2B]">
                <TrendingUp className="h-5 w-5" />
              </div>
              <h3 className="font-serif font-extrabold text-lg text-[#1C2C1D]">Menu-engineering layouts</h3>
              <p className="text-xs text-[#4F5B51] leading-relaxed max-w-lg">
                Templates that guide attention to your high-margin dishes with deliberate hierarchy, spacing and price styling — not just text on a page.
              </p>
            </div>
            <div className="mt-8 flex items-center gap-2 bg-[#E5EEE9] rounded-xl p-3 border border-[#B5CCB9] max-w-sm">
              <span className="text-[14px] font-mono font-bold text-[#1E4D2B]">+28%</span>
              <p className="text-[10px] text-[#255437] font-semibold leading-normal">
                Average-check lift associated with professional menu layouts (Samsung Business research).
              </p>
            </div>
          </div>

          {/* Print + ZIP */}
          <div className="bg-[#EBF2EC] border border-[#CCD7CD] rounded-3xl p-6 md:col-span-4 flex flex-col justify-between shadow-xs hover:shadow-md transition">
            <div className="space-y-2">
              <div className="h-10 w-10 rounded-xl bg-white border border-emerald-200 flex items-center justify-center text-[#1E4D2B]">
                <Printer className="h-5 w-5" />
              </div>
              <h3 className="font-serif font-extrabold text-lg text-[#1C2C1D]">Print-ready PDF &amp; ZIP pack</h3>
              <p className="text-xs text-[#4F5B51] leading-relaxed">
                Export a clean, bleed-safe PDF menu (A4 or US Letter) or the full ZIP pack — high-res images plus a data sheet.
              </p>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-[#1E4D2B] font-extrabold mt-6">
              <span>9 print templates</span>
              <Archive className="h-3.5 w-3.5" />
            </div>
          </div>
        </div>
      </section>

      {/* TEMPLATES / PRESETS */}
      <section id="templates" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 scroll-mt-6">
        <div className="bg-[#E6ECE8] rounded-3xl p-8 sm:p-10 border border-[#CCD7CD]">
          <div className="max-w-2xl space-y-2 mb-8">
            <span className="text-[10px] font-mono text-[#255437] font-extrabold uppercase tracking-widest block">Start in 60 seconds</span>
            <h2 className="text-2xl sm:text-3xl font-serif font-black tracking-tight text-[#1C2C1D]">Start from a preset menu</h2>
            <p className="text-xs text-[#4F5B51] leading-relaxed">Pick a concept and customize prices, items and AI imagery right away.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { tag: "Tuscan Grill", flag: "🇮🇹", title: "Classic Italian Trattoria", desc: "Wine lists, wood-fired pastas, rustic bruschettas and olive-oil dressings.", key: "italian" },
              { tag: "Tokyo Minimalist", flag: "🇯🇵", title: "Izakaya & Ramen Bar", desc: "Sleek monospaced styles, compact grids and street-style pairings.", key: "japanese" },
              { tag: "Nordic Garden", flag: "🌿", title: "Organic Cafe & Plant-Based", desc: "Botanical green tones, warm serif lines and organic textures.", key: "green" },
            ].map((t) => (
              <div key={t.key} className="bg-white rounded-2xl p-5 border border-[#CCD7CD]/80 shadow-xs flex flex-col justify-between hover:shadow-md transition">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono uppercase bg-[#EEF1EE] px-2 py-0.5 rounded font-bold text-[#255437]">{t.tag}</span>
                    <span className="text-xs">{t.flag}</span>
                  </div>
                  <h4 className="font-serif font-bold text-base text-[#1C2C1D]">{t.title}</h4>
                  <p className="text-[11px] text-[#4F5B51] leading-relaxed">{t.desc}</p>
                </div>
                <button
                  onClick={() => onStartCreating(t.key)}
                  className="mt-6 w-full text-xs font-bold py-2.5 bg-[#255437] hover:bg-[#1C422B] text-white rounded-xl transition cursor-pointer"
                >
                  Use preset
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 scroll-mt-6">
        <div className="text-center space-y-2 mb-12">
          <span className="text-xs font-bold font-mono text-[#255437] bg-white border border-[#255437]/20 px-3 py-1 rounded-full uppercase tracking-widest">
            Simple pricing
          </span>
          <h2 className="text-2xl sm:text-4xl font-serif font-black tracking-tight text-[#1C2C1D]">
            Design free. Pay once to download.
          </h2>
          <p className="text-xs sm:text-sm text-[#4F5B51] max-w-xl mx-auto">
            No accounts, no subscriptions. Pay only when you&apos;re happy with your menu.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch">
          {/* Free */}
          <div className="bg-white border border-[#CCD7CD] rounded-3xl p-6 flex flex-col shadow-xs">
            <span className="text-[10px] font-mono text-emerald-800 uppercase tracking-wider font-extrabold bg-emerald-50 px-2 py-0.5 rounded self-start">Design &amp; preview</span>
            <p className="text-3xl font-serif font-black text-[#1C2C1D] mt-3">$0</p>
            <p className="text-[11px] text-[#55695A] font-semibold mt-1">No sign-up required</p>
            <ul className="space-y-2 py-5 text-xs text-[#2C3B2F] font-semibold flex-1">
              <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-[#2a5d3e] mt-0.5 shrink-0" /> Parse any plain-text menu</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-[#2a5d3e] mt-0.5 shrink-0" /> AI descriptions &amp; ingredients</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-[#2a5d3e] mt-0.5 shrink-0" /> AI food photos (watermarked preview)</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-[#2a5d3e] mt-0.5 shrink-0" /> Full live editor &amp; templates</li>
            </ul>
            <button onClick={() => onStartCreating()} className="w-full py-3 bg-[#EAEFEA] hover:bg-[#DEE7DE] border border-[#BACCC0] text-[#1C2521] rounded-xl text-xs font-bold transition cursor-pointer">
              Start designing
            </button>
          </div>

          {/* $19 one-time (highlight) */}
          <div className="bg-white border-2 border-[#255437] rounded-3xl p-6 flex flex-col shadow-lg relative">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#255437] text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">Most popular</span>
            <span className="text-[10px] font-mono text-[#1E4D2B] uppercase tracking-wider font-extrabold bg-[#E5EEE9] px-2 py-0.5 rounded self-start">Download</span>
            <p className="text-3xl font-serif font-black text-[#1C2C1D] mt-3">$19 <span className="text-xs text-stone-500 font-sans font-medium">one time</span></p>
            <p className="text-[11px] text-[#55695A] font-semibold mt-1">Per menu · no subscription</p>
            <ul className="space-y-2 py-5 text-xs text-[#2C3B2F] font-semibold flex-1">
              <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-[#2a5d3e] mt-0.5 shrink-0" /> Remove the watermark</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-[#2a5d3e] mt-0.5 shrink-0" /> High-resolution food photos</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-[#2a5d3e] mt-0.5 shrink-0" /> Print-ready PDF menu (A4 / Letter)</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-[#2a5d3e] mt-0.5 shrink-0" /> Full ZIP pack (images + data)</li>
            </ul>
            <button onClick={() => onStartCreating()} className="w-full py-3 bg-[#255437] hover:bg-[#1C422B] text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-2 cursor-pointer">
              <Lock className="h-3.5 w-3.5" /> Build &amp; unlock for $19
            </button>
          </div>

          {/* Self-host */}
          <div className="bg-[#EAF2EA] border border-[#BACCC0] rounded-3xl p-6 flex flex-col shadow-xs">
            <span className="text-[10px] font-mono text-stone-700 uppercase tracking-wider font-extrabold bg-[#BACCC0]/40 px-2 py-0.5 rounded self-start">Open source</span>
            <p className="text-3xl font-serif font-black text-[#1C2C1D] mt-3">$0 <span className="text-xs text-stone-600 font-sans font-medium">self-host</span></p>
            <p className="text-[11px] text-[#55695A] font-semibold mt-1">Your own API key</p>
            <ul className="space-y-2 py-5 text-xs text-[#2C3B2F] font-semibold flex-1">
              <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-[#2a5d3e] mt-0.5 shrink-0" /> Full source on GitHub</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-[#2a5d3e] mt-0.5 shrink-0" /> No watermark, no fees</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-[#2a5d3e] mt-0.5 shrink-0" /> Bring your own Gemini key</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-[#2a5d3e] mt-0.5 shrink-0" /> Deploy anywhere (Node)</li>
            </ul>
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="w-full py-3 bg-[#1C2C1D] hover:bg-[#2C3B2F] text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-2 cursor-pointer text-center">
              <Github className="h-4 w-4" /> Self-host it free
            </a>
          </div>
        </div>
      </section>

      {/* OPEN SOURCE */}
      <section id="opensource" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 scroll-mt-6">
        <div className="bg-white border border-[#CCD7CD] rounded-3xl p-8 sm:p-10 flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <Github className="h-5 w-5 text-[#1C2C1D]" />
              <h2 className="text-xl sm:text-2xl font-serif font-black text-[#1C2C1D]">Open source &amp; self-hostable</h2>
            </div>
            <p className="text-xs sm:text-sm text-[#4F5B51] leading-relaxed">
              PlateAI is fully open source. Clone the repo, add your own Google Gemini API key, and run it yourself with no
              watermark and no usage fees. Built on React, Vite and a small Node/Express server — deploy it anywhere.
            </p>
          </div>
          <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="shrink-0 py-3 px-6 bg-[#1C2C1D] hover:bg-[#2C3B2F] text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-2">
            <Github className="h-4 w-4" /> View on GitHub
          </a>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 scroll-mt-6">
        <div className="text-center mb-10 space-y-1">
          <span className="text-[10px] font-mono text-[#255437] uppercase tracking-widest font-bold">FAQ</span>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1C2C1D]">Questions, answered.</h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-white rounded-2xl border border-[#CCD7CD] overflow-hidden transition-all duration-300">
              <button
                onClick={() => toggleFaq(index)}
                className="w-full text-left px-5 py-4 sm:py-5 flex items-center justify-between text-xs sm:text-sm font-semibold text-[#1C2C1D] hover:bg-[#EEF1EE]/30 cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-[#255437] shrink-0" />
                  {faq.q}
                </span>
                <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${activeFaq === index ? "rotate-180" : ""}`} />
              </button>
              {activeFaq === index && (
                <div className="px-5 pb-5 pt-1 text-xs text-[#4F5B51] leading-relaxed border-t border-[#EEF1EE]">{faq.a}</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-[#255437] text-white rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-950 to-[#255437] opacity-90" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[180%] h-[180%] bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none" />
          <div className="space-y-4 max-w-2xl mx-auto relative z-10">
            <h2 className="text-2xl sm:text-4xl font-serif font-black tracking-tight leading-tight">Ready to build your menu?</h2>
            <p className="text-xs sm:text-sm text-gray-200 leading-relaxed">
              Start free, no sign-up. Design it, preview your AI photos, and pay a one-time $19 only when you download.
            </p>
          </div>
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3 relative z-10 max-w-sm mx-auto">
            <button onClick={() => onStartCreating()} className="w-full bg-[#EEF1EE] hover:bg-white text-[#2a5d3e] text-xs font-bold px-8 py-3.5 rounded-xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer">
              Create your menu — free
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 border-t border-[#CAD2CD]/50">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-[#255437] flex items-center justify-center text-white">
              <PlateLogo className="h-3.5 w-3.5 stroke-white" />
            </div>
            <Wordmark className="text-xs" />
          </div>
          <div className="text-[10px] text-slate-500 font-medium">
            © {new Date().getFullYear()} PlateAI — AI menu maker for restaurants &amp; cafes.
          </div>
          <div className="flex items-center gap-4 text-[10px] text-slate-400 font-semibold uppercase font-mono">
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="hover:text-slate-600">Open Source</a>
            <a href="#pricing" className="hover:text-slate-600">Pricing</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
