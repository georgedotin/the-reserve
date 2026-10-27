"use client";

import { motion } from "framer-motion";
import { finale, site } from "@/content/site";

type Props = { onEnquire: () => void; onDiscover: () => void };

const rise = {
  hidden: { opacity: 0, y: 28 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: 0.12 * i, duration: 1.1, ease: [0.22, 1, 0.36, 1] as const } }),
};

export default function Finale({ onEnquire, onDiscover }: Props) {
  return (
    <section id="enquire" aria-labelledby="finale-title" className="relative bg-deep text-ivory">
      {/* Ink edge where the film meets the page */}
      <svg className="pointer-events-none absolute inset-x-0 -top-[18vh] h-[18vh] w-full" viewBox="0 0 1440 200" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <filter id="ink-edge" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.012 0.06" numOctaves="4" seed="7" />
            <feDisplacementMap in="SourceGraphic" scale="70" />
          </filter>
          <linearGradient id="ink-fade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0d1712" stopOpacity="0" />
            <stop offset="0.65" stopColor="#0d1712" stopOpacity="0.85" />
            <stop offset="1" stopColor="#0d1712" />
          </linearGradient>
        </defs>
        <rect x="-40" y="40" width="1520" height="220" fill="url(#ink-fade)" filter="url(#ink-edge)" />
      </svg>

      <div className="mx-auto flex min-h-svh max-w-6xl flex-col justify-center px-6 py-32 md:px-10">
        <motion.p custom={0} variants={rise} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.4 }} className="label-caps text-[10px] text-champagne md:text-[11px]">
          By introduction
        </motion.p>
        <motion.h2
          id="finale-title"
          custom={1}
          variants={rise}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.4 }}
          className="mt-8 max-w-4xl font-display text-[clamp(2.8rem,7vw,6.4rem)] font-light leading-[0.95]"
        >
          {finale.headline}
        </motion.h2>
        <motion.p custom={2} variants={rise} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.4 }} className="mt-8 max-w-md text-base leading-relaxed text-ivory/75">
          {finale.sub}
        </motion.p>
        <motion.div custom={3} variants={rise} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.4 }} className="mt-14 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
          <button type="button" onClick={onDiscover} className="btn-line-light">
            {finale.primary}
          </button>
          <button type="button" onClick={onEnquire} className="btn-solid-light">
            {finale.secondary}
          </button>
        </motion.div>
      </div>

      <footer className="border-t border-ivory/10">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 text-[13px] text-ivory/60 md:grid-cols-[1.4fr_1fr_1fr_auto] md:px-10">
          <div>
            <p className="font-display text-xl tracking-[0.32em] text-ivory">THE RESERVE</p>
            <p className="mt-3">{site.contact.address}</p>
          </div>
          <address className="flex flex-col gap-1.5 not-italic">
            <span className="label-caps mb-1 text-[9px] text-champagne">Concierge</span>
            <a className="hover:text-ivory" href={site.contact.phoneHref}>{site.contact.phone}</a>
            <a className="hover:text-ivory" href={`mailto:${site.contact.email}`}>{site.contact.email}</a>
          </address>
          <div className="flex flex-col gap-1.5">
            <span className="label-caps mb-1 text-[9px] text-champagne">Follow</span>
            <a className="hover:text-ivory" href={site.contact.instagramUrl} target="_blank" rel="noopener noreferrer">
              Instagram {site.contact.instagramHandle}
            </a>
          </div>
          <p className="self-end text-[11px] text-ivory/40">© {site.copyrightYear} The Reserve. All rights reserved.</p>
        </div>
      </footer>
    </section>
  );
}
