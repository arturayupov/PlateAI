import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Set up larger limits for base64 image editing transfers
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ limit: "25mb", extended: true }));

// Initialize GoogleGenAI SDK with server-side API Key & user-agent header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Endpoint: Parse text menu or single dish into structured culinary list
app.post("/api/menu/parse", async (req, res) => {
  try {
    const { menuText } = req.body;
    if (!menuText || typeof menuText !== "string" || !menuText.trim()) {
      return res.status(400).json({ error: "Menu text is required." });
    }

    const prompt = `
You are an expert culinary consultant and professional food stylist.
Parse the following unstructured menu text or single-dish description and extract all dishes into a highly structured culinary schema.
For each dish, formulate a concise, premium commercial description and determine key visible ingredients.
Crucially, add a "visualDescription" which acts as a staging and presentation instruction for a professional food photographer (specifying color contrast, garnish placements, surface shine, steam, or crumb details).

Menu text to parse:
"""
${menuText}
"""
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            dishes: {
              type: Type.ARRAY,
              description: "Structured list of parsed menu items",
              items: {
                type: Type.OBJECT,
                properties: {
                  name: {
                    type: Type.STRING,
                    description: "Accurate name of the dish",
                  },
                  category: {
                    type: Type.STRING,
                    description: "Category: Appetizer, Main Course, Side, Dessert, Beverage, Salad, or Brunch",
                  },
                  description: {
                    type: Type.STRING,
                    description: "A short, elegant description suitable for high-end digital menus",
                  },
                  keyIngredients: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "List of key ingredients that should physically stand out or be visible on the plate",
                  },
                  visualDescription: {
                    type: Type.STRING,
                    description: "Food presentation/styling suggestion (garnish, textures, saucing, plate color, steam)",
                  },
                  price: {
                    type: Type.NUMBER,
                    description: "Optional price of the dish if mentioned in the text. Do not include currency symbols.",
                  },
                  currency: {
                    type: Type.STRING,
                    description: "Optional currency code (USD, EUR, RUB, GBP, CNY) if mentioned or inferred from symbols ($ for USD, € for EUR, ₽/руб for RUB, £ for GBP, ¥ for CNY). Default to USD if price is present but currency is missing.",
                  },
                },
                required: ["name", "category", "description", "keyIngredients", "visualDescription"],
              },
            },
          },
          required: ["dishes"],
        },
      },
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("Empty response received from the parser.");
    }

    const jsonResult = JSON.parse(resultText.trim());
    return res.json(jsonResult);
  } catch (error: any) {
    console.error("Error in menu parsing:", error);
    return res.status(500).json({
      error: "Failed to parse the menu. " + (error?.message || ""),
    });
  }
});

// Endpoint: Generate or Regenerate description & keyIngredients list for a specific dish
app.post("/api/menu/generate-details", async (req, res) => {
  try {
    const { name, category, menuContext } = req.body;
    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ error: "Dish name is required for generation." });
    }

    const promptText = `
You are an expert executive chef, culinary copywriter, and high-end restaurant menu designer.
Compose a beautiful, gourmet, appetizing retail commercial description and determine the 3 to 6 key visible ingredients for the dish: "${name}" which belongs to category "${category || "Main Course"}".

Refer to the uploaded menu context text below if it mentions this culinary dish. Extract and improve its phrasing to sound incredibly delicious and luxury. 
If the text does not mention this dish or contains very few details, creatively draft an exceptional Michelin-star level fine dining description and select the key highlight ingredients.

Menu context text:
"""
${menuContext || ""}
"""

Output the details strictly in JSON matching the specified schema.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: promptText,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description: {
              type: Type.STRING,
              description: "A highly appetizing, premium retail commercial description suitable for physical printing, exactly 1 to 2 sentences.",
            },
            keyIngredients: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of 3 to 6 outstanding premium ingredients that physically decorate or are highly visible on the plate",
            },
          },
          required: ["description", "keyIngredients"],
        },
      },
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("No content generated for the details.");
    }

    const jsonResult = JSON.parse(resultText.trim());
    return res.json(jsonResult);
  } catch (error: any) {
    console.error("Error generating dish details:", error);
    return res.status(500).json({
      error: "Failed to generate details. " + (error?.message || ""),
    });
  }
});

// Endpoint: Generate high-quality food photography from scratch for a dish
app.post("/api/image/generate", async (req, res) => {
  try {
    const { name, visualDescription, style, imageSize, aspectRatio } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Dish name is required for generation." });
    }

    // Determine the style prompt based on 'Rustic/Dark', 'Bright/Modern', or 'Social Media' (top-down flatlay)
    let styleInstructions = "";
    if (style === "Rustic/Dark") {
      styleInstructions = `
Rustic/Dark theme with rich side chiaroscuro lighting, deep shadows, and moody organic ambient highlights.
The food is styled on a dark, rustic textured slate or weathered deep charcoal wooden block.
Background items include copper utensils, raw linen napkins, a dusting of spices, or micro herb sprigs.
Photorealistic food commercial, macro close-up focus with a beautiful, deep, shallow field of view. Shot on a 100mm f/2.8 macro lens.
High contrast, warm wood and coal tones.
`;
    } else if (style === "Bright/Modern") {
      styleInstructions = `
Bright/Modern high-key aesthetic, clean minimalist vibe, bright soft diffused natural lighting with faint airy shadows.
Presented elegantly on a matte white porcelain plate or stylish modern ceramic dish, set against an off-white marble countertop or soft pastel table drape.
Dressed with vibrant green garnishes or a light spray of olive oil.
Editorial premium lifestyle food photo, extremely crisp details, beautiful bright colors, soft depth of field. Shot on 85mm f/4 lens.
`;
    } else if (style === "Social Media") {
      styleInstructions = `
Modern Social Media style flatlay.
A perfect 90-degree overhead top-down perspective, graphic and beautifully ordered layout of the plate and utensils.
Set on a modern pastel pop-color background or perfectly clean Scandinavian wood surface.
Consistent uniform studio lighting across the frame with rich, highly vivid textures and pop colors.
Garnishes look incredibly deliberate and visually pleasing. Clean, sharp focus across the entire dish.
`;
    } else {
      // Fallback elegant general style
      styleInstructions = `
High-end commercial food advertisement photography. Fine dining presentation with exquisite garnish, balanced composition, excellent studio lighting, natural vibrant colors.
`;
    }

    const promptText = `
Professional commercial food photography of: ${name}.
Culinary properties and plating notes: ${visualDescription || "Masterful, mouth-watering arrangement"}.
Style Guide:
${styleInstructions}
Ensure the food looks completely cooked, delicious, realistic, glistening, and of Michelin-star restaurant quality. Absolute realism. No artificial sheen or fake textures.
`;

    let base64Image = "";
    let usingFallback = false;
    let fallbackModel = "";

    try {
      console.log("Attempting image generation with premium model: gemini-3-pro-image-preview...");
      const response = await ai.models.generateContent({
        model: "gemini-3-pro-image-preview",
        contents: {
          parts: [{ text: promptText }],
        },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio || "4:3",
            imageSize: imageSize || "1K", // "1K", "2K", "4K"
          },
        },
      });

      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            base64Image = `data:image/png;base64,${part.inlineData.data}`;
            break;
          }
        }
      }
    } catch (firstError: any) {
      console.error("Premium image generation failed, trying fallbacks:", firstError);
      
      const isQuotaOrLimitError = 
        firstError?.message?.includes("429") || 
        firstError?.message?.includes("RESOURCE_EXHAUSTED") || 
        firstError?.message?.includes("quota") || 
        firstError?.status === "RESOURCE_EXHAUSTED";

      try {
        console.log("Attempting fallback to standard model: imagen-3.0-generate-002...");
        fallbackModel = "imagen-3.0-generate-002";
        usingFallback = true;

        const response = await ai.models.generateImages({
          model: "imagen-3.0-generate-002",
          prompt: promptText,
          config: {
            numberOfImages: 1,
            outputMimeType: "image/jpeg",
            aspectRatio: aspectRatio || "4:3",
          },
        });

        if (response.generatedImages?.[0]?.image?.imageBytes) {
          base64Image = `data:image/jpeg;base64,${response.generatedImages[0].image.imageBytes}`;
          console.log("Fallback to imagen-3.0-generate-002 succeeded!");
        } else {
          throw new Error("Empty bytes returned from imagen-3.0-generate-002");
        }
      } catch (fallbackError1: any) {
        console.error("Fallback to imagen-3.0-generate-002 failed, trying newer fallback:", fallbackError1);

        try {
          console.log("Attempting fallback to standard model: imagen-4.0-generate-001...");
          fallbackModel = "imagen-4.0-generate-001";
          usingFallback = true;

          const response = await ai.models.generateImages({
            model: "imagen-4.0-generate-001",
            prompt: promptText,
            config: {
              numberOfImages: 1,
              outputMimeType: "image/jpeg",
              aspectRatio: aspectRatio || "4:3",
            },
          });

          if (response.generatedImages?.[0]?.image?.imageBytes) {
            base64Image = `data:image/jpeg;base64,${response.generatedImages[0].image.imageBytes}`;
            console.log("Fallback to imagen-4.0-generate-001 succeeded!");
          } else {
            throw new Error("Empty bytes returned from imagen-4.0-generate-001");
          }
        } catch (fallbackError2: any) {
          console.error("All image generation strategies failed.", fallbackError2);

          let errorDesc = firstError?.message || fallbackError2?.message || "Unknown error";
          if (isQuotaOrLimitError) {
            errorDesc = "Google AI Studio free trial quota has been exhausted/not-allowed for premium model gemini-3-pro-image-preview (RESOURCE_EXHAUSTED). To resolve this, you can enable a paid plan / Billing in Google AI Studio, or upgrade your API Key in Settings > Secrets. In the meantime, standard fallback generators were also blocked.";
          }
          throw new Error(errorDesc);
        }
      }
    }

    if (!base64Image) {
      throw new Error("No image data could be retrieved from any model. Please check your text input or prompt safety.");
    }

    return res.json({ 
      imageUrl: base64Image, 
      style, 
      imageSize, 
      aspectRatio,
      usingFallback,
      fallbackModel
    });
  } catch (error: any) {
    console.error("Error in image generation endpoint final block:", error);
    return res.status(500).json({
      error: "Food photo photoshoot failed. " + (error?.message || error || ""),
    });
  }
});

// Endpoint: Edit existing food photo using base64 image + natural text edits
app.post("/api/image/edit", async (req, res) => {
  try {
    const { base64Image, editPrompt, imageSize, aspectRatio } = req.body;
    if (!base64Image) {
      return res.status(400).json({ error: "Base64 source image is required for editing." });
    }
    if (!editPrompt || typeof editPrompt !== "string" || !editPrompt.trim()) {
      return res.status(400).json({ error: "Edit prompt instruction is required." });
    }

    // Extract raw base64 and mime type
    let mimeType = "image/png";
    let pureBase64 = base64Image;

    const match = base64Image.match(/^data:([^;]+);base64,(.*)$/);
    if (match) {
      mimeType = match[1];
      pureBase64 = match[2];
    }

    const editInstructions = `
You are editing this food photography. Perform the following modification precisely while preserving the food structure, lighting style, and overall premium aesthetic of the rest of the plate:
"${editPrompt}"
Maintain a completely photorealistic, high-end, appetizing food presentation. No drawings, sketches, or artificial overlays.
`;

    // gemini-3.1-flash-image-preview is highly suited for image-to-image or context-driven edits
    let resultBase64 = "";
    try {
      console.log("Attempting image edit with premium model: gemini-3.1-flash-image-preview...");
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-image-preview",
        contents: {
          parts: [
            {
              inlineData: {
                data: pureBase64,
                mimeType: mimeType,
              },
            },
            {
              text: editInstructions,
            },
          ],
        },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio || "4:3",
            imageSize: imageSize || "1K",
          },
        },
      });

      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            resultBase64 = `data:image/png;base64,${part.inlineData.data}`;
            break;
          }
        }
      }
    } catch (firstError: any) {
      console.error("Premium image editing failed, trying standard fallback gemini-2.5-flash-image...", firstError);

      const isQuotaOrLimitError = 
        firstError?.message?.includes("429") || 
        firstError?.message?.includes("RESOURCE_EXHAUSTED") || 
        firstError?.message?.includes("quota") || 
        firstError?.status === "RESOURCE_EXHAUSTED";

      try {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash-image",
          contents: {
            parts: [
              {
                inlineData: {
                  data: pureBase64,
                  mimeType: mimeType,
                },
              },
              {
                text: editInstructions,
              },
            ],
          },
        });

        if (response.candidates?.[0]?.content?.parts) {
          for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
              resultBase64 = `data:image/png;base64,${part.inlineData.data}`;
              break;
            }
          }
        }
      } catch (fallbackError: any) {
        console.error("All image editing models failed:", fallbackError);

        let errorDesc = firstError?.message || fallbackError?.message || "Unknown editing error";
        if (isQuotaOrLimitError) {
          errorDesc = "Google AI Studio free trial quota has been exhausted/not-allowed for premium model gemini-3.1-flash-image-preview (RESOURCE_EXHAUSTED). To resolve this, you can enable a paid plan / Billing in Google AI Studio, or upgrade your API Key in Settings > Secrets.";
        }
        throw new Error(errorDesc);
      }
    }

    if (!resultBase64) {
      throw new Error("No edited image was returned. Check if the edit instructions are clear.");
    }

    return res.json({ imageUrl: resultBase64 });
  } catch (error: any) {
    console.error("Error in image editing:", error);
    return res.status(500).json({
      error: "Failed to edit food photo. " + (error?.message || error || ""),
    });
  }
});

// Configure Vite middleware or static builds depends on the environment
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Virtual Food Photographer active on http://0.0.0.0:${PORT}`);
  });
}

startServer();
