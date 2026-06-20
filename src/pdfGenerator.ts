import { jsPDF } from "jspdf";
import { Dish, GenerationSettings, BrandStyles, TextStyle } from "./types";

interface ExportOptions {
  theme: "dark" | "light";
  includeUnphotographed: boolean;
  paperSize: "a4" | "letter";
  orientation: "landscape" | "portrait";
  format?: "presentation" | "menu";
  styleTemplate?: "classic" | "minimalist" | "cozy" | "dark_chic" | "asian_fusion" | "retro_vintage" | "kids_menu" | "gastro_pub" | "michelin_star";
  restaurantName?: string;
  restaurantTagline?: string;
  showPageNumbers?: boolean;
  brandStyles?: BrandStyles;
}

function hexToRgb(hex: string): [number, number, number] | null {
  const match = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  return match ? [
    parseInt(match[1], 16),
    parseInt(match[2], 16),
    parseInt(match[3], 16)
  ] : null;
}

function applyBrandTextStyle(
  doc: jsPDF,
  styleObj: TextStyle | undefined,
  defaultFontClass = "Helvetica",
  defaultStyle = "normal",
  defaultPtSize = 10,
  defaultColor: [number, number, number] = [0, 0, 0]
) {
  let font = defaultFontClass;
  if (styleObj?.fontFamily === "sans") font = "Helvetica";
  else if (styleObj?.fontFamily === "serif") font = "Times";
  else if (styleObj?.fontFamily === "mono") font = "Courier";

  let fStyle = "normal";
  const isBold = styleObj?.fontWeight === "bold" || styleObj?.fontWeight === "extrabold";
  const isItalic = styleObj?.fontStyle === "italic";
  if (isBold && isItalic) fStyle = "bolditalic";
  else if (isBold) fStyle = "bold";
  else if (isItalic) fStyle = "italic";
  else fStyle = defaultStyle;

  try {
    doc.setFont(font, fStyle);
  } catch (e) {
    try {
      doc.setFont("Helvetica", "normal");
    } catch (err) {}
  }

  let size = defaultPtSize;
  if (styleObj?.fontSize) {
    const parsed = parseFloat(styleObj.fontSize);
    if (!isNaN(parsed)) {
      size = parsed * 0.75;
    }
  }
  doc.setFontSize(size);

  if (styleObj?.color) {
    const rgb = hexToRgb(styleObj.color);
    if (rgb) {
      doc.setTextColor(rgb[0], rgb[1], rgb[2]);
    } else {
      doc.setTextColor(defaultColor[0], defaultColor[1], defaultColor[2]);
    }
  } else {
    doc.setTextColor(defaultColor[0], defaultColor[1], defaultColor[2]);
  }
}

/**
 * Utility to split text into multiple lines for jsPDF and print it
 */
function drawWrappedText(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): number {
  const lines: string[] = doc.splitTextToSize(text, maxWidth);
  let currentY = y;
  for (const line of lines) {
    doc.text(line, x, currentY);
    currentY += lineHeight;
  }
  return currentY;
}

/**
 * Helper to turn price and currency string into elegant printed character combinations
 */
function formatPrice(dish: Dish): string {
  if (dish.price === undefined || dish.price === null || Number(dish.price) === 0) {
    return "";
  }
  const symbol = dish.currency || "$";
  let symbolChar = symbol;
  if (symbol === "USD") symbolChar = "$";
  else if (symbol === "EUR") symbolChar = "€";
  else if (symbol === "RUB") symbolChar = "₽";
  else if (symbol === "GBP") symbolChar = "£";
  else if (symbol === "CNY" || symbol === "JPY") symbolChar = "¥";
  
  if (symbol === "RUB" || symbolChar === "₽") {
    return `${dish.price} ₽`;
  }
  return `${symbolChar}${dish.price}`;
}

/**
 * Dedicated function to generate a premium print-ready Restaurant/Cafe Guest Menu
 */
function generatePrintableGuestMenu(
  doc: jsPDF,
  dishes: Dish[],
  settings: GenerationSettings,
  options: ExportOptions
) {
  const isLandscape = options.orientation === "landscape";
  const pgWidth = options.paperSize === "a4" ? (isLandscape ? 297 : 210) : (isLandscape ? 279.4 : 215.9);
  const pgHeight = options.paperSize === "a4" ? (isLandscape ? 210 : 297) : (isLandscape ? 215.9 : 279.4);

  // Group dishes by category
  const categoriesMap: Record<string, Dish[]> = {};
  dishes.forEach((d) => {
    const cat = d.category || "Main Course";
    if (!categoriesMap[cat]) {
      categoriesMap[cat] = [];
    }
    categoriesMap[cat].push(d);
  });
  const categories = Object.keys(categoriesMap);

  const style = options.styleTemplate || "classic";
  
  // Decide colors and design systems for all 9 international template presets
  let menuColors = {
    bg: [252, 252, 249] as [number, number, number],          // Alabaster/Cream
    border: [166, 138, 86] as [number, number, number],       // Bistro Gold
    primaryText: [21, 26, 23] as [number, number, number],     // Dark Slate
    secondaryText: [92, 102, 96] as [number, number, number], // Muted forest
    accent: [140, 109, 63] as [number, number, number],        // Gold
    titleFont: "Times" as "Times" | "Helvetica" | "Courier",
    bodyFont: "Helvetica" as "Times" | "Helvetica" | "Courier"
  };

  if (style === "minimalist") {
    menuColors = {
      bg: [255, 255, 255] as [number, number, number],
      border: [20, 20, 20] as [number, number, number],
      primaryText: [14, 14, 14] as [number, number, number],
      secondaryText: [90, 90, 90] as [number, number, number],
      accent: [0, 0, 0] as [number, number, number],
      titleFont: "Helvetica",
      bodyFont: "Helvetica"
    };
  } else if (style === "cozy") {
    menuColors = {
      bg: [244, 246, 243] as [number, number, number],         // Soft sage tea
      border: [37, 84, 55] as [number, number, number],         // Forest green
      primaryText: [20, 36, 25] as [number, number, number],     // Pine
      secondaryText: [85, 102, 89] as [number, number, number], // Leaf
      accent: [37, 84, 55] as [number, number, number],
      titleFont: "Helvetica",
      bodyFont: "Helvetica"
    };
  } else if (style === "dark_chic") {
    menuColors = {
      bg: [15, 18, 16] as [number, number, number],             // Obsidian green-black
      border: [203, 178, 133] as [number, number, number],      // Antique brass
      primaryText: [242, 245, 242] as [number, number, number],  // Warm linen text
      secondaryText: [160, 175, 163] as [number, number, number],// Pale sage
      accent: [203, 178, 133] as [number, number, number],
      titleFont: "Times",
      bodyFont: "Helvetica"
    };
  } else if (style === "asian_fusion") {
    menuColors = {
      bg: [253, 248, 240] as [number, number, number],         // Bamboo cream warm paper
      border: [184, 15, 10] as [number, number, number],         // Imperial lacquer Vermilion red
      primaryText: [15, 15, 15] as [number, number, number],     // Charcoal
      secondaryText: [95, 100, 95] as [number, number, number],  // Slate forest
      accent: [184, 15, 10] as [number, number, number],        // Vermilion
      titleFont: "Helvetica",
      bodyFont: "Helvetica"
    };
  } else if (style === "retro_vintage") {
    menuColors = {
      bg: [244, 235, 215] as [number, number, number],         // Aged newsprint parchment
      border: [54, 43, 36] as [number, number, number],          // Antique deep sepia
      primaryText: [30, 20, 15] as [number, number, number],     // Charcoal espresso
      secondaryText: [85, 75, 68] as [number, number, number],  // Earthy walnut
      accent: [120, 60, 40] as [number, number, number],        // Dark rust
      titleFont: "Times",
      bodyFont: "Helvetica"
    };
  } else if (style === "kids_menu") {
    menuColors = {
      bg: [254, 252, 235] as [number, number, number],         // Playful lemon-cream
      border: [235, 104, 76] as [number, number, number],        // Warm sunny coral
      primaryText: [50, 40, 80] as [number, number, number],     // Friendly clear violet plum
      secondaryText: [100, 80, 120] as [number, number, number], // Berry purple
      accent: [235, 104, 76] as [number, number, number],       // Highlight coral
      titleFont: "Helvetica",
      bodyFont: "Helvetica"
    };
  } else if (style === "gastro_pub") {
    menuColors = {
      bg: [42, 45, 48] as [number, number, number],             // Rough chalkboard slate
      border: [218, 165, 32] as [number, number, number],       // Tavern copper / golden rod
      primaryText: [245, 245, 245] as [number, number, number], // Clean bone-white
      secondaryText: [175, 180, 185] as [number, number, number],// Pale smoke gray
      accent: [218, 165, 32] as [number, number, number],       // Copper gold
      titleFont: "Helvetica",
      bodyFont: "Courier"
    };
  } else if (style === "michelin_star") {
    menuColors = {
      bg: [10, 10, 11] as [number, number, number],             // Caviar obsidian black
      border: [212, 175, 115] as [number, number, number],      // Champagne platinum leaf
      primaryText: [250, 250, 252] as [number, number, number],  // Pure crystal white
      secondaryText: [155, 160, 165] as [number, number, number],// Muted platinum tin
      accent: [212, 175, 115] as [number, number, number],      // Bronze champagne
      titleFont: "Times",
      bodyFont: "Helvetica"
    };
  }

  let pageNumber = 1;
  const margin = 12;

  const drawPageShell = (pageNum: number) => {
    // Background fill
    doc.setFillColor(menuColors.bg[0], menuColors.bg[1], menuColors.bg[2]);
    doc.rect(0, 0, pgWidth, pgHeight, "F");

    // Borders
    if (style === "classic") {
      doc.setDrawColor(menuColors.border[0], menuColors.border[1], menuColors.border[2]);
      doc.setLineWidth(0.6);
      doc.rect(margin, margin, pgWidth - margin * 2, pgHeight - margin * 2, "S");
      
      doc.setLineWidth(0.18);
      doc.rect(margin + 1.5, margin + 1.5, pgWidth - (margin + 1.5) * 2, pgHeight - (margin + 1.5) * 2, "S");

      const corners = [
        [margin + 1.5, margin + 1.5],
        [pgWidth - (margin + 1.5), margin + 1.5],
        [margin + 1.5, pgHeight - (margin + 1.5)],
        [pgWidth - (margin + 1.5), pgHeight - (margin + 1.5)]
      ];
      doc.setFillColor(menuColors.accent[0], menuColors.accent[1], menuColors.accent[2]);
      corners.forEach(([cx, cy]) => {
        doc.circle(cx, cy, 0.8, "F");
      });
    } else if (style === "minimalist") {
      doc.setDrawColor(menuColors.border[0], menuColors.border[1], menuColors.border[2]);
      doc.setLineWidth(0.4);
      doc.line(margin, margin, margin, pgHeight - margin);
    } else if (style === "cozy") {
      doc.setDrawColor(menuColors.border[0], menuColors.border[1], menuColors.border[2]);
      doc.setLineWidth(0.3);
      doc.rect(margin, margin, pgWidth - margin * 2, pgHeight - margin * 2, "S");
      
      const drawLeafAccent = (lx: number, ly: number, angle: number) => {
        doc.setFillColor(menuColors.border[0], menuColors.border[1], menuColors.border[2]);
        doc.circle(lx, ly, 0.9, "F");
        doc.circle(lx + Math.cos(angle) * 1.5, ly + Math.sin(angle) * 1.5, 0.6, "F");
        doc.circle(lx - Math.cos(angle) * 1.5, ly - Math.sin(angle) * 1.5, 0.6, "F");
      };
      
      drawLeafAccent(margin, margin, Math.PI / 4);
      drawLeafAccent(pgWidth - margin, margin, (3 * Math.PI) / 4);
      drawLeafAccent(margin, pgHeight - margin, -Math.PI / 4);
      drawLeafAccent(pgWidth - margin, pgHeight - margin, -(3 * Math.PI) / 4);
    } else if (style === "dark_chic" || style === "michelin_star") {
      doc.setDrawColor(menuColors.border[0], menuColors.border[1], menuColors.border[2]);
      doc.setLineWidth(0.5);
      doc.rect(margin, margin, pgWidth - margin * 2, pgHeight - margin * 2, "S");
      
      doc.setLineWidth(0.15);
      doc.rect(margin + 2, margin + 2, pgWidth - (margin + 2) * 2, pgHeight - (margin + 2) * 2, "S");
    } else if (style === "asian_fusion") {
      doc.setDrawColor(menuColors.border[0], menuColors.border[1], menuColors.border[2]);
      doc.setLineWidth(0.8);
      doc.rect(margin, margin, pgWidth - margin * 2, pgHeight - margin * 2, "S");
      // Inner subtle red offset corner accents
      doc.setLineWidth(0.2);
      doc.rect(margin + 1.2, margin + 1.2, 5, 5, "S");
      doc.rect(pgWidth - margin - 6.2, margin + 1.2, 5, 5, "S");
      doc.rect(margin + 1.2, pgHeight - margin - 6.2, 5, 5, "S");
      doc.rect(pgWidth - margin - 6.2, pgHeight - margin - 6.2, 5, 5, "S");
    } else if (style === "retro_vintage") {
      doc.setDrawColor(menuColors.border[0], menuColors.border[1], menuColors.border[2]);
      doc.setLineWidth(1.2);
      doc.rect(margin, margin, pgWidth - margin * 2, pgHeight - margin * 2, "S");
      doc.setLineWidth(0.4);
      doc.rect(margin + 2.2, margin + 2.2, pgWidth - (margin + 2.2) * 2, pgHeight - (margin + 2.2) * 2, "S");
    } else if (style === "kids_menu") {
      doc.setDrawColor(menuColors.border[0], menuColors.border[1], menuColors.border[2]);
      doc.setLineWidth(0.8);
      // Friendly scalloped single dashed border representation
      doc.rect(margin, margin, pgWidth - margin * 2, pgHeight - margin * 2, "S");
      // Draw friendly dots at corners
      doc.setFillColor(menuColors.border[0], menuColors.border[1], menuColors.border[2]);
      doc.circle(margin + 3, margin + 3, 1.2, "F");
      doc.circle(pgWidth - margin - 3, margin + 3, 1.2, "F");
      doc.circle(margin + 3, pgHeight - margin - 3, 1.2, "F");
      doc.circle(pgWidth - margin - 3, pgHeight - margin - 3, 1.2, "F");
    } else if (style === "gastro_pub") {
      doc.setDrawColor(menuColors.border[0], menuColors.border[1], menuColors.border[2]);
      doc.setLineWidth(0.7);
      doc.rect(margin, margin, pgWidth - margin * 2, pgHeight - margin * 2, "S");
      doc.setLineWidth(0.2);
      // Rough frame lines matching chalkboard style
      doc.line(margin + 1.5, margin + 1.5, pgWidth - margin - 1.5, margin + 1.5);
      doc.line(margin + 1.5, pgHeight - margin - 1.5, pgWidth - margin - 1.5, pgHeight - margin - 1.5);
    }

    // Clean, white-label page numbers (without any "Compiled with PlateAI" developer brandings)
    if (options.showPageNumbers !== false) {
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(menuColors.secondaryText[0], menuColors.secondaryText[1], menuColors.secondaryText[2]);
      doc.text(`—  ${pageNum}  —`, pgWidth / 2, pgHeight - 8, { align: "center" });
    }
  };

  drawPageShell(pageNumber);

  let currentY = margin + 12;
  const restName = options.restaurantName || "L'Étoile Bistro";
  const restTag = options.restaurantTagline || "Artisanal Fine Dining Experience";

  if (style === "classic" || style === "dark_chic") {
    if (options.brandStyles?.restaurantName) {
      applyBrandTextStyle(doc, options.brandStyles.restaurantName, menuColors.titleFont, "bold", 26, menuColors.primaryText);
    } else {
      doc.setFont(menuColors.titleFont, "bold");
      doc.setFontSize(26);
      doc.setTextColor(menuColors.primaryText[0], menuColors.primaryText[1], menuColors.primaryText[2]);
    }
    doc.text(restName.toUpperCase(), pgWidth / 2, currentY, { align: "center" });
    
    currentY += 7;
    if (options.brandStyles?.restaurantTagline) {
      applyBrandTextStyle(doc, options.brandStyles.restaurantTagline, menuColors.titleFont, "italic", 11, menuColors.accent);
    } else {
      doc.setFont(menuColors.titleFont, "italic");
      doc.setFontSize(11);
      doc.setTextColor(menuColors.accent[0], menuColors.accent[1], menuColors.accent[2]);
    }
    doc.text(restTag, pgWidth / 2, currentY, { align: "center" });

    currentY += 4.5;
    doc.setDrawColor(menuColors.border[0], menuColors.border[1], menuColors.border[2]);
    doc.setLineWidth(0.2);
    doc.line(pgWidth / 2 - 30, currentY, pgWidth / 2 - 4, currentY);
    doc.line(pgWidth / 2 + 4, currentY, pgWidth / 2 + 30, currentY);
    
    doc.setFillColor(menuColors.accent[0], menuColors.accent[1], menuColors.accent[2]);
    doc.triangle(pgWidth / 2, currentY - 1.2, pgWidth / 2 - 1.8, currentY, pgWidth / 2, currentY + 1.2, "F");
    doc.triangle(pgWidth / 2, currentY - 1.2, pgWidth / 2 + 1.8, currentY, pgWidth / 2, currentY + 1.2, "F");
    currentY += 7.5;
  } else if (style === "minimalist") {
    if (options.brandStyles?.restaurantName) {
      applyBrandTextStyle(doc, options.brandStyles.restaurantName, menuColors.titleFont, "bold", 24, menuColors.primaryText);
    } else {
      doc.setFont(menuColors.titleFont, "bold");
      doc.setFontSize(24);
      doc.setTextColor(menuColors.primaryText[0], menuColors.primaryText[1], menuColors.primaryText[2]);
    }
    doc.text(restName, margin + 4, currentY, { align: "left" });
    
    currentY += 6;
    if (options.brandStyles?.restaurantTagline) {
      applyBrandTextStyle(doc, options.brandStyles.restaurantTagline, menuColors.bodyFont, "normal", 9, menuColors.secondaryText);
    } else {
      doc.setFont(menuColors.bodyFont, "normal");
      doc.setFontSize(9);
      doc.setTextColor(menuColors.secondaryText[0], menuColors.secondaryText[1], menuColors.secondaryText[2]);
    }
    doc.text(restTag.toUpperCase(), margin + 4, currentY, { align: "left" });

    currentY += 3.5;
    doc.setDrawColor(menuColors.border[0], menuColors.border[1], menuColors.border[2]);
    doc.setLineWidth(0.4);
    doc.line(margin + 4, currentY, pgWidth - margin - 4, currentY);
    currentY += 8.5;
  } else if (style === "cozy") {
    if (options.brandStyles?.restaurantName) {
      applyBrandTextStyle(doc, options.brandStyles.restaurantName, menuColors.titleFont, "bold", 22, menuColors.primaryText);
    } else {
      doc.setFont(menuColors.titleFont, "bold");
      doc.setFontSize(22);
      doc.setTextColor(menuColors.primaryText[0], menuColors.primaryText[1], menuColors.primaryText[2]);
    }
    doc.text(restName.toUpperCase(), pgWidth / 2, currentY, { align: "center" });
    
    currentY += 6;
    if (options.brandStyles?.restaurantTagline) {
      applyBrandTextStyle(doc, options.brandStyles.restaurantTagline, menuColors.bodyFont, "italic", 10, menuColors.secondaryText);
    } else {
      doc.setFont(menuColors.bodyFont, "italic");
      doc.setFontSize(10);
      doc.setTextColor(menuColors.secondaryText[0], menuColors.secondaryText[1], menuColors.secondaryText[2]);
    }
    doc.text(`~  ${restTag}  ~`, pgWidth / 2, currentY, { align: "center" });

    currentY += 4;
    doc.setDrawColor(menuColors.border[0], menuColors.border[1], menuColors.border[2]);
    doc.setLineWidth(0.15);
    doc.line(pgWidth / 2 - 40, currentY, pgWidth / 2 + 40, currentY);
    currentY += 8;
  }

  categories.forEach((cat) => {
    const dList = categoriesMap[cat];
    if (dList.length === 0) return;

    if (currentY > pgHeight - 35) {
      doc.addPage();
      pageNumber++;
      drawPageShell(pageNumber);
      currentY = margin + 12;
    }

    currentY += 3;
    if (options.brandStyles?.category) {
      applyBrandTextStyle(doc, options.brandStyles.category, menuColors.titleFont, "bold", 14, menuColors.accent);
    } else {
      doc.setFont(menuColors.titleFont, "bold");
      doc.setFontSize(14);
      doc.setTextColor(menuColors.accent[0], menuColors.accent[1], menuColors.accent[2]);
    }
    
    if (style === "classic" || style === "dark_chic" || style === "cozy") {
      doc.text(`—  ${cat.toUpperCase()}  —`, pgWidth / 2, currentY, { align: "center" });
      currentY += 7.5;
    } else {
      doc.text(cat.toUpperCase(), margin + 4, currentY);
      currentY += 7.5;
    }

    dList.forEach((dish) => {
      const hasPhoto = !!dish.imageUrl;
      const textWidth = hasPhoto ? pgWidth - margin * 2 - 38 : pgWidth - margin * 2 - 12;
      const textX = hasPhoto ? margin + 28 : margin + 6;

      const descLines: string[] = doc.splitTextToSize(dish.description || "Fresh house special prepared on demand.", textWidth);
      const ingText = dish.ingredientsText !== undefined 
        ? dish.ingredientsText 
        : (dish.keyIngredients && dish.keyIngredients.length > 0 ? `Ingredients: ${dish.keyIngredients.join(", ")}` : "");
      const ingLines: string[] = ingText ? doc.splitTextToSize(ingText, textWidth) : [];
      
      const descHeight = descLines.length * 4.2;
      const ingHeight = ingLines.length > 0 ? ingLines.length * 3.8 + 2 : 0;
      const itemBlockHeight = Math.max(hasPhoto ? 22 : 0, 5 + descHeight + ingHeight + 5);

      if (currentY + itemBlockHeight > pgHeight - margin - 8) {
        doc.addPage();
        pageNumber++;
        drawPageShell(pageNumber);
        currentY = margin + 12;

        if (options.brandStyles?.category) {
          applyBrandTextStyle(doc, options.brandStyles.category, menuColors.titleFont, "bold", 11, menuColors.accent);
        } else {
          doc.setFont(menuColors.titleFont, "bold");
          doc.setFontSize(11);
          doc.setTextColor(menuColors.accent[0], menuColors.accent[1], menuColors.accent[2]);
        }
        if (style === "classic" || style === "dark_chic" || style === "cozy") {
          doc.text(`—  ${cat.toUpperCase()} (Continued)  —`, pgWidth / 2, currentY, { align: "center" });
        } else {
          doc.text(`${cat.toUpperCase()} (Continued)`, margin + 4, currentY);
        }
        currentY += 8;
      }

      if (hasPhoto && dish.imageUrl) {
        const thumbX = margin + 4;
        const thumbY = currentY + 0.5;
        const thumbW = 20;
        const thumbH = 16;

        doc.setDrawColor(menuColors.border[0], menuColors.border[1], menuColors.border[2]);
        doc.setLineWidth(0.25);
        doc.setFillColor(menuColors.bg[0], menuColors.bg[1], menuColors.bg[2]);
        doc.rect(thumbX - 0.8, thumbY - 0.8, thumbW + 1.6, thumbH + 1.6, "FD");

        try {
          doc.addImage(dish.imageUrl, "JPEG", thumbX, thumbY, thumbW, thumbH);
        } catch (err) {
          console.error("Printable thumbnail scale failed", err);
          doc.setFillColor(menuColors.secondaryText[0], menuColors.secondaryText[1], menuColors.secondaryText[2]);
          doc.rect(thumbX, thumbY, thumbW, thumbH, "F");
        }
      }

      const pr = formatPrice(dish);
      if (options.brandStyles?.dishName) {
        applyBrandTextStyle(doc, options.brandStyles.dishName, menuColors.titleFont, "bold", 10.5, menuColors.primaryText);
      } else {
        doc.setFont(menuColors.titleFont, "bold");
        doc.setFontSize(10.5);
        doc.setTextColor(menuColors.primaryText[0], menuColors.primaryText[1], menuColors.primaryText[2]);
      }
      doc.text(dish.name, textX, currentY + 3.5);

      if (pr) {
        const rightX = pgWidth - margin - 6;

        if (style === "classic" || style === "dark_chic") {
          doc.setFont("Courier", "normal");
          doc.setFontSize(10);
          doc.setTextColor(menuColors.secondaryText[0], menuColors.secondaryText[1], menuColors.secondaryText[2]);
          const nameLen = doc.getTextWidth(dish.name);
          const prLen = doc.getTextWidth(pr);
          const availLeadersW = rightX - textX - nameLen - prLen - 12;
          if (availLeadersW > 10) {
            let dots = "";
            for (let i = 0; i < Math.floor(availLeadersW / 1.7); i++) dots += ".";
            doc.text(dots, textX + nameLen + 2.5, currentY + 3.5);
          }
          if (options.brandStyles?.dishPrice) {
            applyBrandTextStyle(doc, options.brandStyles.dishPrice, menuColors.bodyFont, "bold", 10, menuColors.accent);
          } else {
            doc.setFont(menuColors.bodyFont, "bold");
            doc.setFontSize(10);
            doc.setTextColor(menuColors.accent[0], menuColors.accent[1], menuColors.accent[2]);
          }
          doc.text(pr, rightX, currentY + 3.5, { align: "right" });
        } else {
          if (options.brandStyles?.dishPrice) {
            applyBrandTextStyle(doc, options.brandStyles.dishPrice, menuColors.bodyFont, "bold", 10, menuColors.accent);
          } else {
            doc.setFont(menuColors.bodyFont, "bold");
            doc.setFontSize(10);
            doc.setTextColor(menuColors.accent[0], menuColors.accent[1], menuColors.accent[2]);
          }
          doc.text(pr, rightX, currentY + 3.5, { align: "right" });
        }
      }

      let innerTextY = currentY + 7.5;
      if (options.brandStyles?.dishDescription) {
        applyBrandTextStyle(doc, options.brandStyles.dishDescription, menuColors.bodyFont, "normal", 8, menuColors.secondaryText);
      } else {
        doc.setFont(menuColors.bodyFont, "normal");
        doc.setFontSize(8);
        doc.setTextColor(menuColors.secondaryText[0], menuColors.secondaryText[1], menuColors.secondaryText[2]);
      }
      
      descLines.forEach((line) => {
        doc.text(line, textX, innerTextY);
        innerTextY += 3.8;
      });

      if (ingText) {
        if (options.brandStyles?.dishIngredients) {
          applyBrandTextStyle(doc, options.brandStyles.dishIngredients, menuColors.bodyFont, "italic", 7.5, menuColors.accent);
        } else {
          doc.setFont(menuColors.bodyFont, "italic");
          doc.setFontSize(7.5);
          doc.setTextColor(menuColors.accent[0], menuColors.accent[1], menuColors.accent[2]);
        }
        
        ingLines.forEach((iline) => {
          doc.text(iline, textX, innerTextY + 0.5);
          innerTextY += 3.4;
        });
      }

      currentY += Math.max(itemBlockHeight - 2, innerTextY - currentY + 2);
    });

    currentY += 4;
  });
}

/**
 * Main function to generate and download a professional PDF presentation deck
 */
export function generatePresentationPDF(
  dishes: Dish[],
  settings: GenerationSettings,
  options: ExportOptions = {
    theme: "dark",
    includeUnphotographed: true,
    paperSize: "a4",
    orientation: "landscape",
  }
) {
  // Filter dishes if required
  const dishesToExport = options.includeUnphotographed
    ? dishes
    : dishes.filter((d) => !!d.imageUrl);

  if (dishesToExport.length === 0) {
    alert("There are no valid dishes with the selected export criteria.");
    return;
  }

  // Handle the premium Printable guest menu format directly!
  if (options.format === "menu") {
    const doc = new jsPDF({
      orientation: options.orientation,
      unit: "mm",
      format: options.paperSize,
    });
    generatePrintableGuestMenu(doc, dishesToExport, settings, options);
    const fileName = `${(options.restaurantName || "Restaurant").toLowerCase().replace(/\s+/g, "_")}_Printable_Menu_${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(fileName);
    return;
  }

  // Configuration settings
  const isLandscape = options.orientation === "landscape";
  const pgWidth = options.paperSize === "a4" ? (isLandscape ? 297 : 210) : (isLandscape ? 279.4 : 215.9);
  const pgHeight = options.paperSize === "a4" ? (isLandscape ? 210 : 297) : (isLandscape ? 215.9 : 279.4);

  // Colors based on theme (Nordic Forest Sage palette)
  const colors = {
    dark: {
      bg: [20, 26, 21] as [number, number, number],               // #141A15
      cardBg: [28, 38, 30] as [number, number, number],           // #1C261E
      innerBg: [18, 24, 19] as [number, number, number],            // #121813
      border: [58, 77, 62] as [number, number, number],           // #3A4D3E
      textPrimary: [242, 245, 242] as [number, number, number],   // #F2F5F2
      textSecondary: [160, 175, 163] as [number, number, number], // #A0AFA3
      textMuted: [116, 128, 118] as [number, number, number],       // #748076
      brand: [51, 107, 73] as [number, number, number],          // #336B49 (Sage green middle)
      brandBg: [33, 44, 35] as [number, number, number],           // Darker green-gray
    },
    light: {
      bg: [238, 241, 238] as [number, number, number],            // #EEF1EE Nordic off-white
      cardBg: [255, 255, 255] as [number, number, number],
      innerBg: [225, 234, 228] as [number, number, number],        // #E1EAE4
      border: [181, 204, 185] as [number, number, number],        // #B5CCB9 Sage border
      textPrimary: [15, 26, 18] as [number, number, number],       // Deep pine
      textSecondary: [63, 77, 66] as [number, number, number],    // Charcoal green
      textMuted: [129, 143, 132] as [number, number, number],
      brand: [37, 84, 55] as [number, number, number],           // #255437 Deep Sage
      brandBg: [225, 234, 228] as [number, number, number],        // #E1EAE4 soft cream green
    },
  }[options.theme];

  // Create jsPDF instance
  const doc = new jsPDF({
    orientation: options.orientation,
    unit: "mm",
    format: options.paperSize,
  });

  // Helper: Draw Slide Background
  const drawBackground = () => {
    doc.setFillColor(colors.bg[0], colors.bg[1], colors.bg[2]);
    doc.rect(0, 0, pgWidth, pgHeight, "F");
  };

  // Helper: Draw Slide Header / Frame
  const drawHeaderFooter = (titleText: string, subtitleText: string, pageNum: number, totalPages: number) => {
    // Top border line
    doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
    doc.setLineWidth(0.3);
    doc.line(15, 15, pgWidth - 15, 15);

    // Header branding
    const headerTitle = (options.restaurantName || "CULINARY GALLERY").toUpperCase();
    const headerSub = (options.restaurantTagline || "EXQUISITE CULINARY DECK").toUpperCase();
    
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(colors.brand[0], colors.brand[1], colors.brand[2]);
    doc.text(headerTitle, 15, 11);
    
    doc.setFont("Helvetica", "normal");
    doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
    const offsetLength = doc.getTextWidth(headerTitle) + 18;
    doc.text(`—  ${headerSub}`, offsetLength, 11);

    // Bottom border line
    doc.line(15, pgHeight - 15, pgWidth - 15, pgHeight - 15);

    // Footer branding info (white-label)
    doc.setFontSize(7);
    doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
    doc.text(`COMPILED PREVIEW: ${new Date().toLocaleDateString()}`, 15, pgHeight - 10);
    if (options.showPageNumbers !== false) {
      doc.text(`PAGE ${pageNum} OF ${totalPages}`, pgWidth - 15, pgHeight - 10, { align: "right" });
    }
  };

  const totalPages = dishesToExport.length + 1; // 1 represents the cover page

  // ----------------------------------------------------
  // COVER PAGE
  // ----------------------------------------------------
  drawBackground();

  // Cover frame decorative accent
  doc.setLineWidth(1);
  doc.setDrawColor(colors.brand[0], colors.brand[1], colors.brand[2]);
  doc.line(20, 20, 20, pgHeight - 20); // Thick color spine
  
  doc.setLineWidth(0.2);
  doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
  doc.rect(25, 20, pgWidth - 45, pgHeight - 40);

  // Title
  if (options.brandStyles?.restaurantName) {
    applyBrandTextStyle(doc, options.brandStyles.restaurantName, "Helvetica", "bold", 32, colors.textPrimary);
  } else {
    doc.setFont("Helvetica", "bold");
    doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
    doc.setFontSize(32);
  }
  const coverTitle = (options.restaurantName || "CULINARY PORTFOLIO").toUpperCase();
  doc.text(coverTitle, 40, pgHeight / 2 - 20);

  // Subtitle
  if (options.brandStyles?.restaurantTagline) {
    applyBrandTextStyle(doc, options.brandStyles.restaurantTagline, "Helvetica", "italic", 14, colors.brand);
  } else {
    doc.setFont("Helvetica", "italic");
    doc.setTextColor(colors.brand[0], colors.brand[1], colors.brand[2]);
    doc.setFontSize(14);
  }
  const coverSub = (options.restaurantTagline || "Signature Gastronomy, Presentation & Plating Designs");
  doc.text(coverSub, 40, pgHeight / 2 - 10);

  // Partition accent line
  doc.setLineWidth(0.5);
  doc.setDrawColor(colors.brand[0], colors.brand[1], colors.brand[2]);
  doc.line(40, pgHeight / 2 - 3, 140, pgHeight / 2 - 3);

  // Details summary
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
  
  let curY = pgHeight / 2 + 10;
  doc.text(`Target Venue: Signature Guest Experience Review`, 40, curY);
  curY += 6;
  doc.text(`Creative Ambiance Settings: ${settings.style}`, 40, curY);
  curY += 6;
  doc.text(`Digital Plate Quality: ${settings.imageSize} High-Definition Visuals`, 40, curY);
  curY += 6;
  doc.text(`Compiled Curations: ${dishesToExport.length} signature plates staged`, 40, curY);

  // Disclaimer or engine credits
  doc.setFontSize(8);
  doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  doc.text("All recipes and copy are customized for restaurant-grade print and client presentation.", 40, pgHeight - 30);
  doc.text("Premium culinary art and professional photography curated for modern hospitality.", 40, pgHeight - 25);

  // Page index indicator on cover
  if (options.showPageNumbers !== false) {
    doc.setFontSize(7);
    doc.text(`PAGE 1 OF ${totalPages}`, pgWidth - 30, pgHeight - 25);
  }

  // ----------------------------------------------------
  // INDIVIDUAL DISH PAGES
  // ----------------------------------------------------
  dishesToExport.forEach((dish, idx) => {
    doc.addPage();
    drawBackground();
    
    const pageNum = idx + 2;
    drawHeaderFooter(dish.name, dish.category, pageNum, totalPages);
    const printedPrice = formatPrice(dish);

    if (isLandscape) {
      // LANDSCAPE SLIDE FORMAT (Excellent for presentation screens)
      
      // LEFT CONTENT BLOCK: TEXT DESCRIPTION (Width: ~110mm)
      // Category tag box
      doc.setFillColor(colors.brandBg[0], colors.brandBg[1], colors.brandBg[2]);
      doc.roundedRect(15, 25, 45, 6, 1, 1, "F");
      
      if (options.brandStyles?.category) {
        applyBrandTextStyle(doc, options.brandStyles.category, "Helvetica", "bold", 8, colors.brand);
      } else {
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(colors.brand[0], colors.brand[1], colors.brand[2]);
      }
      doc.text(dish.category.toUpperCase(), 18, 29);

      // Price badge in Landscape
      if (printedPrice) {
        if (options.brandStyles?.dishPrice) {
          applyBrandTextStyle(doc, options.brandStyles.dishPrice, "Helvetica", "bold", 13, colors.brand);
        } else {
          doc.setFont("Helvetica", "bold");
          doc.setFontSize(13);
          doc.setTextColor(colors.brand[0], colors.brand[1], colors.brand[2]);
        }
        doc.text(printedPrice, 125, 29.5, { align: "right" });
      }

      // Dish name
      if (options.brandStyles?.dishName) {
        applyBrandTextStyle(doc, options.brandStyles.dishName, "Helvetica", "bold", 22, colors.textPrimary);
      } else {
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(22);
        doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
      }
      
      // Handle name wrap if long
      const splitName: string[] = doc.splitTextToSize(dish.name, 110);
      let nameY = 38;
      splitName.forEach((nLine) => {
        doc.text(nLine, 15, nameY);
        nameY += 8;
      });

      // Description text
      if (options.brandStyles?.dishDescription) {
        applyBrandTextStyle(doc, options.brandStyles.dishDescription, "Helvetica", "normal", 9.5, colors.textSecondary);
      } else {
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(9.5);
        doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
      }
      
      let textY = nameY + 2;
      drawWrappedText(doc, dish.description, 15, textY, 110, 4.5);

      // Key ingredients bullet points
      let ingY = textY + 24;
      if (options.brandStyles?.category) {
        applyBrandTextStyle(doc, options.brandStyles.category, "Helvetica", "bold", 8.5, colors.brand);
      } else {
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(colors.brand[0], colors.brand[1], colors.brand[2]);
      }
      doc.text("RECIPE INGREDIENTS:", 15, ingY);
      
      if (options.brandStyles?.dishIngredients) {
        applyBrandTextStyle(doc, options.brandStyles.dishIngredients, "Helvetica", "normal", 9, colors.textSecondary);
      } else {
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
      }

      let bulletY = ingY + 5;
      const ingredientsList = dish.ingredientsText !== undefined 
        ? dish.ingredientsText.replace(/^(key\s+)?ingredients:\s*/i, "").split(/[●•,;\r\n]+/).map(x => x.trim()).filter(Boolean)
        : (dish.keyIngredients || []);
      if (ingredientsList.length > 0) {
        ingredientsList.slice(0, 4).forEach((ingredient) => {
          // Small elegant bullet point
          doc.setFillColor(colors.brand[0], colors.brand[1], colors.brand[2]);
          doc.circle(17, bulletY - 1, 0.6, "F");
          doc.text(ingredient, 21, bulletY);
          bulletY += 5.5;
        });
      } else {
        doc.setFont("Helvetica", "oblique");
        doc.text("Premium select organic house ingredients", 15, bulletY);
      }

      // Guest Ambiance note block at bottom left (removed developers' raw prompts!)
      let stageY = pgHeight - 50;
      doc.setFillColor(colors.cardBg[0], colors.cardBg[1], colors.cardBg[2]);
      doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
      doc.setLineWidth(0.2);
      doc.roundedRect(15, stageY, 110, 30, 2, 2, "FD");

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(colors.brand[0], colors.brand[1], colors.brand[2]);
      doc.text("CULINARY NOTE & EXPERIENCE SELECTION", 19, stageY + 5);

      doc.setFont("Helvetica", "italic");
      doc.setFontSize(7.5);
      doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
      
      const culinaryWords = `This dish is masterfully prepared by our executive chefs, prioritizing rich artisanal textures, visually premium colors, and perfectly balanced organic pairings. Served ready at the perfect temperature to delight your senses.`;
      drawWrappedText(doc, culinaryWords, 19, stageY + 11, 102, 3.6);


      // RIGHT CONTENT BLOCK: PHOTO IMAGE FRAME (X: 135 to Width-15, Width: 132mm, Height: 99mm)
      const frameX = 135;
      const frameY = 25;
      const frameW = 147;
      const frameH = 110; 

      // Draw shadow border card background
      doc.setFillColor(colors.cardBg[0], colors.cardBg[1], colors.cardBg[2]);
      doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
      doc.setLineWidth(0.4);
      doc.roundedRect(frameX, frameY, frameW, frameH, 3, 3, "FD");

      // Render Image if available, otherwise beautiful pending placeholder
      if (dish.imageUrl) {
        try {
          // Add image snugly inside frame
          doc.addImage(dish.imageUrl, "JPEG", frameX + 2, frameY + 2, frameW - 4, frameH - 4);
          
          // Outer subtle frame overlay
          doc.setDrawColor(colors.bg[0], colors.bg[1], colors.bg[2]);
          doc.setLineWidth(1.5);
          doc.rect(frameX + 2, frameY + 2, frameW - 4, frameH - 4, "S");
        } catch (imgError) {
          console.error("PDF Image add failed:", imgError);
          // Fallback to stylized box
          drawDummyPlaceholder(doc, frameX, frameY, frameW, frameH, colors);
        }
      } else {
        drawDummyPlaceholder(doc, frameX, frameY, frameW, frameH, colors);
      }

    } else {
      // PORTRAIT SLIDE FORMAT
      // Title
      if (options.brandStyles?.dishName) {
        applyBrandTextStyle(doc, options.brandStyles.dishName, "Helvetica", "bold", 18, colors.textPrimary);
      } else {
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(18);
        doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
      }
      doc.text(dish.name, 15, 28);

      if (options.brandStyles?.category) {
        applyBrandTextStyle(doc, options.brandStyles.category, "Helvetica", "normal", 8, colors.brand);
      } else {
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(colors.brand[0], colors.brand[1], colors.brand[2]);
      }
      doc.text(dish.category.toUpperCase(), 15, 33);

      // Price rendering in Portrait mode
      if (printedPrice) {
        if (options.brandStyles?.dishPrice) {
          applyBrandTextStyle(doc, options.brandStyles.dishPrice, "Helvetica", "bold", 13, colors.brand);
        } else {
          doc.setFont("Helvetica", "bold");
          doc.setFontSize(13);
          doc.setTextColor(colors.brand[0], colors.brand[1], colors.brand[2]);
        }
        doc.text(printedPrice, pgWidth - 15, 30, { align: "right" });
      }

      // Photo frame
      const frameX = 15;
      const frameY = 37;
      const frameW = pgWidth - 30;
      const frameH = (pgWidth - 30) * 0.75; // 4:3 Ratio

      doc.setFillColor(colors.cardBg[0], colors.cardBg[1], colors.cardBg[2]);
      doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
      doc.roundedRect(frameX, frameY, frameW, frameH, 2, 2, "FD");

      if (dish.imageUrl) {
        try {
          doc.addImage(dish.imageUrl, "JPEG", frameX + 2, frameY + 2, frameW - 4, frameH - 4);
        } catch (e) {
          drawDummyPlaceholder(doc, frameX, frameY, frameW, frameH, colors);
        }
      } else {
        drawDummyPlaceholder(doc, frameX, frameY, frameW, frameH, colors);
      }

      // Description & items
      if (options.brandStyles?.dishDescription) {
        applyBrandTextStyle(doc, options.brandStyles.dishDescription, "Helvetica", "normal", 10, colors.textSecondary);
      } else {
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
      }
      let portY = frameY + frameH + 8;
      portY = drawWrappedText(doc, dish.description, 15, portY, pgWidth - 30, 5);

      // Ingredients
      portY += 4;
      if (options.brandStyles?.category) {
        applyBrandTextStyle(doc, options.brandStyles.category, "Helvetica", "bold", 8.5, colors.brand);
      } else {
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(colors.brand[0], colors.brand[1], colors.brand[2]);
      }
      doc.text("RECIPE INGREDIENTS:", 15, portY);
      
      if (options.brandStyles?.dishIngredients) {
        applyBrandTextStyle(doc, options.brandStyles.dishIngredients, "Helvetica", "normal", 9, colors.textSecondary);
      } else {
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
      }
      
      const ingString = dish.ingredientsText !== undefined 
        ? dish.ingredientsText.replace(/^(key\s+)?ingredients:\s*/i, "")
        : (dish.keyIngredients || []).join(" • ") || "Premium organic select ingredients.";
      portY += 4.5;
      drawWrappedText(doc, ingString, 15, portY, pgWidth - 30, 4.5);
    }
  });

  // Save the generated document
  const nameLabel = (options.restaurantName || "Bistro").toLowerCase().replace(/\s+/g, "_");
  const fileName = `${nameLabel}_Presentation_Deck_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
}

// Draw a highly professional visual placeholder box for pending photos
function drawDummyPlaceholder(doc: jsPDF, x: number, y: number, w: number, h: number, colors: any) {
  // Fill inside with deep slate
  doc.setFillColor(colors.innerBg[0], colors.innerBg[1], colors.innerBg[2]);
  doc.rect(x + 2, y + 2, w - 4, h - 4, "F");

  // Dashed lines / grid-looking diagonal
  doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
  doc.setLineWidth(0.2);
  doc.line(x + 2, y + 2, x + w - 2, y + h - 2);
  doc.line(x + w - 2, y + 2, x + 2, y + h - 2);

  // Inner aesthetic frame
  doc.setLineWidth(0.3);
  doc.rect(x + 10, y + 10, w - 20, h - 20, "S");

  // Outlined camera/studio drawing
  const centerX = x + w / 2;
  const centerY = y + h / 2;

  // Icon block
  doc.setFillColor(colors.cardBg[0], colors.cardBg[1], colors.cardBg[2]);
  doc.setLineWidth(0.5);
  doc.roundedRect(centerX - 15, centerY - 12, 30, 16, 1, 1, "FD");
  doc.circle(centerX, centerY - 4, 4, "S");
  doc.rect(centerX - 4, centerY - 15, 8, 3, "S");

  // Elegant text
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(colors.brand[0], colors.brand[1], colors.brand[2]);
  doc.text("CULINARY PRESENTATION STAGE", centerX, centerY + 12, { align: "center" });

  doc.setFont("Helvetica", "italic");
  doc.setFontSize(7);
  doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
  doc.text("Plating Design Frame • Visual Presentation Studio", centerX, centerY + 16, { align: "center" });
}
