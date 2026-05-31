import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });

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
    <html lang="es-AR" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-gray-50">{children}</body>
    </html>
  );
}
