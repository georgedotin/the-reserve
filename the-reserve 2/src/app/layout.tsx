import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  // Set NEXT_PUBLIC_SITE_URL on the host so social-share images resolve to the live domain.
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "The Reserve — Private residences, mobility & experiences in Kerala",
  description:
    "The Reserve is a private lifestyle and access house in Kerala: exceptional residences, effortless mobility and experiences beyond the expected.",
  openGraph: {
    title: "The Reserve — Kerala",
    description: "Space to slow down. Arrive differently. Closer to what matters.",
    images: ["/scenes/villa-1280.webp"],
  },
};

export const viewport: Viewport = {
  themeColor: "#0d1712",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${cormorant.variable} ${manrope.variable} antialiased`}>
      <head>
        <link rel="preload" as="image" href="/scenes/villa-2400.webp" type="image/webp" media="(min-width: 900px)" />
        <link rel="preload" as="image" href="/scenes/villa-1280.webp" type="image/webp" media="(max-width: 899px)" />
      </head>
      <body>{children}</body>
    </html>
  );
}
