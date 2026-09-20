import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { auditAdminAction } from "@/lib/admin-resource";

const schema = z.object({
  id: z.string().uuid().optional(), slug: z.string().min(2), sku: z.string().nullable().optional(), name: z.string().min(2),
  description: z.string().optional().default(""), price: z.coerce.number().min(0), compare_at_price: z.coerce.number().min(0).nullable().optional(),
  category: z.string().optional(), collection_id: z.string().uuid().nullable().optional(), collection_name: z.string().optional(),
  material: z.string().optional(), colors: z.array(z.string()).optional(), tags: z.array(z.string()).optional(), images: z.array(z.string()).optional(),
  status: z.enum(["active","preorder","coming_soon","draft","sold_out","archived"]), inventory_quantity: z.coerce.number().int().min(0),
  low_stock_threshold: z.coerce.number().int().min(0).optional(), featured: z.boolean().optional(), best_seller: z.boolean().optional(), is_active: z.boolean().optional(),
  sort_order: z.coerce.number().int().optional(), weight_oz: z.coerce.number().min(0).nullable().optional(), length_in: z.coerce.number().min(0).nullable().optional(),
  width_in: z.coerce.number().min(0).nullable().optional(), height_in: z.coerce.number().min(0).nullable().optional(),
  etsy_taxonomy_id: z.coerce.number().int().nullable().optional(), etsy_shipping_profile_id: z.coerce.number().int().nullable().optional(),
  seo_title: z.string().optional(), seo_description: z.string().optional(),
});

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = createAdminClient();
  if (!supabase) return NextResponse.json({ error: "Service role not configured" }, { status: 503 });
  const [products, collections] = await Promise.all([
    supabase.from("products").select("*").order("sort_order").order("created_at", { ascending: false }),
    supabase.from("collections").select("id,name,slug").order("sort_order"),
  ]);
  const error = products.error ?? collections.error;
  return NextResponse.json(error ? { error: error.message } : { products: products.data, collections: collections.data }, { status: error ? 400 : 200 });
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const supabase = createAdminClient();
  if (!supabase) return NextResponse.json({ error: "Service role not configured" }, { status: 503 });
  const { id, ...values } = parsed.data;
  const before = id ? (await supabase.from("products").select("*").eq("id", id).maybeSingle()).data : null;
  const query = id
    ? supabase.from("products").update({ ...values, updated_at: new Date().toISOString() }).eq("id", id).select().single()
    : supabase.from("products").insert({ ...values, updated_at: new Date().toISOString() }).select().single();
  const { data, error } = await query;
  if (!error) await auditAdminAction({ adminUserId: admin.id, action: id ? "update" : "create", entityType: "product", entityId: data.id, before, after: data });
  return NextResponse.json(error ? { error: error.message } : { product: data }, { status: error ? 400 : 200 });
}

export async function DELETE(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id");
  const supabase = createAdminClient();
  if (!supabase || !id) return NextResponse.json({ error: "Missing configuration or id" }, { status: 400 });
  const before = (await supabase.from("products").select("*").eq("id", id).maybeSingle()).data;
  const { error } = await supabase.from("products").update({ is_active: false, status: "archived", updated_at: new Date().toISOString() }).eq("id", id);
  if (!error) await auditAdminAction({ adminUserId: admin.id, action: "archive", entityType: "product", entityId: id, before });
  return NextResponse.json(error ? { error: error.message } : { ok: true }, { status: error ? 400 : 200 });
}
