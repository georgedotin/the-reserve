"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { site } from "@/content/site";

type Props = { open: boolean; onClose: () => void };
type Status = "idle" | "sending" | "sent" | "error";

const interests = ["Residences", "Mobility", "Experiences", "All of the above"];

export default function EnquiryDialog({ open, onClose }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    returnFocus.current = document.activeElement as HTMLElement;
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => panelRef.current?.querySelector<HTMLElement>("input, button")?.focus(), 350);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && panelRef.current) {
        const items = panelRef.current.querySelectorAll<HTMLElement>("input, select, textarea, button, a[href]");
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      returnFocus.current?.focus();
    };
  }, [open, onClose]);

  const close = () => {
    onClose();
    setTimeout(() => setStatus("idle"), 400);
  };

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    setError("");
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    try {
      const res = await fetch("/api/enquire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !json.ok) throw new Error(json.error || "Something went wrong.");
      setStatus("sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("error");
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-stretch justify-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          <button type="button" aria-label="Close enquiry" className="absolute inset-0 cursor-default bg-deep/70" onClick={close} />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="enquiry-title"
            className="relative flex h-full w-full max-w-xl flex-col overflow-y-auto bg-ivory px-7 py-10 text-charcoal md:px-12 md:py-14"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.7, ease: [0.65, 0, 0.35, 1] }}
          >
            <div className="flex items-center justify-between">
              <p className="label-caps text-[10px] text-brass-deep">Private enquiry</p>
              <button type="button" onClick={close} className="label-caps text-[10px] underline-offset-4 hover:underline">
                Close
              </button>
            </div>

            {status === "sent" ? (
              <div className="my-auto py-16">
                <h2 id="enquiry-title" className="font-display text-5xl font-light leading-[1.05]">Thank you.</h2>
                <p className="mt-6 max-w-sm text-[15px] leading-relaxed text-charcoal/75">
                  A member of our concierge team will be in touch personally, usually within one working day.
                </p>
                <button type="button" onClick={close} className="btn-line mt-10">Return</button>
              </div>
            ) : (
              <>
                <h2 id="enquiry-title" className="mt-12 font-display text-[2.6rem] font-light leading-[1.05] md:text-5xl">
                  Tell us how you would like to experience Kerala.
                </h2>
                <form onSubmit={submit} className="mt-10 flex flex-col gap-6" noValidate={false}>
                  <Field label="Name" name="name" autoComplete="name" required />
                  <Field label="Email" name="email" type="email" autoComplete="email" required />
                  <Field label="Phone (optional)" name="phone" type="tel" autoComplete="tel" />
                  <fieldset>
                    <legend className="label-caps mb-3 text-[10px] text-charcoal/60">Interested in</legend>
                    <div className="flex flex-wrap gap-2">
                      {interests.map((i, idx) => (
                        <label key={i} className="chip">
                          <input type="radio" name="interest" value={i} defaultChecked={idx === 3} className="sr-only" />
                          <span>{i}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <Field label="When are you thinking of?" name="timing" placeholder="e.g. December, for a week" />
                  <label className="flex flex-col gap-2">
                    <span className="label-caps text-[10px] text-charcoal/60">Anything we should know</span>
                    <textarea name="message" rows={3} maxLength={2000} className="field resize-none" />
                  </label>
                  <label className="flex items-start gap-3 text-[13px] leading-snug text-charcoal/70">
                    <input type="checkbox" name="consent" value="yes" required className="mt-0.5 accent-forest" />
                    <span>I agree to be contacted by The Reserve about this enquiry.</span>
                  </label>
                  <div aria-live="polite" className="min-h-5 text-[13px] text-red-800">
                    {status === "error" && error}
                  </div>
                  <button type="submit" disabled={status === "sending"} className="btn-solid self-start disabled:opacity-60">
                    {status === "sending" ? "Sending…" : "Send enquiry"}
                  </button>
                  <p className="text-[12px] text-charcoal/50">
                    Prefer to talk? <a className="underline underline-offset-4" href={site.contact.phoneHref}>{site.contact.phone}</a>
                  </p>
                </form>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Field({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex flex-col gap-2">
      <span className="label-caps text-[10px] text-charcoal/60">{label}</span>
      <input {...props} maxLength={200} className="field" />
    </label>
  );
}
