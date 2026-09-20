"use client";
import { useCallback, useEffect, useMemo, useState } from "react";

type Row = Record<string, unknown> & { id?: string };
const fields: Record<string, string[]> = {
  collections: ["name","slug","description","image_url","featured","is_active","sort_order"],
  printers: ["name","status","current_job","progress","estimated_completion"],
  "design-vault": ["name","description","stage","image_url","vote_count","is_public"],
  orders: ["status","tracking_number"],
  reviews: ["status","verified"],
  coupons: ["code","type","value","minimum_order","starts_at","ends_at","usage_limit","is_active"],
  loyalty: ["user_id","points","reason","order_id"],
  "etsy-listings": ["product_id","etsy_listing_id","state","last_sync_status","last_sync_error"],
};
const booleans = new Set(["featured","is_active","is_public","verified"]);
const numbers = new Set(["sort_order","progress","vote_count","value","minimum_order","usage_limit","points"]);

export function ResourceManager({ resource, title }: { resource: string; title: string }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [editing, setEditing] = useState<Row | null>(null);
  const [message, setMessage] = useState("");
  const resourceFields = useMemo(() => fields[resource] ?? [], [resource]);
  const load = useCallback(async () => { const response = await fetch(`/api/admin/resources/${resource}`); const json = await response.json(); if (json.rows) setRows(json.rows); else setMessage(json.error); }, [resource]);
  useEffect(() => { void load(); }, [load]);
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget); const values: Row = {};
    for (const key of resourceFields) {
      if (booleans.has(key)) values[key] = form.get(key) === "on";
      else if (numbers.has(key)) values[key] = Number(form.get(key) || 0);
      else { const value = String(form.get(key) ?? "").trim(); values[key] = value || null; }
    }
    const response = await fetch(`/api/admin/resources/${resource}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: editing?.id, values }) });
    const json = await response.json(); setMessage(json.error ?? "Saved successfully"); if (!json.error) { setEditing(null); await load(); }
  }
  async function remove() { if (!editing?.id || !confirm("Delete this record?")) return; const response = await fetch(`/api/admin/resources/${resource}?id=${editing.id}`, { method: "DELETE" }); const json = await response.json(); setMessage(json.error ?? "Deleted"); if (!json.error) { setEditing(null); await load(); } }
  return <section className="section"><div className="shell"><p className="eyebrow">Admin module</p><div className="flex items-center justify-between gap-4"><h1 className="title my-6 capitalize">{title}</h1>{resource === "etsy-listings" && <a className="btn btn-secondary" href="/api/admin/etsy/export">Download Etsy CSV</a>}</div><div className="grid gap-8 lg:grid-cols-[1fr_430px]"><div className="glass overflow-auto rounded-2xl p-5"><table className="w-full text-left text-sm"><thead><tr>{resourceFields.slice(0,5).map((field)=><th className="p-2" key={field}>{field.replaceAll("_"," ")}</th>)}</tr></thead><tbody>{rows.map((row)=><tr key={row.id} onClick={()=>setEditing(row)} className="cursor-pointer border-t border-white/10 hover:bg-white/5">{resourceFields.slice(0,5).map((field)=><td className="max-w-52 truncate p-2" key={field}>{typeof row[field] === "object" ? JSON.stringify(row[field]) : String(row[field] ?? "")}</td>)}</tr>)}</tbody></table>{!rows.length&&<p className="muted">No records yet.</p>}</div><form key={editing?.id ?? "new"} onSubmit={save} className="glass grid gap-3 rounded-2xl p-5"><h2 className="text-xl font-black">{editing ? "Edit record" : "Add record"}</h2>{resourceFields.map((field)=>booleans.has(field)?<label key={field} className="flex gap-2"><input type="checkbox" name={field} defaultChecked={Boolean(editing?.[field])}/>{field.replaceAll("_"," ")}</label>:<input key={field} className="input" name={field} type={numbers.has(field)?"number":"text"} defaultValue={String(editing?.[field] ?? "")} placeholder={field.replaceAll("_"," ")}/>) }<button className="btn btn-primary">Save</button>{editing&&<><button type="button" className="btn btn-secondary" onClick={()=>setEditing(null)}>New record</button><button type="button" className="btn border border-red-400/30 text-red-200" onClick={remove}>Delete</button></>}<p className="muted text-sm">{message}</p></form></div></div></section>;
}
