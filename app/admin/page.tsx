import Link from "next/link";
import { requireAdmin } from "@/lib/auth";

const modules = [
  "Products", "Inventory", "Orders", "Custom Shirt Orders", "Collections", "Reviews", "Coupons", "Newsletter",
  "Design Vault", "Print Lab", "Loyalty", "Etsy Listings", "Wholesale", "Affiliates", "Analytics",
];

export default async function Page() {
  const authorized = Boolean(await requireAdmin());
  return <section className="section"><div className="shell"><p className="eyebrow">Business systems</p><h1 className="title my-6">Admin Dashboard</h1>{!authorized ? <div className="glass max-w-2xl rounded-2xl p-7"><b>Admin authentication required</b><p className="muted">Sign in with an owner/admin profile or an email listed in ADMIN_EMAILS.</p><Link href="/auth/sign-in" className="btn btn-primary mt-4">Admin sign in</Link></div> : <div className="grid-auto">{modules.map((name)=><Link href={`/admin/${name.toLowerCase().replaceAll(" ","-")}`} key={name} className="glass rounded-2xl p-6"><b>{name}</b><p className="muted">Manage {name.toLowerCase()}.</p></Link>)}</div>}</div></section>;
}
