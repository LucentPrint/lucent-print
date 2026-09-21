import type { MetadataRoute } from "next";
import { getProducts } from "@/lib/data";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const routes = [
    "",
    "/shop",
    "/our-work",
    "/design-vault",
    "/custom-studio",
    "/pricing",
    "/contact",
    "/loyalty",
    "/wholesale",
    "/subscriptions",
  ];
  const products = await getProducts();
  return [
    ...routes.map((url) => ({ url: base + url, lastModified: new Date() })),
    ...products.map((product) => ({
      url: `${base}/products/${product.slug}`,
      lastModified: new Date(),
    })),
  ];
}
