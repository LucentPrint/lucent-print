import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { ResourceManager } from "./resource-manager";

const map: Record<string, string> = {
  inventory: "inventory_events", orders: "orders", "custom-shirt-orders": "custom_orders", collections: "collections", reviews: "reviews",
  coupons: "coupons", newsletter: "newsletter_subscribers", "design-vault": "design_vault_items",
  "print-lab": "printers", wholesale: "wholesale_quotes", affiliates: "affiliate_applications",
  analytics: "analytics_events", loyalty: "loyalty_transactions", "etsy-listings": "etsy_listings",
};
const editable = new Set(["collections", "print-lab", "design-vault", "orders", "reviews", "coupons", "loyalty", "etsy-listings"]);

export default async function Page({ params }: { params: Promise<{ module: string }> }) {
  if (!(await requireAdmin())) return <section className="section"><div className="shell"><h1 className="title">Admin sign-in required.</h1><Link href="/auth/sign-in" className="btn btn-primary mt-6">Sign in</Link></div></section>;
  const moduleName = (await params).module;
  if (editable.has(moduleName)) return <ResourceManager resource={moduleName === "print-lab" ? "printers" : moduleName} title={moduleName.replaceAll("-", " ")} />;
  const table = map[moduleName];
  const supabase = createAdminClient();
  let rows: Record<string, unknown>[] = [];
  let error = "";
  if (table && supabase) {
    const result = await supabase.from(table).select("*").order("created_at", { ascending: false }).limit(250);
    rows = result.data ?? [];
    error = result.error?.message ?? "";
  }
  return <section className="section"><div className="shell"><p className="eyebrow">Admin module</p><h1 className="title my-6 capitalize">{moduleName.replaceAll("-", " ")}</h1><div className="glass overflow-auto rounded-2xl p-5">{error ? <p className="text-pink-300">{error}</p> : rows.length ? <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(rows, null, 2)}</pre> : <p className="muted">No records yet.</p>}</div></div></section>;
}
