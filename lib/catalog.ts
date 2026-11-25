import catalog from "@/data/catalog.json";

export type GarmentKind = "tee" | "knit" | "hoodie" | "shirt" | "jacket" | "coat";
export type TryOnCategory = "upper_body" | "lower_body" | "dresses";

export interface Product {
  id: string;
  name: string;
  kind: GarmentKind;
  color: string;
  tag: string;
  description: string;
  details: string[];
  image: string;
  backImage?: string;
  sideImage?: string;
  price_sar: number;
  category: string;
  tryon_category: TryOnCategory;
  colors: { name: string; hex: string }[];
  sizes: string[];
  ar?: { name: string; description: string; details: string[]; category: string; color: string };
}

/** Product with name/description/details/category/colour in the chosen language. */
export interface LocalProduct extends Product { colorName: string }

export function localize(p: Product, lang: "en" | "ar"): LocalProduct {
  if (lang === "ar" && p.ar) {
    return { ...p, name: p.ar.name, description: p.ar.description, details: p.ar.details, category: p.ar.category, colorName: p.ar.color };
  }
  return { ...p, colorName: p.colors[0]?.name ?? "" };
}

/** Arabic category label for filter chips (keyed by the English category). */
export function categoryLabel(category: string, lang: "en" | "ar"): string {
  if (lang !== "ar") return category;
  return PRODUCTS.find((p) => p.category === category)?.ar?.category ?? category;
}

export const PRODUCTS = catalog as Product[];
export const SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;
export const FREE_SHIPPING_FROM = 500; // SAR
export const SHIPPING_FEE = 25; // SAR

export const SIZE_GUIDE: [string, string, string, string][] = [
  ["XS", "86–91", "66", "19"],
  ["S", "91–97", "69", "20"],
  ["M", "97–104", "72", "21"],
  ["L", "104–112", "75", "22"],
  ["XL", "112–122", "77", "23"],
  ["XXL", "122–132", "79", "24"],
];

export const CATEGORY_LABELS: Record<TryOnCategory, string> = {
  upper_body: "Upper body — tops, shirts, knitwear, jackets",
  lower_body: "Lower body — trousers, skirts, shorts",
  dresses: "Dresses — full-length pieces",
};

export function getProduct(id: string | null | undefined): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}

export function categories(): string[] {
  return [...new Set(PRODUCTS.map((p) => p.category))];
}

export function colourNames(): string[] {
  return [...new Set(PRODUCTS.flatMap((p) => p.colors.map((c) => c.name)))].sort();
}

export { formatSAR } from "./i18n";

export function shippingFor(subtotal: number): number {
  if (subtotal <= 0) return 0;
  return subtotal >= FREE_SHIPPING_FROM ? 0 : SHIPPING_FEE;
}
