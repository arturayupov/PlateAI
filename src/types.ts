export interface Dish {
  id: string;
  name: string;
  category: string;
  description: string;
  keyIngredients: string[];
  visualDescription: string;
  imageUrl?: string;
  imageId?: string; // server-side id of the clean (watermark-free) original
  isLoading?: boolean;
  error?: string;
  usingFallback?: boolean;
  fallbackModel?: string;
  // History of edits for this particular dish photo
  history?: string[]; 
  historyIndex?: number;
  price?: number;
  currency?: string;
  ingredientsText?: string;
  fieldStyles?: Record<string, { fontSize?: string; fontWeight?: string; fontStyle?: string; color?: string; fontFamily?: string }>;
  imageWidth?: number;
  imageHeight?: number;
}

export type FoodPhotoStyle = "Rustic/Dark" | "Bright/Modern" | "Social Media";

export type ImageSize = "1K" | "2K" | "4K";

export type AspectRatio = "1:1" | "4:3" | "16:9" | "3:4";

export interface GenerationSettings {
  style: FoodPhotoStyle;
  imageSize: ImageSize;
  aspectRatio: AspectRatio;
}

export interface TextStyle {
  fontSize?: string;
  fontWeight?: string;
  fontStyle?: string;
  color?: string;
  fontFamily?: string;
}

export interface BrandStyles {
  restaurantName?: TextStyle;
  restaurantTagline?: TextStyle;
  category?: TextStyle;
  dishName?: TextStyle;
  dishPrice?: TextStyle;
  dishDescription?: TextStyle;
  dishIngredients?: TextStyle;
}

