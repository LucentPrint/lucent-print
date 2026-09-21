import type { Product } from "./types";

export const FAMILY_AND_FRIENDS_CODE = "LUCENTP";

export const APPAREL_SIZES = [
  "Infant",
  "2T",
  "3T",
  "4T",
  "5T",
  "YS",
  "YM",
  "YL",
  "S",
  "M",
  "L",
  "XL",
  "2XL",
  "3XL",
  "4XL",
] as const;

export function normalizePromoCode(code?: string) {
  return code?.trim().toUpperCase() ?? "";
}

export function isBulldogsLaunchProduct(product: Product) {
  return `${product.name} ${product.slug}`.toLowerCase().includes("bulldog");
}

export function isFamilyAndFriendsCode(code?: string) {
  return normalizePromoCode(code) === FAMILY_AND_FRIENDS_CODE;
}

export function familyAndFriendsPrice(size?: string) {
  const normalized = size?.trim().toUpperCase();
  if (!normalized) return null;
  if (normalized === "INFANT" || /^[2-5]T$/.test(normalized)) return 15;
  if (["YS", "YM", "YL"].includes(normalized)) return 20;
  if (/^[2-9]XL$/.test(normalized)) return 27;
  if (["S", "M", "L", "XL"].includes(normalized)) return 25;
  return null;
}

export function promotionalUnitPrice(product: Product, size?: string, code?: string) {
  if (!isFamilyAndFriendsCode(code) || !isBulldogsLaunchProduct(product)) return product.price;
  return familyAndFriendsPrice(size) ?? product.price;
}
