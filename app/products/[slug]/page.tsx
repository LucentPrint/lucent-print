import { ProductImage } from "@/components/product-image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduct, getProductReviews } from "@/lib/data";
import { money } from "@/lib/commerce";
import { isApparelProduct } from "@/lib/product-sections";
import { AddButton } from "./add-button";
import { ReviewForm } from "./review-form";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const product = await getProduct((await params).slug);
  return product
    ? { title: product.name, description: product.description, openGraph: { images: product.images } }
    : {};
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const product = await getProduct((await params).slug);
  if (!product) notFound();
  const reviews = await getProductReviews(product.id);
  const coming = product.status === "coming_soon" || product.price <= 0;
  const apparel = isApparelProduct(product);
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images,
    aggregateRating: reviews.length
      ? {
          "@type": "AggregateRating",
          ratingValue: (reviews.reduce((total, review) => total + review.rating, 0) / reviews.length).toFixed(1),
          reviewCount: reviews.length,
        }
      : undefined,
    offers: coming
      ? undefined
      : {
          "@type": "Offer",
          price: product.price,
          priceCurrency: "USD",
          availability: product.inventory > 0 ? "https://schema.org/InStock" : "https://schema.org/PreOrder",
        },
  };

  return (
    <section className="section">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <div className="shell grid gap-12 lg:grid-cols-2">
        <div className="glass relative min-h-[560px] overflow-hidden rounded-3xl">
          <ProductImage src={product.images[0]} fill sizes="(max-width:1024px) 100vw,50vw" alt={product.name} className="object-cover" />
        </div>
        <div>
          <p className="eyebrow">{product.collection}</p>
          <h1 className="title my-5">{product.name}</h1>
          <p className="text-3xl font-black">{coming ? "Coming soon" : money(product.price)}</p>
          {!coming && apparel && <p className="muted mt-3">Adult S–XL base price. Youth and 12+ team rates apply by size and quantity; 2XL +$3, 3XL +$5. <Link className="text-blue-300 underline" href="/pricing">View price list</Link></p>}
          <p className="muted my-6 text-lg">{product.description}</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="glass rounded-xl p-4"><small className="eyebrow">Material</small><b className="block">{product.material}</b></div>
            <div className="glass rounded-xl p-4"><small className="eyebrow">Availability</small><b className="block">{coming ? "In development" : product.inventory || "Pre-order"}</b></div>
            <div className="glass rounded-xl p-4"><small className="eyebrow">Colors</small><b className="block">{product.colors.join(", ") || "To be announced"}</b></div>
            <div className="glass rounded-xl p-4"><small className="eyebrow">Shipping</small><b className="block">Nationwide</b></div>
          </div>
          {!coming && <AddButton product={product} />}
          <section className="mt-10">
            <h2 className="text-2xl font-black">Care &amp; safety</h2>
            <p className="muted">{apparel ? "Wash inside out in cold water, dry low and do not iron the design. Wait 24 hours before the first wash." : "Keep away from high heat. Small parts may not be suitable for children under three. Final colors may vary slightly due to the 3D-printing process."}</p>
          </section>
        </div>
      </div>
      <div className="shell mt-16">
        <h2 className="text-3xl font-black">Customer reviews</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {reviews.length ? reviews.map((review) => (
            <article key={review.id} className="glass rounded-2xl p-5">
              <b>{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</b>
              <h3 className="mt-2 font-black">{review.title}</h3>
              <p className="muted">{review.body}</p>
              <small>{review.reviewerName}{review.verified ? " · Verified purchase" : ""}</small>
            </article>
          )) : <p className="muted">No approved reviews yet.</p>}
        </div>
        {!coming && <ReviewForm productId={product.id} />}
      </div>
    </section>
  );
}
