import { NextResponse } from "next/server";
import { customShirtEstimate, SHIRT_SIZES, PRINT_PLACEMENTS, type PrintMethod } from "@/lib/custom-pricing";
import { isSublimationColor } from "@/lib/apparel-options";
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
  const printMethod = String(form.get("print_method") ?? "heat-transfer");
  if (!["heat-transfer", "sublimation"].includes(printMethod)) return NextResponse.json({ error: "Choose a valid printing method." }, { status: 400 });
  const shirtColor = String(form.get("shirt_color") ?? "").trim();
  if (printMethod === "sublimation" && !isSublimationColor(shirtColor)) return NextResponse.json({ error: "Choose white or one of the listed light colors for sublimation. For black or dark shirts, select heat transfer." }, { status: 400 });
  if (!name || !email || !phone || !design) return NextResponse.json({ error: "Please complete all required fields." }, { status: 400 });

  let sizeRun: Record<string, number>;
  let placements: string[];
  try {
    sizeRun = JSON.parse(String(form.get("size_run") ?? "{}")) as Record<string, number>;
    placements = JSON.parse(String(form.get("placements") ?? "[]")) as string[];
  } catch {
    return NextResponse.json({ error: "Invalid order details." }, { status: 400 });
  }
  if (!sizeRun || Array.isArray(sizeRun) || typeof sizeRun !== "object" || Object.entries(sizeRun).some(([size, count]) => !(SHIRT_SIZES as readonly string[]).includes(size) || !Number.isInteger(count) || count < 0 || count > 10000) || !Array.isArray(placements) || placements.some(p => !(PRINT_PLACEMENTS as readonly string[]).includes(p)) || new Set(placements).size !== placements.length) return NextResponse.json({ error: "Choose valid sizes, whole-shirt quantities and print placements." }, { status: 400 });
  const quantity = Object.values(sizeRun).reduce((total, value) => total + Math.max(0, Number(value) || 0), 0);
  if (!quantity || !placements.length) return NextResponse.json({ error: "Add a shirt quantity and print placement." }, { status: 400 });

  const supply = String(form.get("shirt_supply") ?? "customer");
  const artwork = String(form.get("artwork_status") ?? "ready");
  const personalization = String(form.get("personalization") ?? "same");
  const garment = String(form.get("garment_type") ?? "tshirt");
  const neededBy = String(form.get("needed_by") ?? "");
  if (!["customer", "lucent"].includes(supply) || !["ready", "design", "complex"].includes(artwork) || !["tshirt", "hoodie"].includes(garment)) return NextResponse.json({ error: "Choose valid garment and design options." }, { status: 400 });
  const pricing = customShirtEstimate({ method: printMethod as PrintMethod, quantities: sizeRun, placements, supply, garment, artwork });

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
    `Garment: ${garment === "hoodie" ? "Hoodie" : "T-shirt"}`,
    `Printing method: ${printMethod === "sublimation" ? "Sublimation — garment, print area and price require review" : "Normal heat transfer"}`,
    `Shirt color: ${shirtColor}`,
    `Shirts supplied by: ${supply === "lucent" ? "Lucent Print" : "Customer"}`,
    `Brand/style: ${String(form.get("brand") ?? "") || "—"}`,
    `Size run: ${Object.entries(sizeRun).filter(([,value])=>Number(value)>0).map(([size,value])=>`${size}: ${value}`).join(", ")}`,
    `Placements: ${placements.join(", ")}`,
    `Artwork: ${artwork === "design" ? "Design help requested" : "Print-ready artwork supplied"}`,
    "Design revisions: first 2 included; extra revisions $5 each. One design fee per team/bulk order.",
    `Pricing: ${pricing.total == null ? "Custom quote required" : `$${pricing.total.toFixed(2)} estimate before shipping`}`,
    `Design service: ${artwork === "complex" ? "Complex artwork from $35, quoted" : artwork === "design" ? "Custom design $15" : "Supplied artwork included"}`,
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
    material: `Custom apparel · ${garment === "hoodie" ? "Hoodie" : "T-shirt"}`,
    colors: shirtColor,
    file_url: fileUrl,
    status: "new",
    estimate: pricing.total,
  };
  const { error } = await supabase.from("custom_orders").insert(payload);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ message: "Your custom shirt request was received. Lucent Print will confirm the final price and schedule." });
}
