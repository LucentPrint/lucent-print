import type { Product } from "./types";

export const SHIRT_SIZES = ["YXS", "YS", "YM", "YL", "YXL", "S", "M", "L", "XL", "2XL", "3XL"] as const;
export const PRINT_PLACEMENTS = ["Front — full chest", "Front — left chest", "Large front", "Full back", "Sleeve"] as const;
export type PrintMethod = "heat-transfer" | "sublimation";
export type PrintLayout = "front" | "back" | "large-front" | "front-back";
export const SHIRT_PRICES = {
  "heat-transfer": {
    adult: { front: 18.99, back: 18.99, "front-back": 24.99 },
    youth: { front: 15.99, back: 15.99, "front-back": 20.99 },
    teamAdult: { front: 12, "front-back": 17 },
    teamYouth: { front: 10, "front-back": 14 },
  },
  sublimation: {
    adult: { front: 22.99, back: 24.99, "large-front": 24.99, "front-back": 27.99 },
    youth: { front: 18.99, back: 19.99, "front-back": 23.99 },
    teamAdult: { front: 15, "front-back": 20 },
    teamYouth: { front: 13, "front-back": 17 },
  },
} as const;
export const DRINKWARE = [
  { name: "20 oz Water Bottle", price: 24.99, bulkMinimum: 10, bulkPrice: 18, description: "Stainless, double-wall insulated. Full wrap. Handle lid + splash-proof lid, 2 straws, brush and gift box." },
  { name: "20 oz Skinny Tumbler", price: 24.99, bulkMinimum: 10, bulkPrice: 18, description: "Stainless, insulated, straight wall. Full wrap. Lid, straw and gift box." },
  { name: "16 oz Glass Can", price: 19.99, bulkMinimum: 12, bulkPrice: 14, description: "Clear or frosted glass with bamboo lid and straw." },
  { name: "11 oz Coffee Mug", price: 17.99, bulkMinimum: 12, bulkPrice: 12, description: "White ceramic. Dishwasher and microwave safe." },
] as const;

export function shirtUnitPrice(method: PrintMethod, size: string, layout: PrintLayout, quantity = 1, supply = "lucent"): number | null {
  if (!(SHIRT_SIZES as readonly string[]).includes(size)) return null;
  if (supply === "customer") return method === "heat-transfer" && layout !== "large-front" ? (layout === "front-back" ? 20 : 13) : null;
  const youth = size.startsWith("Y");
  const prices = SHIRT_PRICES[method];
  const standard: Partial<Record<PrintLayout, number>> = youth ? prices.youth : prices.adult;
  const team: Partial<Record<PrintLayout, number>> = youth ? prices.teamYouth : prices.teamAdult;
  const base = quantity >= 12 ? team[layout] ?? standard[layout] : standard[layout];
  if (base == null) return null;
  return base + (size === "2XL" ? 3 : size === "3XL" ? 5 : 0);
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
  return { quantity, lines, setup, requiresQuote, total: requiresQuote ? null : Math.round((subtotal + setup) * 100) / 100, team: quantity >= 12 && input.supply === "lucent" && (layout === "front" || layout === "front-back") };
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
