import { createAdminClient } from "@/lib/supabase/admin";

export const adminResources = {
  collections: { table: "collections", order: "sort_order" },
  printers: { table: "printers", order: "name" },
  "design-vault": { table: "design_vault_items", order: "created_at" },
  orders: { table: "orders", order: "created_at" },
  reviews: { table: "reviews", order: "created_at" },
  coupons: { table: "coupons", order: "created_at" },
  loyalty: { table: "loyalty_transactions", order: "created_at" },
  "print-jobs": { table: "print_jobs", order: "created_at" },
  "etsy-listings": { table: "etsy_listings", order: "updated_at" },
} as const;

export type AdminResource = keyof typeof adminResources;

export function resourceConfig(resource: string) {
  return adminResources[resource as AdminResource] ?? null;
}

export async function auditAdminAction(input: {
  adminUserId: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  before?: unknown;
  after?: unknown;
}) {
  const supabase = createAdminClient();
  if (!supabase) return;
  await supabase.from("admin_audit_log").insert({
    admin_user_id: input.adminUserId,
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    before_data: input.before ?? null,
    after_data: input.after ?? null,
  });
}
