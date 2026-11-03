import type { Product } from "./types";

export const KIDS_SHIRT_SIZES = ["2T", "3T", "4T", "5T", "YXS", "YS", "YM", "YL", "YXL"] as const;
export const ADULT_SHIRT_SIZES = ["S", "M", "L", "XL", "2XL", "3XL"] as const;
// This registry enables pricing only. It does not create or activate products.
// Held artwork must remain unpublished until separately approved.
const COLLECTION_SHIRT_SLUGS = new Set([
  "inspirada-bulldogs-varsity-shirt",
  "inspirada-bulldogs-stacked-shirt",
  "inspirada-bulldogs-top-dogs-26-27-shirt",
  "inspirada-bulldogs-monochrome-football-shirt",
  "inspirada-bulldogs-2026-badge-shirt",
  "inspirada-bulldogs-2026-spiked-circle-shirt",
  "bulldogs-coach-varsity-shirt",
  "bulldogs-coach-stacked-shirt",
  "bulldogs-coach-monochrome-shirt",
  "stay-wild-move-different-shirt",
  "matrix-code-green-t-shirt",
  "matrix-static-green-t-shirt",
  "lucent-vortex-green-t-shirt",
  "lucent-faces-green-t-shirt",
  "lucent-faces-blue-t-shirt",
  "lucent-faces-red-t-shirt",
  "vintage-static-tv-t-shirt",
  "green-crowned-lion-t-shirt",
  "a-godly-woman-t-shirt",
  "confidence-olive-t-shirt",
  "desert-spook-season-t-shirt",
  "halloween-crowned-pumpkin-t-shirt",
  "halloween-masked-lollipop-t-shirt",
  "halloween-card-reaper-t-shirt",
  "halloween-horror-squad-t-shirt",
  "halloween-vegas-skeleton-t-shirt",
  "halloween-crowned-ghost-t-shirt",
  "faith-over-fear-t-shirt",
  "faith-archer-dark-t-shirt",
  "faith-archer-light-t-shirt",
  "mo-masc-racing-t-shirt",
  "mo-masc-red-brush-t-shirt",
  "reaper-roses-t-shirt",
  "las-vegas-raiders-t-shirt",
  "tiger-mom-t-shirt",
  "tiger-grandma-t-shirt",
  "tiger-bonus-dad-t-shirt",
  "tiger-baby-bro-t-shirt",
  "kc-crown-claw-t-shirt",
  "halloween-portrait-italian-woman-t-shirt",
  "halloween-portrait-asian-woman-t-shirt",
  "halloween-portrait-black-woman-t-shirt",
  "halloween-portrait-light-skinned-black-woman-t-shirt",
  "statue-blood-t-shirt",
  "three-silent-reapers-t-shirt",
  "inspirada-bulldogs-custom-shirt",
  "bulldogs-bolt-custom-shirt",
  "exotica-scissors-custom-shirt",
  "tiger-baby-bro-custom-shirt"
]);
export function isCollectionShirt(product: Pick<Product, "slug">) {
  return COLLECTION_SHIRT_SLUGS.has(product.slug);
}
export function collectionShirtPrice(size: string): number | null {
  if ((KIDS_SHIRT_SIZES as readonly string[]).includes(size)) return 20;
  if ((ADULT_SHIRT_SIZES as readonly string[]).includes(size)) return 25;
  return null;
}
export const COLLECTION_SHIRT_PRICE_LABEL = "Kids/youth $20 · Adults $25 · Pictured print placement included";

export function collectionShirtPriceLabel(product: Pick<Product, "slug">) {
  return product.slug === "inspirada-bulldogs-monochrome-football-shirt"
    ? "Kids/youth $20 · Adults $25 · Higher centered chest print · Back blank"
    : COLLECTION_SHIRT_PRICE_LABEL;
}
