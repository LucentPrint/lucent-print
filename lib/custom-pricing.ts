import type { Product } from "./types";

export const SHIRT_SIZES = ["Infant", "2T", "3T", "4T", "5T", "YXS", "YS", "YM", "YL", "YXL", "S", "M", "L", "XL", "2XL", "3XL"] as const;
export const PRINT_PLACEMENTS = ["Front — full chest", "Front — left chest", "Large front", "Full back", "Sleeve"] as const;
export type PrintMethod = "heat-transfer" | "sublimation";
export type PrintLayout = "front" | "back" | "large-front" | "front-back";
export const DRINKWARE = [
  { name: "20 oz Water Bottle", price: 24.99, bulkMinimum: 10, bulkPrice: 18, description: "Stainless, double-wall insulated. Full wrap. Handle lid + splash-proof lid, 2 straws, brush and gift box." },
  { name: "20 oz Skinny Tumbler", price: 19.99, bulkMinimum: 10, bulkPrice: 19.99, description: "Stainless, insulated, straight wall. Full wrap. Lid, straw and gift box." },
  { name: "16 oz Glass Can", price: 19.99, bulkMinimum: 12, bulkPrice: 14, description: "Clear or frosted glass with bamboo lid and straw." },
  { name: "11 oz Coffee Mug", price: 17.99, bulkMinimum: 12, bulkPrice: 12, description: "White ceramic. Dishwasher and microwave safe." },
] as const;

export function shirtUnitPrice(method: PrintMethod, size: string, layout: PrintLayout, quantity = 1, supply = "lucent"): number | null {
  void quantity;
  if (!(SHIRT_SIZES as readonly string[]).includes(size)) return null;
  if (supply === "customer" && method === "sublimation") return null;
  if (method === "heat-transfer" && layout === "large-front") return null;
  if (method === "sublimation" && layout === "large-front" && ["Infant", "2T", "3T", "4T", "5T", "YXS", "YS", "YM", "YL", "YXL"].includes(size)) return null;
  const oneSided = ["Infant", "2T", "3T", "4T", "5T", "YXS"].includes(size) ? 12.99
    : ["YS", "YM", "YL", "YXL"].includes(size) ? 15.99
    : ["S", "M", "L"].includes(size) ? 19.99
    : size === "XL" ? 21.99
    : size === "2XL" ? 22.99
    : 24.99;
  return Math.round((oneSided + (layout === "front-back" ? 5 : 0)) * 100) / 100;
}

export function layoutForPlacements(placements: string[]): PrintLayout | null {
  if (placements.length === 1) {
    if (placements[0] === "Full back") return "back";
    if (placements[0] === "Large front") return "large-front";
    if (["Front — full chest", "Front — left chest"].includes(placements[0])) return "front";
  }
  if (placements.length === 2 && placements.includes("Full back") && placements.some(p => ["Front — full chest", "Front — left chest"].includes(p))) return "front-back";
  return null;
}

export function customShirtEstimate(input: { method: PrintMethod; quantities: Record<string, number>; placements: string[]; supply: string; garment: string; artwork: string }) {
  const entries = Object.entries(input.quantities).filter(([, q]) => q > 0);
  const quantity = entries.reduce((sum, [, q]) => sum + q, 0);
  const layout = layoutForPlacements(input.placements);
  const lines = entries.map(([size, count]) => ({ size, count, unit: layout ? shirtUnitPrice(input.method, size, layout, quantity, input.supply) : null }));
  const setup = input.artwork === "design" ? 15 : 0;
  const requiresQuote = input.garment !== "tshirt" || input.artwork === "complex" || lines.some(line => line.unit == null) || !layout;
  const subtotal = Math.round(lines.reduce((sum, line) => sum + (line.unit ?? 0) * line.count, 0) * 100) / 100;
  return { quantity, lines, setup, requiresQuote, total: requiresQuote ? null : Math.round((subtotal + setup) * 100) / 100, team: false };
}

// Existing cotton designs have a fixed print layout; their size and team rates follow the price list.
export const CATALOG_SHIRT_LAYOUTS: Record<string, PrintLayout> = {
  "inspirada-bulldogs-custom-shirt": "front-back",
  "bulldogs-bolt-custom-shirt": "front",
  "exotica-scissors-custom-shirt": "front",
  "tiger-baby-bro-custom-shirt": "front",
};
export function catalogUnitPrice(product: Product, size = "S", quantity = 1) {
  const layout = CATALOG_SHIRT_LAYOUTS[product.slug];
  if (!layout) return product.price;
  return shirtUnitPrice("heat-transfer", size, layout, quantity) ?? product.price;
}
