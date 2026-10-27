"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { scenes, site } from "@/content/site";

type Props = {
  active: number; // -1 when past the film (enquiry)
  onNavigate: (id: string) => void;
};

const links = [...scenes.map((s) => ({ id: s.id, label: s.label })), { id: "enquire", label: "Enquire" }];

export default function Header({ active, onNavigate }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const go = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    setOpen(false);
    onNavigate(id);
  };

  const current = (i: number, id: string) =>
    (id === "enquire" ? active === -1 : active === i) ? ("true" as const) : undefined;

  return (
    <>
      <header className={`${open ? "text-charcoal" : "ui-tone header-shade"} fixed inset-x-0 top-0 z-40 flex items-start justify-between px-6 pt-6 md:px-10 md:pt-8`}>
        <a href="#top" onClick={go("top")} className="label-caps group flex flex-col gap-1.5 text-[11px] md:text-xs" aria-label="The Reserve — back to the beginning">
          <span className="font-display text-[17px] tracking-[0.42em] normal-case md:text-[19px]">THE RESERVE</span>
          <span className="opacity-60 tracking-[0.36em]">Kerala</span>
        </a>

        <nav aria-label="Primary" className="hidden md:block">
          <ul className="flex items-center gap-9">
            {links.map((l, i) => (
              <li key={l.id}>
                <a
                  href={`#${l.id}`}
                  onClick={go(l.id)}
                  aria-current={current(i, l.id)}
                  className="nav-link label-caps text-[11px]"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <button
          type="button"
          className="label-caps text-[11px] md:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Close" : "Menu"}
        </button>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="fixed inset-0 z-30 flex flex-col justify-between bg-ivory px-6 pb-10 pt-28 text-charcoal md:hidden"
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0% 0)" }}
            exit={{ clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 0.6, ease: [0.65, 0, 0.35, 1] }}
          >
            <ul className="flex flex-col gap-5">
              {links.map((l, i) => (
                <motion.li
                  key={l.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 + i * 0.07, duration: 0.5 }}
                >
                  <a href={`#${l.id}`} onClick={go(l.id)} className="font-display text-5xl font-light">
                    <span className="label-caps mr-4 align-middle text-[10px] text-brass">{i < 3 ? scenes[i].numeral : "—"}</span>
                    {l.label}
                  </a>
                </motion.li>
              ))}
            </ul>
            <div className="label-caps flex flex-col gap-2 text-[10px] opacity-70">
              <a href={`mailto:${site.contact.email}`}>{site.contact.email}</a>
              <a href={site.contact.phoneHref}>{site.contact.phone}</a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
