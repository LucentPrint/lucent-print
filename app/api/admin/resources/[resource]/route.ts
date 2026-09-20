import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { auditAdminAction, resourceConfig } from "@/lib/admin-resource";

const bodySchema = z.object({ id: z.string().uuid().optional(), values: z.record(z.string(), z.unknown()) });

export async function GET(_: Request, { params }: { params: Promise<{ resource: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const resource = (await params).resource;
  const config = resourceConfig(resource);
  const supabase = createAdminClient();
  if (!config || !supabase) return NextResponse.json({ error: "Unknown resource or missing service role" }, { status: 400 });
  const { data, error } = await supabase.from(config.table).select("*").order(config.order, { ascending: resource === "collections" || resource === "printers" }).limit(500);
  return NextResponse.json(error ? { error: error.message } : { rows: data }, { status: error ? 400 : 200 });
}

export async function POST(req: Request, { params }: { params: Promise<{ resource: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const resource = (await params).resource;
  const config = resourceConfig(resource);
  const parsed = bodySchema.safeParse(await req.json());
  const supabase = createAdminClient();
  if (!config || !parsed.success || !supabase) return NextResponse.json({ error: "Invalid request or missing service role" }, { status: 400 });
  const { id, values } = parsed.data;
  let before: unknown = null;
  if (id) before = (await supabase.from(config.table).select("*").eq("id", id).maybeSingle()).data;
  const query = id
    ? supabase.from(config.table).update(values).eq("id", id).select().single()
    : supabase.from(config.table).insert(values).select().single();
  const { data, error } = await query;
  if (!error) await auditAdminAction({ adminUserId: admin.id, action: id ? "update" : "create", entityType: resource, entityId: data?.id, before, after: data });
  return NextResponse.json(error ? { error: error.message } : { row: data }, { status: error ? 400 : 200 });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ resource: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const resource = (await params).resource;
  const config = resourceConfig(resource);
  const id = new URL(req.url).searchParams.get("id");
  const supabase = createAdminClient();
  if (!config || !id || !supabase) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const before = (await supabase.from(config.table).select("*").eq("id", id).maybeSingle()).data;
  const { error } = await supabase.from(config.table).delete().eq("id", id);
  if (!error) await auditAdminAction({ adminUserId: admin.id, action: "delete", entityType: resource, entityId: id, before });
  return NextResponse.json(error ? { error: error.message } : { ok: true }, { status: error ? 400 : 200 });
}
