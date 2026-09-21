import Link from "next/link";
import { ArrowRight, Box, Shirt } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { getProducts } from "@/lib/data";
import { isApparelProduct } from "@/lib/product-sections";

export default async function Home() {
  const products = await getProducts();
  const apparel = products.filter(isApparelProduct);
  const prints = products.filter((product) => !isApparelProduct(product));

  return (
    <>
      <section className="border-b border-white/10 py-20 sm:py-28">
        <div className="shell text-center">
          <p className="eyebrow">Live. Create. Inspire.</p>
          <h1 className="title mx-auto my-6 max-w-5xl">
            Two creative studios. <span className="text-pink-500">One Lucent Print.</span>
          </h1>
          <p className="muted mx-auto max-w-3xl text-lg">
            Choose what you need and go straight to the right part of our shop.
          </p>

          <div className="mt-12 grid gap-6 text-left lg:grid-cols-2">
            <Link
              href="/shop"
              className="glass group rounded-[28px] p-7 transition hover:-translate-y-1 hover:border-blue-400/60 sm:p-10"
            >
              <div className="mb-8 flex items-center justify-between">
                <span className="rounded-2xl bg-blue-500/15 p-4 text-blue-300">
                  <Box size={38} />
                </span>
                <ArrowRight className="transition group-hover:translate-x-2" />
              </div>
              <p className="eyebrow">Shop ready-made products</p>
              <h2 className="mt-3 text-4xl font-black sm:text-5xl">
                Lucent Print
                <br />
                3D Printing
              </h2>
              <p className="muted mt-5 max-w-xl text-lg">
                Browse handmade clickers, sensory toys, seasonal collectibles, custom gifts,
                and new 3D-printed releases.
              </p>
              <span className="btn btn-primary mt-8">Shop 3D prints</span>
            </Link>

            <Link
              href="/custom-studio"
              className="glass group rounded-[28px] p-7 transition hover:-translate-y-1 hover:border-pink-400/60 sm:p-10"
            >
              <div className="mb-8 flex items-center justify-between">
                <span className="rounded-2xl bg-pink-500/15 p-4 text-pink-300">
                  <Shirt size={38} />
                </span>
                <ArrowRight className="transition group-hover:translate-x-2" />
              </div>
              <p className="eyebrow text-pink-400">Made for teams, events and businesses</p>
              <h2 className="mt-3 text-4xl font-black sm:text-5xl">
                Lucent Print
                <br />
                Custom Apparel
              </h2>
              <p className="muted mt-5 max-w-xl text-lg">
                Order custom shirts and hoodies, request team apparel, upload artwork, and
                build an instant estimate.
              </p>
              <span className="btn btn-primary mt-8">Start an apparel order</span>
            </Link>
          </div>

          <div className="mt-8 grid gap-3 text-sm sm:grid-cols-3">
            <div className="glass rounded-xl p-4">
              <b>Made in Las Vegas</b>
              <p className="muted">Small-business care</p>
            </div>
            <div className="glass rounded-xl p-4">
              <b>Ships nationwide</b>
              <p className="muted">Secure Stripe checkout</p>
            </div>
            <div className="glass rounded-xl p-4">
              <b>Custom work welcome</b>
              <p className="muted">Ideas brought to life</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">3D printing</p>
              <h2 className="mt-2 text-4xl font-black sm:text-5xl">Popular 3D prints</h2>
            </div>
            <Link className="btn btn-secondary gap-2" href="/shop">
              View all 3D products <ArrowRight size={18} />
            </Link>
          </div>
          <div className="grid-auto">
            {prints.slice(0, 4).map((product) => (
              <ProductCard key={product.id} p={product} />
            ))}
          </div>
        </div>
      </section>

      <section className="section bg-white/[.025]">
        <div className="shell">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow text-pink-400">Custom apparel</p>
              <h2 className="mt-2 text-4xl font-black sm:text-5xl">
                Shirts made for your moment
              </h2>
            </div>
            <Link className="btn btn-secondary gap-2" href="/custom-studio">
              Build your apparel order <ArrowRight size={18} />
            </Link>
          </div>
          <div className="grid-auto">
            {apparel.slice(0, 4).map((product) => (
              <ProductCard key={product.id} p={product} />
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell grid gap-6 md:grid-cols-3">
          <Link href="/our-work" className="glass rounded-2xl p-7">
            <p className="eyebrow">See the quality</p>
            <h3 className="text-2xl font-black">Our Work</h3>
            <p className="muted">Explore finished 3D prints and custom apparel projects.</p>
          </Link>
          <Link href="/design-vault" className="glass rounded-2xl p-7">
            <p className="eyebrow">Vote &amp; follow</p>
            <h3 className="text-2xl font-black">Design Vault</h3>
            <p className="muted">See prototypes and vote on upcoming releases.</p>
          </Link>
          <Link href="/wholesale" className="glass rounded-2xl p-7">
            <p className="eyebrow">Organizations</p>
            <h3 className="text-2xl font-black">Bulk &amp; Wholesale</h3>
            <p className="muted">
              Request larger orders for teams, events, stores, and businesses.
            </p>
          </Link>
        </div>
      </section>
    </>
  );
}
