import { NextResponse } from "next/server";
import Stripe from "stripe";
import { z } from "zod";
import { getProducts } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { isApparelProduct } from "@/lib/product-sections";
import { catalogUnitPrice, CATALOG_SHIRT_LAYOUTS, SHIRT_SIZES } from "@/lib/custom-pricing";
import { FAMILY_AND_FRIENDS_CODE, familyAndFriendsPrice, isBulldogsLaunchProduct, normalizePromoCode } from "@/lib/promotions";

const checkoutSchema = z.object({
  paymentPlan: z.enum(["full", "deposit"]).default("full"),
  promoCode: z.string().trim().max(40).optional(),
  items: z.array(z.object({
    id: z.string().uuid(),
    quantity: z.number().int().min(1).max(99).default(1),
    selectedColor: z.string().trim().max(80).optional(),
  })).min(1).max(40),
});

export async function POST(req: Request) {
  try {
    const apiKey = process.env.STRIPE_API_KEY || process.env.STRIPE_SECRET_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Stripe is not configured." }, { status: 503 });
    }

    const { items, paymentPlan, promoCode } = checkoutSchema.parse(await req.json());
    const products = await getProducts();
    const normalizedPromoCode = normalizePromoCode(promoCode);
    if (normalizedPromoCode && normalizedPromoCode !== FAMILY_AND_FRIENDS_CODE) {
      throw new Error("That promo code is not valid.");
    }
    const safeItems: Array<{
      id: string;
      name: string;
      price: number;
      quantity: number;
      selectedColor?: string;
      isApparel: boolean;
      chargedPrice: number;
      catalogPrice: number;
    }> = [];

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map((item) => {
      const product = products.find((candidate) => candidate.id === item.id);
      if (!product || product.price <= 0 || product.status !== "active") {
        throw new Error("One or more products are unavailable.");
      }
      if (product.inventory < items.filter(other=>other.id===item.id).reduce((sum,other)=>sum+other.quantity,0)) {
        throw new Error(`${product.name} does not have enough stock.`);
      }

      const isApparel = isApparelProduct(product);
      const qualifiesForFamilyPricing = normalizedPromoCode === FAMILY_AND_FRIENDS_CODE && isBulldogsLaunchProduct(product);
      const familyPrice = qualifiesForFamilyPricing ? familyAndFriendsPrice(item.selectedColor) : null;
      if (qualifiesForFamilyPricing && familyPrice == null) {
        throw new Error(`Choose a valid size for ${product.name} before using LUCENTP.`);
      }
      if (CATALOG_SHIRT_LAYOUTS[product.slug] && !(SHIRT_SIZES as readonly string[]).includes(item.selectedColor ?? "")) throw new Error(`Choose a listed shirt size for ${product.name}. Other sizes require a quote.`);
      const productQuantity = items.filter(other=>other.id===item.id).reduce((sum,other)=>sum+other.quantity,0);
      const regularPrice = catalogUnitPrice(product, item.selectedColor, productQuantity);
      const orderPrice = familyPrice == null ? regularPrice : Math.min(familyPrice, regularPrice);
      const chargedPrice = paymentPlan === "deposit" && isApparel
        ? Math.round(orderPrice * 50) / 100
        : orderPrice;

      safeItems.push({
        id: product.id,
        name: product.name,
        price: orderPrice,
        quantity: item.quantity,
        selectedColor: item.selectedColor,
        isApparel,
        chargedPrice,
        catalogPrice: product.price,
      });

      return {
        quantity: item.quantity,
        price_data: {
          currency: "usd",
          unit_amount: Math.round(chargedPrice * 100),
          product_data: {
            name: `${paymentPlan === "deposit" && isApparel ? "50% apparel deposit — " : ""}${item.selectedColor ? `${product.name} - ${item.selectedColor}` : product.name}`,
            images: product.images.filter((image) => image.startsWith("https://")),
            metadata: { product_id: product.id },
          },
        },
      };
    });

    if (normalizedPromoCode === FAMILY_AND_FRIENDS_CODE && !products.some(product=>safeItems.some(item=>item.id===product.id)&&isBulldogsLaunchProduct(product))) {
      throw new Error("LUCENTP applies only to Bulldogs launch shirts.");
    }

    const supabase = await createClient();
    const user = supabase ? (await supabase.auth.getUser()).data.user : null;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const stripe = new Stripe(apiKey);
    const subtotal = safeItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const chargedSubtotal = safeItems.reduce((sum, item) => sum + item.chargedPrice * item.quantity, 0);
    const apparelBalanceDue = safeItems.reduce((sum, item) => sum + (item.isApparel ? (item.price - item.chargedPrice) * item.quantity : 0), 0);
    const metadata: Record<string, string> = {
      payment_plan: paymentPlan,
      charged_subtotal: chargedSubtotal.toFixed(2),
      full_order_total: (subtotal + (subtotal >= 75 ? 0 : 6.95)).toFixed(2),
      apparel_balance_due: apparelBalanceDue.toFixed(2),
      promotion_code: normalizedPromoCode,
    };
    safeItems.forEach((item, index) => {
      metadata[`item_${index}`] = JSON.stringify(item);
    });
    const shippingOptions: Stripe.Checkout.SessionCreateParams.ShippingOption[] = [{
      shipping_rate_data: {
        type: "fixed_amount",
        fixed_amount: { amount: subtotal >= 75 ? 0 : 695, currency: "usd" },
        display_name: subtotal >= 75 ? "Free shipping" : "Standard shipping",
      },
    }];
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      integration_identifier: "lucent_print_qmvtrazk",
      line_items: lineItems,
      success_url: `${siteUrl}/account?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/checkout?checkout=cancelled`,
      allow_promotion_codes: false,
      billing_address_collection: "auto",
      shipping_address_collection: { allowed_countries: ["US"] },
      shipping_options: shippingOptions,
      customer_email: user?.email,
      client_reference_id: user?.id,
      metadata,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Checkout is unavailable.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
