import Experience from "@/components/Experience";
import { finale, scenes, site, stills } from "@/content/site";

export default function Home() {
  return (
    <>
      <Experience />
      {/* Without JavaScript the journey degrades to a readable editorial sequence. */}
      <noscript>
        <div className="bg-deep text-ivory">
          {scenes.map((s, i) => (
            <section key={s.id} className="relative flex min-h-svh items-end p-8">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/scenes/${stills[i].key}-1280.webp`} alt={stills[i].alt} className="absolute inset-0 h-full w-full object-cover" />
              <div className="relative max-w-xl">
                <p className="label-caps text-xs">{s.numeral} · {s.label}</p>
                <h2 className="mt-4 font-display text-6xl font-light">{s.headline}</h2>
                <p className="mt-4">{s.body}</p>
              </div>
            </section>
          ))}
          <section className="p-8">
            <h2 className="font-display text-5xl font-light">{finale.headline}</h2>
            <p className="mt-4">{finale.sub}</p>
            <a className="mt-8 inline-block underline" href={`mailto:${site.contact.email}`}>{finale.secondary}</a>
          </section>
        </div>
      </noscript>
    </>
  );
}
