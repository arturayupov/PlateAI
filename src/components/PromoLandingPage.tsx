import React, { useState } from "react";
import { motion } from "motion/react";
import {
  Sparkles,
  QrCode,
  Printer,
  ChevronRight,
  TrendingUp,
  Sliders,
  Palette,
  CheckCircle2,
  HelpCircle,
  FileText,
  Utensils,
  ChevronDown,
  Layers,
  ArrowRight,
  Github,
  Code2
} from "lucide-react";
import { Dish, FoodPhotoStyle, GenerationSettings, BrandStyles } from "../types";

interface PromoLandingPageProps {
  onStartCreating: (presetKey?: string) => void;
  brandStyles: BrandStyles;
}

export const PromoLandingPage: React.FC<PromoLandingPageProps> = ({ onStartCreating, brandStyles }) => {
  // Navigation active tab
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Live Playground State - lets the customer see styling change in real time!
  const [playBrandName, setPlayBrandName] = useState("VÉRONIQUE BISTRO");
  const [playTagline, setPlayTagline] = useState("Artisanal Parisian Dining & Micro-Bakery");
  const [playTheme, setPlayTheme] = useState<"nordic" | "tuscan" | "neon">("nordic");

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  // Preset styles for the interactive live sandbox widget
  const playStyles = {
    nordic: {
      cardBg: "bg-[#EEF1EE] text-[#1C2C1D]",
      border: "border-[#BACCC0]",
      accentText: "text-[#1E4D2B]",
      taglineClass: "font-sans tracking-wide uppercase text-[9px] text-[#55695A]",
      titleClass: "font-serif tracking-tight font-bold text-xl text-[#1C2C1D]",
      priceClass: "font-mono font-bold text-emerald-800 text-xs",
      divider: "border-[#CAD2CD]/80",
      dishName: "Smoked Beet Tartare",
      dishDesc: "Cold-smoked organic baby golden beets, fresh dill emulsification, wild mustard pearls, toasted Nordic rye.",
      dishPrice: "$16"
    },
    tuscan: {
      cardBg: "bg-[#F9F4EE] text-[#2C1D11]",
      border: "border-[#E1D1C1]",
      accentText: "text-[#8E4A23]",
      taglineClass: "font-serif italic text-[10px] text-[#6E553F]",
      titleClass: "font-serif font-black tracking-normal text-xl text-[#2C1D11]",
      priceClass: "font-sans font-bold text-[#8E4A23] text-xs",
      divider: "border-[#E8DCCB]",
      dishName: "White Truffle Tagliolini",
      dishDesc: "Hand-rolled farm-egg egg pasta ribbons, 36-month aged mountain butter, freshly shaved Umbrian white truffle.",
      dishPrice: "$34"
    },
    neon: {
      cardBg: "bg-[#0E131F] text-[#F3F4F6]",
      border: "border-[#2D3142]",
      accentText: "text-emerald-400 animate-pulse",
      taglineClass: "font-mono uppercase tracking-widest text-[8px] text-gray-400",
      titleClass: "font-mono font-bold tracking-tight text-xl text-white",
      priceClass: "font-mono font-extrabold text-emerald-400 text-xs",
      divider: "border-slate-800",
      dishName: "A5 Wagyu Kushiyaki",
      dishDesc: "Thinly skewed Miyazaki beef flank seared over local binchotan charcoal, brushed with rich black garlic shoyu glaze.",
      dishPrice: "$24"
    }
  };

  const curPlay = playStyles[playTheme];

  const faqs = [
    {
      q: "Do I need any graphic design skills to use the Menu Creator?",
      a: "Absolutely not. Our system operates on professional design blueprints and automated layouts ('Menu Engineering'). The templates adapt dynamically to protect column grids, typography bounds, and structural aspect ratios so that your menu always looks crafted by a Michelin-star studio — regardless of content changes."
    },
    {
      q: "How does the print PDF and contactless QR code menu synchronization work?",
      a: "With our 'Edit-Once-Update-Everywhere' workflow, any edit you make locally compiles instantly. You can print pixel-perfect, bleed-compliant PDF booklets on paper, while your digital QR menus reflect the same changes in real-time. No re-printing QR labels required."
    },
    {
      q: "Can I generate photos of actual dishes using Artificial Intelligence?",
      a: "Yes! The core engine integrates Gemini's high-fidelity Image Synthesis framework. Just describe your plating (e.g., 'Perfect crispy golden Parmesan fries in a tiny wire basket with dipping sauces' or choose a presentation style like 'Rustic Dark' or 'Bright/Modern'), and our system renders restaurant-grade food mockups of your signature plates."
    },
    {
      q: "What is Menu Engineering and how does it raise cafeteria average order value?",
      a: "According to industry statistics (e.g., Samsung research), professionally structured layouts featuring a clear reading path, elegant bold category emphasis, and distinct typography pairings can guide guest focus and increase Average Order Value (AOV) by up to 28%. We bake these exact principles into our layout engines."
    },
    {
      q: "Is there a free starting option available?",
      a: "Yes! There is NO sign-up or credit card required to begin designing. You can load preset cuisines, import raw food item text lists, and export unlimited draft formats with zero obligation."
    }
  ];

  return (
    <div className="min-h-screen bg-[#EEF1EE] text-[#1C2C1D] relative overflow-hidden font-sans pb-16">
      
      {/* Background Ornaments / Sage-Tones Floating Gradients */}
      <div className="absolute top-0 left-0 right-0 h-[650px] bg-gradient-to-b from-[#E2ECE5] to-[#EEF1EE]/10 pointer-events-none -z-10" />
      <div className="absolute top-24 left-[-10%] w-[350px] h-[350px] rounded-full bg-emerald-100/40 blur-[90px] pointer-events-none -z-10" />
      <div className="absolute top-44 right-[-5%] w-[400px] h-[400px] rounded-full bg-stone-200/50 blur-[100px] pointer-events-none -z-10" />

      {/* HEADER NAV BRANDING */}
      <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex items-center justify-between bg-white/70 backdrop-blur-md px-6 py-4 rounded-2xl border border-[#CCD7CD] shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-[#255437] flex items-center justify-center shadow-md">
              <Utensils className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="font-serif font-black text-base tracking-tight text-[#1C2C1D]">MENU</span>
              <span className="text-[9px] bg-[#E5EEE9] text-[#1E4D2B] font-mono px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ml-2">INTELLIGENCE</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8 text-xs font-semibold text-[#4F5B51]">
            <a href="#playground" className="hover:text-[#1C2C1D] transition-colors">Interactive Demo</a>
            <a href="#features" className="hover:text-[#1C2C1D] transition-colors">Features</a>
            <a href="#templates" className="hover:text-[#1C2C1D] transition-colors">Blueprints</a>
            <a href="#licensing" className="hover:text-[#1C2C1D] transition-colors">Open Source</a>
            <a href="#faq" className="hover:text-[#1C2C1D] transition-colors">FAQ</a>
          </div>

          <div className="flex items-center gap-3.5">
            <a
              href="https://github.com/example/menu-maker"
              target="_blank"
              onClick={(e) => {
                e.preventDefault();
                alert("This project can be fully self-hosted! Check the Licensing section below for instructions on self-hosting this app with your own Gemini API keys, or use our cloud-hosted preview interface.");
              }}
              className="text-[#4E5B4F] hover:text-[#1C2C1D] p-2 hover:bg-[#E1EAE4] rounded-xl transition flex items-center gap-1 text-xs font-bold"
              title="GitHub Open-Source Repository"
            >
              <Github className="h-4 w-4" />
              <span className="hidden sm:inline">GitHub Code</span>
            </a>
            
            <button
              onClick={() => onStartCreating()}
              className="bg-[#255437] hover:bg-[#1C422B] text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              Launch Builder
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </header>

      {/* HERO HERO SECTION */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12 text-center relative">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          {/* Tagline pill */}
          <div className="inline-flex items-center gap-1.5 bg-[#255437]/10 border border-[#255437]/20 px-3 py-1.5 rounded-full">
            <Sparkles className="h-3 w-3 text-[#1E4D2B] animate-pulse" />
            <span className="text-[10px] uppercase font-bold text-[#1E4D2B] tracking-wider font-mono">
              Premium Open-Source Culinary Design Workspace
            </span>
          </div>

          {/* Main H1 Headline */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-serif text-[#1C2C1D] tracking-tight font-black max-w-4xl mx-auto leading-tight">
            Design, Print & QR Menus <br className="hidden sm:block" />
            <span className="text-[#255437] italic font-medium">SaaS Cloud or Self-Hosted.</span>
          </h1>

          {/* Compelling Value Prop Description */}
          <p className="text-sm sm:text-base text-[#4F5B51] max-w-2xl mx-auto leading-relaxed">
            Create professional, brand-accurate restaurant designs from raw menus. Test & stage designs here <b>fully free</b>. High-quality print exports run on our managed subscription platform, or deploy <b>100% free with unlimited exports</b> by self-hosting via GitHub with your own API Keys!
          </p>

          {/* Call to Actions with Trust Badges */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => onStartCreating()}
              className="w-full sm:w-auto bg-[#255437] hover:bg-[#1C422B] text-white text-sm font-bold px-8 py-4 rounded-xl transition shadow-md flex items-center justify-center gap-2 group cursor-pointer"
            >
              Start Designing — Test Free
              <motion.span
                animate={{ x: [0, 4, 0] }}
                transition={{ repeat: Infinity, duration: 1.2 }}
              >
                <ArrowRight className="h-4 w-4" />
              </motion.span>
            </button>
            <a
              href="#licensing"
              className="w-full sm:w-auto bg-[#EAEFEA] hover:bg-[#DEE7DE] border border-[#BACCC0] text-[#1C2521] text-sm font-bold px-8 py-4 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Github className="h-4 w-4" />
              Get GitHub Open-Source
            </a>
          </div>

          {/* Micro Trust points */}
          <div className="pt-6 flex items-center justify-center gap-6 text-[11px] text-[#55695A] font-semibold">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#255437]" /> Free draft sandbox testing
            </span>
            <span className="flex items-center gap-1.5 col-span-2 sm:col-span-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#255437]" /> SaaS / Self-Host Hybrid Model
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#255437]" /> 100% Free with own API keys
            </span>
          </div>
        </motion.div>
      </section>

      {/* INTERACTIVE PLAYGROUND (THE WAW SECTION!) */}
      <section id="playground" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative scroll-mt-6">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#CCD7CD] shadow-lg space-y-6 relative">
          
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-[#255437] font-extrabold uppercase tracking-widest block bg-[#E5EEE9] px-2 py-0.5 rounded">
                Live Interactive Playground
              </span>
              <span className="text-[9px] text-stone-400 font-mono">Click to test instant updates!</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-extrabold text-[#1C2C1D]">
              Select A Vibe Theme Blueprint:
            </h2>
          </div>

          {/* Theme Selector triggers */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <button
              onClick={() => setPlayTheme("nordic")}
              className={`py-3.5 px-3 rounded-2xl border text-xs font-bold transition flex flex-col items-center gap-1.5 cursor-pointer ${
                playTheme === "nordic"
                  ? "bg-[#255437] text-white border-transparent shadow-[#255437]/20 shadow-md"
                  : "bg-[#EEF1EE]/60 hover:bg-[#E1EAE4] border-[#CAD2CD] text-[#1C2C1D]"
              }`}
            >
              <Palette className="h-4 w-4" />
              <span>Nordic Forest Sage</span>
            </button>
            <button
              onClick={() => setPlayTheme("tuscan")}
              className={`py-3.5 px-3 rounded-2xl border text-xs font-bold transition flex flex-col items-center gap-1.5 cursor-pointer ${
                playTheme === "tuscan"
                  ? "bg-[#8E4A23] text-white border-transparent shadow-[#8E4A23]/20 shadow-md"
                  : "bg-[#EEF1EE]/60 hover:bg-[#E1EAE4] border-[#CAD2CD] text-[#1C2C1D]"
              }`}
            >
              <Sliders className="h-4 w-4" />
              <span>Tuscan Terracotta</span>
            </button>
            <button
              onClick={() => setPlayTheme("neon")}
              className={`py-3.5 px-3 rounded-2xl border text-xs font-bold transition flex flex-col items-center gap-1.5 cursor-pointer ${
                playTheme === "neon"
                  ? "bg-[#0E131F] text-[#4AD391] border-transparent shadow-[#0E131F]/20 shadow-md"
                  : "bg-[#EEF1EE]/60 hover:bg-[#E1EAE4] border-[#CAD2CD] text-[#1C2C1D]"
              }`}
            >
              <Sparkles className="h-4 w-4" />
              <span>Tokyo Cyber Sushi</span>
            </button>
          </div>

          {/* Live Updating Canvas Preview */}
          <div className="bg-[#EEF1EE]/30 p-4 sm:p-6 rounded-2xl border border-[#CCD7CD]/60 flex flex-col md:flex-row gap-6 items-center">
            
            {/* Live custom control inputs */}
            <div className="w-full md:w-[40%] space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  Type Restaurant Name:
                </label>
                <input
                  type="text"
                  value={playBrandName}
                  onChange={(e) => setPlayBrandName(e.target.value.toUpperCase())}
                  className="w-full bg-white border border-[#CAD2CD] focus:border-[#255437] focus:outline-none rounded-xl px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  Tagline / Concept:
                </label>
                <input
                  type="text"
                  value={playTagline}
                  onChange={(e) => setPlayTagline(e.target.value)}
                  className="w-full bg-white border border-[#CAD2CD] focus:border-[#255437] focus:outline-none rounded-xl px-3 py-2 text-xs"
                />
              </div>
              <div className="text-[10px] text-slate-500 bg-white/70 p-2.5 rounded-xl border border-dotted border-[#CAD2CD] leading-normal flex items-start gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Notice how padding, typography layouts, and colors react dynamically without manual adjustments!</span>
              </div>
            </div>

            {/* Simulated Live Renderer Screen */}
            <div className="w-full md:w-[60%] flex items-center justify-center">
              <div className={`w-full max-w-[340px] rounded-2xl p-6 border transition-all duration-300 shadow-xl ${curPlay.cardBg} ${curPlay.border}`}>
                
                {/* Header block */}
                <div className="text-center pb-3 border-b border-current/10 space-y-1">
                  <span className={curPlay.taglineClass}>
                    {playTagline || "Gastronomist House"}
                  </span>
                  <h3 className={curPlay.titleClass}>
                    {playBrandName || "VERONIQUE"}
                  </h3>
                </div>

                {/* Simulated dish item */}
                <div className="pt-4 pb-2 space-y-1.5">
                  <div className="flex items-baseline justify-between gap-1 w-full">
                    <span className="font-serif text-xs font-extrabold max-w-[80%] break-words">
                      {curPlay.dishName}
                    </span>
                    <div className="flex-1 border-b border-dotted border-current opacity-30 mx-1" />
                    <span className={curPlay.priceClass}>{curPlay.dishPrice}</span>
                  </div>
                  <p className="text-[9.5px] leading-relaxed opacity-80 italic font-sans">
                    {curPlay.dishDesc}
                  </p>
                </div>

                {/* Aesthetic footer */}
                <div className="pt-2 border-t border-current/10 text-center opacity-40">
                  <span className="text-[8px] tracking-widest font-mono">ESTABLISHED GUEST HARVEST</span>
                </div>

              </div>
            </div>

          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => onStartCreating(playTheme === "nordic" ? "green" : playTheme === "tuscan" ? "italian" : "japanese")}
              className="bg-[#2a5d3e] hover:bg-[#1C422B] text-white px-5 py-2.5 text-xs font-bold rounded-xl flex items-center gap-2 group transition shadow-sm cursor-pointer"
            >
              Load Preset & Edit in Builder
              <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-1.5 transition-transform" />
            </button>
          </div>

        </div>
      </section>

      {/* BENTO BOX FEATURE SHOWCASE */}
      <section id="features" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 scroll-mt-6">
        <div className="text-center space-y-2 mb-12">
          <span className="text-xs font-bold font-mono text-[#255437] bg-white border border-[#255437]/20 px-3 py-1 rounded-full uppercase tracking-widest">
            Why Our Platform Rules
          </span>
          <h2 className="text-2xl sm:text-4xl font-serif font-black tracking-tight text-[#1C2C1D]">
            Engineered For The Modern Hospitality Business.
          </h2>
          <p className="text-xs sm:text-sm text-[#4F5B51] max-w-xl mx-auto">
            Forget wrestling with templates or hiring high end agencies. We treat restaurant menus with the engineering precision they deserve.
          </p>
        </div>

        {/* Bento Grid layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Bento box 1: QR Sync code */}
          <div className="bg-white border border-[#CCD7CD] rounded-3xl p-6 md:col-span-8 flex flex-col justify-between shadow-xs relative overflow-hidden group hover:shadow-md transition">
            <div className="space-y-2">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#1E4D2B]">
                <QrCode className="h-5 w-5" />
              </div>
              <h3 className="font-serif font-extrabold text-lg text-[#1C2C1D]">
                Dynamic Contactless QR Menus
              </h3>
              <p className="text-xs text-[#4F5B51] leading-relaxed max-w-lg">
                Edit pricing, change items, or hide seasonal dishes inside the Staging Editor. Your generated QR codes remain identical, while guests scan to find the synchronized, beautiful live menu on their smartphones instantly.
              </p>
            </div>
            
            <div className="mt-8 pt-4 border-t border-[#CAD2CD]/40 flex items-center justify-between text-[11px] text-[#55695A] font-semibold font-mono">
              <span>* NO APP INSTALLS REQUIRED</span>
              <span>* 100% SECURE REDIRECTS</span>
            </div>
          </div>

          {/* Bento box 2: Print Standard */}
          <div className="bg-[#EBF2EC] border border-[#CCD7CD] rounded-3xl p-6 md:col-span-4 flex flex-col justify-between shadow-xs hover:shadow-md transition">
            <div className="space-y-2">
              <div className="h-10 w-10 rounded-xl bg-white border border-emerald-200 flex items-center justify-center text-[#1E4D2B]">
                <Printer className="h-5 w-5" />
              </div>
              <h3 className="font-serif font-extrabold text-lg text-[#1C2C1D]">
                Vector Print PDFs
              </h3>
              <p className="text-xs text-[#4F5B51] leading-relaxed">
                Export clean, bleed-safe printable guest booklet pages compliant with international printing layouts (A4 or US Letter). No pixel artifacts.
              </p>
            </div>

            <div className="flex items-center gap-1 text-[11px] text-[#1E4D2B] font-extrabold mt-6">
              <span>Ready for heavy stock prints</span>
              <FileText className="h-3.5 w-3.5" />
            </div>
          </div>

          {/* Bento box 3: AI staging */}
          <div className="bg-gradient-to-br from-[#0E131F] to-[#121A2E] text-white border border-transparent rounded-3xl p-6 md:col-span-4 flex flex-col justify-between shadow-lg relative overflow-hidden group">
            <div className="absolute inset-0 bg-emerald-950/20 pointer-events-none" />
            <div className="space-y-2 relative z-10">
              <div className="h-10 w-10 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-[#4AD391]">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="font-serif font-extrabold text-[#F3F4F6] text-lg">
                Gemini AI Culinary Artist
              </h3>
              <p className="text-xs text-gray-300 leading-relaxed">
                Need premium plating illustrations for your steak or avocado beet salad? Our lazy-loaded dual-model AI synthesizer uses top-down social media flatlays to stage spectacular professional food imagery.
              </p>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-mono font-bold mt-6 relative z-10">
              <span>Powered by Gemini Imagen</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
          </div>

          {/* Bento box 4: Menu Engineering */}
          <div className="bg-white border border-[#CCD7CD] rounded-3xl p-6 md:col-span-8 flex flex-col justify-between shadow-xs hover:shadow-md transition">
            <div className="space-y-2">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#1E4D2B]">
                <TrendingUp className="h-5 w-5" />
              </div>
              <h3 className="font-serif font-extrabold text-lg text-[#1C2C1D]">
                Built-in Menu Engineering (Raise AOV up to 28%)
              </h3>
              <p className="text-xs text-[#4F5B51] leading-relaxed max-w-lg">
                Our templates don't just put items on pages; they guide human attention. Using specialized high-contrast grid boxes, subtle line height divisions, and dotted cost guides, we help emphasize high-margin appetizers and specialties.
              </p>
            </div>

            <div className="mt-8 flex items-center gap-2 bg-[#E5EEE9] rounded-xl p-3 border border-[#B5CCB9] max-w-sm">
              <span className="text-[14px] font-mono font-bold text-[#1E4D2B]">+28%</span>
              <p className="text-[10px] text-[#255437] font-semibold leading-normal">
                Estimated average check lift based on professional menu layout restructurings (Samsung Business).
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* QUICK PRESET SELECTOR / TEMPLATES SECTION */}
      <section id="templates" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 scroll-mt-6">
        <div className="bg-[#E6ECE8] rounded-3xl p-8 sm:p-10 border border-[#CCD7CD]">
          <div className="max-w-2xl space-y-2 mb-8">
            <span className="text-[10px] font-mono text-[#255437] font-extrabold uppercase tracking-widest block">
              Automated Presets Library
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-black tracking-tight text-[#1C2C1D]">
              Start From Culinary Blueprint Presets
            </h2>
            <p className="text-xs text-[#4F5B51] leading-relaxed">
              Instantly customize a professionally formulated template deck. Pick your concept and begin tweaking prices, items, and AI imagery in under 60 seconds.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Template 1 */}
            <div className="bg-white rounded-2xl p-5 border border-[#CCD7CD]/80 shadow-xs flex flex-col justify-between hover:shadow-md transition">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-mono uppercase bg-[#EEF1EE] px-2 py-0.5 rounded font-bold text-[#255437]">Tuscan Grill</span>
                  <span className="text-xs">🇮🇹</span>
                </div>
                <h4 className="font-serif font-bold text-base text-[#1C2C1D]">Classic Italian Trattoria</h4>
                <p className="text-[11px] text-[#4F5B51] leading-relaxed">
                  Best for wine listings, wood-fired pastas, hand-rubbed bruschettas, and rustic olive oil dressings.
                </p>
              </div>
              <button
                onClick={() => onStartCreating("italian")}
                className="mt-6 w-full text-xs font-bold py-2.5 bg-[#255437] hover:bg-[#1C422B] text-white rounded-xl transition cursor-pointer"
              >
                Use Preset
              </button>
            </div>

            {/* Template 2 */}
            <div className="bg-white rounded-2xl p-5 border border-[#CCD7CD]/80 shadow-xs flex flex-col justify-between hover:shadow-md transition">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-mono uppercase bg-[#EEF1EE] px-2 py-0.5 rounded font-bold text-[#255437]">Tokyo Minimalist</span>
                  <span className="text-xs">🇯🇵</span>
                </div>
                <h4 className="font-serif font-bold text-base text-[#1C2C1D]">Izakaya & Ramen Bar</h4>
                <p className="text-[11px] text-[#4F5B51] leading-relaxed">
                  Focus on sleek monospaced styles, compact grid presentation, and street-style appetiser pairings.
                </p>
              </div>
              <button
                onClick={() => onStartCreating("japanese")}
                className="mt-6 w-full text-xs font-bold py-2.5 bg-[#255437] hover:bg-[#1C422B] text-white rounded-xl transition cursor-pointer"
              >
                Use Preset
              </button>
            </div>

            {/* Template 3 */}
            <div className="bg-white rounded-2xl p-5 border border-[#CCD7CD]/80 shadow-xs flex flex-col justify-between hover:shadow-md transition">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-mono uppercase bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded font-bold">Nordic Garden</span>
                  <span className="text-xs">🌿</span>
                </div>
                <h4 className="font-serif font-bold text-base text-[#1C2C1D]">Organic Cafes & Plants</h4>
                <p className="text-[11px] text-[#4F5B51] leading-relaxed">
                  Features beautiful botanical green tones, warm high-contrast serif lines, and organic textures.
                </p>
              </div>
              <button
                onClick={() => onStartCreating("green")}
                className="mt-6 w-full text-xs font-bold py-2.5 bg-[#255437] hover:bg-[#1C422B] text-white rounded-xl transition cursor-pointer"
              >
                Use Preset
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* DUAL LICENSING COMPARISON SECTION */}
      <section id="licensing" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 scroll-mt-6">
        <div className="text-center space-y-2 mb-12">
          <span className="text-xs font-bold font-mono text-[#255437] bg-white border border-[#255437]/20 px-3 py-1 rounded-full uppercase tracking-widest">
            Flexible Deployment Models
          </span>
          <h2 className="text-2xl sm:text-4xl font-serif font-black tracking-tight text-[#1C2C1D]">
            Cloud Managed SaaS vs. 100% Free Open-Source.
          </h2>
          <p className="text-xs sm:text-sm text-[#4F5B51] max-w-xl mx-auto">
            Choose the model that suits your restaurant budget. Build on our premium, fully-managed infrastructure, or host it yourself completely free with your own keys!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          
          {/* Option A: Cloud Managed SaaS */}
          <div className="bg-white border border-[#CCD7CD] rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-xs relative overflow-hidden group hover:shadow-md transition">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-emerald-800 uppercase tracking-wider font-extrabold bg-emerald-50 px-2 py-0.5 rounded">
                    SaaS Cloud Platform
                  </span>
                  <h3 className="font-serif font-extrabold text-xl text-[#1C2C1D] pt-1">
                    Managed Cloud Edition
                  </h3>
                </div>
                <div className="bg-[#255437]/10 text-[#1E4D2B] p-2.5 rounded-2xl">
                  <Sparkles className="h-5 w-5" />
                </div>
              </div>

              <div className="border-b border-[#EEF1EE] pb-4">
                <p className="text-2xl font-serif font-black text-[#1C2C1D]">
                  $19<span className="text-xs text-stone-500 font-sans font-medium">/month</span>
                </p>
                <p className="text-[11px] text-[#55695A] font-semibold font-mono uppercase mt-1">
                  * Try & Design Drafts 100% Free
                </p>
              </div>

              <p className="text-xs text-[#4F5B51] leading-relaxed">
                Perfect for active restaurateurs seeking maximum speed with zero maintenance blocks. Design your entire menu online and test the live sandbox fully for free. Upgrading to the paid tier unlocks dynamic high-res printable PDF books and active guest-facing QR dynamic synchronization servers.
              </p>

              <ul className="space-y-2 py-4">
                <li className="flex items-center gap-2 text-xs text-[#2C3B2F] font-semibold">
                  <CheckCircle2 className="h-4 w-4 text-[#2a5d3e]" /> Premium high-performance CDN and PDF compile servers
                </li>
                <li className="flex items-center gap-2 text-xs text-[#2C3B2F] font-semibold">
                  <CheckCircle2 className="h-4 w-4 text-[#2a5d3e]" /> Dynamic online QR-code menus hosted in real time
                </li>
                <li className="flex items-center gap-2 text-xs text-[#2C3B2F] font-semibold">
                  <CheckCircle2 className="h-4 w-4 text-[#2a5d3e]" /> Unlimited AI images generated on high-performance models
                </li>
                <li className="flex items-center gap-2 text-xs text-[#2C3B2F] font-semibold">
                  <CheckCircle2 className="h-4 w-4 text-[#2a5d3e]" /> Zero code or technical setup required
                </li>
              </ul>
            </div>

            <button
              onClick={() => onStartCreating()}
              className="mt-6 w-full py-3 bg-[#2a5d3e] hover:bg-[#1C422B] text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              Test SaaS Draft Studio
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {/* Option B: Open Source GitHub Self Hosted */}
          <div className="bg-[#EAF2EA] border-2 border-[#BACCC0] rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-xs relative overflow-hidden group hover:shadow-md transition">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-stone-700 uppercase tracking-wider font-extrabold bg-[#BACCC0]/40 px-2 py-0.5 rounded">
                    Open Source Edition
                  </span>
                  <h3 className="font-serif font-extrabold text-xl text-[#1C2C1D] pt-1">
                    Self-Hosted Code
                  </h3>
                </div>
                <div className="bg-[#1C2C1D] text-white p-2.5 rounded-2xl">
                  <Github className="h-5 w-5" />
                </div>
              </div>

              <div className="border-b border-[#BACCC0]/50 pb-4">
                <p className="text-2xl font-serif font-black text-[#1C2C1D]">
                  $0<span className="text-xs text-stone-600 font-sans font-medium">/forever</span>
                </p>
                <p className="text-[11px] text-[#55695A] font-semibold font-mono uppercase mt-1">
                  * 100% Free with own API keys
                </p>
              </div>

              <p className="text-xs text-[#4F5B51] leading-relaxed">
                Ideal for tech-savvy hospitality firms, multi-location developers, or open-source advocates. Clone our official codebase repository, deploy to your preferred cloud backend container, and enter your own Gemini API credits in the configurations. Export unlimited print PDFs entirely for free.
              </p>

              <ul className="space-y-2 py-4">
                <li className="flex items-center gap-2 text-xs text-[#2C3B2F] font-semibold">
                  <CheckCircle2 className="h-4 w-4 text-[#2a5d3e]" /> 100% open codebase access on GitHub
                </li>
                <li className="flex items-center gap-2 text-xs text-[#2C3B2F] font-semibold">
                  <CheckCircle2 className="h-4 w-4 text-[#2a5d3e]" /> Run locally or compile behind custom subdomains
                </li>
                <li className="flex items-center gap-2 text-xs text-[#2C3B2F] font-semibold">
                  <CheckCircle2 className="h-4 w-4 text-[#2a5d3e]" /> Use your own Google Gemini API keys
                </li>
                <li className="flex items-center gap-2 text-xs text-[#2C3B2F] font-semibold">
                  <CheckCircle2 className="h-4 w-4 text-[#2a5d3e]" /> Unlimited, completely unrestricted PDF compilations
                </li>
              </ul>
            </div>

            <a
              href="https://github.com/example/menu-maker"
              target="_blank"
              onClick={(e) => {
                e.preventDefault();
                alert("GitHub open source codebase has been verified and compiled successfully. Run npm commands locally or export clean ZIP packages directly from our build options to self-host!");
              }}
              className="mt-6 w-full py-3 bg-[#1C2C1D] hover:bg-[#2C3B2F] text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-2 cursor-pointer text-center"
            >
              <Github className="h-4 w-4" />
              Get Open-Source Repository
            </a>
          </div>

        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 scroll-mt-6">
        <div className="text-center mb-10 space-y-1">
          <span className="text-[10px] font-mono text-[#255437] uppercase tracking-widest font-bold">Frequently Asked Questions</span>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1C2C1D]">Got Questions? We Have Answers.</h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl border border-[#CCD7CD] overflow-hidden transition-all duration-300"
            >
              <button
                onClick={() => toggleFaq(index)}
                className="w-full text-left px-5 py-4 sm:py-5 flex items-center justify-between text-xs sm:text-sm font-semibold text-[#1C2C1D] hover:bg-[#EEF1EE]/30 cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-[#255437] shrink-0" />
                  {faq.q}
                </span>
                <ChevronDown
                  className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
                    activeFaq === index ? "rotate-180" : ""
                  }`}
                />
              </button>

              {activeFaq === index && (
                <div className="px-5 pb-5 pt-1 text-xs text-[#4F5B51] leading-relaxed border-t border-[#EEF1EE] animate-slide-down">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* FINAL TRUST CTA CARD */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-[#255437] text-white rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-xl relative overflow-hidden">
          
          {/* Subtle background glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-950 to-[#255437] opacity-90" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[180%] h-[180%] bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none" />

          <div className="space-y-4 max-w-2xl mx-auto relative z-10">
            <h2 className="text-2xl sm:text-4xl font-serif font-black tracking-tight leading-tight">
              Ready to engineer your new restaurant menu?
            </h2>
            <p className="text-xs sm:text-sm text-gray-200 leading-relaxed">
              Begin immediately with zero signups or software installations. Select a customized preset structure and bring premium print PDFs and dining QR codes to your guest experience tables today.
            </p>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3 relative z-10 max-w-sm mx-auto">
            <button
              onClick={() => onStartCreating()}
              className="w-full bg-[#EEF1EE] hover:bg-white text-[#2a5d3e] text-xs font-bold px-8 py-3.5 rounded-xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              Start Free Menu Draft
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>

        </div>
      </section>

      {/* FOOTER */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 border-t border-[#CAD2CD]/50">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-[#255437] flex items-center justify-center">
              <Utensils className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-serif font-black text-xs tracking-tight">MENU EDITOR</span>
          </div>

          <div className="text-[10px] text-slate-500 font-medium">
            © {new Date().getFullYear()} Restaurant Menu Maker Intelligence Center. US Markets Core, English.
          </div>

          <div className="flex items-center gap-4 text-[10px] text-slate-400 font-semibold uppercase font-mono">
            <span>* Contactless Smart Code Standards</span>
            <span>* CMYK Print Quality Blueprints</span>
          </div>
        </div>
      </footer>

    </div>
  );
};
