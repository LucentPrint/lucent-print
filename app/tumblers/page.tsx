import Link from "next/link";
import { TumblerGrid } from "@/components/tumbler-grid";
import { getProducts } from "@/lib/data";
import { isDrinkwareProduct } from "@/lib/product-sections";

export const metadata = {
  title: "Tumblers",
  description: "Shop Happy Halloween, Inspirada Bulldogs Halloween and Autumn Pumpkin tumblers from Lucent Print.",
};

export default async function TumblersPage() {
  const products = (await getProducts()).filter(isDrinkwareProduct);
  return (
    <section className="section">
      <div className="shell">
        <p className="eyebrow text-orange-300">Lucent Print · Drinkware</p>
        <h1 className="title my-6">Tumblers</h1>
        <p className="muted max-w-3xl text-lg">Seasonal designs with personality. Choose a design, add optional personalization and order securely online.</p>
        <div className="mb-10 mt-6 flex flex-wrap gap-3">
          <Link href="/pricing#drinkware" className="btn btn-secondary">Drinkware prices &amp; options</Link>
          <Link href="/contact" className="btn btn-secondary">Ask about a custom design</Link>
        </div>
        <TumblerGrid products={products} />
        <div className="glass mt-10 rounded-3xl p-6 sm:p-8">
          <h2 className="text-2xl font-black">Make it yours</h2>
          <p className="muted mt-3 max-w-3xl">Names and short text can be added before placing the item in your cart. For a fully custom design or a bulk order, contact us for a quote.</p>
          <Link href="/contact" className="mt-4 inline-block text-orange-300 underline">Ask about custom or bulk drinkware</Link>
        </div>
      </div>
    </section>
  );
}
