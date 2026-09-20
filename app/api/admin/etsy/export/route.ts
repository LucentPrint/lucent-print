import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

function csv(value: unknown) {
  const text = Array.isArray(value) ? value.join("|") : String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = createAdminClient();
  if (!supabase) return NextResponse.json({ error: "Service role not configured" }, { status: 503 });
  const { data, error } = await supabase.from("products").select("slug,name,description,price,inventory_quantity,materials:material,colors,images,status,etsy_taxonomy_id,etsy_shipping_profile_id").eq("is_active", true).order("sort_order");
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  const header = ["SKU","TITLE","DESCRIPTION","PRICE","QUANTITY","MATERIALS","TAGS","IMAGE_URLS","STATE","TAXONOMY_ID","SHIPPING_PROFILE_ID"];
  const rows = (data ?? []).map((row) => [row.slug,row.name,row.description,row.price,row.inventory_quantity,row.materials,row.colors,row.images,row.status === "active" || row.status === "preorder" ? "active" : "draft",row.etsy_taxonomy_id,row.etsy_shipping_profile_id].map(csv).join(","));
  return new NextResponse([header.join(","), ...rows].join("\n"), { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": "attachment; filename=lucent-print-etsy-export.csv" } });
}
