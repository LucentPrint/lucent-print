import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { auditAdminAction } from "@/lib/admin-resource";

const schema = z.object({ productId: z.string().uuid(), change: z.coerce.number().int(), reason: z.string().min(2), referenceId: z.string().optional() });

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const supabase = createAdminClient();
  if (!supabase) return NextResponse.json({ error: "Service role not configured" }, { status: 503 });
  const { data, error } = await supabase.rpc("adjust_inventory", {
    p_product_id: parsed.data.productId,
    p_change: parsed.data.change,
    p_reason: parsed.data.reason,
    p_reference_id: parsed.data.referenceId ?? null,
  });
  if (!error) await auditAdminAction({ adminUserId: admin.id, action: "adjust_inventory", entityType: "product", entityId: parsed.data.productId, after: parsed.data });
  return NextResponse.json(error ? { error: error.message } : { inventoryQuantity: data }, { status: error ? 400 : 200 });
}
