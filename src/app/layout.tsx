import type { Metadata } from "next";
import { Cormorant_Garamond, Plus_Jakarta_Sans } from "next/font/google";
import ScrollToTop from "@/components/ScrollToTop";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-cormorant",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-jakarta",
});

export const metadata: Metadata = {
  title: "4 & 5 BHK Luxury Apartments in North Bangalore | Bollineni Vienna",
  description:
    "Luxury 4 & 5 BHK flats in North Bangalore at Bollineni Vienna. European-inspired design, premium amenities, excellent connectivity. Download the brochure.",
  keywords: [
    "Bollineni Vienna",
    "Bollineni Vienna Yelahanka",
    "4 BHK apartments in Yelahanka",
    "5 BHK apartments in Bangalore",
    "Luxury apartments in North Bangalore",
    "ultra-luxury apartments in North Bengaluru",
    "4 BHK flats for sale in Yelahanka",
    "5 BHK flats in North Bangalore",
    "Luxury apartments in Kogilu Bangalore",
    "BSCPL Bollineni Vienna price",
    "Bollineni Vienna floor plan / brochure",
    "Ultra-luxury apartments near Bangalore airport",
    "Low-density luxury apartments Bangalore",
    "Bollineni Vienna RERA",
  ],
  authors: [{ name: "Bollineni Group" }],
  publisher: "Bollineni Group",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "4 & 5 BHK Luxury Apartments in North Bangalore | Bollineni Vienna",
    description:
      "Luxury 4 & 5 BHK flats in North Bangalore at Bollineni Vienna. European-inspired design, premium amenities, excellent connectivity.",
    images: [{ url: "/og-image-gold.png", width: 1200, height: 630, alt: "Bollineni Vienna" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "4 & 5 BHK Luxury Apartments in North Bangalore | Bollineni Vienna",
    description:
      "Luxury 4 & 5 BHK flats in North Bangalore at Bollineni Vienna. European-inspired design, premium amenities, excellent connectivity.",
    images: ["/og-image-gold.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${cormorant.variable} ${jakarta.variable}`}
    >
      <body className="antialiased">
        <div className="relative bg-ink">{children}</div>
        <ScrollToTop />
      </body>
    </html>
  );
}
