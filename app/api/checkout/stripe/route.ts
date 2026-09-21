import { NextResponse } from "next/server";
import Stripe from "stripe";
import { z } from "zod";
import { getProducts } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";

const checkoutSchema = z.object({
  items: z.array(z.object({
    id: z.string().uuid(),
    quantity: z.number().int().min(1).max(10).default(1),
    selectedColor: z.string().trim().max(80).optional(),
  })).min(1).max(50),
});

export async function POST(req: Request) {
  try {
    const apiKey = process.env.STRIPE_API_KEY || process.env.STRIPE_SECRET_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Stripe is not configured." }, { status: 503 });
    }

    const { items } = checkoutSchema.parse(await req.json());
    const products = await getProducts();
    const safeItems: Array<{
      id: string;
      name: string;
      price: number;
      quantity: number;
      selectedColor?: string;
    }> = [];

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map((item) => {
      const product = products.find((candidate) => candidate.id === item.id);
      if (!product || product.price <= 0 || product.status !== "active") {
        throw new Error("One or more products are unavailable.");
      }
      if (product.inventory < item.quantity) {
        throw new Error(`${product.name} does not have enough stock.`);
      }

      safeItems.push({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        selectedColor: item.selectedColor,
      });

      return {
        quantity: item.quantity,
        price_data: {
          currency: "usd",
          unit_amount: Math.round(product.price * 100),
          product_data: {
            name: item.selectedColor ? `${product.name} - ${item.selectedColor}` : product.name,
            images: product.images.filter((image) => image.startsWith("https://")),
            metadata: { product_id: product.id },
          },
        },
      };
    });

    const supabase = await createClient();
    const user = supabase ? (await supabase.auth.getUser()).data.user : null;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const stripe = new Stripe(apiKey);
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      integration_identifier: "lucent_print_qmvtrazk",
      line_items: lineItems,
      success_url: `${siteUrl}/account?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/checkout?checkout=cancelled`,
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      shipping_address_collection: { allowed_countries: ["US"] },
      customer_email: user?.email,
      client_reference_id: user?.id,
      metadata: { items: JSON.stringify(safeItems).slice(0, 4900) },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Checkout is unavailable.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
