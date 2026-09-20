import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const allowedFileTypes = new Set(["application/pdf", "image/svg+xml", "image/png", "image/jpeg", "image/webp"]);

export async function POST(req: Request) {
  const form = await req.formData();
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Supabase unavailable" }, { status: 503 });
  const user = (await supabase.auth.getUser()).data.user;
  const name = String(form.get("name") ?? "").trim();
  const email = String(form.get("email") ?? user?.email ?? "").trim();
  const phone = String(form.get("phone") ?? "").trim();
  const design = String(form.get("description") ?? "").trim();
  if (!name || !email || !phone || !design) return NextResponse.json({ error: "Please complete all required fields." }, { status: 400 });

  let sizeRun: Record<string, number>;
  let placements: string[];
  try {
    sizeRun = JSON.parse(String(form.get("size_run") ?? "{}")) as Record<string, number>;
    placements = JSON.parse(String(form.get("placements") ?? "[]")) as string[];
  } catch {
    return NextResponse.json({ error: "Invalid order details." }, { status: 400 });
  }
  const quantity = Object.values(sizeRun).reduce((total, value) => total + Math.max(0, Number(value) || 0), 0);
  if (!quantity || !placements.length) return NextResponse.json({ error: "Add a shirt quantity and print placement." }, { status: 400 });

  const supply = String(form.get("shirt_supply") ?? "customer");
  const artwork = String(form.get("artwork_status") ?? "ready");
  const personalization = String(form.get("personalization") ?? "same");
  const neededBy = String(form.get("needed_by") ?? "");
  const locationRate = placements.length === 1 ? 16 : 27 + Math.max(0, placements.length - 2) * 6;
  const discount = quantity >= 50 ? 0.2 : quantity >= 24 ? 0.15 : quantity >= 12 ? 0.1 : 0;
  const lineSubtotal = quantity * (locationRate + (supply === "lucent" ? 9 : 0) + (personalization === "individual" ? 4 : 0));
  const setup = artwork === "design" ? 25 : 0;
  const rush = neededBy && new Date(neededBy).getTime() - Date.now() < 7 * 86400000 ? 0.25 : 0;
  const estimate = Number(((lineSubtotal * (1 - discount) + setup) * (1 + rush)).toFixed(2));

  let fileUrl: string | null = null;
  const file = form.get("file");
  if (file instanceof File && file.size) {
    if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: "Artwork files must be 10 MB or smaller." }, { status: 400 });
    if (!allowedFileTypes.has(file.type)) return NextResponse.json({ error: "Upload a PDF, SVG, PNG, JPG or WebP file." }, { status: 400 });
    const extension = file.name.split(".").pop()?.toLowerCase() || "bin";
    const path = `${user?.id ?? "guest"}/${crypto.randomUUID()}.${extension}`;
    const storage = user ? supabase : createAdminClient();
    if (!storage) return NextResponse.json({ error: "Upload service unavailable" }, { status: 503 });
    const { error } = await storage.storage.from("custom-order-files").upload(path, file, { contentType: file.type, upsert: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    fileUrl = path;
  }

  const details = [
    "CUSTOM SHIRT ORDER",
    `Organization: ${String(form.get("organization") ?? "") || "—"}`,
    `Phone: ${phone}`,
    `Garment: ${String(form.get("garment_type") ?? "T-shirt")}`,
    `Shirts supplied by: ${supply === "lucent" ? "Lucent Print" : "Customer"}`,
    `Brand/style: ${String(form.get("brand") ?? "") || "—"}`,
    `Size run: ${Object.entries(sizeRun).filter(([,value])=>Number(value)>0).map(([size,value])=>`${size}: ${value}`).join(", ")}`,
    `Placements: ${placements.join(", ")}`,
    `Artwork: ${artwork === "design" ? "Design help requested" : "Print-ready artwork supplied"}`,
    `Personalization: ${personalization === "individual" ? "Individual names/numbers" : "Same design on all shirts"}`,
    `Needed by: ${neededBy}`,
    `Fulfillment: ${String(form.get("fulfillment") ?? "Pickup — Las Vegas")}`,
    `Design: ${design}`,
    `Notes: ${String(form.get("notes") ?? "") || "—"}`,
  ].join("\n");

  const payload = {
    user_id: user?.id ?? null,
    name,
    email,
    description: details,
    dimensions: placements.join(", "),
    quantity,
    material: `Custom apparel · ${String(form.get("garment_type") ?? "T-shirt")}`,
    colors: String(form.get("shirt_color") ?? ""),
    file_url: fileUrl,
    status: "new",
    estimate,
  };
  const { error } = await supabase.from("custom_orders").insert(payload);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ message: "Your custom shirt request was received. Lucent Print will confirm the final price and schedule." });
}
