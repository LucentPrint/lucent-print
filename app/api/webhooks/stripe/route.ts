import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";

export async function POST(req: Request) {
  const apiKey = process.env.STRIPE_API_KEY || process.env.STRIPE_SECRET_KEY;
  if (!apiKey || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const stripe = new Stripe(apiKey);
  const signature = (await headers()).get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  try {
    const event = stripe.webhooks.constructEvent(
      await req.text(),
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );

    if (
      event.type === "checkout.session.completed" ||
      event.type === "checkout.session.async_payment_succeeded"
    ) {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.payment_status === "unpaid") {
        return NextResponse.json({ received: true, type: event.type, fulfilled: false });
      }
      const supabase = createAdminClient();

      if (supabase) {
        type PaidItem = { id: string; name: string; price: number; quantity: number; isApparel?: boolean; chargedPrice?: number };
        const itemEntries = Object.entries(session.metadata ?? {})
          .filter(([key]) => key.startsWith("item_"))
          .sort(([left], [right]) => Number(left.slice(5)) - Number(right.slice(5)));
        const items = itemEntries.length
          ? itemEntries.map(([, value]) => JSON.parse(value) as PaidItem)
          : JSON.parse(session.metadata?.items || "[]") as PaidItem[];
        const paymentPlan = session.metadata?.payment_plan === "deposit" ? "deposit" : "full";
        const apparelBalanceDue = Number(session.metadata?.apparel_balance_due || 0);
        const existing = await supabase.from("orders").select("id").eq("provider_order_id", session.id).maybeSingle();
        let order = existing.data;
        let createdNow = false;

        if (!order) {
          const created = await supabase.from("orders").insert({
            user_id: session.client_reference_id || null,
            email: session.customer_details?.email,
            status: paymentPlan === "deposit" ? "pending" : "paid", provider: "stripe", provider_order_id: session.id,
            subtotal: (session.amount_subtotal || 0) / 100,
            shipping: Number(session.total_details?.amount_shipping || 0) / 100,
            tax: Number(session.total_details?.amount_tax || 0) / 100,
            total: (session.amount_total || 0) / 100,
            shipping_address: session.customer_details?.address || {}, updated_at: new Date().toISOString(),
          }).select("id").single();
          if (created.error) throw created.error;
          order = created.data;
          createdNow = Boolean(order?.id);
        }

        if (createdNow && order?.id && items.length) {
          const insertedItems = await supabase.from("order_items").insert(items.map((item) => ({
            order_id: order!.id, product_id: item.id, name: item.name, price: item.price, quantity: item.quantity,
            options: { payment_plan: paymentPlan, charged_price: item.chargedPrice ?? item.price, balance_due: item.isApparel ? Math.max(0, item.price - (item.chargedPrice ?? item.price)) * item.quantity : 0 },
          })));
          if (insertedItems.error) throw insertedItems.error;
          for (const item of items) {
            const inventoryUpdate = await supabase.rpc("adjust_inventory", { p_product_id: item.id, p_change: -item.quantity, p_reason: "Stripe sale", p_reference_id: session.id });
            if (inventoryUpdate.error) throw inventoryUpdate.error;
          }
          if (session.client_reference_id) {
            await supabase.from("loyalty_transactions").insert({
              user_id: session.client_reference_id, points: Math.floor((session.amount_total || 0) / 100), reason: "Purchase", order_id: order.id,
            });
          }
          if (session.customer_details?.email) {
            await sendEmail({
              to: session.customer_details.email, subject: "Lucent Print order confirmed",
              html: `<h1>Thank you for your order</h1><p>Your Lucent Print order has been received.</p>${paymentPlan === "deposit" ? `<p>Your apparel deposit was received. Remaining apparel balance: $${apparelBalanceDue.toFixed(2)}.</p>` : "<p>Your order was paid in full.</p>"}<p>Order reference: ${session.id}</p>`,
            });
          }
        }
      }
    }

    return NextResponse.json({ received: true, type: event.type });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Invalid webhook";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
