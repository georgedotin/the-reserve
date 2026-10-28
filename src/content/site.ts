// All display copy and brand details live here so the runtime stays content-agnostic.
// Contact details below are first-draft values: replace them with the brand's real ones before launch.

export const site = {
  name: "The Reserve",
  region: "Kerala, India · by invitation",
  tagline: "Private residences · mobility · experiences",
  contact: {
    address: "Kochi, Kerala, India",
    phone: "+91 9745300666",
    phoneHref: "tel:+919745300666",
    email: "mail@georgealex.in",
    instagramHandle: "@thrsrve",
    instagramUrl: "https://www.instagram.com/thrsrve/",
  },
  copyrightYear: 2026,
};

export type SceneCopy = {
  id: "residences" | "mobility" | "experiences";
  numeral: string;
  label: string;
  eyebrow: string;
  headline: string;
  body: string;
  /** Desktop placement; mobile always uses the bottom panel. */
  position: "left" | "right" | "upper-left";
};

export const scenes: SceneCopy[] = [
  {
    id: "residences",
    numeral: "I",
    label: "Residences",
    eyebrow: "The Reserve",
    headline: "Space to slow down.",
    body: "Exceptional residences. Private escapes. Places that feel like your own.",
    position: "left",
  },
  {
    id: "mobility",
    numeral: "II",
    label: "Mobility",
    eyebrow: "The journey is yours",
    headline: "Arrive differently.",
    body: "Exceptional mobility, without the ownership burden.",
    position: "left",
  },
  {
    id: "experiences",
    numeral: "III",
    label: "Experiences",
    eyebrow: "Beyond the ordinary",
    headline: "Closer to what matters.",
    body: "Private experiences. Exceptional access. A world beyond the expected.",
    position: "upper-left",
  },
];

export const finale = {
  headline: "A different way to experience Kerala.",
  sub: "For those who value time, privacy, and access.",
  primary: "Discover The Reserve",
};

/** Scene still assets, in journey order. `focus` is the subject point in image space (0–1, top-left origin). */
export const stills = [
  { key: "villa", alt: "A private Kerala villa with terracotta tiled roofs and an infinity pool among coconut palms at golden hour" },
  { key: "road", alt: "A dark green luxury SUV on a rain-soaked road through misty Munnar tea plantations" },
  { key: "helipad", alt: "A private helicopter on a laterite-edged helipad above a valley of cloud" },
  { key: "aerial", alt: "Aerial view of the Western Ghats and backwaters rolling to the Arabian Sea at golden hour" },
] as const;
