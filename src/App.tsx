import React, { useState, useEffect, useRef } from "react";
import {
  Upload,
  FileText,
  Sparkles,
  Camera,
  Wand2,
  Download,
  Maximize2,
  RefreshCw,
  Check,
  RotateCcw,
  Utensils,
  ChevronRight,
  Eye,
  AlertTriangle,
  History,
  Info,
  Trash2,
  Edit3,
  Sliders,
  Printer,
  Copy,
  Archive,
  Search,
  Palette,
  GripVertical
} from "lucide-react";
import JSZip from "jszip";
import { Dish, FoodPhotoStyle, ImageSize, AspectRatio, GenerationSettings, BrandStyles, TextStyle } from "./types";
import { generatePresentationPDF } from "./pdfGenerator";
import { InteractiveDesignerCanvas } from "./components/InteractiveDesignerCanvas";
import { PromoLandingPage } from "./components/PromoLandingPage";
import { PaywallModal } from "./components/PaywallModal";
import {
  getProjectId,
  getStoredToken,
  setStoredToken,
  startCheckout,
  confirmPayment,
  unlockImages,
} from "./paywallClient";

const getFormattedPriceWithSymbol = (dish: Dish) => {
  if (dish.price === undefined || dish.price === null || Number(dish.price) === 0) {
    return "";
  }
  const symbol = dish.currency || "USD";
  let symbolChar = "$";
  if (symbol === "USD") symbolChar = "$";
  else if (symbol === "EUR") symbolChar = "€";
  else if (symbol === "RUB") symbolChar = "₽";
  else if (symbol === "GBP") symbolChar = "£";
  else if (symbol === "CNY" || symbol === "JPY") symbolChar = "¥";
  
  if (symbol === "RUB" || symbolChar === "₽") {
    return `${dish.price} ₽`;
  }
  return `${symbolChar}${dish.price}`;
};

// PRESET CULINARY MENUS FOR QUICK INITIATION
const MENU_PRESETS = {
  italian: `Appetizers:
- Burrata Caprese: Creamy Pugliese burrata over heirloom cherry tomatoes, drizzled with 12-year aged balsamic glaze and fresh basil microgreens.
- Wood-Fired Bruschetta: Slices of rustic sourdough bread rubbed with fresh garlic, loaded with seasoned Roma tomato, basil chiffonade, and extra virgin olive oil.

Main Courses:
- Truffle Butter Tagliolini: House-made egg noodles tossed in black truffle butter, finished with shaved fresh black truffles and aged Parmigiano-Reggiano.
- Rosemary Pan-Seared Ribeye: Premium dry-aged ribeye steak seared with rosemary needles, garlic clove, and basted with melted brown butter.

Desserts:
- Venetian Espresso Tiramisu: Espresso-soaked savoiardi sponge biscuits layered under sweet whipped cream mascarpone and dusted heavily with cocoa powder.`,

  japanese: `Appetizers:
- Takoyaki Street Fritters: Batter-fried octopus balls coated with sweet tonkatsu glaze, Japanese Kewpie mayo, shredded nori, and bonito fish flakes.

Main Courses:
- Tonkotsu Char Siu Ramen: Creamy milky pork broth with fresh wheat ramen noodles, rolled tender pork belly slice, roasted nori sheet, bamboo shoots, and a jammy gold soft-boiled egg.
- Torched Wagyu Sushi Nigiri: Seared premium Wagyu beef slices draped over small premium vinegared rice bundles, brushed with sweet soy reduction.

Desserts:
- Matcha Molten Lava Cake: Warm dark green matcha cake with a molten chocolate center, garnished with fresh mint.`,

  green: `Appetizers:
- Golden Avocado beet Handrolls: Crisp seaweed nori filled with ripe avocado, golden beet strips and crunchy cucumber, served with sweet ginger glaze.

Main Courses:
- Smoked Cauliflower Steak: Charred thick cauliflower core wood-smoked, resting on a bed of vivid green herb chimichurri sauce, sprinkled with red pomegranate pearls.
- Woodland Mushroom Risotto: Creamy Arborio rice slow-cooked with fresh chanterelle mushrooms, white wine, and fresh garden sage.

Desserts:
- Mango Coconut Panna Cotta: Silky vegan coconut cream custard topped with a sweet mango coulis puree.`
};

export interface ThemeConfig {
  id: string;
  name: string;
  emoji: string;
  description: string;
  bodyBg: string;
  headerBg: string;
  headerBorder: string;
  headerText: string;
  cardBg: string;
  cardBorder: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accentText: string;
  accentBg: string;
  accentBorder: string;
  buttonPrimary: string;
  buttonSecondary: string;
  badgeBg: string;
  inputBg: string;
  inputBorder: string;
  glowShadow: string;
}

export const theme: ThemeConfig = {
  id: "nordic-sage",
  name: "Nordic Forest Sage",
  emoji: "🌿",
  description: "Relaxed minimal green-tinted atmosphere with soft natural organic tones & leafy cozy vibes.",
  bodyBg: "bg-[#EEF1EE]",
  headerBg: "bg-[#E6ECE8]/95 border-[#CFDCCE] backdrop-blur-md shadow-[0_2px_8px_-3px_rgba(35,83,54,0.06)]",
  headerBorder: "border-[#CFDCCE]",
  headerText: "text-[#1C2C1D]",
  cardBg: "bg-white/95 backdrop-blur-3xl",
  cardBorder: "border-[#CCD7CD] shadow-sm",
  textPrimary: "text-[#1C2C1D]",
  textSecondary: "text-[#4F5B51]",
  textMuted: "text-[#819084]",
  accentText: "text-[#1E4D2B]",
  accentBg: "bg-[#E5EEE9]",
  accentBorder: "border-[#B5CCB9]",
  buttonPrimary: "bg-[#255437] hover:bg-[#1C422B] text-white shadow-sm focus:ring-[#255437]/20",
  buttonSecondary: "bg-[#EAEFEA] hover:bg-[#DEE7DE] border-[#BACCC0] text-[#1C2521]",
  badgeBg: "bg-[#E6F0EA] border-[#BCCFC1] text-[#1E4D2B] font-semibold",
  inputBg: "bg-[#F7FAF8]",
  inputBorder: "border-[#CAD2CD] focus:border-[#255437]/60",
  glowShadow: "shadow-[0_4px_24px_-4px_rgba(37,84,55,0.05)]",
};

export default function App() {
  const [menuText, setMenuText] = useState("");
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showOnlyIncomplete, setShowOnlyIncomplete] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [globalSettings, setGlobalSettings] = useState<GenerationSettings>({
    style: "Bright/Modern",
    imageSize: "1K",
    aspectRatio: "4:3"
  });

  // Modal full preview
  const [previewDish, setPreviewDish] = useState<Dish | null>(null);
  const [historyModalDish, setHistoryModalDish] = useState<Dish | null>(null);

  // Export PDF config settings view
  const [activeView, setActiveView] = useState<"landing" | "studio" | "designer">("landing");

  // ---- Paywall: one-time $19 download unlock (no accounts) ----
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => !!getStoredToken());
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState("");
  const pendingActionRef = useRef<null | (() => void)>(null);

  // Swap watermarked previews for the clean originals after a successful purchase.
  const applyUnlock = async (token: string, projectId: string) => {
    const ids = dishesRef.current.map((d) => d.imageId).filter(Boolean) as string[];
    if (ids.length === 0) return;
    try {
      const clean = await unlockImages(token, projectId, ids);
      setDishes((prev) => {
        const updated = prev.map((d) => (d.imageId && clean[d.imageId] ? { ...d, imageUrl: clean[d.imageId]! } : d));
        saveToLocalStorage(updated);
        return updated;
      });
    } catch (e) {
      console.warn("unlock swap failed", e);
    }
  };

  // Gate an action behind the paywall: run it if unlocked, else open the modal.
  const ensureUnlocked = (action: () => void) => {
    if (isUnlocked) { action(); return; }
    pendingActionRef.current = action;
    setPayError("");
    setPaywallOpen(true);
  };

  const handlePay = async () => {
    setPayLoading(true);
    setPayError("");
    try {
      await startCheckout(); // redirects to Stripe
    } catch (e: any) {
      setPayError(e?.message || "Checkout failed.");
      setPayLoading(false);
    }
  };

  // Handle the return from Stripe Checkout (?paid=1&session_id=...).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("paid") === "1" && params.get("session_id")) {
      (async () => {
        const res = await confirmPayment(params.get("session_id")!);
        if (res.paid && res.token) {
          setStoredToken(res.token);
          setIsUnlocked(true);
          await applyUnlock(res.token, res.projectId || getProjectId());
          setActiveView("designer");
        }
        window.history.replaceState({}, "", window.location.pathname);
      })();
    }
  }, []);
  const [exportTheme, setExportTheme] = useState<"dark" | "light">("light"); // Default to light printable for Nordic Sage
  const [exportOnlyFullyGenerated, setExportOnlyFullyGenerated] = useState(false);
  const [exportPaperSize, setExportPaperSize] = useState<"a4" | "letter">("a4");
  const [exportOrientation, setExportOrientation] = useState<"landscape" | "portrait">("portrait");
  const [exportFormat, setExportFormat] = useState<"presentation" | "menu">("menu");
  const [exportStyleTemplate, setExportStyleTemplate] = useState<"classic" | "minimalist" | "cozy" | "dark_chic" | "asian_fusion" | "retro_vintage" | "kids_menu" | "gastro_pub" | "michelin_star">("classic");
  const [restaurantName, setRestaurantName] = useState("L'Étoile Bistro");
  const [restaurantTagline, setRestaurantTagline] = useState("Artisanal French Cuisine & Fine Dining");
  const [showPageNumbers, setShowPageNumbers] = useState(true);
  const [brandStyles, setBrandStyles] = useState<BrandStyles>({
    restaurantName: { fontSize: "22px", fontWeight: "bold", fontFamily: "serif", color: "" },
    restaurantTagline: { fontSize: "11px", fontWeight: "normal", fontFamily: "sans", color: "" },
    category: { fontSize: "10px", fontWeight: "bold", fontFamily: "mono", color: "" },
    dishName: { fontSize: "13px", fontWeight: "bold", fontFamily: "serif", color: "" },
    dishPrice: { fontSize: "12px", fontWeight: "bold", fontFamily: "mono", color: "" },
    dishDescription: { fontSize: "9.5px", fontWeight: "normal", fontFamily: "sans", color: "" },
    dishIngredients: { fontSize: "8.5px", fontWeight: "normal", fontFamily: "sans", color: "" }
  });
  
  // Staging state for sequential batch regeneration of dishes
  const [isRegeneratingAll, setIsRegeneratingAll] = useState(false);
  const [currentRegenIndex, setCurrentRegenIndex] = useState(-1);

  // Quick staging edit prompt state
  const [editPromptValue, setEditPromptValue] = useState("");
  const [isEditingImageId, setIsEditingImageId] = useState<string | null>(null);
  const [openCurrencyDropdownId, setOpenCurrencyDropdownId] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<{ id: string; field: string } | null>(null);

  // Drag-and-drop reordering state and handlers for Active Dishes Card Deck
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);

  const handleCardDragStart = (e: React.DragEvent, id: string) => {
    setDraggedCardId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  };

  const handleCardDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleCardDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedCardId || draggedCardId === targetId) return;

    setDishes((prev) => {
      const updated = [...prev];
      const sourceIdx = updated.findIndex((d) => d.id === draggedCardId);
      const targetIdx = updated.findIndex((d) => d.id === targetId);
      
      if (sourceIdx !== -1 && targetIdx !== -1) {
        const [movedItem] = updated.splice(sourceIdx, 1);
        updated.splice(targetIdx, 0, movedItem);
      }
      return updated;
    });
  };

  const handleCardDragEnd = () => {
    setDraggedCardId(null);
  };

  const handleCopyText = (id: string, field: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField({ id, field });
    setTimeout(() => {
      setCopiedField(null);
    }, 2000);
  };

  const [isExportingZip, setIsExportingZip] = useState(false);

  const handleDownloadProjectArchive = async () => {
    if (dishes.length === 0) {
      alert("No items to export yet! Please add or generate dishes first.");
      return;
    }
    setIsExportingZip(true);
    try {
      const zip = new JSZip();

      // 1. Text Summary File
      let textSummary = `========================================================\n`;
      textSummary += `       RESTAURANT MENU COMPOSITION & SPECIFICATIONS\n`;
      textSummary += `========================================================\n\n`;
      textSummary += `Generated on: ${new Date().toLocaleString()}\n`;
      textSummary += `Total Dishes Loaded: ${dishes.length}\n\n`;

      const categories = Array.from(new Set(dishes.map((d) => d.category || "Main Courses"))) as string[];
      for (const cat of categories) {
        textSummary += `\n--------------------------------------------------------\n`;
        textSummary += `  ${cat.toUpperCase()}\n`;
        textSummary += `--------------------------------------------------------\n\n`;

        const catDishes = dishes.filter((d) => (d.category || "Main Courses") === cat);
        for (const item of catDishes) {
          const priceStr = item.price !== undefined ? getFormattedPriceWithSymbol(item) : "N/A";
          textSummary += `DISH NAME:   ${item.name}\n`;
          textSummary += `PRICE:       ${priceStr} (${item.currency || "USD"})\n`;
          textSummary += `INGREDIENTS: ${item.keyIngredients ? item.keyIngredients.join(", ") : ""}\n`;
          textSummary += `GOURMET DESCRIPTION:\n${item.description || "No description generated yet."}\n\n`;
          textSummary += `CAMERA STYLING & PLATE COMPOSITION INSTRUCTIONS:\n${item.visualDescription || ""}\n`;
          if (item.imageUrl) {
            textSummary += `IMAGE REF:   images/${item.name.toLowerCase().replace(/[^a-z0-9]/g, "_")}_${item.id}.jpg\n`;
          } else {
            textSummary += `IMAGE REF:   [No photo captured for this item]\n`;
          }
          textSummary += `\n`;
        }
      }
      zip.file("menu_description_and_gourmet_copy.txt", textSummary);

      // 2. Excel-ready sheet (BOM included for accurate UTF-8 Russian/Multi-lingual rendering)
      const headers = ["Category", "Name", "Price", "Currency", "Gourmet Description", "Composition Ingredients", "Camera Plating Instructions", "Image File Name"];
      const csvRows = [
        headers.map(h => `"${h.replace(/"/g, '""')}"`).join(","),
        ...dishes.map(d => {
          const imgFile = d.imageUrl ? `images/${d.name.toLowerCase().replace(/[^a-z0-9]/g, "_")}_${d.id}.jpg` : "";
          return [
            d.category || "Main Course",
            d.name,
            d.price !== undefined ? d.price.toString() : "",
            d.currency || "USD",
            d.description || "",
            d.keyIngredients ? d.keyIngredients.join(", ") : "",
            d.visualDescription || "",
            imgFile
          ].map(cell => `"${(cell || "").replace(/"/g, '""')}"`).join(",");
        })
      ];
      const csvContent = "\uFEFF" + csvRows.join("\n");
      zip.file("menu_data_spreadsheet.csv", csvContent);

      // 3. Images Folder Packing
      const imagesFolder = zip.folder("images");
      if (imagesFolder) {
        for (const d of dishes) {
          if (d.imageUrl) {
            try {
              const res = await fetch(d.imageUrl);
              if (res.ok) {
                const blob = await res.blob();
                const cleanName = d.name.toLowerCase().replace(/[^a-z0-9]/g, "_");
                imagesFolder.file(`${cleanName}_${d.id}.jpg`, blob);
              }
            } catch (err) {
              console.warn("Failed to fetch image for zip download. Proceeding...", err);
            }
          }
        }
      }

      const content = await zip.generateAsync({ type: "blob" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(content);
      link.download = `plateai_menu_designer_pack_${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e: any) {
      alert("Failed to package the designer ZIP package: " + (e?.message || e));
    } finally {
      setIsExportingZip(false);
    }
  };

  const [isExportingImagesZip, setIsExportingImagesZip] = useState(false);

  const handleDownloadAllImagesOnlyZip = async () => {
    const photoDishes = dishes.filter((d) => d.imageUrl);
    if (photoDishes.length === 0) {
      alert("No generated photos found to download! Please generate photos first.");
      return;
    }
    setIsExportingImagesZip(true);
    try {
      const zip = new JSZip();
      for (const d of photoDishes) {
        if (d.imageUrl) {
          try {
            const res = await fetch(d.imageUrl);
            if (res.ok) {
              const blob = await res.blob();
              const cleanName = d.name.toLowerCase().replace(/[^a-z0-9]/g, "_");
              zip.file(`${cleanName}_${d.id}.jpg`, blob);
            }
          } catch (err) {
            console.warn(`Failed to fetch image for "${d.name}". Proceeding...`, err);
          }
        }
      }

      const content = await zip.generateAsync({ type: "blob" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(content);
      link.download = `plateai_highres_photos_${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e: any) {
      alert("Failed to package the photos ZIP archive: " + (e?.message || e));
    } finally {
      setIsExportingImagesZip(false);
    }
  };

  // Details AI generation loading states
  const [generatingDetails, setGeneratingDetails] = useState<Record<string, boolean>>({});

  // Parse server log console messages for visual feedback
  const [stylistLogs, setStylistLogs] = useState<string[]>([]);
  const [loadingMassage, setLoadingMessage] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dishesRef = useRef<Dish[]>([]);

  // Keep dishesRef up to date across asynchronous loops
  useEffect(() => {
    dishesRef.current = dishes;
  }, [dishes]);

  // Load state from local storage on startup
  useEffect(() => {
    const savedDishes = localStorage.getItem("virtual_photographer_dishes");
    const savedMenu = localStorage.getItem("virtual_photographer_menu_text");
    const savedSettings = localStorage.getItem("virtual_photographer_settings");

    if (savedDishes) {
      try {
        setDishes(JSON.parse(savedDishes));
      } catch (e) {
        console.error("Error loading local storage dishes", e);
      }
    }
    if (savedMenu) {
      setMenuText(savedMenu);
    } else {
      setMenuText(MENU_PRESETS.italian); // Default preset setup
    }
    if (savedSettings) {
      try {
        setGlobalSettings(JSON.parse(savedSettings));
      } catch (e) {}
    }
  }, []);

  const debounceSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync dishes and menu text with local storage
  const saveToLocalStorage = (updatedDishes: Dish[]) => {
    if (debounceSaveTimeoutRef.current) {
      clearTimeout(debounceSaveTimeoutRef.current);
      debounceSaveTimeoutRef.current = null;
    }
    localStorage.setItem("virtual_photographer_dishes", JSON.stringify(updatedDishes));
  };

  const saveToLocalStorageDebounced = (updatedDishes: Dish[]) => {
    if (debounceSaveTimeoutRef.current) {
      clearTimeout(debounceSaveTimeoutRef.current);
    }
    debounceSaveTimeoutRef.current = setTimeout(() => {
      localStorage.setItem("virtual_photographer_dishes", JSON.stringify(updatedDishes));
      debounceSaveTimeoutRef.current = null;
    }, 1000); // 1-second debounce delay to save manual edits
  };

  // Clean up pending timers on unmount
  useEffect(() => {
    return () => {
      if (debounceSaveTimeoutRef.current) {
        clearTimeout(debounceSaveTimeoutRef.current);
      }
    };
  }, []);

  const handleUpdateMenuText = (val: string) => {
    setMenuText(val);
    localStorage.setItem("virtual_photographer_menu_text", val);
  };

  const handleUpdateSettings = (settings: Partial<GenerationSettings>) => {
    const updated = { ...globalSettings, ...settings };
    setGlobalSettings(updated);
    localStorage.setItem("virtual_photographer_settings", JSON.stringify(updated));
  };

  // Preset Selection
  const loadPreset = (key: keyof typeof MENU_PRESETS) => {
    handleUpdateMenuText(MENU_PRESETS[key]);
  };

  // DRAG & DROP FOR MANUAL FILE SELECTION
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      readMenuFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      readMenuFile(e.target.files[0]);
    }
  };

  const readMenuFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text === "string" && text.trim()) {
        handleUpdateMenuText(text);
      }
    };
    reader.readAsText(file);
  };

  // PARSER ACTION CALL
  const parseMenu = async () => {
    if (!menuText.trim()) return;
    setIsParsing(true);
    setParseError("");
    setStylistLogs(["Consulting head culinary director...", "Analyzing kitchen vocabulary..."]);

    const interval = setInterval(() => {
      const logs = [
        "Staging dish categories...",
        "Evaluating plating contrast...",
        "Configuring garnish highlights...",
        "Finalizing creative metadata...",
        "Serving digital table setup..."
      ];
      setStylistLogs((prev) => {
        if (prev.length < 5) {
          return [...prev, logs[prev.length - 2]];
        }
        return prev;
      });
    }, 900);

    try {
      const res = await fetch("/api/menu/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menuText }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to process query.");
      }

      const data = await res.json();
      if (data.dishes && Array.isArray(data.dishes)) {
        const parsedDishes: Dish[] = data.dishes.map((d: any, index: number) => ({
          id: `parsed-${Date.now()}-${index}`,
          name: d.name,
          category: d.category || "Main Course",
          description: d.description,
          keyIngredients: d.keyIngredients || [],
          visualDescription: d.visualDescription || "Masterfully plated, studio lighting",
          history: [],
          historyIndex: -1,
          price: d.price !== undefined ? d.price : undefined,
          currency: d.currency || "USD"
        }));
        setDishes(parsedDishes);
        saveToLocalStorage(parsedDishes);
      } else {
        throw new Error("No structured dishes returned from semantic parse.");
      }
    } catch (e: any) {
      setParseError(e.message || "An exception occurred parsing your text menu.");
    } finally {
      clearInterval(interval);
      setIsParsing(false);
      setStylistLogs([]);
    }
  };

  // UDPATE A DETAILED COMPONENT ELEMENT IN THE DATABASE
  const handleUpdateDishField = (id: string, field: string, value: any) => {
    setDishes((prev) => {
      const updated = prev.map((d) => {
        if (d.id === id) {
          const nextDish = { ...d, [field]: value };
          if (field === "keyIngredients") {
            delete nextDish.ingredientsText;
          }
          return nextDish;
        }
        return d;
      });
      saveToLocalStorageDebounced(updated);
      return updated;
    });
  };

  // GENERATE OR REGENERATE PROFESSIONAL CHEF DESCRIPTION AND COMPOSITIONS
  const handleGenerateDetails = async (id: string) => {
    const target = dishesRef.current.find((d) => d.id === id);
    if (!target) return;

    setGeneratingDetails((prev) => ({ ...prev, [id]: true }));
    try {
      const res = await fetch("/api/menu/generate-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: target.name,
          category: target.category,
          menuContext: menuText,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to synthesize dish details.");
      }

      const data = await res.json();
      if (data.description || data.keyIngredients) {
        setDishes((prev) => {
          const updated = prev.map((d) =>
            d.id === id
              ? {
                  ...d,
                  description: data.description || d.description,
                  keyIngredients: data.keyIngredients || d.keyIngredients,
                  error: "",
                }
              : d
          );
          saveToLocalStorage(updated);
          return updated;
        });
      }
    } catch (e: any) {
      setDishes((prev) => {
        const updated = prev.map((d) =>
          d.id === id ? { ...d, error: `Details generation failed: ${e.message}` } : d
        );
        saveToLocalStorage(updated);
        return updated;
      });
    } finally {
      setGeneratingDetails((prev) => ({ ...prev, [id]: false }));
    }
  };

  // IMAGE GENERATOR CAPTURE ACTION
  const generateDishPhoto = async (dishId: string) => {
    const target = dishesRef.current.find((d) => d.id === dishId);
    if (!target) return;

    // Update state to loading
    setDishes((prev) =>
      prev.map((d) => (d.id === dishId ? { ...d, isLoading: true, error: "" } : d))
    );

    try {
      const response = await fetch("/api/image/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: target.name,
          visualDescription: target.visualDescription,
          style: globalSettings.style,
          imageSize: globalSettings.imageSize,
          aspectRatio: globalSettings.aspectRatio
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Generation engine failed to respond.");
      }

      const data = await response.json();
      
      setDishes((prev) => {
        const updated = prev.map((d) => {
          if (d.id === dishId) {
            const hist = d.history ? [...d.history] : [];
            // Save original image in history first if introducing a new one
            if (d.imageUrl) {
              hist.push(d.imageUrl);
            }
            return {
              ...d,
              imageUrl: data.imageUrl,
              imageId: data.imageId,
              isLoading: false,
              usingFallback: data.usingFallback,
              fallbackModel: data.fallbackModel,
              history: hist,
              historyIndex: hist.length // point to current image
            };
          }
          return d;
        });
        saveToLocalStorage(updated);
        return updated;
      });
    } catch (e: any) {
      setDishes((prev) => {
        const updated = prev.map((d) => (d.id === dishId ? { ...d, isLoading: false, error: e.message } : d));
        saveToLocalStorage(updated);
        return updated;
      });
    }
  };

  // SEQUENTIALLY REGENERATE ALL DISHES WITH STABLE REF ACCESS
  const handleRegenerateAll = async () => {
    const listLength = dishesRef.current.length;
    if (listLength === 0 || isRegeneratingAll) return;

    if (!window.confirm(`This will sequentially regenerate fresh photographs for all ${listLength} dishes using your current settings. Proceed?`)) {
      return;
    }

    setIsRegeneratingAll(true);
    try {
      for (let i = 0; i < dishesRef.current.length; i++) {
        setCurrentRegenIndex(i);
        const targetDishKey = dishesRef.current[i]?.id;
        if (targetDishKey) {
          await generateDishPhoto(targetDishKey);
        }
      }
    } catch (err) {
      console.error("Batch regeneration error:", err);
    } finally {
      setIsRegeneratingAll(false);
      setCurrentRegenIndex(-1);
    }
  };

  // EDIT THE GENERATED IMAGE VIA CHAT MODIFIER (GEMINI 3.1 FLASH IMAGE)
  const applyImageRevision = async (dishId: string) => {
    const target = dishes.find((d) => d.id === dishId);
    if (!target || !target.imageUrl || !editPromptValue.trim()) return;

    setIsEditingImageId(dishId);
    setLoadingMessage("Tuning camera and editing digital glaze...");

    try {
      const response = await fetch("/api/image/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          base64Image: target.imageUrl,
          editPrompt: editPromptValue,
          imageSize: globalSettings.imageSize,
          aspectRatio: globalSettings.aspectRatio
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to modify image.");
      }

      const data = await response.json();

      setDishes((prev) => {
        const updated = prev.map((d) => {
          if (d.id === dishId) {
            const currentHist = d.history ? [...d.history] : [];
            // Add current before updating
            currentHist.push(d.imageUrl!);
            
            return {
              ...d,
              imageUrl: data.imageUrl,
              imageId: data.imageId,
              history: currentHist,
              historyIndex: currentHist.length // index of the updated image
            };
          }
          return d;
        });
        saveToLocalStorage(updated);
        return updated;
      });

      setEditPromptValue("");
    } catch (error: any) {
      alert("Error styling image: " + error.message);
    } finally {
      setIsEditingImageId(null);
      setLoadingMessage("");
    }
  };

  // UNDO / HISTORICAL LOOKBACK FOR DISH IMAGE
  const rollbackImage = (dishId: string) => {
    setDishes((prev) => {
      const updated = prev.map((d) => {
        if (d.id === dishId && d.history && d.history.length > 0) {
          const prevHist = [...d.history];
          const previousImage = prevHist.pop(); // get last saved item
          return {
            ...d,
            imageUrl: previousImage,
            history: prevHist,
            historyIndex: prevHist.length - 1
          };
        }
        return d;
      });
      saveToLocalStorage(updated);
      return updated;
    });
  };

  // RESTORE SPECIFIC HISTORICAL DISH IMAGE VERSION
  const restoreDishHistoryVersion = (dishId: string, targetVersionUrl: string) => {
    setDishes((prev) => {
      const updated = prev.map((d) => {
        if (d.id === dishId) {
          const hist = d.history ? [...d.history] : [];
          const currentImg = d.imageUrl;
          
          if (hist.includes(targetVersionUrl)) {
            // Push currently active image into history if not already there
            if (currentImg && !hist.includes(currentImg)) {
              hist.push(currentImg);
            }
            // Remove target restored image from history as it's now current main active image
            const finalHist = hist.filter((img) => img !== targetVersionUrl);
            
            return {
              ...d,
              imageUrl: targetVersionUrl,
              history: finalHist,
              historyIndex: finalHist.length
            };
          }
        }
        return d;
      });
      saveToLocalStorage(updated);
      
      // Keep state in-sync for the interactive open modal
      const updatedDishObj = updated.find((d) => d.id === dishId);
      if (updatedDishObj) {
        setHistoryModalDish(updatedDishObj);
      }
      return updated;
    });
  };

  // Manual Visual Instruction change
  const handleVisualInstructionChange = (id: string, text: string) => {
    setDishes((prev) => {
      const updated = prev.map((d) => (d.id === id ? { ...d, visualDescription: text } : d));
      saveToLocalStorageDebounced(updated);
      return updated;
    });
  };

  // Clear state completely to start clean
  const clearAllDishes = () => {
    if (window.confirm("Clear all loaded dishes from memory?")) {
      setDishes([]);
      localStorage.removeItem("virtual_photographer_dishes");
    }
  };

  // Categories set
  const categories = ["All", ...Array.from(new Set(dishes.map((d) => d.category)))];

  const checkIsDishIncomplete = (d: Dish) => {
    const isPriceMissingByVal = d.price === undefined || d.price === null || isNaN(d.price) || d.price <= 0;
    const isCategoryMissingByVal = !d.category || !d.category.trim();
    const isNameMissingByVal = !d.name || !d.name.trim();
    return isPriceMissingByVal || isCategoryMissingByVal || isNameMissingByVal;
  };

  const incompleteDishesCount = dishes.filter(checkIsDishIncomplete).length;
  const totalDishes = dishes.length;
  const completedPhotos = dishes.filter((d) => d.imageUrl).length;
  const waitingPhotos = dishes.filter((d) => !d.imageUrl).length;

  const initialFiltered = selectedCategory === "All" ? dishes : dishes.filter((d) => d.category === selectedCategory);
  const tempFiltered = showOnlyIncomplete ? initialFiltered.filter(checkIsDishIncomplete) : initialFiltered;
  const filteredDishes = tempFiltered.filter((d) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    const nameMatch = d.name?.toLowerCase().includes(query) ?? false;
    const ingredientsMatch = d.keyIngredients?.some((ing) => ing.toLowerCase().includes(query)) ?? false;
    return nameMatch || ingredientsMatch;
  });

  return (
    <div className={`min-h-screen ${theme.bodyBg} ${theme.textSecondary} font-sans selection:bg-[#255437] selection:text-white antialiased transition-all duration-300`}>
      {/* GLORIOUS NORDIC SAGE HEADER */}
      {activeView !== "landing" && (
        <header className={`border-b ${theme.headerBorder} ${theme.headerBg} sticky top-0 z-40 transition-all duration-300`}>
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div onClick={() => setActiveView("landing")} title="Back to home" className="flex items-center gap-3.5 cursor-pointer">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-tr from-[#1E4D2B] via-[#255437] to-[#3B664C] flex items-center justify-center text-[#EAF2EB] shadow-md shadow-[#1E4D2B]/10 group relative overflow-hidden transition-all duration-300 hover:scale-105 border border-[#BACCC0]/40">
              <svg viewBox="0 0 24 24" className="h-6 w-6 stroke-[#EAF2EB] fill-none stroke-[2]" xmlns="http://www.w3.org/2000/svg">
                {/* Platter base */}
                <path d="M3 16h18" strokeLinecap="round" />
                {/* Elegant underplate base */}
                <path d="M6 19c3 1.5 9 1.5 12 0" strokeLinecap="round" opacity="0.8" />
                {/* Cloche dome */}
                <path d="M5 16a7 7 0 0 1 14 0" strokeLinecap="round" />
                {/* Top handle ball */}
                <circle cx="12" cy="8" r="1.5" fill="#EAF2EB" />
                {/* Spark / Shine of pristine presentation */}
                <path d="M12 3v2M9.5 4.5l1 1M14.5 4.5l-1 1" strokeLinecap="round" opacity="0.9" />
              </svg>
            </div>
            <div>
              <h1 className={`text-xl font-display font-extrabold tracking-tight ${theme.textPrimary} flex items-center gap-2.5 transition-colors`}>
                <span>PLATE<span className="text-[#255437] underline underline-offset-4 decoration-2">AI</span></span>
                <span className="px-2.5 py-0.5 bg-[#DEE7DE] border border-[#CFDCCE] text-[9px] rounded uppercase tracking-widest text-[#235336] font-mono font-bold shadow-xs">
                  FOOD MENU STUDIO
                </span>
              </h1>
              <p className="text-xs text-[#5C6E5F]">
                Transform plain-text restaurant menus into high-end, realistic organic food photography representations.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-[#E1EAE4]/60 p-1 rounded-xl border border-[#CFDCCE] shadow-inner">
              <button
                onClick={() => setActiveView("studio")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition duration-200 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeView === "studio"
                    ? "bg-[#255437] text-white shadow-xs"
                    : "text-[#4F5B51] hover:text-[#1C2C1D]"
                }`}
              >
                <Camera className="h-3.5 w-3.5" />
                Staging Studio
              </button>
              {dishes.length > 0 && (
                <button
                  onClick={() => {
                    setActiveView("designer");
                  }}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition duration-200 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    activeView === "designer"
                      ? "bg-[#255437] text-white shadow-xs"
                      : "text-[#4F5B51] hover:text-[#1C2C1D]"
                  }`}
                >
                  <Palette className="h-3.5 w-3.5" />
                  Print & Slide Designer
                </button>
              )}
            </div>

            {dishes.length > 0 && (
              <button
                onClick={clearAllDishes}
                className={`text-xs flex items-center gap-1.5 px-3 py-2.5 rounded-xl border ${theme.buttonSecondary} transition duration-155 cursor-pointer`}
                title="Clear Database"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear Deck
              </button>
            )}
          </div>
        </div>
      </header>
      )}

      {/* CORE WORKSPACE */}
      <main className={`${activeView === "landing" ? "max-w-none px-0 py-0 sm:px-0 lg:px-0" : "max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8"}`}>
        {activeView === "landing" ? (
          <PromoLandingPage
            onStartCreating={(presetKey) => {
              if (presetKey && (presetKey === "italian" || presetKey === "japanese" || presetKey === "green")) {
                loadPreset(presetKey as any);
              }
              setActiveView("studio");
            }}
            brandStyles={brandStyles}
          />
        ) : activeView === "studio" ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT PANEL: MENU SOURCE INPUT & STENCIL IMPORT (4 COLS) */}
          <section className="lg:col-span-4 space-y-6">
            <div id="deck_importer_card" className={`${theme.cardBg} border ${theme.cardBorder} rounded-2xl p-5 space-y-4 transition-all duration-300`}>
              <div className="flex justify-between items-center">
                <div className={`flex items-center gap-2 ${theme.accentText} font-display font-medium text-sm tracking-wide uppercase transition-colors`}>
                  <FileText className="h-4 w-4" />
                  1. Menu Parser
                </div>
                <span className={`text-[10px] font-mono ${theme.textMuted} uppercase`}>Input</span>
              </div>

              {/* QUICK LOADER PRESETS CONTAINER */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase tracking-widest text-[#5C6E5F] font-extrabold block">
                  Quick Culinary Presets:
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => loadPreset("italian")}
                    className={`text-[11px] py-1.5 px-1 bg-[#EEF1EE]/60 border ${theme.inputBorder} rounded-xl hover:bg-[#E1EAE4] hover:border-[#BACCC0] text-[#1C2C1D] font-bold transition cursor-pointer`}
                  >
                    🇮🇹 Tuscan
                  </button>
                  <button
                    onClick={() => loadPreset("japanese")}
                    className={`text-[11px] py-1.5 px-1 bg-[#EEF1EE]/60 border ${theme.inputBorder} rounded-xl hover:bg-[#E1EAE4] hover:border-[#BACCC0] text-[#1C2C1D] font-bold transition cursor-pointer`}
                  >
                    🇯🇵 Tokyo
                  </button>
                  <button
                    onClick={() => loadPreset("green")}
                    className={`text-[11px] py-1.5 px-1 bg-[#E1EAE4] border-[#B5CCB9] border rounded-xl hover:bg-[#BACCC0] text-[#1E4D2B] font-extrabold transition cursor-pointer`}
                  >
                    🌿 Green
                  </button>
                </div>
              </div>

              {/* FILE UPLOAD DRAG/DROP STENCIL */}
              <div
                className={`border border-dashed rounded-xl p-4 text-center cursor-pointer transition relative ${
                  dragActive ? "border-[#255437] bg-[#255437]/10" : `${theme.inputBorder} ${theme.inputBg} hover:border-[#255437]/40`
                }`}
                onDragOver={handleDrag}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept=".txt,.md,.json"
                  onChange={handleFileSelect}
                />
                
                <Upload className="h-5 w-5 text-[#235336] mx-auto mb-2" />
                <p className={`text-xs font-medium ${theme.textPrimary}`}>
                  Drag & Drop Menu File (.txt, .md)
                </p>
                <p className="text-[10px] text-slate-500 mt-1">Or click to search local files</p>
              </div>

              {/* TEXT AREA INPUT */}
              <div className="space-y-1.5">
                <textarea
                  value={menuText}
                  onChange={(e) => handleUpdateMenuText(e.target.value)}
                  placeholder="Paste raw menu text or lists here..."
                  rows={14}
                  className={`w-full text-sm ${theme.inputBg} border ${theme.inputBorder} rounded-xl p-3 ${theme.textPrimary} placeholder:text-slate-500 focus:outline-none focus:border-[#255437] transition font-sans resize-y`}
                  id="user_menu_textarea"
                />
              </div>

              {/* HEAVY TRIGGER SUBMIT BUTTON */}
              <button
                onClick={parseMenu}
                disabled={isParsing || !menuText.trim()}
                className={`w-full py-3 px-4 ${theme.buttonPrimary} font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition duration-200 cursor-pointer`}
                id="parse_menu_btn"
              >
                {isParsing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Analysing Gastronomy...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Parse & Stage Menu Items
                  </>
                )}
              </button>

              {parseError && (
                <div className="p-3 bg-red-950/20 border border-red-900/30 rounded-xl flex items-start gap-2.5">
                  <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-red-300 font-mono leading-relaxed">{parseError}</p>
                </div>
              )}
            </div>

            {/* ARTISTIC CULINARY LOGS */}
            {isParsing && stylistLogs.length > 0 && (
              <div className={`${theme.cardBg} border ${theme.cardBorder} rounded-2xl p-4 space-y-2 font-mono text-[11px] transition-all`}>
                <h3 className={`text-[10px] ${theme.textMuted} uppercase tracking-widest font-bold`}>Steward Visual Logs</h3>
                <div className={`space-y-1 ${theme.textSecondary}`}>
                  {stylistLogs.map((log, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <span className="text-[#255437]">✔</span>
                      <span>{log}</span>
                    </div>
                  ))}
                  <div className="flex gap-2 items-center text-[#255437]/70 animate-pulse">
                    <span className="text-[#255437]">▶</span>
                    <span>Staging beautiful culinary shadows...</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* INSTRUCTION CARD FOR CAMERA RULES */}
            <div className={`border ${theme.cardBorder} rounded-xl p-4 bg-black/5 space-y-2 text-xs`}>
              <div className={`flex items-center gap-2 ${theme.textPrimary} font-medium`}>
                <Info className="h-4 w-4 text-[#255437] shrink-0" />
                <span>Tips for high fidelity photography</span>
              </div>
              <ul className={`space-y-1.5 ${theme.textSecondary} pl-6 list-disc`}>
                <li>Pick the right style toggle to fit your restaurant ambiance.</li>
                <li>Edit the pre-filled <strong className="text-slate-700">Staging prompt</strong> inside each food card of a parsed item to change plates, background materials, or side garnishes.</li>
                <li>Write precise revisions like <em className="text-[#1E4D2B] font-semibold">"add coarse sea salt flakes and raw thyme"</em> on any generated image to modify it seamlessly.</li>
              </ul>
            </div>
          </section>
 
          {/* RIGHT PANEL: INTERACTIVE CANVAS & PHOTO DISH GRID (8 COLS) */}
          <section className="lg:col-span-8 space-y-6">
            
            {/* GLOBAL PHOTOGRAPHY SETTINGS CARD */}
            <div id="photography_presets_card" className={`${theme.cardBg} border ${theme.cardBorder} rounded-2xl p-5 space-y-4 transition-all`}>
              <div className={`flex items-center justify-between border-b ${theme.cardBorder} pb-3`}>
                <div className="flex items-center gap-2">
                  <Utensils className="h-4 w-4 text-[#255437]" />
                  <h2 className={`text-sm font-display font-medium uppercase ${theme.textPrimary} tracking-wider`}>
                    2. Studio Environment Control
                  </h2>
                </div>
                <span className={`text-[10px] font-mono ${theme.textMuted} uppercase`}>Interactive Setup</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                
                {/* STYLE TOGGLE SELECTORS */}
                <div className="md:col-span-6 space-y-2">
                  <label className={`text-xs font-medium ${theme.textSecondary} block`}>
                    Photographic Theme Style:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["Rustic/Dark", "Bright/Modern", "Social Media"] as FoodPhotoStyle[]).map((st) => (
                      <button
                        key={st}
                        onClick={() => handleUpdateSettings({ style: st })}
                        className={`text-xs py-2 px-1 rounded-xl border text-center transition flex flex-col justify-center items-center gap-1 cursor-pointer ${
                          globalSettings.style === st
                            ? `${theme.accentBg} ${theme.accentBorder} ${theme.accentText} font-medium`
                            : `${theme.inputBg} ${theme.inputBorder} ${theme.textSecondary} hover:border-slate-500`
                        }`}
                      >
                        <span className="text-[10px] font-mono leading-none">{st === "Social Media" ? "Top-Down" : st.split("/")[0]}</span>
                        <span className="text-[9px] text-slate-500 uppercase tracking-widest">{st === "Social Media" ? "FlatLay" : st.split("/")[1] || "Modern"}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* RESOLUTION SELECTOR (REQUIRED) */}
                <div className="md:col-span-3 space-y-2">
                  <label className={`text-xs font-medium ${theme.textSecondary} block`}>
                    Resolution Level:
                  </label>
                  <select
                    value={globalSettings.imageSize}
                    onChange={(e) => handleUpdateSettings({ imageSize: e.target.value as ImageSize })}
                    className={`w-full text-xs ${theme.inputBg} border ${theme.inputBorder} rounded-xl p-2.5 ${theme.textSecondary} focus:outline-none focus:border-[#255437]`}
                  >
                    <option value="1K">1K Standard (Fast)</option>
                    <option value="2K">2K Quad-HD (Premium)</option>
                    <option value="4K">4K Ultimate precision</option>
                  </select>
                </div>

                {/* ASPECT RATIO */}
                <div className="md:col-span-3 space-y-2">
                  <label className={`text-xs font-medium ${theme.textSecondary} block`}>
                    Aspect Ratio:
                  </label>
                  <select
                    value={globalSettings.aspectRatio}
                    onChange={(e) => handleUpdateSettings({ aspectRatio: e.target.value as AspectRatio })}
                    className={`w-full text-xs ${theme.inputBg} border ${theme.inputBorder} rounded-xl p-2.5 ${theme.textSecondary} focus:outline-none focus:border-[#255437]`}
                  >
                    <option value="4:3">4:3 (Traditional Card)</option>
                    <option value="1:1">1:1 (Square Post)</option>
                    <option value="16:9">16:9 (Landscape Banner)</option>
                    <option value="3:4">3:4 (Portrait Feed)</option>
                  </select>
                </div>

              </div>
            </div>

            {/* ERROR BOUNDARY DISPLAY */}
            {dishes.length === 0 ? (
              <div className={`border ${theme.cardBorder} ${theme.cardBg} rounded-2xl p-12 text-center space-y-4`}>
                <div className={`w-16 h-16 ${theme.inputBg} border ${theme.inputBorder} rounded-full flex items-center justify-center ${theme.textMuted} mx-auto`}>
                  <Utensils className="h-8 w-8 text-[#255437]" />
                </div>
                <div className="space-y-1.5 max-w-md mx-auto">
                  <h3 className={`text-base font-display font-medium ${theme.textPrimary}`}>No dishes on the staging table</h3>
                  <p className={`text-xs ${theme.textMuted} leading-relaxed`}>
                    Paste your menu text on the left hand panel and click "Parse & Stage Menu Items" to run our semantic staging generator.
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    onClick={() => loadPreset("italian")}
                    className={`inline-flex items-center gap-1.5 text-xs ${theme.accentText} font-medium px-4 py-2 bg-slate-900 border ${theme.inputBorder} hover:bg-slate-800 rounded-xl transition cursor-pointer`}
                  >
                    Load Tuscan Trattoria Preset
                    <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* CATEGORIES NAVIGATION MENU BAR */}
                <div className={`flex flex-wrap items-center justify-between gap-4 border-b ${theme.cardBorder} pb-3`}>
                  <div className="flex flex-wrap gap-1.5 items-center">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => {
                          setSelectedCategory(cat);
                          setShowOnlyIncomplete(false);
                        }}
                        className={`text-xs px-3.5 py-1.5 rounded-xl border transition cursor-pointer ${
                          selectedCategory === cat && !showOnlyIncomplete
                            ? `${theme.buttonPrimary} font-bold`
                            : `${theme.inputBg} ${theme.inputBorder} ${theme.textSecondary} hover:border-[#255437]/40`
                        }`}
                      >
                        {cat}
                      </button>
                    ))}

                    {incompleteDishesCount > 0 && (
                      <button
                        onClick={() => {
                          setShowOnlyIncomplete((prev) => !prev);
                          if (!showOnlyIncomplete) {
                            setSelectedCategory("All"); // Reset the category filter to show all incomplete items across categories
                          }
                        }}
                        className={`text-xs px-3.5 py-1.5 rounded-xl border transition cursor-pointer flex items-center gap-1.5 font-bold ${
                          showOnlyIncomplete
                            ? "bg-amber-500 hover:bg-amber-600 text-[#1C2C1D] border-amber-500 shadow-md shadow-amber-500/10"
                            : "bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30"
                        }`}
                        title="Focus solely on items with missing information"
                      >
                        <AlertTriangle className={`h-3.5 w-3.5 ${showOnlyIncomplete ? "text-[#1C2C1D]" : "text-amber-500 animate-pulse"}`} />
                        <span>{incompleteDishesCount} Incomplete</span>
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      disabled={isRegeneratingAll || dishes.length === 0}
                      onClick={handleRegenerateAll}
                      className={`text-xs font-semibold px-4 py-1.5 rounded-xl border flex items-center gap-1.5 transition cursor-pointer ${
                        isRegeneratingAll
                          ? `${theme.inputBg} ${theme.cardBorder} ${theme.textMuted} cursor-not-allowed`
                          : `${theme.inputBg} hover:opacity-95 ${theme.cardBorder} ${theme.textPrimary}`
                      }`}
                    >
                      <RefreshCw className={`h-3.5 w-3.5 text-[#255437] ${isRegeneratingAll ? "animate-spin" : ""}`} />
                      {isRegeneratingAll ? (
                        <span>
                          Regenerating {currentRegenIndex + 1}/{dishes.length}...
                        </span>
                      ) : (
                        <span>Regenerate All</span>
                      )}
                    </button>
                    <button
                      onClick={() => setActiveView("designer")}
                      className={`text-xs font-semibold px-4 py-1.5 rounded-xl ${theme.buttonPrimary} flex items-center gap-1.5 transition cursor-pointer shadow-sm`}
                    >
                      <Download className="h-3.5 w-3.5 stroke-[2.5]" />
                      Export Presentation Deck
                    </button>
                    <span className={`text-[10px] uppercase font-mono tracking-widest ${theme.textMuted}`}>
                      Showing {filteredDishes.length} Items
                    </span>
                  </div>
                </div>

                {/* SEARCH INPUT BAR */}
                <div className="relative flex items-center">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Search className={`h-4 w-4 text-[#255437]/50`} />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search dishes by name or ingredients (e.g. Pasta, Garlic, Cheese)..."
                    className={`w-full text-xs sm:text-sm pl-10 pr-12 py-2.5 rounded-xl border ${theme.inputBorder} ${theme.inputBg} ${theme.textPrimary} focus:outline-none focus:border-[#255437] transition-all duration-300 shadow-sm`}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className={`absolute right-3.5 text-[10px] sm:text-xs font-mono font-bold tracking-widest text-[#255437] hover:opacity-80 transition-opacity bg-[#E6F0EA] px-2 py-0.5 rounded uppercase`}
                      title="Clear Search"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* SUMMARY STATS BAR */}
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Total Dishes Metric */}
                    <div className={`p-3.5 rounded-xl border ${theme.cardBorder} ${theme.cardBg} flex items-center gap-3.5 transition-all duration-300`}>
                      <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-[#255437] rounded-lg shrink-0">
                        <Utensils className="h-4 w-4" />
                      </div>
                      <div>
                        <span className={`text-[10px] uppercase font-mono tracking-wider ${theme.textMuted} block`}>
                          Total Dishes Staged
                        </span>
                        <div className="flex items-baseline gap-1.5">
                          <span className={`text-lg font-bold font-display ${theme.textPrimary}`}>
                            {totalDishes}
                          </span>
                          <span className={`text-[10px] ${theme.textMuted}`}>items</span>
                        </div>
                      </div>
                    </div>

                    {/* Completed Photos Metric */}
                    <div className={`p-3.5 rounded-xl border ${theme.cardBorder} ${theme.cardBg} flex items-center gap-3.5 transition-all duration-300`}>
                      <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-[#255437] rounded-lg shrink-0">
                        <Camera className="h-4 w-4 text-emerald-500" />
                      </div>
                      <div>
                        <span className={`text-[10px] uppercase font-mono tracking-wider ${theme.textMuted} block`}>
                          Completed Photoshoots
                        </span>
                        <div className="flex items-baseline gap-1.5">
                          <span className={`text-lg font-bold font-display ${theme.textPrimary}`}>
                            {completedPhotos}
                          </span>
                          <span className={`text-[10px] text-emerald-500/80 font-semibold`}>
                            {totalDishes > 0 ? Math.round((completedPhotos / totalDishes) * 100) : 0}% ready
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Waiting/Pending Generation Metric */}
                    <div className={`p-3.5 rounded-xl border ${theme.cardBorder} ${theme.cardBg} flex items-center gap-3.5 transition-all duration-300`}>
                      <div className="p-2 bg-amber-500/15 border border-amber-500/25 text-amber-500 rounded-lg shrink-0">
                        <Sparkles className={`h-4 w-4 text-amber-500 ${waitingPhotos > 0 ? "animate-pulse" : ""}`} />
                      </div>
                      <div>
                        <span className={`text-[10px] uppercase font-mono tracking-wider ${theme.textMuted} block`}>
                          Awaiting Photoplate
                        </span>
                        <div className="flex items-baseline gap-1.5">
                          <span className={`text-lg font-bold font-display ${theme.textPrimary}`}>
                            {waitingPhotos}
                          </span>
                          <span className={`text-[10px] ${theme.textMuted}`}>
                            {waitingPhotos > 0 ? "needs generation" : "all captured! ✨"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ZIP Photos Quick Download Banner */}
                  {completedPhotos > 0 && (
                    <div className={`p-2.5 rounded-xl border ${theme.cardBorder} ${theme.cardBg} flex flex-wrap items-center justify-between gap-3 transition-all duration-300`}>
                      <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <p className={`text-xs ${theme.textMuted}`}>
                          You have <strong className={theme.textPrimary}>{completedPhotos} high-resolution photos</strong> ready. Download all photos in one bulk ZIP file.
                        </p>
                      </div>
                      <button
                        onClick={() => ensureUnlocked(handleDownloadAllImagesOnlyZip)}
                        disabled={isExportingImagesZip}
                        className="text-xs font-bold px-4 py-2 rounded-xl bg-[#255437] text-white hover:opacity-90 disabled:opacity-50 transition-all duration-200 flex items-center gap-2 shadow-sm shrink-0 cursor-pointer"
                      >
                        {isExportingImagesZip ? (
                          <>
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            <span>Compressing Photo Archive...</span>
                          </>
                        ) : (
                          <>
                            <Download className="h-3.5 w-3.5" />
                            <span>Download All High-Res Images ({completedPhotos})</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* THE ACTIVE DISHES CARD DECK LIST */}
                <div className="space-y-6">
                  {filteredDishes.map((dish) => {
                    const isImgLoading = dish.isLoading;
                    
                    const isPriceMissing = dish.price === undefined || dish.price === null || isNaN(dish.price) || dish.price <= 0;
                    const isCategoryMissing = !dish.category || !dish.category.trim();
                    const isNameMissing = !dish.name || !dish.name.trim();
                    const isDishIncomplete = isPriceMissing || isCategoryMissing || isNameMissing;

                    const missingFields = [];
                    if (isNameMissing) missingFields.push("Name");
                    if (isCategoryMissing) missingFields.push("Category");
                    if (isPriceMissing) missingFields.push("Price");

                    return (
                      <div
                        key={dish.id}
                        id={`dish_card_${dish.id}`}
                        draggable
                        onDragStart={(e) => handleCardDragStart(e, dish.id)}
                        onDragOver={handleCardDragOver}
                        onDrop={(e) => handleCardDrop(e, dish.id)}
                        onDragEnd={handleCardDragEnd}
                        className={`${theme.cardBg} border ${
                          draggedCardId === dish.id
                            ? "border-emerald-500/50 opacity-45 scale-[0.98] border-dashed"
                            : isDishIncomplete 
                              ? "border-amber-500/50 hover:border-amber-500 shadow-[0_4px_24px_-4px_rgba(245,158,11,0.08)] bg-amber-500/[0.01]" 
                              : `${theme.cardBorder} hover:border-[#255437]/40 ${theme.glowShadow}`
                        } rounded-2xl overflow-hidden transition-all duration-300`}
                      >
                        {isDishIncomplete && (
                          <div className="bg-amber-500/10 border-b border-amber-500/20 px-5 py-2.5 flex items-center justify-between text-xs text-amber-600 dark:text-amber-400 font-semibold animate-fade-in">
                            <div className="flex items-center gap-1.5">
                              <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                              <span>
                                Incomplete Dish Configuration: Missing <span className="font-extrabold underline">{missingFields.join(" & ")}</span>.
                              </span>
                            </div>
                            <span className="text-[10px] uppercase tracking-wider font-bold opacity-85">Required for menu and slidedeck cards</span>
                          </div>
                        )}
                        
                        <div className="flex">
                          {/* Drag handle strip */}
                          <div 
                            className="w-10 shrink-0 flex items-center justify-center border-r border-[#CAD2CD]/20 hover:bg-[#EEF2EF]/40 dark:hover:bg-[#1E2522]/30 text-[#8C9C90] cursor-grab active:cursor-grabbing transition-all group/grip"
                            title="Drag card to reorder"
                          >
                            <GripVertical className="h-5 w-5 opacity-40 group-hover/grip:opacity-100 transition-opacity" />
                          </div>

                          {/* Main contents wrapper */}
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-5 p-5">
                                {/* COLLATERAL PREVIEW (5 COLS IF PHOTO EXISTS, ELSE WHOLE CARD HAS FORM FIELDS) */}
                          <div className="md:col-span-7 space-y-4">
                            {/* Name, Category, Price & Currency row */}
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                               <div className="flex-1 flex gap-2 items-center">
                                <input
                                  type="text"
                                  value={dish.name}
                                  onChange={(e) => handleUpdateDishField(dish.id, "name", e.target.value)}
                                  className={`text-base font-display font-extrabold bg-transparent border-b ${
                                    isNameMissing 
                                      ? "border-amber-500 text-amber-600 focus:border-amber-500 placeholder-amber-400/60" 
                                      : `${theme.textPrimary} ${theme.inputBorder} focus:border-[#255437]`
                                  } py-1 flex-1 focus:outline-none transition-colors`}
                                  placeholder="Dish Name"
                                />
                                <input
                                  type="text"
                                  value={dish.category}
                                  onChange={(e) => handleUpdateDishField(dish.id, "category", e.target.value)}
                                  className={`text-[10px] font-mono font-bold tracking-widest uppercase px-2.5 py-1 rounded w-28 text-center focus:outline-none focus:border-[#255437] border-b ${
                                    isCategoryMissing 
                                      ? "bg-amber-500/15 border-amber-500 text-amber-600 focus:border-amber-500" 
                                      : `${theme.badgeBg}`
                                  }`}
                                  placeholder="Category"
                                />
                                {dish.price !== undefined && Number(dish.price) > 0 && (
                                  <span className={`text-[11px] font-mono font-semibold ${theme.accentText} ${theme.badgeBg} border ${theme.accentBorder} px-2.5 py-1 rounded-lg shrink-0 whitespace-nowrap`}>
                                    {getFormattedPriceWithSymbol(dish)}
                                  </span>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-1.5 self-end sm:self-auto">
                                <span className={`text-xs ${theme.textMuted} font-mono`}>Price:</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  value={dish.price !== undefined ? dish.price : ""}
                                  onChange={(e) => handleUpdateDishField(dish.id, "price", e.target.value ? parseFloat(e.target.value) : undefined)}
                                  className={`w-16 sm:w-20 text-xs font-bold text-center rounded-lg py-1 px-2 focus:outline-none focus:border-[#255437] border-b ${
                                    isPriceMissing 
                                      ? "bg-amber-500/15 border-amber-500 text-amber-600 focus:border-amber-500" 
                                      : `${theme.accentText} ${theme.inputBg} border ${theme.inputBorder}`
                                  }`}
                                  placeholder="0"
                                />
                                <div className="relative">
                                  <button
                                    type="button"
                                    onClick={() => setOpenCurrencyDropdownId(openCurrencyDropdownId === dish.id ? null : dish.id)}
                                    className={`text-xs font-semibold ${theme.textSecondary} ${theme.inputBg} border ${theme.inputBorder} rounded-lg py-1 px-2.5 focus:outline-none focus:border-[#255437] cursor-pointer flex items-center gap-1 min-w-[5.2rem] justify-between transition duration-200`}
                                  >
                                    <span>
                                      {dish.currency || "USD"} ({
                                        (dish.currency || "USD") === "USD" ? "$" :
                                        (dish.currency || "USD") === "EUR" ? "€" :
                                        (dish.currency || "USD") === "RUB" ? "₽" :
                                        (dish.currency || "USD") === "GBP" ? "£" :
                                        "¥"
                                      })
                                    </span>
                                    <svg className={`h-3 w-3 text-slate-400 transition-transform duration-200 ${openCurrencyDropdownId === dish.id ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                                    </svg>
                                  </button>
                                  
                                  {openCurrencyDropdownId === dish.id && (
                                    <>
                                      {/* Click outdoor overlay */}
                                      <div 
                                        className="fixed inset-0 z-40 cursor-default" 
                                        onClick={() => setOpenCurrencyDropdownId(null)}
                                      />
                                      <div className={`absolute right-0 mt-1.5 w-28 rounded-lg shadow-xl border ${theme.cardBorder} ${theme.cardBg} z-50 py-1 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-100`}>
                                        {[
                                          { code: "USD", symbol: "$" },
                                          { code: "EUR", symbol: "€" },
                                          { code: "RUB", symbol: "₽" },
                                          { code: "GBP", symbol: "£" },
                                          { code: "CNY", symbol: "¥" }
                                        ].map((curr) => (
                                          <button
                                            key={curr.code}
                                            type="button"
                                            onClick={() => {
                                              handleUpdateDishField(dish.id, "currency", curr.code);
                                              setOpenCurrencyDropdownId(null);
                                            }}
                                            className={`w-full text-left px-3 py-1.5 text-xs font-medium hover:bg-[#255437] hover:text-white transition duration-150 flex items-center justify-between ${
                                              (dish.currency || "USD") === curr.code ? `bg-[#255437]/10 ${theme.accentText} font-bold` : `${theme.textPrimary}`
                                            }`}
                                          >
                                            <span>{curr.code}</span>
                                            <span className="opacity-60">{curr.symbol}</span>
                                          </button>
                                        ))}
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Gourmet Description with dynamic AI Generation triggers */}
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <label className={`text-xs font-semibold ${theme.textSecondary}`}>Gourmet Description</label>
                                  {dish.description && (
                                    <button
                                      type="button"
                                      onClick={() => handleCopyText(dish.id, "description", dish.description || "")}
                                      className="p-1 hover:bg-[#255437]/10 text-slate-400 hover:text-[#255437] rounded-md transition cursor-pointer flex items-center justify-center"
                                      title="Copy Gourmet Description to clipboard"
                                    >
                                      {copiedField?.id === dish.id && copiedField?.field === "description" ? (
                                        <Check className="h-3.5 w-3.5 text-[#255437]" />
                                      ) : (
                                        <Copy className="h-3.5 w-3.5" />
                                      )}
                                    </button>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleGenerateDetails(dish.id)}
                                  disabled={generatingDetails[dish.id]}
                                  className={`text-[10px] ${theme.accentText} bg-[#255437]/10 hover:bg-[#255437]/20 px-2.5 py-1 rounded-lg flex items-center gap-1 transition disabled:opacity-50 cursor-pointer font-bold border ${theme.accentBorder}`}
                                  title="Regenerate gourmet descriptions with AI"
                                >
                                  <Sparkles className="h-3 w-3" />
                                  {generatingDetails[dish.id] ? "Synthesizing..." : "Regenerate description & ingredients"}
                                </button>
                              </div>
                              <textarea
                                value={dish.description || ""}
                                onChange={(e) => handleUpdateDishField(dish.id, "description", e.target.value)}
                                rows={2}
                                className={`w-full text-xs ${theme.inputBg} border ${theme.inputBorder} rounded-xl p-3 ${theme.textPrimary} focus:outline-none focus:border-[#255437]/60 leading-relaxed`}
                                placeholder="Gourmet description for clients..."
                              />
                            </div>

                            {/* Composition Ingredients */}
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-1.5">
                                <label className={`text-xs font-semibold ${theme.textSecondary}`}>Recipe Composition Ingredients (comma-separated)</label>
                                {dish.keyIngredients && dish.keyIngredients.length > 0 && dish.keyIngredients.join(", ").trim() && (
                                  <button
                                    type="button"
                                    onClick={() => handleCopyText(dish.id, "ingredients", dish.keyIngredients.join(", "))}
                                    className="p-1 hover:bg-[#255437]/10 text-slate-400 hover:text-[#255437] rounded-md transition cursor-pointer flex items-center justify-center"
                                    title="Copy ingredients to clipboard"
                                  >
                                    {copiedField?.id === dish.id && copiedField?.field === "ingredients" ? (
                                      <Check className="h-3.5 w-3.5 text-[#255437]" />
                                    ) : (
                                      <Copy className="h-3.5 w-3.5" />
                                    )}
                                  </button>
                                )}
                              </div>
                              <input
                                type="text"
                                value={dish.keyIngredients ? dish.keyIngredients.join(", ") : ""}
                                onChange={(e) => handleUpdateDishField(dish.id, "keyIngredients", e.target.value.split(",").map((x) => x.trim()))}
                                className={`w-full text-xs font-sans ${theme.inputBg} border ${theme.inputBorder} rounded-xl p-3 ${theme.textPrimary} focus:outline-none focus:border-[#255437]/60`}
                                placeholder="e.g. Herb butter, Sea salt, Pomegranate seeds, Shaved truffle"
                              />
                            </div>

                            {/* PRE-FILLED SENSORY DETAILS FOR THE PLATE */}
                            <div className="space-y-2 pt-1">
                              <div className="flex items-center gap-1.5">
                                <Edit3 className="h-3.5 w-3.5 text-[#255437]" />
                                <span className={`text-xs font-semibold ${theme.textSecondary}`}>Camera Styling Instructions:</span>
                              </div>
                              <textarea
                                value={dish.visualDescription}
                                onChange={(e) => handleVisualInstructionChange(dish.id, e.target.value)}
                                className={`w-full text-xs font-mono ${theme.inputBg} border ${theme.inputBorder} rounded-xl p-3 ${theme.textPrimary} focus:outline-none focus:border-[#255437]/60 leading-relaxed`}
                                rows={2}
                                placeholder="Edit the visual elements, plate colors, garnishing..."
                              />
                            </div>

                            {/* DISH ROOT ACTIONS */}
                            <div className="flex flex-wrap items-center gap-3 pt-3">
                              {dish.imageUrl ? (
                                <button
                                  onClick={() => generateDishPhoto(dish.id)}
                                  disabled={isImgLoading}
                                  className={`py-2.5 px-4 ${theme.buttonSecondary} disabled:opacity-50 text-xs font-medium flex items-center gap-2 transition cursor-pointer rounded-xl`}
                                >
                                  <Camera className="h-3.5 w-3.5" />
                                  Regenerate Setup
                                </button>
                              ) : (
                                <button
                                  onClick={() => generateDishPhoto(dish.id)}
                                  disabled={isImgLoading}
                                  className={`py-2.5 px-5 ${theme.buttonPrimary} rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition cursor-pointer`}
                                >
                                  <Camera className="h-4 w-4 stroke-[2.5]" />
                                  Shoot Dish Photo
                                </button>
                              )}

                              {/* UNDO LINK IF VISIBLE REVISIONS IN HISTORY */}
                              {dish.history && dish.history.length > 0 && (
                                <div className="flex flex-wrap items-center gap-2">
                                  <button
                                    onClick={() => rollbackImage(dish.id)}
                                    className={`text-xs ${theme.textSecondary} hover:bg-black/10 flex items-center gap-1 border ${theme.inputBorder} px-3 py-2 rounded-xl ${theme.inputBg} cursor-pointer transition`}
                                    title="Rollback to previous photo state"
                                  >
                                    <RotateCcw className="h-3.5 w-3.5" />
                                    Undo edit
                                  </button>

                                  <button
                                    onClick={() => setHistoryModalDish(dish)}
                                    className={`text-xs ${theme.textSecondary} hover:bg-black/10 flex items-center gap-1 border ${theme.inputBorder} px-3 py-2 rounded-xl ${theme.inputBg} cursor-pointer transition`}
                                    title="View full generation/edit history"
                                  >
                                    <History className="h-3.5 w-3.5 text-[#255437]" />
                                    View History ({dish.history.length + (dish.imageUrl ? 1 : 0)})
                                  </button>
                                </div>
                              )}
                            </div>
                            
                            {dish.error && (
                              <div className="mt-2 text-[11px] font-mono text-red-400 bg-red-950/20 border border-red-900/30 rounded-xl p-2">
                                Error: {dish.error}
                              </div>
                            )}
                          </div>

                          {/* RIGHT RENDER CANVAS CONTAINER (5 COLS IF IMAGE EXISTS OR IN LOADING STEP) */}
                          <div className="md:col-span-5 flex flex-col justify-center items-center">
                            {/* IF NO PHOTO CAPTURED AND NOT LOADING */}
                            {!dish.imageUrl && !isImgLoading && (
                              <div className={`w-full aspect-4/3 ${theme.inputBg} border ${theme.cardBorder} border-dashed rounded-xl flex flex-col items-center justify-center text-center p-6 space-y-2`}>
                                <div className={`h-10 w-10 rounded-full ${theme.cardBg} border ${theme.cardBorder} flex items-center justify-center ${theme.textMuted}`}>
                                  <Camera className="h-5 w-5" />
                                </div>
                                <span className={`text-xs font-medium ${theme.textSecondary}`}>Ready for photoshoot</span>
                                <span className={`text-[10px] ${theme.textMuted} font-mono`}>
                                  {globalSettings.style} • {globalSettings.imageSize}
                                </span>
                              </div>
                            )}

                            {/* PHOTO BEING SHOT LOADER */}
                            {isImgLoading && (
                              <div className={`w-full aspect-4/3 shimmer-bg rounded-xl border ${theme.cardBorder} flex flex-col items-center justify-center text-center p-6 space-y-3`}>
                                <div className={`h-9 w-9 ${theme.cardBg} rounded-full flex items-center justify-center text-[#255437] border border-[#255437]/20 animate-spin`}>
                                  <RefreshCw className="h-4 w-4" />
                                </div>
                                <div className="space-y-1">
                                  <p className={`text-xs font-medium ${theme.textSecondary} animate-pulse`}>Capturing fine details...</p>
                                  <p className={`text-[10px] ${theme.textMuted} font-mono`}>Using gemini-3-pro-image-preview</p>
                                </div>
                              </div>
                            )}

                            {/* OUTPUT DISPLAY */}
                            {dish.imageUrl && !isImgLoading && (
                              <div className="w-full space-y-3">
                                <div className={`relative group rounded-xl overflow-hidden border ${theme.cardBorder} shadow-xl bg-slate-900/30`}>
                                  
                                  {/* RENDER DYNAMIC IMAGE PREFERENCE */}
                                  <img
                                    src={dish.imageUrl}
                                    alt={dish.name}
                                    referrerPolicy="no-referrer"
                                    className="w-full h-auto object-cover max-h-64 object-center cursor-pointer hover:scale-[1.02] transition duration-300"
                                    onClick={() => setPreviewDish(dish)}
                                  />

                                  {/* UPPER HOVER CONTROLS */}
                                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition duration-200">
                                    <button
                                      onClick={() => setPreviewDish(dish)}
                                      className="p-1.5 bg-slate-950/80 hover:bg-slate-950 border border-slate-800 rounded-lg text-white hover:text-[#BACCC0] transition cursor-pointer"
                                      title="Open Fullscreen HD Preview"
                                    >
                                      <Maximize2 className="h-3.5 w-3.5" />
                                    </button>
                                    <a
                                      href={dish.imageUrl}
                                      download={`${dish.name.toLowerCase().replace(/\s+/g, "_")}_raw.png`}
                                      className="p-1.5 bg-slate-950/80 hover:bg-slate-950 border border-slate-800 rounded-lg text-white hover:text-[#BACCC0] transition cursor-pointer"
                                      title="Download Original file"
                                    >
                                      <Download className="h-3.5 w-3.5" />
                                    </a>
                                  </div>

                                  {/* THE ASPECT RATIO & QUALITY SPEC TAGS */}
                                  <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1 bg-slate-950/80 border border-slate-800 rounded px-2 py-0.5 text-[9px] font-mono text-slate-350">
                                    <span>{globalSettings.style.split("/")[0]}</span>
                                    <span>•</span>
                                    <span>{globalSettings.imageSize}</span>
                                    {dish.usingFallback && (
                                      <>
                                        <span>•</span>
                                        <span className="text-amber-400 font-bold bg-amber-950/40 px-1 rounded border border-amber-900/30">
                                          Fallback: {dish.fallbackModel}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>

                                {/* EDIT CONTAINER LAYOVER (REQUIRED TASK COMPLETED SEAMLESSLY) */}
                                <div className={`space-y-1.5 ${theme.inputBg} p-3 rounded-xl border ${theme.cardBorder}`}>
                                  <div className="flex items-center gap-1.5">
                                    <Wand2 className="h-3.5 w-3.5 text-[#255437]" />
                                    <span className={`text-[11px] font-medium ${theme.textPrimary} block`}>
                                      Prompt-Based Photo Revision Tool:
                                    </span>
                                  </div>
                                  
                                  <div className="flex items-center gap-1.5">
                                    <input
                                      type="text"
                                      value={isEditingImageId === dish.id ? editPromptValue : (isEditingImageId ? "" : editPromptValue)}
                                      onChange={(e) => setEditPromptValue(e.target.value)}
                                      placeholder="E.g. Sprinkle sea salt flakes and raw sage..."
                                      disabled={!!isEditingImageId}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                          applyImageRevision(dish.id);
                                        }
                                      }}
                                      className={`flex-1 text-xs ${theme.cardBg} border ${theme.inputBorder} rounded-lg px-2.5 py-1.5 placeholder:text-slate-500 ${theme.textPrimary} focus:outline-none focus:border-[#255437]`}
                                    />
                                    <button
                                      onClick={() => applyImageRevision(dish.id)}
                                      disabled={!!isEditingImageId || !editPromptValue.trim()}
                                      className={`px-3 py-1.5 ${theme.buttonPrimary} rounded-lg text-xs font-semibold cursor-pointer transition disabled:opacity-50`}
                                    >
                                      {isEditingImageId === dish.id ? (
                                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                      ) : (
                                        <Check className="h-3.5 w-3.5" />
                                      )}
                                    </button>
                                  </div>
                                  
                                  {isEditingImageId === dish.id && (
                                    <span className="text-[9px] font-mono text-[#336B49] animate-pulse block">
                                      {loadingMassage}
                                    </span>
                                  )}
                                  
                                  <span className={`text-[9px] ${theme.textMuted} leading-none block`}>
                                    Edits are processed by gemini-3.1-flash-image-preview
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>

                        </div>
                      </div>
                    </div>
                  );
                })}
                </div>

              </div>
            )}

          </section>

        </div>
      ) : (
        /* DESIGNER VIEW */
        <div className="space-y-6 animate-fade-in">
           {/* DYNAMIC BENTO HERO CARD */}
           <div className={`${theme.cardBg} border ${theme.cardBorder} rounded-2xl p-6 relative flex flex-col md:flex-row justify-between items-center gap-4 ${theme.glowShadow}`}>
              <div className="space-y-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-[#255437]/10 border border-[#255437]/30 flex items-center justify-center text-[#255437]">
                    <Sliders className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className={`text-base font-display font-extrabold ${theme.textPrimary}`}>
                      Print & Presentation Studio Deck
                    </h2>
                    <p className={`text-[11px] font-mono uppercase tracking-wider ${theme.textMuted}`}>WYSIWYG Interactive Workspace</p>
                  </div>
                </div>
                <p className={`text-xs ${theme.textSecondary} mt-2 max-w-2xl leading-relaxed`}>
                   Arrange your menu, edit text inline, then download a print-ready PDF or the full pack.
                </p>
              </div>
              
              {/* Export actions */}
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-[11px] font-semibold text-[#55695A] mr-1 hidden lg:inline">Download&nbsp;→</span>
                <button
                  type="button"
                  onClick={() => ensureUnlocked(() => {
                    try {
                      generatePresentationPDF(dishes, globalSettings, {
                        theme: exportTheme,
                        includeUnphotographed: !exportOnlyFullyGenerated,
                        paperSize: exportPaperSize,
                        orientation: exportOrientation,
                        format: exportFormat,
                        styleTemplate: exportStyleTemplate,
                        restaurantName: restaurantName,
                        restaurantTagline: restaurantTagline,
                        showPageNumbers: showPageNumbers,
                        brandStyles: brandStyles
                      });
                    } catch (error: any) {
                      alert("Failure compiling document: " + (error?.message || error));
                    }
                  })}
                  className={`px-5 py-2 text-xs font-bold ${theme.buttonPrimary} rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-md`}
                >
                  <Printer className="h-3.5 w-3.5" />
                  Export PDF
                </button>
                <button
                  type="button"
                  disabled={isExportingZip}
                  onClick={() => ensureUnlocked(handleDownloadProjectArchive)}
                  className="px-4 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-750 text-white rounded-xl transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shadow-md"
                >
                  <Archive className="h-3.5 w-3.5" />
                  {isExportingZip ? "Packaging…" : "Download ZIP"}
                </button>
              </div>
           </div>

           {/* Wide 2-Column Unified Interactive Designer Workspace */}
           <div className="space-y-4">
             <div className={`${theme.cardBg} border ${theme.cardBorder} rounded-2xl p-5 ${theme.glowShadow}`}>
                <InteractiveDesignerCanvas
                   dishes={dishes}
                   setDishes={setDishes}
                   restaurantName={restaurantName}
                   setRestaurantName={setRestaurantName}
                   restaurantTagline={restaurantTagline}
                   setRestaurantTagline={setRestaurantTagline}
                   exportStyleTemplate={exportStyleTemplate}
                   setExportStyleTemplate={setExportStyleTemplate}
                   exportTheme={exportTheme}
                   setExportTheme={setExportTheme}
                   exportFormat={exportFormat}
                   setExportFormat={setExportFormat}
                   exportOrientation={exportOrientation}
                   setExportOrientation={setExportOrientation}
                   exportPaperSize={exportPaperSize}
                   setExportPaperSize={setExportPaperSize}
                   exportOnlyFullyGenerated={exportOnlyFullyGenerated}
                   setExportOnlyFullyGenerated={setExportOnlyFullyGenerated}
                   brandStyles={brandStyles}
                   setBrandStyles={setBrandStyles}
                   showPageNumbers={showPageNumbers}
                   setShowPageNumbers={setShowPageNumbers}
                   onExportPDF={() => ensureUnlocked(() => {
                     try {
                       generatePresentationPDF(dishes, globalSettings, {
                         theme: exportTheme,
                         includeUnphotographed: !exportOnlyFullyGenerated,
                         paperSize: exportPaperSize,
                         orientation: exportOrientation,
                         format: exportFormat,
                         styleTemplate: exportStyleTemplate,
                         restaurantName: restaurantName,
                         restaurantTagline: restaurantTagline,
                         showPageNumbers: showPageNumbers,
                         brandStyles: brandStyles
                       });
                     } catch (error: any) {
                       alert("Failure compiling document: " + (error?.message || error));
                     }
                   })}
                />
             </div>
             
             <div className="p-4 bg-[#EAF2EB] border border-[#CFDCCE] rounded-xl flex items-start gap-2.5">
               <Info className="h-4 w-4 text-[#255437] shrink-0 mt-0.5" />
               <p className="text-[11px] text-[#4F5B51] leading-relaxed">
                 <strong>Interactive Canvas Workspace:</strong> All configuration controls (Presets, Layout Format, Canvas Spacing, Brand Overrides, and sequence checklist) are unified on the Left Workspace Side-Panel for ultimate comfort and grandmas-friendly clarity. Feel free to drag and drop elements on the Canvas, click directly on text to rewrite, and click re-size options instantly.
               </p>
             </div>
           </div>

         </div>
      )}
      </main>

      {/* FULL HD PREVIEW ZOOM DIALOG / MODAL */}
      {previewDish && (
        <div className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-4">
          <button
            onClick={() => setPreviewDish(null)}
            className="absolute top-4 right-4 p-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-full transition cursor-pointer"
          >
            ✕
          </button>

          <div className="max-w-4xl w-full flex flex-col items-center gap-4">
            <div className="text-center">
              <span className="text-[10px] font-mono uppercase bg-[#255437]/30 text-[#BACCC0] border border-[#255437]/40 px-2.5 py-0.5 rounded-full">
                {previewDish.category}
              </span>
              <h2 className="text-xl font-display font-medium text-white mt-1.5">{previewDish.name}</h2>
              <p className="text-xs text-slate-400 mt-1 max-w-lg mx-auto">{previewDish.description}</p>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-2 rounded-2xl shadow-2xl relative max-h-[70vh] flex items-center justify-center overflow-hidden">
              <img
                src={previewDish.imageUrl}
                alt={previewDish.name}
                referrerPolicy="no-referrer"
                className="max-h-[65vh] w-auto max-w-full object-contain rounded-xl"
              />
            </div>

            <div className="flex gap-3 text-xs">
              <a
                href={previewDish.imageUrl}
                download={`${previewDish.name.toLowerCase().replace(/\s+/g, "_")}_full.png`}
                className="py-2.5 px-6 bg-[#255437] hover:bg-[#255437]/90 text-white rounded-xl font-bold flex items-center gap-2 transition cursor-pointer"
              >
                <Download className="h-4 w-4" />
                Download Presentation Image
              </a>
              <button
                onClick={() => setPreviewDish(null)}
                className="py-2.5 px-6 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl transition cursor-pointer"
              >
                Return to Deck
              </button>
            </div>
            
            <p className="text-[10px] font-mono text-slate-500">
              Capturing Aspect: {globalSettings.aspectRatio} • Shot size: {globalSettings.imageSize} • {globalSettings.style} Tone Settings
            </p>
          </div>
        </div>
      )}



      {/* SHOT VERSION HISTORY MODAL */}
      {historyModalDish && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#0D0D11] border border-slate-800 rounded-2xl max-w-4xl w-full p-6 space-y-6 shadow-2xl relative max-h-[90vh] flex flex-col">
            <button
              onClick={() => setHistoryModalDish(null)}
              className="absolute top-4 right-4 p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white rounded-lg transition cursor-pointer font-bold"
            >
              ✕
            </button>

            <div className="space-y-1.5 pr-8">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded bg-[#255437]/10 border border-[#255437]/30 flex items-center justify-center text-[#255437]">
                  <History className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-display font-bold text-white">Image Version History</h3>
                  <p className="text-[11px] text-slate-400">
                    <span className="font-semibold text-[#BACCC0]">{historyModalDish.name}</span> — {historyModalDish.category}
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Review all photographic iterations, prompt-based revisions, and original captures generated for this dish. Select any snapshot to restore it.
              </p>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* 1. RENDER PREVIOUS IMAGES FROM HISTORY */}
                {historyModalDish.history && historyModalDish.history.map((url, idx) => (
                  <div 
                    key={`hist-${idx}`} 
                    className="group relative rounded-xl overflow-hidden border border-slate-800/80 bg-slate-950/40 p-2.5 flex flex-col justify-between space-y-3 hover:border-slate-700 transition"
                  >
                    <div className="relative rounded-lg overflow-hidden border border-slate-800 bg-slate-900">
                      <img 
                        src={url} 
                        alt={`Version ${idx + 1}`} 
                        referrerPolicy="no-referrer"
                        className="w-full aspect-4/3 object-cover object-center cursor-pointer hover:scale-105 transition duration-300" 
                        onClick={() => setPreviewDish({ ...historyModalDish, imageUrl: url })}
                      />
                      <span className="absolute top-2 left-2 bg-slate-950/80 border border-slate-800 text-slate-400 text-[9px] font-mono px-2 py-0.5 rounded-full">
                        Version #{idx + 1}
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      <p className="text-[11px] text-slate-400 leading-relaxed italic">
                        Archived photoshoot state of earlier styling configuration.
                      </p>
                      
                      <button
                        onClick={() => restoreDishHistoryVersion(historyModalDish.id, url)}
                        className="w-full py-2 bg-slate-900 hover:bg-[#255437] hover:text-white border border-slate-800 hover:border-transparent text-slate-300 rounded-lg text-xs font-bold transition cursor-pointer"
                      >
                        Restore This Version
                      </button>
                    </div>
                  </div>
                ))}

                {/* 2. RENDER THE CURRENT ACTIVE IMAGE (IF APPLICABLE) */}
                {historyModalDish.imageUrl && (
                  <div className="relative rounded-xl overflow-hidden border-2 border-[#255437]/80 bg-[#255437]/5 p-2.5 flex flex-col justify-between space-y-3 shadow-lg shadow-[#255437]/5">
                    <div className="relative rounded-lg overflow-hidden border border-[#255437]/30 bg-slate-900">
                      <img 
                        src={historyModalDish.imageUrl} 
                        alt="Current Active Version" 
                        referrerPolicy="no-referrer"
                        className="w-full aspect-4/3 object-cover object-center cursor-pointer hover:scale-105 transition duration-300"
                        onClick={() => setPreviewDish(historyModalDish)}
                      />
                      <span className="absolute top-2 left-2 bg-[#255437] text-white text-[9px] font-bold px-2 py-0.5 rounded-full font-mono">
                        Active (Current)
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      <p className="text-[11px] text-[#BACCC0]/85 leading-relaxed font-medium">
                        Current active master photograph displayed on digital board presentations and export decks.
                      </p>
                      
                      <div className="w-full py-2 bg-[#0d0d11]/80 border border-[#255437]/30 text-[#BACCC0] font-bold rounded-lg text-xs text-center select-none">
                        ✓ Currently Active
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                onClick={() => setHistoryModalDish(null)}
                className="py-2.5 px-5 bg-slate-900 hover:bg-slate-800 border border-slate-850 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer transition"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="bg-[#0A0A0B] border-t border-slate-800/80 mt-16 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500 space-y-2">
          <p>
            PLATE<span className="text-[#336B49] font-bold">AI</span> Studio — Virtual Food Photographer Applet for Restaurant Owners & Culinary Stylists.
          </p>
        </div>
      </footer>

      <PaywallModal
        open={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        onPay={handlePay}
        priceUsd={19}
        loading={payLoading}
        error={payError}
      />
    </div>
  );
}
