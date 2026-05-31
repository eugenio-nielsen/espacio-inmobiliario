import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { Playfair_Display } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  style: ["normal", "italic"],
  display: "swap",
});

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://espacioinmobiliario.com.ar";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: "Espacio Inmobiliario — Propiedades directas de dueños",
    template: "%s | Espacio Inmobiliario",
  },
  description:
    "Comprá, vendé o alquilá propiedades directamente con los dueños en Buenos Aires. Sin comisiones ni intermediarios.",
  openGraph: {
    siteName: "Espacio Inmobiliario",
    locale: "es_AR",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
  alternates: { canonical: SITE },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR" className={`${outfit.variable} ${playfair.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
