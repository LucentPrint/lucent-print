import Image from "next/image";
import { TUMBLERS, tumblerInquiry } from "@/lib/tumblers";
import { money } from "@/lib/commerce";

export function TumblerGrid() {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {TUMBLERS.map((tumbler) => (
        <article key={tumbler.slug} id={tumbler.slug} className="glass flex scroll-mt-24 flex-col overflow-hidden rounded-3xl">
          <a href={tumbler.image} target="_blank" rel="noreferrer" aria-label={`View full photo of ${tumbler.name}`} className="relative block aspect-square bg-[#faf9f7]">
            <Image src={tumbler.image} alt={tumbler.alt} fill sizes="(max-width: 767px) 100vw, 33vw" className="object-contain" />
          </a>
          <div className="flex flex-1 flex-col p-6">
            <p className="eyebrow text-orange-300">Tumblers</p>
            <h3 className="mt-3 text-2xl font-black">{tumbler.name}</h3>
            <p className="mt-3 text-2xl font-black text-blue-300">{money(tumbler.price)}</p>
            <p className="muted mt-3 flex-1">{tumbler.description}</p>
            <a className="btn btn-primary mt-6" href={tumblerInquiry(tumbler.name)} aria-label={`Request ${tumbler.name}`}>Request this tumbler</a>
          </div>
        </article>
      ))}
    </div>
  );
}
