import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { Playfair_Display } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import AsesoriaFlotante from "@/components/AsesoriaFlotante";
import ClicksGA from "@/components/analytics/ClicksGA";
import OrigenVisita from "@/components/analytics/OrigenVisita";
import { CLAVE_TRAFICO_INTERNO } from "@/lib/trafico-interno";

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

import { SITE } from "@/lib/site";
const GA_ID = "G-EV1LYND1S5";
// GA solo en el sitio publicado: en desarrollo (localhost) cada prueba
// sumaba visitas y eventos falsos a los números reales
const GA_ACTIVO = process.env.NODE_ENV === "production";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: "Espacio Inmobiliario · Propiedades directas de dueños",
    template: "%s | Espacio Inmobiliario",
  },
  description:
    "Comprá o vendé propiedades directamente con los dueños en Buenos Aires. Sin comisiones, con acompañamiento profesional.",
  openGraph: {
    siteName: "Espacio Inmobiliario",
    locale: "es_AR",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR" className={`${outfit.variable} ${playfair.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {children}

        <AsesoriaFlotante />
        <ClicksGA />
        <OrigenVisita />

        {/* Google Analytics — carga después de que la página es interactiva */}
        {GA_ACTIVO && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                var interno = false;
                try { interno = localStorage.getItem('${CLAVE_TRAFICO_INTERNO}') === '1'; } catch (e) {}
                gtag('config', '${GA_ID}', interno ? { traffic_type: 'internal' } : {});
              `}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
