import type { Product } from "@/lib/types";

export function isApparelProduct(product: Product) {
  const text = `${product.collection} ${product.category} ${product.material} ${product.name}`.toLowerCase();
  return ["apparel", "shirt", "hoodie", "clothing"].some((term) => text.includes(term));
}

export function isDrinkwareProduct(product: Product) {
  const text = `${product.collection} ${product.category} ${product.material} ${product.name}`.toLowerCase();
  return ["drinkware", "tumbler", "water bottle", "glass can", "coffee mug"].some((term) => text.includes(term));
}
