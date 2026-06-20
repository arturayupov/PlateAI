import React, { useState, useEffect, useRef } from "react";
import { Dish, FoodPhotoStyle, BrandStyles, TextStyle } from "../types";
import {
  MoveUp,
  MoveDown,
  Trash2,
  Plus,
  Type,
  Maximize2,
  Minimize2,
  AlignLeft,
  Settings,
  Sparkles,
  RefreshCw,
  FolderOpen,
  DollarSign,
  Palette,
  Layers,
  ArrowLeft,
  ArrowRight,
  Printer,
  Eye,
  Grid,
  Move,
  Magnet
} from "lucide-react";

// Helper to calculate dynamic auto-resizing height for textareas to prevent truncation or overlap
const getDynamicTextareaHeight = (text: string = "", fontSizeStr: string | undefined, defaultSize: number, lineSpread: number, extraPad = 8, charsPerLine = 36) => {
  const size = fontSizeStr ? parseFloat(fontSizeStr) : defaultSize;
  const numLines = Math.max(1, Math.ceil((text.length || 1) / charsPerLine));
  return `${numLines * size * lineSpread + extraPad}px`;
};

interface InteractiveDesignerCanvasProps {
  dishes: Dish[];
  setDishes: React.Dispatch<React.SetStateAction<Dish[]>>;
  restaurantName: string;
  setRestaurantName: (name: string) => void;
  restaurantTagline: string;
  setRestaurantTagline: (tagline: string) => void;
  exportStyleTemplate: string;
  setExportStyleTemplate: (style: any) => void;
  exportTheme: "dark" | "light";
  setExportTheme: (theme: "dark" | "light") => void;
  exportFormat: "menu" | "presentation";
  setExportFormat: (format: "menu" | "presentation") => void;
  exportOrientation: "portrait" | "landscape";
  setExportOrientation: (orientation: "portrait" | "landscape") => void;
  exportPaperSize: "a4" | "letter";
  setExportPaperSize: (size: "a4" | "letter") => void;
  exportOnlyFullyGenerated: boolean;
  setExportOnlyFullyGenerated: (val: boolean) => void;
  onExportPDF?: () => void;
  brandStyles: BrandStyles;
  setBrandStyles: (styles: BrandStyles) => void;
  showPageNumbers: boolean;
  setShowPageNumbers: (val: boolean) => void;
}

export const InteractiveDesignerCanvas: React.FC<InteractiveDesignerCanvasProps> = ({
  dishes,
  setDishes,
  restaurantName,
  setRestaurantName,
  restaurantTagline,
  setRestaurantTagline,
  exportStyleTemplate,
  setExportStyleTemplate,
  exportTheme,
  setExportTheme,
  exportFormat,
  setExportFormat,
  exportOrientation,
  setExportOrientation,
  exportPaperSize,
  setExportPaperSize,
  exportOnlyFullyGenerated,
  setExportOnlyFullyGenerated,
  onExportPDF,
  brandStyles,
  setBrandStyles,
  showPageNumbers,
  setShowPageNumbers,
}) => {
  const [activeTab, setActiveTab] = useState<"style" | "branding" | "layout" | "dishes">("style");

  // Pager settings
  const [currentPage, setCurrentPage] = useState<number>(0); // 0 is Cover Page, 1..N are dishes or categories
  
  // Custom font overrides state
  const [titleFontFamily, setTitleFontFamily] = useState<"serif" | "sans" | "mono">("serif");
  const [bodyFontFamily, setBodyFontFamily] = useState<"serif" | "sans" | "mono">("sans");
  
  // Custom spacing state for template fine-tuning
  const [imageScale, setImageScale] = useState<number>(100); // 100%
  const [imageAspectRatio, setImageAspectRatio] = useState<"1:1" | "4:3" | "16:9" | "ellipse">("4:3");
  const [itemPadding, setItemPadding] = useState<number>(4); // Y-axis spacing
  const [showIngredients, setShowIngredients] = useState<boolean>(true);
  
  // Cover-page customizer states
  const [coverBgType, setCoverBgType] = useState<"solid" | "gradient" | "artistic">("gradient");
  const [coverBgGradient, setCoverBgGradient] = useState<string>("from-emerald-950 via-slate-900 to-black");
  const [coverAccentColor, setCoverAccentColor] = useState<string>("#336B49");

  // Text element specific custom styling overrides
  const [activeTextSelection, setActiveTextSelection] = useState<{
    dishId?: string;
    globalFieldId?: string;
    fieldName: string;
    label: string;
  } | null>(null);

  // Canva-style active element selection and resize utilities
  const [activeElementSelected, setActiveElementSelected] = useState<string | null>(null);

  const startImageResize = (e: React.PointerEvent, dishId: string, isPercent: boolean) => {
    e.stopPropagation();
    e.preventDefault();
    
    // Auto select this dish if user resizing its image
    setActiveElementSelected(isPercent ? ("slide_photo_frame_" + dishId) : ("menu_dish_card_" + dishId));
    
    const dish = dishes.find(d => d.id === dishId);
    if (!dish) return;
    
    const startW = isPercent ? (dish.imageWidth ?? imageScale) : (dish.imageWidth ?? 56);
    const startH = isPercent ? (dish.imageHeight ?? imageScale) : (dish.imageHeight ?? 56);
    
    const startX = e.clientX;
    const startY = e.clientY;
    
    const handlePointerMove = (moveEv: PointerEvent) => {
      const deltaX = moveEv.clientX - startX;
      const deltaY = moveEv.clientY - startY;
      
      const scaleFactor = isPercent ? 0.35 : 1.0; 
      
      const newW = Math.max(isPercent ? 10 : 30, Math.min(isPercent ? 150 : 250, startW + deltaX * scaleFactor));
      const newH = Math.max(isPercent ? 10 : 30, Math.min(isPercent ? 150 : 250, startH + deltaY * scaleFactor));
      
      handleUpdateDishText(dishId, "imageWidth", Math.round(newW));
      handleUpdateDishText(dishId, "imageHeight", Math.round(newH));
    };
    
    const handlePointerUp = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
    
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  };

  const [globalFieldStyles, setGlobalFieldStyles] = useState<Record<string, { fontSize?: string; fontWeight?: string; fontStyle?: string; color?: string; fontFamily?: string }>>({
    restaurantName: { fontSize: "24px", fontWeight: "extrabold", color: "", fontFamily: "serif" },
    restaurantTagline: { fontSize: "12px", fontWeight: "normal", color: "", fontFamily: "sans" }
  });

  const getActiveStyle = () => {
    if (!activeTextSelection) return {};
    const { fieldName } = activeTextSelection;
    if (fieldName === "restaurantName") return brandStyles.restaurantName || {};
    if (fieldName === "restaurantTagline") return brandStyles.restaurantTagline || {};
    if (fieldName === "category") return brandStyles.category || {};
    if (fieldName === "name") return brandStyles.dishName || {};
    if (fieldName === "price") return brandStyles.dishPrice || {};
    if (fieldName === "description") return brandStyles.dishDescription || {};
    if (fieldName === "ingredientsText") return brandStyles.dishIngredients || {};
    if (fieldName === "ingredientsTitle") return brandStyles.category || {};

    const { dishId, globalFieldId } = activeTextSelection;
    if (dishId) {
      const dish = dishes.find(d => d.id === dishId);
      return dish?.fieldStyles?.[fieldName] || {};
    } else if (globalFieldId) {
      return globalFieldStyles[globalFieldId] || {};
    }
    return {};
  };

  const handleUpdateSelectedStyle = (property: string, value: string) => {
    if (!activeTextSelection) return;
    const { fieldName } = activeTextSelection;
    let styleKey: keyof BrandStyles | null = null;
    if (fieldName === "restaurantName") styleKey = "restaurantName";
    else if (fieldName === "restaurantTagline") styleKey = "restaurantTagline";
    else if (fieldName === "category") styleKey = "category";
    else if (fieldName === "name") styleKey = "dishName";
    else if (fieldName === "price") styleKey = "dishPrice";
    else if (fieldName === "description") styleKey = "dishDescription";
    else if (fieldName === "ingredientsText") styleKey = "dishIngredients";
    else if (fieldName === "ingredientsTitle") styleKey = "category" as any;

    if (styleKey) {
      const updatedStyle = {
        ...(brandStyles[styleKey] || {}),
        [property]: value
      };
      setBrandStyles({
        ...brandStyles,
        [styleKey]: updatedStyle
      });
    } else {
      const { dishId, globalFieldId } = activeTextSelection;
      if (dishId) {
        setDishes(prev => prev.map(d => {
          if (d.id === dishId) {
            const existingStyles = d.fieldStyles || {};
            const fieldStyle = existingStyles[fieldName] || {};
            const updatedStyles = {
              ...existingStyles,
              [fieldName]: {
                ...fieldStyle,
                [property]: value
              }
            };
            return {
              ...d,
              fieldStyles: updatedStyles
            };
          }
          return d;
        }));
      } else if (globalFieldId) {
        setGlobalFieldStyles(prev => {
          const existingStyles = prev[globalFieldId] || {};
          return {
            ...prev,
            [globalFieldId]: {
              ...existingStyles,
              [property]: value
            }
          };
        });
      }
    }
  };

  const resolveElementStyles = (
    dishId: string | undefined, 
    globalFieldId: string | undefined, 
    fieldName: string,
    defaultClass: string, 
    defaultStyle: React.CSSProperties = {}
  ) => {
    let customStyleObj: any = {};
    if (fieldName === "restaurantName") customStyleObj = brandStyles.restaurantName || {};
    else if (fieldName === "restaurantTagline") customStyleObj = brandStyles.restaurantTagline || {};
    else if (fieldName === "category") customStyleObj = brandStyles.category || {};
    else if (fieldName === "name") customStyleObj = brandStyles.dishName || {};
    else if (fieldName === "price") customStyleObj = brandStyles.dishPrice || {};
    else if (fieldName === "description") customStyleObj = brandStyles.dishDescription || {};
    else if (fieldName === "ingredientsText") customStyleObj = brandStyles.dishIngredients || {};
    else if (fieldName === "ingredientsTitle") customStyleObj = brandStyles.category || {};
    else if (dishId) {
      const dish = dishes.find(d => d.id === dishId);
      customStyleObj = dish?.fieldStyles?.[fieldName] || {};
    } else if (globalFieldId) {
      customStyleObj = globalFieldStyles[globalFieldId] || {};
    }

    // Map properties to concrete CSS or Tailwind classes
    let fontClass = "";
    if (customStyleObj.fontFamily) {
      const fFam = customStyleObj.fontFamily.toLowerCase();
      if (fFam.includes("sans")) fontClass = "font-sans";
      else if (fFam.includes("serif")) fontClass = "font-serif";
      else if (fFam.includes("mono")) fontClass = "font-mono text-xs";
    }

    let weightClass = "";
    if (customStyleObj.fontWeight) {
      if (customStyleObj.fontWeight === "normal") weightClass = "font-normal";
      else if (customStyleObj.fontWeight === "bold") weightClass = "font-bold font-semibold";
      else if (customStyleObj.fontWeight === "extrabold") weightClass = "font-extrabold font-black";
    }

    let styleClass = "";
    if (customStyleObj.fontStyle) {
      if (customStyleObj.fontStyle === "italic") styleClass = "italic";
      else if (customStyleObj.fontStyle === "normal") styleClass = "not-italic";
    }

    let sizeStyle: React.CSSProperties = {};
    if (customStyleObj.fontSize) {
      sizeStyle = { fontSize: customStyleObj.fontSize };
    }

    let colorStyle: React.CSSProperties = {};
    if (customStyleObj.color) {
      colorStyle = { color: customStyleObj.color };
    }

    // Combine default and custom CSS styles and classes
    const classes = [defaultClass, fontClass, weightClass, styleClass].filter(Boolean).join(" ");
    
    // Explicit line height to prevent overlapping lines
    let leadingStyle: React.CSSProperties = {};
    if (fieldName === "description" || fieldName === "ingredientsText") {
      leadingStyle = { lineHeight: "1.45" };
    } else if (fieldName === "name" || fieldName === "restaurantName") {
      leadingStyle = { lineHeight: "1.25" };
    } else {
      leadingStyle = { lineHeight: "1.35" };
    }

    // Dynamic height calculation to avoid text truncation or overlap under custom font sizes
    let heightStyle: React.CSSProperties = {};
    if (fieldName === "description" && defaultClass.includes("h-[28px]")) {
      const parsedSize = customStyleObj.fontSize ? parseFloat(customStyleObj.fontSize) : 9.5;
      heightStyle = { height: `${parsedSize * 1.45 * 2 + 3}px` };
    } else if (fieldName === "ingredientsText" && defaultClass.includes("h-[22px]")) {
      const parsedSize = customStyleObj.fontSize ? parseFloat(customStyleObj.fontSize) : 8.5;
      heightStyle = { height: `${parsedSize * 1.45 * 1.5 + 2}px` };
    }

    const combinedStyles = { ...defaultStyle, ...sizeStyle, ...colorStyle, ...leadingStyle, ...heightStyle };

    return { className: classes, style: combinedStyles };
  };

  // HTML5 Drag and Drop for dishes list reordering
  const [draggedDishIndex, setDraggedDishIndex] = useState<number | null>(null);

  const handleDishDragStart = (e: React.DragEvent, index: number) => {
    setDraggedDishIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDishDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
  };

  const handleDishDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedDishIndex === null || draggedDishIndex === index) return;
    
    setDishes((prev) => {
      const updated = [...prev];
      const [draggedItem] = updated.splice(draggedDishIndex, 1);
      updated.splice(index, 0, draggedItem);
      return updated;
    });
  };

  const handleDishDragEnd = () => {
    setDraggedDishIndex(null);
  };

  const [scale, setScale] = useState<number>(1);

  // State to track relative offset coordinates of positioned boxes precisely on the canvas
  const [textOffsets, setTextOffsets] = useState<Record<string, { x: number; y: number }>>(() => {
    try {
      const saved = localStorage.getItem("designer_text_offsets");
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      console.error("Failed to parse text offsets from localStorage", e);
      return {};
    }
  });

  // Persist text offsets to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("designer_text_offsets", JSON.stringify(textOffsets));
  }, [textOffsets]);

  const [activeDragKey, setActiveDragKey] = useState<string | null>(null);
  const [snapToGrid, setSnapToGrid] = useState<boolean>(true); // Snap to Grid defaults to true for precision layout
  const [gridSize, setGridSize] = useState<number>(10); // Standard grid size 10px or 20px
  const dragStartRef = useRef<{ clientX: number; clientY: number; initX: number; initY: number } | null>(null);

  const startDragText = (e: React.PointerEvent, key: string) => {
    e.preventDefault();
    const initX = textOffsets[key]?.x || 0;
    const initY = textOffsets[key]?.y || 0;
    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      initX,
      initY
    };
    setActiveDragKey(key);
  };

  useEffect(() => {
    if (!activeDragKey) return;

    const handlePointerMove = (e: PointerEvent) => {
      if (!dragStartRef.current) return;
      const { clientX, clientY, initX, initY } = dragStartRef.current;
      const dx = e.clientX - clientX;
      const dy = e.clientY - clientY;

      // Compensate for viewport scale
      const deltaX = dx / scale;
      const deltaY = dy / scale;

      let targetX = initX + deltaX;
      let targetY = initY + deltaY;

      if (snapToGrid) {
        targetX = Math.round(targetX / gridSize) * gridSize;
        targetY = Math.round(targetY / gridSize) * gridSize;
      } else {
        targetX = Math.round(targetX);
        targetY = Math.round(targetY);
      }

      setTextOffsets(prev => ({
        ...prev,
        [activeDragKey]: {
          x: targetX,
          y: targetY
        }
      }));
    };

    const handlePointerUp = () => {
      setActiveDragKey(null);
      dragStartRef.current = null;
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [activeDragKey, scale, snapToGrid, gridSize]);

  const resetAllTextOffsets = () => {
    setTextOffsets({});
  };

  const renderDraggableTextBox = (
    key: string,
    children: React.ReactNode,
    className = ""
  ) => {
    const offset = textOffsets[key] || { x: 0, y: 0 };
    const isSelected = activeElementSelected === key;
    return (
      <div
        key={key}
        onClick={(e) => {
          e.stopPropagation();
          setActiveElementSelected(key);
        }}
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px)`,
          touchAction: "none"
        }}
        className={`group/drag relative ${className} transition-shadow duration-200 ${
          isSelected ? "ring-2 ring-emerald-500 rounded-sm shadow-lg z-30" : ""
        }`}
      >
        {/* Figma/Canva Style Corner handles when selected */}
        {isSelected && (
          <>
            <div className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-emerald-500 border border-white rounded-sm pointer-events-none z-50 shadow-sm" />
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 border border-white rounded-sm pointer-events-none z-50 shadow-sm" />
            <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 bg-emerald-500 border border-white rounded-sm pointer-events-none z-50 shadow-sm" />
            <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-emerald-500 border border-white rounded-sm pointer-events-none z-50 shadow-sm" />
            
            {/* Quick floating style tag */}
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-emerald-600 text-[8px] font-mono font-bold text-white uppercase tracking-wider px-1.5 py-0.5 rounded shadow pointer-events-none z-50 whitespace-nowrap">
              Active Layer
            </div>
          </>
        )}

        {/* Elegant overlay handle representing precise canvas positioning on hover */}
        <div
          onPointerDown={(e) => {
            e.stopPropagation();
            setActiveElementSelected(key);
            startDragText(e, key);
          }}
          className="absolute -top-3.5 -left-3.5 hidden group-hover/drag:flex active:flex items-center justify-center w-5 h-5 bg-[#255437] hover:bg-emerald-700 text-white rounded-full cursor-grab active:cursor-grabbing shadow-md z-45 transition-all scale-95 hover:scale-110 active:scale-100 border border-white"
          title="Drag this handle to position precisely"
        >
          <Move className="h-3 w-3 pointer-events-none" />
        </div>
        {children}
      </div>
    );
  };

  // Viewport-based Scaling Mechanism (Declared dynamically after all tracking dependency states are registered)
  const [fitToView, setFitToView] = useState<boolean>(true);
  const [showLayoutGuides, setShowLayoutGuides] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Determine standard virtual resolution of page designs so that the scaling element stays sharp and pixel-perfect
  const getCanvasDimensions = () => {
    if (currentPage === 0) {
      if (exportOrientation === "landscape") {
        return { width: 580, height: 410 };
      } else {
        return { width: 420, height: 594 };
      }
    } else {
      if (exportFormat === "presentation") {
        return { width: 620, height: 350 };
      } else {
        if (exportOrientation === "landscape") {
          return { width: 580, height: 410 };
        } else {
          return { width: 420, height: 594 };
        }
      }
    }
  };

  const dims = getCanvasDimensions();

  const renderAlignmentGuides = () => {
    if (!showLayoutGuides) return null;
    return (
      <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden rounded-md select-none">
        {/* Elegant light dotted background grid */}
        <div 
          className="absolute inset-0 opacity-40 animate-fade-in"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(16, 185, 129, 0.08) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(16, 185, 129, 0.08) 1px, transparent 1px)
            `,
            backgroundSize: `${gridSize}px ${gridSize}px`,
          }}
        />

        {/* Outer margin guide lines */}
        <div className="absolute top-6 bottom-6 left-6 right-6 border border-dashed border-emerald-500/35 rounded" />
        <span className="absolute top-1.5 left-7 text-[7px] font-mono font-bold text-emerald-600/60 uppercase tracking-widest bg-emerald-50/90 px-1 rounded border border-emerald-200">Margin Guide (24px)</span>

        {/* Center Vertical Axis */}
        <div className="absolute left-1/2 top-0 bottom-0 border-l border-dashed border-emerald-500/25 -translate-x-1/2 flex flex-col justify-between items-center py-6">
          <span className="text-[7px] font-mono font-bold text-emerald-500/55 bg-white/70 px-1 rounded -translate-y-4">Center V</span>
          <span className="text-[7px] font-mono font-bold text-emerald-500/55 bg-white/70 px-1 rounded translate-y-4">Center V</span>
        </div>

        {/* Center Horizontal Axis */}
        <div className="absolute top-1/2 left-0 right-0 border-t border-dashed border-emerald-500/25 -translate-y-1/2 flex justify-between items-center px-6">
          <span className="text-[7px] font-mono font-bold text-emerald-500/55 bg-white/70 px-1 rounded -translate-x-4">Center H</span>
          <span className="text-[7px] font-mono font-bold text-emerald-500/55 bg-white/70 px-1 rounded translate-x-4">Center H</span>
        </div>

        {/* Center Axis intersection crosshair */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 border border-solid border-emerald-500/60 rounded-full flex items-center justify-center">
          <div className="w-1 h-1 bg-emerald-500 rounded-full" />
        </div>

        {/* Corner crop marks for print layout structure */}
        <div className="absolute top-1 left-1 w-2.5 h-2.5 border-t border-l border-emerald-500/45" />
        <div className="absolute top-1 right-1 w-2.5 h-2.5 border-t border-r border-emerald-500/45" />
        <div className="absolute bottom-1 left-1 w-2.5 h-2.5 border-b border-l border-emerald-500/45" />
        <div className="absolute bottom-1 right-1 w-2.5 h-2.5 border-b border-r border-emerald-500/45" />

        {/* Dynamic Canvas resolution marker at bottom */}
        <div className="absolute bottom-1.5 left-2 bg-emerald-50/90 text-[#1E4D2B] font-mono text-[7px] font-extrabold px-1.5 py-0.5 rounded border border-emerald-200">
          CANVAS REF: {dims.width}px × {dims.height}px
        </div>
      </div>
    );
  };

  // Dynamic calculations utilizing ResizeObserver so that the workspace reflows and shrinks neatly on smaller screens or splitscreens with a subpixel safety buffer
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return;
      if (!fitToView) {
        setScale(1);
        return;
      }
      const element = containerRef.current;
      
      // clientWidth/clientHeight exclude scrollbars/borders, giving us the exact layout workspace area
      const availableWidth = element.clientWidth;
      const availableHeight = element.clientHeight;

      const currentDims = getCanvasDimensions();
      
      // Calculate ratio with an elegant 4% padding safety margin buffer to never trigger accidental overflow scrollbars
      const safeWidth = Math.max(80, availableWidth * 0.96);
      const safeHeight = Math.max(80, availableHeight * 0.96);

      const scaleX = safeWidth / currentDims.width;
      const scaleY = safeHeight / currentDims.height;

      const optimalScale = Math.min(scaleX, scaleY);
      // Clamp bounds gracefully so it remains highly legible on both small mobile layouts and large digital dashboards
      setScale(Math.max(0.25, Math.min(2.0, optimalScale)));
    };

    // Trigger an immediate frame to prevent layout flash
    handleResize();
    const animId = requestAnimationFrame(handleResize);

    if (typeof ResizeObserver !== "undefined" && containerRef.current) {
      const observer = new ResizeObserver(() => {
        requestAnimationFrame(handleResize);
      });
      observer.observe(containerRef.current);
      return () => {
        cancelAnimationFrame(animId);
        observer.disconnect();
      };
    }

    window.addEventListener("resize", handleResize);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
    };
  }, [
    currentPage,
    exportFormat,
    exportOrientation,
    dishes,
    imageScale,
    imageAspectRatio,
    itemPadding,
    showIngredients,
    fitToView
  ]);

  // Synchronize initial overrides based on selected template styles
  useEffect(() => {
    if (exportStyleTemplate === "minimalist") {
      setTitleFontFamily("sans");
      setBodyFontFamily("sans");
    } else if (exportStyleTemplate === "cozy") {
      setTitleFontFamily("sans");
      setBodyFontFamily("sans");
    } else if (exportStyleTemplate === "dark_chic" || exportStyleTemplate === "michelin_star") {
      setTitleFontFamily("serif");
      setBodyFontFamily("sans");
    } else if (exportStyleTemplate === "gastro_pub") {
      setTitleFontFamily("sans");
      setBodyFontFamily("mono");
    } else {
      setTitleFontFamily("serif");
      setBodyFontFamily("sans");
    }
  }, [exportStyleTemplate]);

  // Handle adding a new mock/custom item on the fly
  const handleAddNewItem = () => {
    const newItem: Dish = {
      id: "custom_" + Date.now(),
      name: "New Gourmet Treat",
      category: dishes[0]?.category || "Chef Specials",
      description: "Delicate artisanal dish prepared with hand-selected ingredients and gourmet finish.",
      keyIngredients: ["Select Spices", "Fresh Greens", "Cold Press Oil"],
      visualDescription: "Premium plate aesthetic on slate background",
      price: 24,
      currency: dishes[0]?.currency || "$",
      imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80" // generic high-res fallback
    };
    setDishes((prev) => [...prev, newItem]);
  };

  // Reorder dishes up
  const moveItemUp = (index: number) => {
    if (index === 0) return;
    setDishes((prev) => {
      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[index - 1];
      updated[index - 1] = temp;
      return updated;
    });
  };

  // Reorder dishes down
  const moveItemDown = (index: number) => {
    if (index === dishes.length - 1) return;
    setDishes((prev) => {
      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[index + 1];
      updated[index + 1] = temp;
      return updated;
    });
  };

  // Update specific dish text field value
  const handleUpdateDishText = (id: string, field: keyof Dish, value: any) => {
    setDishes((prev) =>
      prev.map((d) => (d.id === id ? { ...d, [field]: value } : d))
    );
  };

  // Update ingredients tag list
  const handleUpdateIngredient = (dishId: string, index: number, value: string) => {
    setDishes((prev) =>
      prev.map((d) => {
        if (d.id === dishId) {
          const newIngs = [...(d.keyIngredients || [])];
          newIngs[index] = value;
          return { ...d, keyIngredients: newIngs };
        }
        return d;
      })
    );
  };

  // Remove a dish
  const handleRemoveDish = (id: string) => {
    if (confirm("Are you sure you want to remove this dish from the menu compilation?")) {
      setDishes((prev) => prev.filter((d) => d.id !== id));
    }
  };

  // Font styling dynamic classes mapping
  const titleFontClass = {
    serif: "font-serif tracking-tight",
    sans: "font-sans font-bold tracking-tight",
    mono: "font-mono tracking-normal text-amber-500"
  }[titleFontFamily];

  const bodyFontClass = {
    serif: "font-serif",
    sans: "font-sans",
    mono: "font-mono text-xs"
  }[bodyFontFamily];

  // Dynamic style matching based on style options
  const getThemePalette = () => {
    if (exportFormat === "presentation") {
      return exportTheme === "dark" 
        ? {
            bg: "bg-[#141A15] text-[#F2F5F2]",
            card: "bg-[#1C261E] border-[#3A4D3E]/60",
            border: "border-[#3A4D3E]",
            accentText: "text-[#336B49]",
            mutedText: "text-[#A0AFA3]",
            badge: "bg-[#212C23] text-[#336B49] border-[#3A4D3E]"
          }
        : {
            bg: "bg-[#EEF1EE] text-[#0F1A12]",
            card: "bg-white border-[#B5CCB9]",
            border: "border-[#B5CCB9]",
            accentText: "text-[#255437]",
            mutedText: "text-[#3F4D42]",
            badge: "bg-[#E1EAE4] text-[#255437] border-[#B5CCB9]/60"
          };
    }

    // "menu" styles mapping
    switch (exportStyleTemplate) {
      case "minimalist":
        return {
          bg: "bg-white text-stone-900",
          card: "bg-white border-stone-200",
          border: "border-l-2 border-stone-850",
          accentText: "text-stone-950 uppercase",
          mutedText: "text-stone-500",
          badge: "bg-stone-50 text-stone-850 border-stone-205"
        };
      case "cozy":
        return {
          bg: "bg-[#F4F6F3] text-emerald-950",
          card: "bg-white border-[#375437]/25",
          border: "border-[#375437]/45",
          accentText: "text-[#255437]",
          mutedText: "text-[#556659]",
          badge: "bg-[#E1EAE4] text-[#255437] border-[#B5CCB9]/40"
        };
      case "dark_chic":
        return {
          bg: "bg-[#0F1210] text-[#F2F5F2]",
          card: "bg-[#141715] border-[#CBB285]/30",
          border: "border-[#CBB285]/50",
          accentText: "text-[#CBB285]",
          mutedText: "text-[#A0AFA3]",
          badge: "bg-[#1E221F] text-[#CBB285] border-[#CBB285]/20"
        };
      case "asian_fusion":
        return {
          bg: "bg-[#FDF8F0] text-[#0F0F0F]",
          card: "bg-[#FCF5EA] border-[#B80F0A]/20",
          border: "border-2 border-[#B80F0A]",
          accentText: "text-[#B80F0A] font-bold",
          mutedText: "text-[#5F645F]",
          badge: "bg-[#F7ECE0] text-[#B80F0A] border-[#B80F0A]/30"
        };
      case "retro_vintage":
        return {
          bg: "bg-[#F4EBD7] text-[#1E140F]",
          card: "bg-[#EADDC2] border-[#362B24]/40",
          border: "border-[#362B24]",
          accentText: "text-[#783C28] font-bold font-serif",
          mutedText: "text-[#554B44]",
          badge: "bg-[#E2D2B0] text-[#362B24] border-[#362B24]/20"
        };
      case "kids_menu":
        return {
          bg: "bg-[#FEFCEB] text-[#322850]",
          card: "bg-white border-[#EB684C]/30 rounded-2xl",
          border: "border-[#EB684C] border-dashed",
          accentText: "text-[#EB684C] font-bold",
          mutedText: "text-[#645078]",
          badge: "bg-[#FFF6E5] text-[#EB684C] border-[#EB684C]/30"
        };
      case "gastro_pub":
        return {
          bg: "bg-[#2A2D30] text-[#F5F5F5]",
          card: "bg-[#1E2022] border-[#DAA520]/40",
          border: "border-b border-[#DAA520]",
          accentText: "text-[#DAA520] font-mono",
          mutedText: "text-[#AFB4B9]",
          badge: "bg-[#25282B] text-[#DAA520] border-[#DAA520]/35"
        };
      case "michelin_star":
        return {
          bg: "bg-[#0A0A0B] text-[#FAFDFC]",
          card: "bg-[#0F0F10] border-[#D4AF73]/20",
          border: "border-l border-[#D4AF73]/60",
          accentText: "text-[#D4AF73] tracking-widest",
          mutedText: "text-[#9BA0A5]",
          badge: "bg-[#151517] text-[#D4AF73] border-[#D4AF73]/30"
        };
      default: // "classic"
        return {
          bg: "bg-[#FCFCF9] text-[#151A17]",
          card: "bg-[#FAFAF6] border-[#A68A56]/35",
          border: "border-[#A68A56]",
          accentText: "text-[#8C6D3F]",
          mutedText: "text-[#5C6660]",
          badge: "bg-[#F3F3ED] text-[#8C6D3F] border-[#A68A56]/20"
        };
    }
  };

  const palette = getThemePalette();

  // Helper page count
  const totalPages = exportFormat === "presentation"
    ? dishes.length + 1 // 1 cover page + N dishes
    : Math.ceil(dishes.length / 3) + 1; // 1 cover page + custom groupings (say, 3 items per page)

  const canvasAspectClass = exportOrientation === "landscape"
    ? "aspect-[1.414/1] w-full max-w-[580px]"
    : "aspect-[1/1.414] w-full max-w-[420px]";

  return (
    <div className="w-full flex flex-col xl:flex-row gap-6 h-auto xl:h-full" id="designer-sandbox">
      {/* LEFT SIDEBAR: UNIFIED COMPACT DESK panel */}
      <div className="w-full xl:w-[380px] shrink-0 bg-white border border-[#CCD7CD] rounded-2xl p-4 flex flex-col space-y-4 overflow-visible xl:overflow-y-auto hierarchy-scrollbar shadow-[0_4px_24px_-4px_rgba(37,84,55,0.03)]">
        <div className="flex items-center gap-1.5 pb-2 border-b border-[#CCD7CD]/60">
          <Palette className="h-4 w-4 text-[#255437]" />
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#1C2C1D]">Interactive Control Desk</h4>
        </div>

        {/* Tab Headers */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-[#F0F4F1] rounded-xl border border-[#DCE4DF]">
          {[
            { id: "style", label: "Presets" },
            { id: "branding", label: "Brand" },
            { id: "layout", label: "Layout" },
            { id: "dishes", label: "Sequence" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-1.5 rounded-lg text-center font-bold text-[10px] transition cursor-pointer ${
                activeTab === tab.id
                  ? "bg-[#255437] text-white shadow-xs"
                  : "text-[#4F5B51] hover:text-[#1C2C1D] hover:bg-slate-300/10"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Dynamic Typography & Canvas Style Customization Tool */}
        {activeTextSelection ? (
          <div className="bg-[#E6F0EA] border border-[#BACCC0] rounded-xl p-3 space-y-3 animate-fade-in text-stone-800">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#255437] flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 animate-pulse" /> Text Styling Studio
              </span>
              <button 
                type="button"
                onClick={() => setActiveTextSelection(null)}
                className="text-[9px] hover:bg-stone-100 text-stone-600 font-bold px-1.5 py-0.5 rounded bg-white border border-stone-200 transition"
              >
                Done
              </button>
            </div>
            
            <p className="text-[10px] font-bold text-stone-700 bg-white/70 px-2 py-1 rounded truncate">
              🎯 {activeTextSelection.label}
            </p>

            <div className="grid grid-cols-2 gap-2">
              {/* Font Family */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-[#255437] uppercase block">Font Family</label>
                <select
                  value={getActiveStyle().fontFamily || "sans"}
                  onChange={(e) => handleUpdateSelectedStyle("fontFamily", e.target.value)}
                  className="w-full text-[11px] p-1 bg-white border border-stone-300 rounded focus:outline-none focus:ring-1 focus:ring-[#255437]"
                >
                  <option value="sans font-sans">Modern Sans</option>
                  <option value="serif font-serif">Elegant Serif</option>
                  <option value="mono font-mono">Technical Mono</option>
                </select>
              </div>

              {/* Font Weight */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-[#255437] uppercase block">Weight</label>
                <select
                  value={getActiveStyle().fontWeight || "normal"}
                  onChange={(e) => handleUpdateSelectedStyle("fontWeight", e.target.value)}
                  className="w-full text-[11px] p-1 bg-white border border-stone-300 rounded focus:outline-none focus:ring-1 focus:ring-[#255437]"
                >
                  <option value="normal">Normal</option>
                  <option value="bold">Bold</option>
                  <option value="extrabold">Extra Bold</option>
                </select>
              </div>

              {/* Font Style */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-[#255437] uppercase block">Italic Style</label>
                <select
                  value={getActiveStyle().fontStyle || "normal"}
                  onChange={(e) => handleUpdateSelectedStyle("fontStyle", e.target.value)}
                  className="w-full text-[11px] p-1 bg-white border border-stone-300 rounded focus:outline-none focus:ring-1 focus:ring-[#255437]"
                >
                  <option value="normal">Regular</option>
                  <option value="italic">Italic</option>
                </select>
              </div>

              {/* Font Size */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-[#255437] uppercase block">Font Size</label>
                <select
                  value={getActiveStyle().fontSize || ""}
                  onChange={(e) => handleUpdateSelectedStyle("fontSize", e.target.value)}
                  className="w-full text-[11px] p-1 bg-white border border-stone-300 rounded focus:outline-none focus:ring-1 focus:ring-[#255437]"
                >
                  <option value="">Default Size</option>
                  <option value="7px">7px (Tiny)</option>
                  <option value="8.5px">8.5px (Small)</option>
                  <option value="10px">10px (Regular)</option>
                  <option value="12px">12px (Medium)</option>
                  <option value="14px">14px (Large)</option>
                  <option value="16px">16px (X-Large)</option>
                  <option value="20px">20px (2X-Large)</option>
                  <option value="24px">24px (Title)</option>
                </select>
              </div>
            </div>

            {/* Color Palette */}
            <div className="space-y-1.5 pt-1">
              <label className="text-[9px] font-bold text-[#255437] uppercase block">Custom Color Accent</label>
              <div className="grid grid-cols-5 gap-1">
                {[
                  { name: "Default", value: "" },
                  { name: "Charcoal", value: "#2A2D2A" },
                  { name: "Deep Black", value: "#000000" },
                  { name: "Pure Emerald", value: "#1B4F31" },
                  { name: "Forest", value: "#0F766E" },
                  { name: "Royal Ruby", value: "#B80F0A" },
                  { name: "Tangerine", value: "#B45309" },
                  { name: "Deep Gold", value: "#D4AF73" },
                  { name: "Muted Slate", value: "#475569" },
                  { name: "Soft Lilac", value: "#6D28D9" },
                ].map((col) => (
                  <button
                    key={col.value || "default"}
                    title={col.name}
                    type="button"
                    onClick={() => handleUpdateSelectedStyle("color", col.value)}
                    className="h-4.5 rounded text-[8px] font-extrabold border flex items-center justify-center transition active:scale-95 cursor-pointer"
                    style={{
                      backgroundColor: col.value || "#FFFFFF",
                      color: col.value ? "#FFFFFF" : "#111111",
                      borderColor: getActiveStyle().color === col.value ? "#1B4F31" : "#CAD2CD",
                    }}
                  >
                    {col.name === "Default" ? "Def" : ""}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1.5 pt-1">
                <span className="text-[8.5px] font-mono text-stone-500 whitespace-nowrap">HEX Code:</span>
                <input
                  type="text"
                  placeholder="#000000"
                  value={getActiveStyle().color || ""}
                  onChange={(e) => handleUpdateSelectedStyle("color", e.target.value)}
                  className="w-full text-[10px] font-mono px-1 py-0.5 bg-white border border-stone-300 rounded focus:outline-none focus:border-[#255437]"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-[#F4F7F5] border border-[#CCD7CD]/80 rounded-xl p-3 text-[10px] text-[#4F5B51] space-y-1.5 animate-fade-in line-height-relaxed shadow-xs">
            <span className="font-bold text-[#255437] block flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-[#255437]" /> Canvas Typography Studio
            </span>
            <p className="leading-normal">
              Click **directly** on any text on the slide layout (e.g. <b>Ingredients: ...</b>, <b>Dish Name</b>, <b>Price</b>, or <b>Description</b>) to style and select colors or weights instantly!
            </p>
          </div>
        )}

        {/* TAB 1: PRESETS */}
        {activeTab === "style" && (
          <div className="space-y-4 animate-fade-in">
            {/* Target Output Format */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block font-extrabold">Format & Medium</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setExportFormat("menu");
                    setExportOrientation("portrait");
                  }}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer relative flex flex-col justify-between h-[85px] ${
                    exportFormat === "menu"
                      ? "bg-[#E6F0EA] border-[#255437] text-[#1C2C1D]"
                      : "bg-[#F7FAF8] border-[#CAD2CD] hover:border-[#BACCC0] text-[#1C2C1D]"
                  }`}
                >
                  <span className="font-extrabold block text-xs text-[#255437]">Guest Menu</span>
                  <span className="text-[9px] text-[#5C6E5F] block leading-tight mt-1">Multi-page printable portrait card.</span>
                  {exportFormat === "menu" && <div className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-[#255437]" />}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setExportFormat("presentation");
                    setExportOrientation("landscape");
                  }}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer relative flex flex-col justify-between h-[85px] ${
                    exportFormat === "presentation"
                      ? "bg-[#E6F0EA] border-[#255437] text-[#1C2C1D]"
                      : "bg-[#F7FAF8] border-[#CAD2CD] hover:border-[#BACCC0] text-[#1C2C1D]"
                  }`}
                >
                  <span className="font-extrabold block text-xs text-[#255437]">Slide Deck</span>
                  <span className="text-[9px] text-[#5C6E5F] block leading-tight mt-1">Wide landscape dining presentation.</span>
                  {exportFormat === "presentation" && <div className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-[#255437]" />}
                </button>
              </div>
            </div>

            {/* Aesthetic Style Presets */}
            <div className="space-y-2.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block font-extrabold">Style Presets</span>
              <div className="grid grid-cols-1 gap-1.5 max-h-[300px] overflow-y-auto pr-1 hierarchy-scrollbar">
                {[
                  { id: "classic", label: "Classic Bistro", desc: "Chic serifs, thin ivory borders, dot leaders" },
                  { id: "minimalist", label: "Swiss Minimalist", desc: "Clean typography, modern layouts, no borders" },
                  { id: "cozy", label: "Botanical Cozy", desc: "Sage green styling, organic hand-drawn borders" },
                  { id: "dark_chic", label: "Michelin Gold", desc: "Obsidian gold typography, ultra luxury tone" },
                  { id: "asian_fusion", label: "Asian Fusion", desc: "Warm bamboo parchment base, vermillion borders" },
                  { id: "retro_vintage", label: "Retro Newspaper", desc: "Rustic cream parchment theme, double rule borders" },
                  { id: "kids_menu", label: "Playful Kids Menu", desc: "Soft pastel lemon yellow, friendly dashed borders" },
                  { id: "gastro_pub", label: "Gastro/Chalkboard Pub", desc: "Rustic blackboard slate, tavern copper details" },
                  { id: "michelin_star", label: "Caviar Michelin Star", desc: "Exquisite pitch-black aesthetic, gold accent lines" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setExportStyleTemplate(item.id as any)}
                    className={`p-2 rounded-lg border text-left transition cursor-pointer text-xs flex justify-between items-center ${
                      exportStyleTemplate === item.id
                        ? "bg-[#E6F0EA] border-[#255437]"
                        : "bg-[#F7FAF8] border-[#CAD2CD]/60 hover:border-[#BACCC0]"
                    }`}
                  >
                    <div className="space-y-0.5 max-w-[280px]">
                      <span className="font-extrabold block text-[11px] text-[#235336]">{item.label}</span>
                      <span className="text-[9.5px] text-[#5C6E5F] block leading-tight">{item.desc}</span>
                    </div>
                    <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${exportStyleTemplate === item.id ? "bg-[#255437]" : "bg-transparent border border-slate-350"}`} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: BRANDING */}
        {activeTab === "branding" && (
          <div className="space-y-4 animate-fade-in">
            {/* Branding inputs */}
            <div className="space-y-3">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block font-extrabold">Brand Overrides</span>
              <div className="space-y-2">
                <div>
                  <label className="text-[9px] text-[#819084] block font-extrabold mb-1 tracking-wider uppercase">RESTAURANT NAME</label>
                  <input
                    type="text"
                    value={restaurantName}
                    onChange={(e) => setRestaurantName(e.target.value)}
                    className="w-full bg-[#F7FAF8] border border-[#CAD2CD] rounded-xl px-3 py-2 text-xs text-[#1C2C1D] focus:outline-none focus:border-[#255437]"
                    placeholder="La Fleur Bistro"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-[#819084] block font-extrabold mb-1 tracking-wider uppercase">TAGLINE / SLOGAN</label>
                  <input
                    type="text"
                    value={restaurantTagline}
                    onChange={(e) => setRestaurantTagline(e.target.value)}
                    className="w-full bg-[#F7FAF8] border border-[#CAD2CD] rounded-xl px-3 py-2 text-xs text-[#1C2C1D] focus:outline-none focus:border-[#255437]"
                    placeholder="Handcrafted organic gastronomy"
                  />
                </div>
              </div>
            </div>

            {/* Custom fonts */}
            <div className="space-y-3">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block font-extrabold">Typography Pairings</span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] text-[#819084] block font-extrabold mb-1 tracking-wider uppercase">HEADING FONT</label>
                  <select
                    value={titleFontFamily}
                    onChange={(e: any) => setTitleFontFamily(e.target.value)}
                    className="w-full bg-[#F7FAF8] border border-[#CAD2CD] rounded-xl px-2 py-1.5 text-xs text-[#1C2C1D] focus:outline-none focus:border-[#255437]"
                  >
                    <option value="serif">Times Serif</option>
                    <option value="sans">Modern Sans</option>
                    <option value="mono">Technical Mono</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] text-[#819084] block font-extrabold mb-1 tracking-wider uppercase">BODY FONT</label>
                  <select
                    value={bodyFontFamily}
                    onChange={(e: any) => setBodyFontFamily(e.target.value)}
                    className="w-full bg-[#F7FAF8] border border-[#CAD2CD] rounded-xl px-2 py-1.5 text-xs text-[#1C2C1D] focus:outline-none focus:border-[#255437]"
                  >
                    <option value="sans">Inter Sans-serif</option>
                    <option value="serif">Garamond Serif</option>
                    <option value="mono">Fira Mono</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Global Typography Sizing */}
            <div className="space-y-3 border-t border-[#CAD2CD]/40 pt-3">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block font-extrabold">Global Font Sizing Center</span>
              <div className="space-y-2 bg-[#F4F7F5] border border-[#CCD7CD]/40 p-3 rounded-xl shadow-xs">
                {/* Dish Name */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold text-[#4F5B51] uppercase">Dish Names</span>
                  <select
                    value={brandStyles.dishName?.fontSize || "18px"}
                    onChange={(e) => {
                      setBrandStyles(prev => ({
                        ...prev,
                        dishName: { ...(prev.dishName || {}), fontSize: e.target.value }
                      }));
                    }}
                    className="bg-white border border-[#CAD2CD] rounded-lg px-2 py-1 text-[11px] text-[#1C2C1D] focus:outline-none focus:border-[#255437]"
                  >
                    <option value="12px">12px (Small)</option>
                    <option value="14px">14px (Medium)</option>
                    <option value="16px">16px (Normal)</option>
                    <option value="18px">18px (Large)</option>
                    <option value="20px">20px (X-Large)</option>
                    <option value="22px">22px (2X-Large)</option>
                    <option value="24px">24px (Display)</option>
                  </select>
                </div>
                
                {/* Dish Description */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold text-[#4F5B51] uppercase">Descriptions</span>
                  <select
                    value={brandStyles.dishDescription?.fontSize || "11px"}
                    onChange={(e) => {
                      setBrandStyles(prev => ({
                        ...prev,
                        dishDescription: { ...(prev.dishDescription || {}), fontSize: e.target.value }
                      }));
                    }}
                    className="bg-white border border-[#CAD2CD] rounded-lg px-2 py-1 text-[11px] text-[#1C2C1D] focus:outline-none focus:border-[#255437]"
                  >
                    <option value="8.5px">8.5px (Tiny)</option>
                    <option value="9.5px">9.5px (Small)</option>
                    <option value="10.5px">10.5px (Regular)</option>
                    <option value="11px">11px (Normal)</option>
                    <option value="12px">12px (Medium)</option>
                    <option value="14px">14px (Large)</option>
                  </select>
                </div>

                {/* Price */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold text-[#4F5B51] uppercase">Prices</span>
                  <select
                    value={brandStyles.dishPrice?.fontSize || "14px"}
                    onChange={(e) => {
                      setBrandStyles(prev => ({
                        ...prev,
                        dishPrice: { ...(prev.dishPrice || {}), fontSize: e.target.value }
                      }));
                    }}
                    className="bg-white border border-[#CAD2CD] rounded-lg px-2 py-1 text-[11px] text-[#1C2C1D] focus:outline-none focus:border-[#255437]"
                  >
                    <option value="10px">10px</option>
                    <option value="12px">12px</option>
                    <option value="14px">14px</option>
                    <option value="16px">16px</option>
                    <option value="18px">18px</option>
                  </select>
                </div>

                {/* Ingredients */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold text-[#4F5B51] uppercase">Ingredients</span>
                  <select
                    value={brandStyles.dishIngredients?.fontSize || "9.5px"}
                    onChange={(e) => {
                      setBrandStyles(prev => ({
                        ...prev,
                        dishIngredients: { ...(prev.dishIngredients || {}), fontSize: e.target.value }
                      }));
                    }}
                    className="bg-white border border-[#CAD2CD] rounded-lg px-2 py-1 text-[11px] text-[#1C2C1D] focus:outline-none focus:border-[#255437]"
                  >
                    <option value="7px">7px (Tiny)</option>
                    <option value="8px">8px (X-Small)</option>
                    <option value="9px">9px (Small)</option>
                    <option value="9.5px">9.5px (Regular)</option>
                    <option value="11px">11px (Medium)</option>
                  </select>
                </div>
              </div>
              <div className="text-[8.5px] text-[#55695A] leading-relaxed bg-emerald-50/50 p-2 rounded-lg border border-emerald-100/40">
                💡 <b>Pro-Tip:</b> Click directly on any text blocks on the template preview to open local sizing overrides, weight control, and color palettes!
              </div>
            </div>

            {/* Premium cover overlays (SOLID, GRADIENT, SPINE COLOR) */}
            <div className="space-y-3 bg-[#EAF2EB] border border-[#CAD2CD]/60 p-3 rounded-xl shadow-xs">
              <span className="text-[9.5px] font-mono text-[#1E4D2B] font-extrabold block">✨ COVER CANVAS PREMIUM ACCENTS</span>
              <div>
                <label className="text-[9px] text-[#4F5B51] block font-bold mb-1 uppercase tracking-wider">Background style</label>
                <div className="grid grid-cols-3 gap-1">
                  {["solid", "gradient", "artistic"].map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setCoverBgType(b as any)}
                      className={`py-1 text-[9px] capitalize rounded-lg border transition cursor-pointer font-semibold ${
                        coverBgType === b 
                          ? "bg-[#255437] border-[#255437] text-white font-bold" 
                          : "bg-white border-[#CAD2CD] text-[#4F5B51]"
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>
              
              {coverBgType === "gradient" && (
                <div>
                  <label className="text-[9px] text-[#4F5B51] block font-bold mb-1 uppercase tracking-wider">Color Ambiance Gradient Preset</label>
                  <select
                    value={coverBgGradient}
                    onChange={(e) => setCoverBgGradient(e.target.value)}
                    className="w-full bg-white border border-[#CAD2CD] rounded-xl px-2 py-1 text-[10px] text-[#1C2C1D] focus:outline-none focus:border-[#255437]"
                  >
                    <option value="from-emerald-950 via-slate-900 to-black">Sage Obsidian Jade</option>
                    <option value="from-amber-950 via-stone-900 to-slate-950">Rustic Amber Earth</option>
                    <option value="from-red-950 via-slate-905 to-stone-950">Asian Vermilion Velvet</option>
                    <option value="from-slate-900 to-slate-950">Minimal Carbon Slate</option>
                  </select>
                </div>
              )}

              <div>
                <label className="text-[9px] text-[#4F5B51] block font-bold mb-1 uppercase tracking-wider">Spine Accent Line Color</label>
                <div className="flex gap-2">
                  {["#336B49", "#D4AF37", "#B80F0A", "#743621"].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCoverAccentColor(c)}
                      style={{ backgroundColor: c }}
                      className={`h-5 w-5 rounded-full border border-current transition cursor-pointer ${
                        coverAccentColor === c ? "ring-2 ring-[#255437] scale-110" : "opacity-85"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SPACING & PARAMETERS */}
        {activeTab === "layout" && (
          <div className="space-y-4 animate-fade-in">
            {/* Parameters Orientation & Paper size */}
            <div className="space-y-3">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block font-extrabold">Setup & Sizing</span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] text-[#819084] block font-extrabold mb-1 tracking-wider uppercase">ORIENTATION</label>
                  <select
                    value={exportOrientation}
                    onChange={(e: any) => setExportOrientation(e.target.value)}
                    className="w-full bg-[#F7FAF8] border border-[#CAD2CD] rounded-xl px-2 py-1.5 text-xs text-[#1C2C1D] focus:outline-none focus:border-[#255437]"
                  >
                    <option value="portrait">Portrait</option>
                    <option value="landscape">Landscape</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] text-[#819084] block font-extrabold mb-1 tracking-wider uppercase">PAPER SIZE</label>
                  <select
                    value={exportPaperSize}
                    onChange={(e: any) => setExportPaperSize(e.target.value)}
                    className="w-full bg-[#F7FAF8] border border-[#CAD2CD] rounded-xl px-2 py-1.5 text-xs text-[#1C2C1D] focus:outline-none focus:border-[#255437]"
                  >
                    <option value="a4">A4 Standard</option>
                    <option value="letter">US Letter</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Filter Draft checkbox */}
            <div className="p-2.5 rounded-xl border border-[#CAD2CD] bg-[#F7FAF8] flex items-center justify-between text-left">
              <div className="space-y-0.5 pr-2">
                <span className="text-[11px] font-bold text-slate-800 block">Filter Draft Items</span>
                <span className="text-[9.5px] text-slate-500 block leading-tight">Only show completed food photos.</span>
              </div>
              <button
                type="button"
                onClick={() => setExportOnlyFullyGenerated(!exportOnlyFullyGenerated)}
                className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  exportOnlyFullyGenerated ? "bg-[#255437]" : "bg-[#BACCC0]"
                }`}
              >
                <span className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-xs transition duration-200 ${
                  exportOnlyFullyGenerated ? "translate-x-3" : "translate-x-0"
                }`} />
              </button>
            </div>

            {/* Canvas micro spacing parameters */}
            <div className="space-y-3">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block font-extrabold">Spacing Adjustments</span>
              <div className="space-y-3 bg-[#F7FAF8] p-3 rounded-xl border border-[#CCD7CD]/60">
                <div>
                  <div className="flex justify-between text-[10px] text-[#4F5B51] font-semibold mb-1">
                    <span>Image Frame Scale</span>
                    <span>{imageScale}%</span>
                  </div>
                  <input
                    type="range"
                    min="40"
                    max="100"
                    value={imageScale}
                    onChange={(e) => setImageScale(Number(e.target.value))}
                    className="w-full h-1 bg-[#BACCC0] rounded-lg appearance-none cursor-pointer accent-[#255437]"
                  />
                </div>
                
                <div>
                  <label className="text-[9px] text-[#819084] block font-extrabold mb-1 tracking-wider uppercase">Image Aspect Ratio</label>
                  <div className="grid grid-cols-4 gap-1">
                    {(["1:1", "4:3", "16:9", "ellipse"] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setImageAspectRatio(r)}
                        className={`py-1 text-[9px] font-mono rounded-lg border transition cursor-pointer ${
                          imageAspectRatio === r 
                            ? "bg-[#255437] border-[#255437] text-white font-bold" 
                            : "bg-white border-[#CAD2CD] text-[#4F5B51] hover:text-[#1C2C1D] hover:border-[#255437]"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[10px] text-[#4F5B51] font-semibold mb-1">
                    <span>Gourmet Row Spacing</span>
                    <span>{itemPadding}px</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="12"
                    value={itemPadding}
                    onChange={(e) => setItemPadding(Number(e.target.value))}
                    className="w-full h-1 bg-[#BACCC0] rounded-lg appearance-none cursor-pointer accent-[#255437]"
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] text-[#4F5B51] font-semibold pt-1">
                  <span>Show Ingredients?</span>
                  <button
                    type="button"
                    onClick={() => setShowIngredients(!showIngredients)}
                    className={`text-[9px] px-2 py-1 rounded-lg border transition cursor-pointer font-bold ${
                      showIngredients 
                        ? "bg-[#255437] border-[#255437] text-white" 
                        : "bg-white border-[#CAD2CD] text-[#819084]"
                    }`}
                  >
                    {showIngredients ? "YES" : "NO"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SEQUENCE CHECKLIST */}
        {activeTab === "dishes" && (
          <div className="space-y-3 animate-fade-in flex flex-col h-full min-h-[350px]">
            <div className="flex items-center justify-between pb-2 text-[10px] text-slate-500 uppercase tracking-wider font-mono font-extrabold border-b border-[#CCD7CD]/60">
              <span>Sequence Checklist</span>
              <button
                type="button"
                onClick={handleAddNewItem}
                className="text-[9px] py-1 px-2.5 bg-[#E6F0EA] border border-[#BCCFC1] text-[#1E4D2B] hover:bg-[#D4E5DB] rounded-lg flex items-center gap-1 transition cursor-pointer font-bold"
              >
                <Plus className="h-3 w-3" /> Add Custom
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-[320px] hierarchy-scrollbar">
              {dishes.map((dish, idx) => (
                <div
                  key={dish.id}
                  draggable
                  onDragStart={(e) => handleDishDragStart(e, idx)}
                  onDragOver={(e) => handleDishDragOver(e, idx)}
                  onDrop={(e) => handleDishDrop(e, idx)}
                  onDragEnd={handleDishDragEnd}
                  className={`p-2 rounded-xl border transition flex items-center justify-between text-[11px] group cursor-grab active:cursor-grabbing ${
                    draggedDishIndex === idx
                      ? "bg-emerald-50 border-emerald-300 border-dashed opacity-45 shadow-inner"
                      : "bg-[#F7FAF8] border-[#CCD7CD]/60 hover:border-[#255437]/45 shadow-xs"
                  }`}
                  title="Drag and drop to reorder"
                >
                  <div className="truncate pr-1.5 flex-1 min-w-0 flex items-center gap-1.5">
                    <span className="font-mono text-[9px] text-[#819084] mr-0.5">#{idx+1}</span>
                    <span className="text-[#1C2C1D] truncate font-bold">{dish.name}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition">
                    <button
                      type="button"
                      onClick={() => moveItemUp(idx)}
                      disabled={idx === 0}
                      className="p-1 text-[#4F5B51] hover:text-[#1C2C1D] disabled:opacity-35 cursor-pointer"
                      title="Move Up"
                    >
                      <MoveUp className="h-2.5 w-2.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveItemDown(idx)}
                      disabled={idx === dishes.length - 1}
                      className="p-1 text-[#4F5B51] hover:text-[#1C2C1D] disabled:opacity-35 cursor-pointer"
                      title="Move Down"
                    >
                      <MoveDown className="h-2.5 w-2.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveDish(dish.id)}
                      className="p-1 text-red-600 hover:text-red-800 cursor-pointer"
                      title="Remove Item"
                    >
                      <Trash2 className="h-2.5 w-2.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* RIGHT PREVIEW WORKSPACE DECK: DYNAMIC INTERACTIVE LIVE CANVAS */}
      <div className="flex-1 bg-[#EEF1EE]/40 border border-[#CCD7CD] rounded-2xl p-5 flex flex-col space-y-4 justify-between overflow-visible xl:overflow-hidden relative min-h-[500px] xl:min-h-0 shadow-[0_4px_24px_-4px_rgba(37,84,55,0.03)]">
        <div className="flex flex-col gap-3.5 border-b border-[#CCD7CD]/60 pb-3.5" id="wysiwyg-preview-top-toolbar">
          {/* TOP ROW: Header Title + Page Navigation Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
            <div className="space-y-0.5">
              <h4 className="text-xs font-extrabold uppercase tracking-widest text-[#1C2C1D] flex items-center gap-1.5 whitespace-nowrap">
                <Eye className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>WYSIWYG Live Sandbox Canvas</span>
              </h4>
              <p className="text-[10px] text-[#4F5B51] font-mono leading-tight whitespace-nowrap">
                Mode: <span className="text-[#1E4D2B] font-extrabold">{exportFormat === "menu" ? "Printable Guest Menu" : "Landscape PowerPoint Deck"}</span> • Template: <span className="text-[#1E4D2B] font-extrabold font-serif italic">{exportStyleTemplate}</span>
              </p>
            </div>

            {/* Page navigation controls with touch targets */}
            <div className="flex items-center gap-1.5 bg-[#EAF2EB] p-1 rounded-xl border border-[#CCD7CD] shrink-0 self-start sm:self-center">
              <button
                disabled={currentPage === 0}
                type="button"
                onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                className="p-1 px-2.5 bg-white hover:bg-[#DEE7DE] border border-[#CCD7CD] text-[#1C2521] rounded-lg disabled:opacity-35 transition cursor-pointer flex items-center justify-center shadow-xs"
                title="Previous Page"
                id="btn-canvas-prev-page"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <span className="text-[10px] font-mono font-extrabold text-[#1C2C1D] px-2 whitespace-nowrap min-w-[70px] text-center">
                PAGE {currentPage + 1} / {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages - 1}
                type="button"
                onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                className="p-1 px-2.5 bg-white hover:bg-[#DEE7DE] border border-[#CCD7CD] text-[#1C2521] rounded-lg disabled:opacity-35 transition cursor-pointer flex items-center justify-center shadow-xs"
                title="Next Page"
                id="btn-canvas-next-page"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* BOTTOM ROW: Action Buttons & Design Tuning tools */}
          <div className="flex flex-wrap items-center gap-2 w-full justify-start">
            {/* Alignment Layout Guides overlay */}
            <button
              type="button"
              onClick={() => setShowLayoutGuides(prev => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all text-[10px] font-extrabold cursor-pointer shadow-xs ${
                showLayoutGuides 
                  ? "bg-emerald-50 border-emerald-500/40 text-emerald-700 hover:bg-emerald-100/60" 
                  : "bg-white border-[#CCD7CD] text-[#4F5B51] hover:bg-[#EEF1EE]/50"
              }`}
              title="Toggle Layout Alignment Guides & Grid Overlay"
              id="btn-toggle-alignment-guides"
            >
              <Grid className={`h-3.5 w-3.5 ${showLayoutGuides ? "text-emerald-600" : "text-[#4F5B51]"}`} />
              <span>Alignment Grid: <span className={showLayoutGuides ? "text-emerald-700 font-extrabold font-mono" : "text-[#4F5B51] font-mono"}>{showLayoutGuides ? "ON" : "OFF"}</span></span>
            </button>

            {/* Snap to Grid Selector (10px, 20px, Off) */}
            <div className="flex items-center gap-1.5 bg-white border border-[#CCD7CD] rounded-xl px-2.5 py-1 shadow-xs text-[10px]">
              <span className="flex items-center gap-1 text-[#4F5B51] font-extrabold select-none">
                <Magnet className={`h-3.5 w-3.5 ${snapToGrid ? "text-emerald-600" : "text-[#4F5B51]"}`} />
                <span>Snap Grid:</span>
              </span>
              <div id="grid-snap-selector" className="flex items-center gap-0.5 bg-stone-100 p-0.5 rounded-lg border border-stone-200">
                <button
                  type="button"
                  onClick={() => {
                    setSnapToGrid(true);
                    setGridSize(10);
                  }}
                  className={`px-2 py-0.5 rounded text-[9px] font-bold transition-all cursor-pointer ${
                    snapToGrid && gridSize === 10
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-stone-600 hover:text-stone-900"
                  }`}
                  title="Snap elements to 10px grid"
                >
                  10px
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSnapToGrid(true);
                    setGridSize(20);
                  }}
                  className={`px-2 py-0.5 rounded text-[9px] font-bold transition-all cursor-pointer ${
                    snapToGrid && gridSize === 20
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-stone-600 hover:text-stone-900"
                  }`}
                  title="Snap elements to 20px grid"
                >
                  20px
                </button>
                <button
                  type="button"
                  onClick={() => setSnapToGrid(false)}
                  className={`px-2 py-0.5 rounded text-[9px] font-bold transition-all cursor-pointer ${
                    !snapToGrid
                      ? "bg-stone-500 text-white shadow-xs"
                      : "text-stone-600 hover:text-stone-900"
                  }`}
                  title="Disable coordinates snapping"
                >
                  Off
                </button>
              </div>
            </div>

            {/* Fit to View Toggle Option */}
            <button
              type="button"
              onClick={() => setFitToView(prev => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all text-[10px] font-extrabold cursor-pointer shadow-xs ${
                fitToView 
                  ? "bg-[#EAF2EB] border-[#A8C3AF] text-[#1E4D2B] hover:bg-[#D9EADB]" 
                  : "bg-white border-[#CCD7CD] text-[#4F5B51] hover:bg-[#EEF1EE]/50"
              }`}
              title="Toggle Fit to View scaling mechanism"
              id="btn-toggle-fit-to-view"
            >
              <Maximize2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>Fit to View: <span className={fitToView ? "text-[#1E4D2B] font-extrabold font-mono" : "text-[#4F5B51] font-mono"}>{fitToView ? "ON" : "OFF"}</span></span>
            </button>

            {/* Reset Draggable Coordinates */}
            {Object.keys(textOffsets).length > 0 && (
              <button
                type="button"
                onClick={resetAllTextOffsets}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100/60 transition-all text-[10px] font-extrabold cursor-pointer shadow-xs"
                title="Reset all custom text positioning back to original layouts"
                id="btn-reset-text-offsets"
              >
                <RefreshCw className="h-3.5 w-3.5 text-amber-600" />
                <span>Reset Text Offsets ({Object.keys(textOffsets).length})</span>
              </button>
            )}

            {/* Quick Template Switcher internally */}
            <div className="flex items-center gap-1.5 bg-[#EAF2EB] px-3 py-1.5 rounded-xl border border-[#CCD7CD]">
              <span className="text-[9px] text-[#4F5B51] uppercase font-mono font-bold">Live Presets:</span>
              <select
                value={exportStyleTemplate}
                onChange={(e) => setExportStyleTemplate(e.target.value as any)}
                className="bg-transparent border-none text-[10px] text-[#255437] focus:outline-none font-bold cursor-pointer font-sans"
              >
                <option value="classic">Classic Bistro</option>
                <option value="minimalist">Swiss Minimalist</option>
                <option value="cozy">Botanical Cozy</option>
                <option value="dark_chic">Michelin Gold</option>
                <option value="asian_fusion">Asian Fusion (Premium Red)</option>
                <option value="retro_vintage">Retro Newspaper</option>
                <option value="kids_menu">Playful Kids Menu</option>
                <option value="gastro_pub">Gastro/Chalkboard Pub</option>
                <option value="michelin_star">Caviar Michelin Star</option>
              </select>
            </div>

            {/* Swap Slides positions live! */}
            {exportFormat === "presentation" && currentPage > 0 && (
              <div className="flex items-center gap-1 bg-[#EAF2EB] p-0.5 px-2 rounded-xl border border-[#CCD7CD] shadow-xs">
                <span className="text-[9px] text-[#4F5B51] font-extrabold mr-1 font-mono uppercase select-none">Slide Order:</span>
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => {
                    const idx = currentPage - 1;
                    moveItemUp(idx);
                    setCurrentPage(prev => prev - 1);
                  }}
                  className="px-2 py-1 bg-white hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-30 rounded-lg text-[9px] font-bold border border-[#CCD7CD] transition cursor-pointer"
                  title="Move page slide left (Swap with previous)"
                >
                  ◀ Swap Left
                </button>
                <button
                  type="button"
                  disabled={currentPage >= totalPages - 1}
                  onClick={() => {
                    const idx = currentPage - 1;
                    moveItemDown(idx);
                    setCurrentPage(prev => prev + 1);
                  }}
                  className="px-2 py-1 bg-white hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-30 rounded-lg text-[9px] font-bold border border-[#CCD7CD] transition cursor-pointer"
                  title="Move page slide right (Swap with next)"
                >
                  Swap Right ▶
                </button>
              </div>
            )}
          </div>
        </div>

        {/* CANVAS GRAPHICS BODY WRAPPER */}
        <div ref={containerRef} className="flex-1 bg-[#EEF1EE]/90 backdrop-blur-md rounded-2xl border border-[#CCD7CD] p-6 lg:p-10 flex items-center justify-center overflow-auto hierarchy-scrollbar relative min-h-[460px]">
          
          {/* COVER PAGE PREVIEW rendering */}
          {currentPage === 0 && (
            <div 
              style={{
                width: `${dims.width * scale}px`,
                height: `${dims.height * scale}px`,
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
              className="transition-all duration-300 select-none ease-out"
            >
              <div
                style={{
                  width: `${dims.width}px`,
                  height: `${dims.height}px`,
                  transform: `scale(${scale})`,
                  transformOrigin: "center center",
                  position: "absolute",
                  flexShrink: 0,
                }}
                className="flex flex-col"
              >
                <div
                  className={`p-8 border shadow-2xl relative flex flex-col justify-between transition-all duration-300 h-full w-full ${palette.bg}`}
                  style={{
                    borderColor: palette.accentText.includes("text-[#") ? palette.accentText.split("text-[")[1].split("]")[0] : "#375437",
                    borderRadius: exportStyleTemplate === "kids_menu" ? "20px" : "4px"
                  }}
                >
                  {/* Elegant Accent border rings depending on styles */}
                  {exportStyleTemplate === "classic" && (
                    <div className="absolute inset-2 border border-amber-600/10 pointer-events-none rounded" />
                  )}
                  {exportStyleTemplate === "michelin_star" && (
                    <div className="absolute inset-1 border border-[#D4AF73]/20 pointer-events-none" />
                  )}

                  {/* Centered Main Title content */}
                  {renderDraggableTextBox(
                    "cover_title_block",
                    <div className="text-center space-y-4 my-auto relative w-full">
                      {/* Thick Spine line on the left representing layout cover if Classic / Dark Cozy style is picked */}
                      {(exportStyleTemplate === "classic" || exportStyleTemplate === "dark_chic" || exportStyleTemplate === "cozy") && (
                        <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-1.5 h-16 bg-[#336B49] rounded-full opacity-80" style={{ backgroundColor: coverAccentColor }} />
                      )}

                      <div className="space-y-2">
                        <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest block font-mono">ESTABLISHED GUEST PORTFOLIO</span>
                        <textarea
                          rows={2}
                          ref={(el) => {
                            if (el) {
                              el.style.height = "auto";
                              el.style.height = `${el.scrollHeight}px`;
                            }
                          }}
                          value={restaurantName}
                          onChange={(e) => setRestaurantName(e.target.value)}
                          onFocus={() => setActiveTextSelection({
                            globalFieldId: "restaurantName",
                            fieldName: "restaurantName",
                            label: "Restaurant Name (Cover)"
                          })}
                          style={resolveElementStyles(undefined, "restaurantName", "restaurantName", "").style}
                          className={resolveElementStyles(undefined, "restaurantName", "restaurantName", `w-full text-center bg-transparent border-b border-transparent focus:border-emerald-600 focus:outline-none focus:bg-slate-800/15 resize-none overflow-hidden leading-tight break-words whitespace-normal ${titleFontClass}`).className}
                          placeholder="Restaurant Name"
                          draggable={false}
                        />
                      </div>
                      
                      <textarea
                        rows={2}
                        ref={(el) => {
                          if (el) {
                            el.style.height = "auto";
                            el.style.height = `${el.scrollHeight}px`;
                          }
                        }}
                        value={restaurantTagline}
                        onChange={(e) => setRestaurantTagline(e.target.value)}
                        onFocus={() => setActiveTextSelection({
                          globalFieldId: "restaurantTagline",
                          fieldName: "restaurantTagline",
                          label: "Restaurant Tagline (Cover)"
                        })}
                        style={resolveElementStyles(undefined, "restaurantTagline", "restaurantTagline", "").style}
                        className={resolveElementStyles(undefined, "restaurantTagline", "restaurantTagline", `w-full text-center bg-transparent border-b border-transparent focus:border-emerald-600 text-xs italic focus:outline-none focus:bg-slate-800/15 resize-none overflow-hidden leading-snug break-words whitespace-normal ${palette.accentText}`).className}
                        placeholder="Tagline or Slogan"
                        draggable={false}
                      />

                    </div>,
                    "my-auto flex flex-col justify-center items-center w-full z-10"
                  )}

                  {/* Clean cover layout with elegant white-space footer */}
                  <div className="h-6" />
                </div>
                {renderAlignmentGuides()}
              </div>
            </div>
          )}

          {/* INDIVIDUAL DISH SLIDES / PORTFOLIO PAGE PREVIEW rendering */}
          {currentPage > 0 && (
            <div className="w-full h-full flex items-center justify-center animate-fade-in">
              {exportFormat === "presentation" ? (
                // LANDSCAPE PRESENTATION SLIDE PREVIEW (1 single slide per page)
                (() => {
                  const dishIndex = currentPage - 1;
                  const dish = dishes[dishIndex];
                  if (!dish) return <div className="text-[11px] text-slate-500">No dish found for page</div>;

                  return (
                    <div 
                      style={{
                        width: `${dims.width * scale}px`,
                        height: `${dims.height * scale}px`,
                        position: "relative",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                      className="transition-all duration-300 select-none ease-out"
                    >
                      <div
                        style={{
                          width: `${dims.width}px`,
                          height: `${dims.height}px`,
                          transform: `scale(${scale})`,
                          transformOrigin: "center center",
                          position: "absolute",
                          flexShrink: 0,
                        }}
                        className="flex flex-col"
                      >
                        <div className={`w-full h-full rounded-xl border border-slate-800/80 p-6 flex flex-col justify-between shadow-2xl transition ${palette.bg}`}>
                          
                          {/* Top Header line of slides - removed restaurantName input and slide numbering as requested */}
                          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                            <div className="flex items-center gap-1.5">
                              <input
                                type="text"
                                value={dish.category || ""}
                                onChange={(e) => handleUpdateDishText(dish.id, "category", e.target.value)}
                                onFocus={() => setActiveTextSelection({
                                  dishId: dish.id,
                                  fieldName: "category",
                                  label: `Category: "${dish.category}"`
                                })}
                                style={resolveElementStyles(dish.id, undefined, "category", "").style}
                                className={resolveElementStyles(dish.id, undefined, "category", "text-[9px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-900 px-1.5 py-0.5 rounded uppercase font-bold text-center w-[85px] focus:outline-none focus:border-emerald-500").className}
                                placeholder="CULINARY"
                                draggable={false}
                              />
                            </div>
                            {/* Empty space, no running headings or numbers duplicated here */}
                          </div>

                          {/* Splitscreen block */}
                          <div className="flex-1 grid grid-cols-12 gap-4 items-center py-2.5 overflow-hidden">
                            
                            {/* Left texts side */}
                            <div className="col-span-6 space-y-2">
                              {renderDraggableTextBox(
                                "slide_text_block_" + dish.id,
                                <div className="space-y-2 w-full z-15">
                                  <div className="flex items-start justify-between gap-1.5">
                                    <input
                                      type="text"
                                      value={dish.name}
                                      onChange={(e) => handleUpdateDishText(dish.id, "name", e.target.value)}
                                      onFocus={() => setActiveTextSelection({
                                        dishId: dish.id,
                                        fieldName: "name",
                                        label: `Dish Name: "${dish.name}"`
                                      })}
                                      style={resolveElementStyles(dish.id, undefined, "name", "").style}
                                      className={resolveElementStyles(dish.id, undefined, "name", `w-full bg-transparent border-b border-transparent focus:border-stone-500 focus:bg-slate-800/10 text-md font-bold focus:outline-none ${titleFontClass}`).className}
                                      draggable={false}
                                    />
                                    {dish.price !== undefined && (
                                      <input
                                        type="text"
                                        value={`${dish.currency || "$"}${dish.price}`}
                                        onChange={(e) => {
                                          const rawVal = e.target.value.replace(/[^0-9.]/g, "");
                                          handleUpdateDishText(dish.id, "price", parseFloat(rawVal) || 0);
                                        }}
                                        onFocus={() => setActiveTextSelection({
                                          dishId: dish.id,
                                          fieldName: "price",
                                          label: `Dish Price: "${dish.name}"`
                                        })}
                                        style={resolveElementStyles(dish.id, undefined, "price", "").style}
                                        className={resolveElementStyles(dish.id, undefined, "price", "w-[45px] text-right font-bold text-xs bg-transparent text-emerald-500 border-none focus:outline-none truncate").className}
                                        draggable={false}
                                      />
                                    )}
                                  </div>

                                  <textarea
                                    ref={(el) => {
                                      if (el) {
                                        el.style.height = "auto";
                                        el.style.height = `${el.scrollHeight}px`;
                                      }
                                    }}
                                    value={dish.description}
                                    onChange={(e) => handleUpdateDishText(dish.id, "description", e.target.value)}
                                    onFocus={() => setActiveTextSelection({
                                      dishId: dish.id,
                                      fieldName: "description",
                                      label: `Description: "${dish.name}"`
                                    })}
                                    style={{
                                      ...resolveElementStyles(dish.id, undefined, "description", "").style,
                                    }}
                                    className={resolveElementStyles(dish.id, undefined, "description", `w-full bg-transparent border-b border-transparent focus:border-stone-500 text-[10.5px] leading-relaxed focus:outline-none focus:bg-slate-800/10 resize-none overflow-hidden ${bodyFontClass} ${palette.mutedText}`).className}
                                    placeholder="Delectable culinary description..."
                                    draggable={false}
                                  />

                                  {/* Ingredient Bullets list on canvas */}
                                  {showIngredients && (
                                    <div className="space-y-1">
                                      <textarea
                                        ref={(el) => {
                                          if (el) {
                                            el.style.height = "auto";
                                            el.style.height = `${el.scrollHeight}px`;
                                          }
                                        }}
                                        value={dish.ingredientsText !== undefined ? dish.ingredientsText : `Key Ingredients: ${(dish.keyIngredients || []).join(", ")}`}
                                        onChange={(e) => handleUpdateDishText(dish.id, "ingredientsText", e.target.value)}
                                        onFocus={() => {
                                          if (dish.ingredientsText === undefined) {
                                            const computedVal = `Key Ingredients: ${(dish.keyIngredients || []).join(", ")}`;
                                            handleUpdateDishText(dish.id, "ingredientsText", computedVal);
                                          }
                                          setActiveTextSelection({
                                            dishId: dish.id,
                                            fieldName: "ingredientsText",
                                            label: `Ingredients Text: "${dish.name}"`
                                          });
                                        }}
                                        style={{
                                          ...resolveElementStyles(dish.id, undefined, "ingredientsText", "").style,
                                        }}
                                        className={resolveElementStyles(dish.id, undefined, "ingredientsText", `w-full bg-transparent border-b border-transparent focus:border-stone-500 focus:bg-slate-800/10 text-[9.5px] font-mono focus:outline-none resize-none overflow-hidden text-stone-700 dark:text-stone-300 leading-normal`).className}
                                        placeholder="Ingredients: Select Spices, Fresh Greens..."
                                        draggable={false}
                                      />
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Right Photo frame preview space */}
                            <div className="col-span-6 flex justify-center h-full items-center">
                              {renderDraggableTextBox(
                                "slide_photo_frame_" + dish.id,
                                <div
                                  onPointerDown={(e) => {
                                    e.stopPropagation();
                                    setActiveElementSelected("slide_photo_frame_" + dish.id);
                                  }}
                                  className="group/img relative overflow-hidden rounded bg-slate-900 border border-slate-800 flex items-center justify-center transition cursor-pointer active:cursor-grabbing"
                                  style={{
                                    width: `${dish.imageWidth ?? imageScale}%`,
                                    height: `${dish.imageHeight ?? imageScale}%`,
                                    borderRadius: imageAspectRatio === "ellipse" ? "100%" : "6px",
                                    aspectRatio: imageAspectRatio === "ellipse" ? "1/1" : imageAspectRatio.replace(":", "/")
                                  }}
                                >
                                  {dish.imageUrl ? (
                                    <img
                                      src={dish.imageUrl}
                                      alt={dish.name}
                                      referrerPolicy="no-referrer"
                                      className="w-full h-full object-cover rounded pointer-events-none select-none"
                                    />
                                  ) : (
                                    <div className="text-center p-2">
                                      <span className="text-[9px] text-slate-500 block uppercase font-mono font-bold">Aesthetic Photo</span>
                                      <span className="text-[7.5px] text-slate-600 block italic">Shoot pending</span>
                                    </div>
                                  )}

                                  {/* Small resize anchor handle at the bottom-right corner of the image frame (perfect Canva direct squeeze/stretch!) */}
                                  <div
                                    onPointerDown={(e) => startImageResize(e, dish.id, true)}
                                    className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-emerald-600 border border-white hover:bg-emerald-500 rounded-xs cursor-se-resize z-45"
                                    title="Drag to resize image (Canva style)"
                                  />
                                  
                                  {/* Ambient percentage dimension tooltip on hover */}
                                  <div className="absolute top-1 left-1 bg-black/75 text-[7px] text-white p-0.5 rounded leading-none opacity-0 group-hover/img:opacity-100 pointer-events-none font-mono">
                                    Size: {dish.imageWidth ?? imageScale}%
                                  </div>
                                </div>,
                                "z-15"
                              )}
                            </div>

                          </div>

                          {/* Footer white-label disclaimer */}
                          <div className="flex justify-between text-[8px] opacity-45 font-mono pt-1.5 border-t border-slate-800/20">
                            <span>Curated for {restaurantName}</span>
                            <span>Chef's Signature Portfolio</span>
                          </div>
                        </div>
                        {renderAlignmentGuides()}
                      </div>
                    </div>
                  );
                })()
              ) : (
                // PORTRAIT GUEST PRINTABLE MENU PREVIEW (Shows menu page view grouping items)
                (() => {
                  // printable pages grouping items by category or paging chunk of 3 items per page
                  const pageSize = 3;
                  const pageIndex = currentPage - 1;
                  const pageDishes = dishes.slice(pageIndex * pageSize, (pageIndex * pageSize) + pageSize);

                  if (pageDishes.length === 0) {
                    return <div className="text-[11px] text-[#4F5B51] font-semibold text-center py-8">Add some gourmet dishes to compile pagination.</div>;
                  }

                  return (
                    <div 
                      style={{
                        width: `${dims.width * scale}px`,
                        height: `${dims.height * scale}px`,
                        position: "relative",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                      className="transition-all duration-300 select-none ease-out"
                    >
                      <div
                        style={{
                          width: `${dims.width}px`,
                          height: `${dims.height}px`,
                          transform: `scale(${scale})`,
                          transformOrigin: "center center",
                          position: "absolute",
                          flexShrink: 0,
                        }}
                        className="flex flex-col"
                      >
                        <div
                          className={`p-6 shadow-2xl relative flex flex-col justify-between transition-all duration-300 h-full w-full ${palette.bg}`}
                          style={{
                            borderWidth: exportStyleTemplate === "retro_vintage" ? "5px" : "1.5px",
                            borderRadius: exportStyleTemplate === "kids_menu" ? "20px" : "3px",
                            borderColor: palette.accentText.includes("text-[#") ? palette.accentText.split("text-[")[1].split("]")[0] : "#B5CCB9"
                          }}
                        >
                      {/* Decorative accents for corners if applicable */}
                      {exportStyleTemplate === "classic" && (
                        <div className="absolute inset-1.5 border border-[#A68A56]/20 pointer-events-none rounded" />
                      )}

                      {/* Empty header space per request */}
                      <div className="h-2" />

                      {/* Body List of Paged items */}
                      <div className="flex-1 flex flex-col justify-around">
                        {pageDishes.map((dish, dIdx) => {
                          const globalIdx = (pageIndex * pageSize) + dIdx;
                          return renderDraggableTextBox(
                            "menu_dish_card_" + dish.id,
                            <div
                              key={dish.id}
                              draggable
                              onDragStart={(e) => handleDishDragStart(e, globalIdx)}
                              onDragOver={(e) => handleDishDragOver(e, globalIdx)}
                              onDrop={(e) => handleDishDrop(e, globalIdx)}
                              onDragEnd={handleDishDragEnd}
                              className={`flex gap-3 items-center hover:bg-stone-500/5 p-1.5 rounded-lg group text-left relative cursor-grab active:cursor-grabbing transition-all ${
                                draggedDishIndex === globalIdx
                                  ? "opacity-35 bg-emerald-50/10 scale-95 border-emerald-500 border-dashed border"
                                  : ""
                              }`}
                              style={{
                                paddingTop: `${itemPadding * 1.5}px`,
                                paddingBottom: `${itemPadding * 1.5}px`
                              }}
                            >
                              {/* Superficial hover action controls (absolute positioned, z-50 overlay, takes 0px space from DOM flow!) */}
                              <div className="absolute right-1 -top-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-stone-200 shadow-md rounded-lg p-0.5 z-50">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    moveItemUp(globalIdx);
                                  }}
                                  disabled={globalIdx === 0}
                                  className="p-1 hover:bg-stone-100 text-stone-700 disabled:opacity-30 rounded cursor-pointer leading-none text-[8px] font-bold"
                                  title="Move Item Up (Swap with previous)"
                                >
                                  ▲
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    moveItemDown(globalIdx);
                                  }}
                                  disabled={globalIdx === dishes.length - 1}
                                  className="p-1 hover:bg-stone-100 text-stone-700 disabled:opacity-30 rounded cursor-pointer leading-none text-[8px] font-bold"
                                  title="Move Item Down (Swap with next)"
                                >
                                  ▼
                                </button>
                                <div className="w-px h-3 bg-stone-200 mx-0.5 self-center" />
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm("Are you sure you want to delete this dish?")) {
                                      setDishes(prev => prev.filter(d => d.id !== dish.id));
                                    }
                                  }}
                                  className="p-0.5 hover:bg-red-50 text-red-600 hover:text-red-800 rounded cursor-pointer leading-none text-[8px] font-bold px-1"
                                  title="Delete Item"
                                >
                                  ✕
                                </button>
                              </div>

                              {/* Interactive Image with Canva-style grab center & edge corner resizing */}
                              {dish.imageUrl && (
                                <div
                                  onPointerDown={(e) => {
                                    e.stopPropagation();
                                    setActiveElementSelected("menu_dish_card_" + dish.id);
                                  }}
                                  className="group/img bg-stone-100 rounded border border-[#CCD7CD]/50 shrink-0 overflow-hidden relative cursor-pointer active:cursor-grabbing"
                                  style={{
                                    width: `${dish.imageWidth ?? 56}px`,
                                    height: `${dish.imageHeight ?? 56}px`,
                                    borderRadius: imageAspectRatio === "ellipse" ? "100%" : "4px"
                                  }}
                                >
                                  <img
                                    src={dish.imageUrl}
                                    alt={dish.name}
                                    referrerPolicy="no-referrer"
                                    className="w-full h-full object-cover pointer-events-none select-none"
                                  />
                                  
                                  {/* Small resize anchor handle at the bottom-right corner of the image frame */}
                                  <div
                                    onPointerDown={(e) => startImageResize(e, dish.id, false)}
                                    className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-600 border border-white hover:bg-emerald-500 rounded-xs cursor-se-resize z-45"
                                    title="Drag to resize image (Canva style)"
                                  />
                                  
                                  {/* Ambient dimensions tooltip on hover */}
                                  <div className="absolute top-0.5 left-0.5 bg-black/75 text-[7px] text-white p-0.5 rounded leading-none opacity-0 group-hover/img:opacity-100 pointer-events-none font-mono">
                                    {dish.imageWidth ?? 56}x{dish.imageHeight ?? 56}px
                                  </div>
                                </div>
                              )}

                              {/* Item info values with fluid dynamic height auto-growing textareas */}
                              <div className="flex-1 space-y-0.5 min-w-0">
                                <div className="flex items-baseline justify-between gap-1 w-full">
                                  <textarea
                                    rows={1}
                                    ref={(el) => {
                                      if (el) {
                                        el.style.height = "auto";
                                        el.style.height = `${el.scrollHeight}px`;
                                      }
                                    }}
                                    value={dish.name}
                                    onChange={(e) => handleUpdateDishText(dish.id, "name", e.target.value)}
                                    onFocus={() => setActiveTextSelection({
                                      dishId: dish.id,
                                      fieldName: "name",
                                      label: `Dish Name: "${dish.name}"`
                                    })}
                                    style={{
                                      ...resolveElementStyles(dish.id, undefined, "name", "").style,
                                    }}
                                    className={resolveElementStyles(dish.id, undefined, "name", `bg-transparent border-b border-transparent focus:border-stone-500 text-xs font-bold focus:outline-none focus:bg-slate-850/5 max-w-[75%] flex-1 min-w-[50px] resize-none overflow-hidden break-words whitespace-normal leading-tight ${titleFontClass}`).className}
                                    draggable={false}
                                  />
                                  <div className="flex-1 border-b border-dotted border-current opacity-25 min-w-[10px] mx-1 self-center" />
                                  {dish.price !== undefined && (
                                    <input
                                      type="text"
                                      value={`${dish.currency || "$"}${dish.price}`}
                                      onChange={(e) => {
                                        const rawVal = e.target.value.replace(/[^0-9.]/g, "");
                                        handleUpdateDishText(dish.id, "price", parseFloat(rawVal) || 0);
                                      }}
                                      onFocus={() => setActiveTextSelection({
                                        dishId: dish.id,
                                        fieldName: "price",
                                        label: `Dish Price: "${dish.name}"`
                                      })}
                                      style={resolveElementStyles(dish.id, undefined, "price", "").style}
                                      className={resolveElementStyles(dish.id, undefined, "price", "w-[42px] text-right font-mono font-bold text-xs bg-transparent focus:outline-none text-emerald-600 focus:border-b focus:border-stone-500 shrink-0").className}
                                      draggable={false}
                                    />
                                  )}
                                </div>

                                <textarea
                                  rows={1}
                                  ref={(el) => {
                                    if (el) {
                                      el.style.height = "auto";
                                      el.style.height = `${el.scrollHeight}px`;
                                    }
                                  }}
                                  value={dish.description}
                                  onChange={(e) => handleUpdateDishText(dish.id, "description", e.target.value)}
                                  onFocus={() => setActiveTextSelection({
                                    dishId: dish.id,
                                    fieldName: "description",
                                    label: `Description: "${dish.name}"`
                                  })}
                                  style={{
                                    ...resolveElementStyles(dish.id, undefined, "description", "").style,
                                  }}
                                  className={resolveElementStyles(dish.id, undefined, "description", `w-full bg-transparent border-b border-transparent focus:border-stone-500 text-[9.5px] leading-normal focus:outline-none focus:bg-slate-850/5 resize-none overflow-hidden ${bodyFontClass} ${palette.mutedText}`).className}
                                  placeholder="Gourmet description..."
                                  draggable={false}
                                />

                                {showIngredients && (
                                  <textarea
                                    rows={1}
                                    ref={(el) => {
                                      if (el) {
                                        el.style.height = "auto";
                                        el.style.height = `${el.scrollHeight}px`;
                                      }
                                    }}
                                    value={dish.ingredientsText !== undefined ? dish.ingredientsText : `Ingredients: ${(dish.keyIngredients || []).slice(0, 3).join(", ")}`}
                                    onChange={(e) => handleUpdateDishText(dish.id, "ingredientsText", e.target.value)}
                                    onFocus={() => {
                                      if (dish.ingredientsText === undefined) {
                                        const computedVal = `Ingredients: ${(dish.keyIngredients || []).slice(0, 3).join(", ")}`;
                                        handleUpdateDishText(dish.id, "ingredientsText", computedVal);
                                      }
                                      setActiveTextSelection({
                                        dishId: dish.id,
                                        fieldName: "ingredientsText",
                                        label: `Ingredients: "${dish.name}"`
                                      });
                                    }}
                                    style={{
                                      ...resolveElementStyles(dish.id, undefined, "ingredientsText", "").style,
                                    }}
                                    className={resolveElementStyles(dish.id, undefined, "ingredientsText", "w-full bg-transparent border-b border-transparent focus:border-stone-500 focus:outline-none focus:bg-slate-850/5 text-[8.5px] font-mono leading-normal resize-none overflow-hidden text-stone-700 mt-0.5").className}
                                    placeholder="Ingredients: Select Spices, Fresh Greens, Cold Press Oil"
                                    draggable={false}
                                  />
                                )}
                              </div>
                            </div>,
                            "w-full z-15"
                          );
                        })}
                      </div>

                      {/* Footer page identifier removed as per request */}
                      <div className="h-1" />
                    </div>
                    {renderAlignmentGuides()}
                  </div>
                </div>
              );
            })()
          )}
            </div>
          )}

        </div>

        {/* Tip information */}
        <div className="bg-white/70 border border-[#CCD7CD] p-3 rounded-2xl text-center flex items-center justify-center gap-2 text-[10px] text-[#4F5B51] font-medium shadow-sm">
          <Sparkles className="h-3.5 w-3.5 text-[#255437]" />
          <span>Click to edit text, currency, and pricing directly on the canvas preview to see immediate feedback.</span>
        </div>

      </div>
    </div>
  );
};
