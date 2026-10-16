import type { Metadata } from "next";
import Link from "next/link";
import Stripe from "stripe";
import { adminEmails, getCurrentUser } from "@/lib/auth";
import { isReservationOwner } from "@/lib/reservation-owner";
import { listReservationSessions, reservationPaymentState, validCheckoutSessionId } from "@/lib/reservation-checkout";

export const metadata: Metadata = { title: "Reservation requests", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function ReservationsAdmin({ searchParams }: {
  searchParams: Promise<{ after?: string | string[] }>;
}) {
  const user = await getCurrentUser();
  if (!isReservationOwner(user, adminEmails())) {
    return (
      <section className="section"><div className="shell max-w-3xl">
        <p className="eyebrow">Reservation requests</p>
        <h1 className="my-6 text-4xl font-black">Owner access required</h1>
        <p className="muted">Sign in with the verified owner email configured for this website to view customer reservation details.</p>
        <Link href="/auth/sign-in" className="btn btn-primary mt-6">Owner sign in</Link>
      </div></section>
    );
  }

  const { after } = await searchParams;
  const cursor = validCheckoutSessionId(after) ? after : undefined;
  const apiKey = process.env.STRIPE_API_KEY || process.env.STRIPE_SECRET_KEY;
  let result: Awaited<ReturnType<typeof listReservationSessions>> | null = null;
  if (apiKey) {
    try { result = await listReservationSessions(new Stripe(apiKey), cursor); } catch { /* Render a recoverable owner-facing error below. */ }
  }

  return (
    <section className="section"><div className="shell">
      <Link href="/admin" className="text-sm text-blue-300 hover:underline">← Admin dashboard</Link>
      <p className="eyebrow mt-7">Party planning &amp; reservations</p>
      <h1 className="my-6 text-4xl font-black sm:text-5xl">Reservation requests</h1>
      <p className="muted max-w-3xl">Review event details collected with the $390.00 service checkout. Payment does not confirm a date. Contact the customer to confirm availability and arrangements.</p>
      <p className="muted mt-3 max-w-3xl text-sm">“Checkout paid” describes the original checkout payment. Open the payment in Stripe for its current history, including any refunds or disputes.</p>

      {!result ? (
        <div role="alert" className="glass mt-8 rounded-2xl p-6">
          Reservation records are temporarily unavailable. Check the site’s Stripe connection and try again.
        </div>
      ) : (
        <>
          <p className="muted my-7 text-sm">Found {result.sessions.length} reservation checkout{result.sessions.length === 1 ? "" : "s"} in {result.scanned} {cursor ? "older" : "recent"} checkouts. {result.hasMore ? "More records may be available using Older checkouts below." : "There are no older checkouts in this view."}</p>
          <div className="grid gap-6 lg:grid-cols-2">
            {result.sessions.map((session) => {
              const data = session.metadata ?? {};
              const state = reservationPaymentState(session);
              const paymentId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
              const stripeUrl = paymentId ? `https://dashboard.stripe.com/${session.livemode ? "" : "test/"}payments/${paymentId}` : undefined;
              const status = state === "paid" ? "Checkout paid" : state === "processing" ? "Payment processing" : state === "incomplete" ? "Checkout incomplete" : "Payment needs review";
              return (
                <article key={session.id} className="glass min-w-0 rounded-2xl p-6 sm:p-8">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <h2 className="break-words text-2xl font-bold">{data.full_name || "Reservation request"}</h2>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${state === "paid" ? "bg-emerald-400/10 text-emerald-300" : "bg-amber-400/10 text-amber-300"}`}>{status}</span>
                  </div>
                  {!session.livemode && <p className="mt-2 text-sm font-bold text-amber-300">Stripe test mode</p>}
                  <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
                    {[
                      ["Email", data.email], ["Phone", data.phone], ["Event", data.event_type],
                      ["Guests", data.guest_count], ["Requested date", data.preferred_date],
                      ["Requested time", data.preferred_time ? `${data.preferred_time} Pacific` : ""],
                      ["Location", data.event_location], ["Date confirmation", "Requires follow-up"],
                    ].map(([label, value]) => (
                      <div key={label} className="min-w-0"><dt className="muted">{label}</dt><dd className="mt-1 break-words font-medium">{value || "—"}</dd></div>
                    ))}
                  </dl>
                  {data.event_details && <div className="mt-5"><h3 className="muted text-sm">Event details</h3><p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed">{data.event_details}</p></div>}
                  <p className="muted mt-5 break-all text-xs">Checkout reference: {session.id}</p>
                  {stripeUrl && <a href={stripeUrl} className="btn btn-secondary mt-5" target="_blank" rel="noopener noreferrer">View payment in Stripe ↗</a>}
                </article>
              );
            })}
          </div>
          {result.sessions.length === 0 && <div className="glass rounded-2xl p-6">No reservation checkouts were found in this group. {result.hasMore && "Continue to older checkouts to see earlier requests."}</div>}
          <nav aria-label="Reservation history" className="mt-8 flex flex-wrap gap-3">
            {cursor && <Link href="/admin/reservations" className="btn btn-secondary">Newest checkouts</Link>}
            {result.hasMore && result.nextCursor && <Link href={`/admin/reservations?after=${encodeURIComponent(result.nextCursor)}`} className="btn btn-primary">Older checkouts</Link>}
          </nav>
        </>
      )}
    </div></section>
  );
}
