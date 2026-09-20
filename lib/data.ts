import { createClient } from "./supabase/server";
import type { Collection, DesignVaultItem, Printer, Product, Review } from "./types";

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function product(row: Record<string, unknown>): Product {
  const images = strings(row.images);
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    description: typeof row.description === "string" ? row.description : "",
    price: Number(row.price ?? 0),
    compareAtPrice: row.compare_at_price == null ? null : Number(row.compare_at_price),
    category: typeof row.category === "string" ? row.category : "Other",
    collection: typeof row.collection_name === "string" ? row.collection_name : "Lucent Print",
    material: typeof row.material === "string" ? row.material : "PLA",
    colors: strings(row.colors),
    images: images.length ? images : ["/images/lucent-print-coming-soon.webp"],
    status: (row.status as Product["status"]) ?? "draft",
    inventory: Number(row.inventory_quantity ?? 0),
    featured: Boolean(row.featured),
    bestSeller: Boolean(row.best_seller),
  };
}

export async function getProducts(): Promise<Product[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .neq("status", "archived")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) {
    console.error("Supabase products query failed:", error.message);
    return [];
  }
  return (data ?? []).map((row) => product(row as Record<string, unknown>));
}

export async function getFeaturedProducts(limit = 4): Promise<Product[]> {
  const products = await getProducts();
  const featured = products.filter((item) => item.featured);
  return (featured.length ? featured : products).slice(0, limit);
}

export async function getProduct(slug: string): Promise<Product | null> {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .neq("status", "archived")
    .maybeSingle();
  if (error) {
    console.error("Supabase product query failed:", error.message);
    return null;
  }
  return data ? product(data as Record<string, unknown>) : null;
}

export async function getCollections(): Promise<Collection[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("collections")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error) {
    console.error("Supabase collections query failed:", error.message);
    return [];
  }
  return (data ?? []).map((row) => ({
    id: String(row.id), name: String(row.name), slug: String(row.slug),
    description: row.description ?? "", imageUrl: row.image_url,
    featured: Boolean(row.featured), sortOrder: Number(row.sort_order ?? 0),
  }));
}

export async function getPrinters(): Promise<Printer[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data, error } = await supabase.from("printers").select("*").order("name");
  if (error) {
    console.error("Supabase printers query failed:", error.message);
    return [];
  }
  return (data ?? []).map((row) => ({
    id: String(row.id), name: String(row.name), status: row.status ?? "idle",
    currentJob: row.current_job ?? "No active job", progress: Number(row.progress ?? 0),
    estimatedCompletion: row.estimated_completion, lastUpdated: row.last_updated,
  }));
}

export async function getDesignVaultItems(): Promise<DesignVaultItem[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("design_vault_items")
    .select("*")
    .eq("is_public", true)
    .order("vote_count", { ascending: false });
  if (error) {
    console.error("Supabase Design Vault query failed:", error.message);
    return [];
  }
  return (data ?? []).map((row) => ({
    id: String(row.id), name: String(row.name), description: row.description ?? "",
    stage: row.stage ?? "concept", imageUrl: row.image_url, voteCount: Number(row.vote_count ?? 0),
  }));
}

export async function getProductReviews(productId: string): Promise<Review[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("reviews")
    .select("id, rating, title, body, verified, created_at, profiles(full_name)")
    .eq("product_id", productId)
    .eq("status", "approved")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("Supabase reviews query failed:", error.message);
    return [];
  }
  return (data ?? []).map((row: Record<string, unknown>) => {
    const profile = row.profiles as { full_name?: string | null } | null;
    return {
      id: String(row.id),
      rating: Number(row.rating ?? 0),
      title: (row.title as string | null) ?? null,
      body: (row.body as string | null) ?? null,
      verified: Boolean(row.verified),
      createdAt: String(row.created_at),
      reviewerName: profile?.full_name ?? "Verified customer",
    };
  });
}
