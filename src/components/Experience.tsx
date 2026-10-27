"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import InkStage from "./InkStage";
import Header from "./Header";
import Finale from "./Finale";
import EnquiryDialog from "./EnquiryDialog";
import { scenes, site } from "@/content/site";
import { chapterAt, chapterFill, chapters, stateAt, visibleInk } from "@/lib/timeline";

gsap.registerPlugin(ScrollTrigger);

// Copy windows on the 0–1 journey: [fade in start, fully in, fade out start, gone]
const COPY_WINDOWS: Array<[number, number, number, number]> = [
  [0.135, 0.175, 0.24, 0.285],
  [0.43, 0.48, 0.56, 0.59],
  [0.69, 0.73, 0.785, 0.81],
];

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduced;
}

export default function Experience() {
  const reduced = usePrefersReducedMotion();
  const trackRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const activeRef = useRef(true);
  const openingRef = useRef<HTMLDivElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);
  const finalRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const copyRefs = useRef<Array<HTMLElement | null>>([]);
  const fillRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const [active, setActive] = useState(0);
  const [enquiryOpen, setEnquiryOpen] = useState(false);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const root = document.documentElement;
    const proxy = { p: 0 };
    let lastChapter = 0;

    const onProgress = () => {
      const p = proxy.p;
      progressRef.current = p;
      root.style.setProperty("--ui", visibleInk(stateAt(p)).toFixed(3));
      fillRefs.current.forEach((el, i) => el && (el.style.transform = `scaleX(${chapterFill(p, i)})`));
      const ch = chapterAt(p);
      if (ch !== lastChapter && lastChapter !== -1) {
        lastChapter = ch;
        setActive(ch);
      }
    };

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: track,
          start: "top top",
          end: "bottom bottom",
          scrub: reduced ? true : 0.9,
        },
      });
      tl.to(proxy, { p: 1, duration: 1, onUpdate: onProgress }, 0);

      const inFrom = reduced ? { autoAlpha: 0 } : { autoAlpha: 0, y: 36, filter: "blur(10px)" };
      const inTo = reduced ? { autoAlpha: 1 } : { autoAlpha: 1, y: 0, filter: "blur(0px)" };
      const outTo = reduced ? { autoAlpha: 0 } : { autoAlpha: 0, y: -28, filter: "blur(8px)" };

      // Opening: wordmark on the ink-wash paper, and the scroll cue.
      tl.to(openingRef.current, { ...outTo, duration: 0.035 }, 0.03);
      tl.to(cueRef.current, { autoAlpha: 0, duration: 0.015 }, 0.005);
      tl.fromTo(railRef.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.03 }, 0.05);

      copyRefs.current.forEach((el, i) => {
        if (!el) return;
        const [a, b, c, d] = COPY_WINDOWS[i];
        const lines = el.querySelectorAll("[data-line]");
        tl.fromTo(lines, inFrom, { ...inTo, duration: (b - a) * 0.7, stagger: (b - a) * 0.15, ease: "power2.out" }, a);
        tl.to(lines, { ...outTo, duration: d - c, stagger: (d - c) * 0.1, ease: "power1.in" }, c);
        tl.fromTo(el, { "--shade": 0 }, { "--shade": 1, duration: b - a }, a);
        tl.to(el, { "--shade": 0, duration: d - c }, c);
      });

      const finalLines = finalRef.current?.querySelectorAll("[data-line]") ?? [];
      tl.fromTo(finalLines, inFrom, { ...inTo, duration: 0.04, stagger: 0.012, ease: "power2.out" }, 0.925);
    });

    // Pause the stage once the enquiry section fully covers it.
    const io = new IntersectionObserver(([entry]) => {
      activeRef.current = entry.isIntersecting;
    });
    io.observe(track);

    // "Enquire" becomes the current nav item once the finale owns most of the screen.
    const finaleEl = document.getElementById("enquire");
    const fio = new IntersectionObserver(
      ([entry]) => {
        lastChapter = entry.isIntersecting ? -1 : chapterAt(proxy.p);
        setActive(lastChapter);
      },
      { rootMargin: "0px 0px -50% 0px" },
    );
    if (finaleEl) fio.observe(finaleEl);

    return () => {
      io.disconnect();
      fio.disconnect();
      ctx.revert();
    };
  }, [reduced]);

  const navigate = useCallback(
    (id: string) => {
      const behavior: ScrollBehavior = reduced ? "auto" : "smooth";
      if (id === "enquire") {
        document.getElementById("enquire")?.scrollIntoView({ behavior });
        return;
      }
      const track = trackRef.current;
      if (!track) return;
      const target = id === "top" ? 0 : (chapters.find((c) => c.id === id)?.target ?? 0);
      const top = track.offsetTop + target * (track.offsetHeight - window.innerHeight);
      window.scrollTo({ top, behavior });
    },
    [reduced],
  );

  const openEnquiry = useCallback(() => setEnquiryOpen(true), []);
  const closeEnquiry = useCallback(() => setEnquiryOpen(false), []);

  return (
    <>
      <Header active={active} onNavigate={navigate} />
      <InkStage progressRef={progressRef} reducedMotion={reduced} activeRef={activeRef} />

      <main id="top" className="relative z-10">
        {/* The scroll track: one continuous take. Anchors mark where each world begins. */}
        <div ref={trackRef} className="relative h-[880vh]">
          {chapters.map((c) => (
            <span key={c.id} id={c.id} className="absolute left-0 block h-px w-px" style={{ top: `calc(${c.target} * (100% - 100svh))` }} />
          ))}

          <div className="sticky top-0 h-svh w-full overflow-hidden">
            {/* Opening */}
            <div ref={openingRef} className="ui-tone opening-veil pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
              <p className="label-caps mb-6 text-[10px] opacity-70 md:text-[11px]">{site.region} · Est. by invitation</p>
              <h1 className="font-display text-[clamp(3.4rem,13vw,12.5rem)] font-light leading-[0.86] tracking-[0.02em]">
                The&nbsp;Reserve
              </h1>
              <p className="label-caps mt-8 text-[10px] opacity-70 md:text-[11px]">{site.tagline}</p>
            </div>

            <div ref={cueRef} className="ui-tone pointer-events-none absolute inset-x-0 bottom-10 flex flex-col items-center gap-3">
              <span className="label-caps text-[10px]">Scroll</span>
              <span className="scroll-cue" />
            </div>

            {/* Scene copy: one complete, static block per world */}
            {scenes.map((s, i) => (
              <article
                key={s.id}
                ref={(el) => {
                  copyRefs.current[i] = el;
                }}
                aria-label={s.label}
                className={`copy-block copy-${s.position} pointer-events-none absolute text-ivory`}
              >
                <p data-line className="label-caps flex items-center gap-4 text-[10px] text-champagne md:text-[11px]">
                  <span>{s.numeral}</span>
                  <span className="h-px w-10 bg-champagne/60" />
                  <span>{s.label}</span>
                </p>
                <p data-line className="label-caps mt-6 text-[11px] tracking-[0.34em] md:text-xs">{s.eyebrow}</p>
                <h2 data-line className="mt-4 font-display text-[clamp(2.9rem,7.4vw,7.2rem)] font-light leading-[0.92]">
                  {s.headline}
                </h2>
                <p data-line className="mt-6 max-w-md text-[15px] leading-relaxed text-ivory/85 md:text-base">
                  {s.body}
                </p>
              </article>
            ))}

            {/* Final composition */}
            <div ref={finalRef} className="pointer-events-none absolute inset-x-0 top-[20%] flex flex-col items-center text-center text-deep">
              <p data-line className="label-caps text-[10px] text-brass-deep md:text-[11px]">Residences · Mobility · Experiences</p>
              <p data-line className="mt-6 font-display text-[clamp(3rem,10vw,9rem)] font-light leading-[0.9] tracking-[0.04em] text-shadow-glow">
                The Reserve
              </p>
              <p data-line className="label-caps mt-6 text-[10px] md:text-[11px]">Kerala</p>
            </div>

            {/* Three-part progress rail */}
            <div ref={railRef} className="ui-tone invisible absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-3 md:bottom-10 md:left-10 md:translate-x-0" aria-hidden="true">
              {scenes.map((s, i) => (
                <div key={s.id} className={`flex flex-col gap-2 transition-opacity duration-500 ${active === i ? "opacity-100" : "opacity-45"}`}>
                  <span className="label-caps text-[9px]">
                    {s.numeral}
                    <span className="ml-2 hidden md:inline">{s.label}</span>
                  </span>
                  <span className="relative block h-px w-14 overflow-hidden bg-current/25 md:w-24">
                    <span
                      ref={(el) => {
                        fillRefs.current[i] = el;
                      }}
                      className="absolute inset-0 origin-left scale-x-0 bg-current"
                    />
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <Finale onEnquire={openEnquiry} onDiscover={() => navigate("top")} />
      </main>

      <EnquiryDialog open={enquiryOpen} onClose={closeEnquiry} />
    </>
  );
}
