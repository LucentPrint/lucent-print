import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Our Work | Lucent Print",
  description: "A gallery of custom apparel and 3D-printed creations made by Lucent Print.",
};

const apparel = [
  { title: "Inspirada Bulldogs — Green Front", image: "/images/our-work/inspirada-green-front.jpg", note: "Custom youth football team shirt" },
  { title: "Inspirada Bulldogs — Player Back", image: "/images/our-work/inspirada-green-back.jpg", note: "Personalized player name and number" },
  { title: "Inspirada Bulldogs — Charcoal", image: "/images/our-work/inspirada-charcoal-front.jpg", note: "Alternate team colorway" },
  { title: "Bulldogs Bolt Shirt", image: "/images/our-work/bulldogs-bolt-shirt.jpg", note: "Bold mascot apparel design" },
  { title: "Exotica Scissors Shirt", image: "/images/our-work/exotica-scissors-shirt.jpg", note: "Custom small-business apparel" },
  { title: "Tiger Baby Bro Shirt", image: "/images/our-work/tiger-baby-bro-shirt.jpg", note: "Coordinated family spirit wear" },
];

const prints = [
  { title: "Yellow Chomper", image: "/images/our-work/yellow-chomper.jpg", note: "Character desk collectible" },
  { title: "Pumpkin Cupcake Clicker", image: "/images/our-work/pumpkin-cupcake.jpg", note: "Seasonal sensory collectible" },
  { title: "Halloween Donut Collection", image: "/images/our-work/halloween-donut-collection.jpg", note: "Four-piece seasonal clicker set" },
  { title: "Spiderweb Donut Gift Set", image: "/images/our-work/spiderweb-donut-gift-set.jpg", note: "Purple and black two-piece clicker set" },
  { title: "Halloween Keyboard Clicker", image: "/images/our-work/halloween-keyboard-clicker.jpg", note: "Spider-and-bats two-key sensory clicker" },
  { title: "Skull Pumpkin Cauldron", image: "/images/our-work/01-skull-pumpkin-cauldron.jpg", note: "Multi-color Halloween container" },
  { title: "Pink Smiley Tumbler", image: "/images/our-work/02-pink-smiley-tumbler.jpg", note: "Miniature kawaii desk collectible" },
  { title: "Blue Puppy Carrier", image: "/images/our-work/03-blue-dog-carrier.jpg", note: "Pastel pet-carrier collectible" },
  { title: "White Puppy Carrier", image: "/images/our-work/04-white-dog-carrier.jpg", note: "Alternate pastel colorway" },
  { title: "Zombie Head", image: "/images/our-work/05-zombie-head.jpg", note: "Articulated Halloween character" },
  { title: "Witch Cauldron", image: "/images/our-work/06-witch-cauldron.jpg", note: "Bubbling Halloween display piece" },
  { title: "Skull Ghost Bucket", image: "/images/our-work/07-skull-ghost-bucket.jpg", note: "Interactive seasonal collectible" },
];

function Gallery({ items }: { items: typeof apparel }) {
  return <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{items.map((item) => <article key={item.title} className="glass overflow-hidden rounded-2xl"><div className="relative aspect-square overflow-hidden bg-zinc-100"><Image src={item.image} alt={item.title} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover transition duration-500 hover:scale-[1.025]" /></div><div className="p-5"><h3 className="text-xl font-black">{item.title}</h3><p className="muted mt-1">{item.note}</p></div></article>)}</div>;
}

export default function OurWork() {
  return <main><section className="section"><div className="shell"><p className="eyebrow">Made by Lucent Print</p><h1 className="title mt-4 max-w-4xl">Ideas turned into <span className="text-pink-500">real creations.</span></h1><p className="muted mt-6 max-w-2xl text-lg">Explore custom apparel and 3D-printed pieces made with care in Las Vegas. These are examples of completed work; availability and customization options may vary.</p><div className="mt-8 flex flex-wrap gap-3"><Link className="btn btn-primary" href="/custom-studio">Start a custom shirt</Link><Link className="btn btn-secondary" href="/shop">Browse the shop</Link></div></div></section><section className="section bg-white/[.025]"><div className="shell"><p className="eyebrow">Custom apparel</p><h2 className="title mb-10 mt-3">Shirts made for teams, families & brands</h2><Gallery items={apparel} /></div></section><section className="section"><div className="shell"><p className="eyebrow">3D printed</p><h2 className="title mb-10 mt-3">Characters, collectibles & seasonal pieces</h2><Gallery items={prints} /></div></section><section className="section bg-white/[.025]"><div className="shell glass rounded-[28px] p-8 text-center md:p-12"><p className="eyebrow">Have an idea?</p><h2 className="mt-3 text-3xl font-black md:text-5xl">Let&apos;s bring it to life.</h2><p className="muted mx-auto mt-4 max-w-2xl">Tell us what you want to create. We&apos;ll help shape the idea, colors, size, and finish.</p><Link className="btn btn-primary mt-7" href="/custom-studio">Start your custom order</Link></div></section></main>;
}
