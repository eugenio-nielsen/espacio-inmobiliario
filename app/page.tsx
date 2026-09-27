import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/user";
import type { Metadata } from "next";
import { PROPERTY_CARD_COLS, TOPE_HOME, type PropertyCardData } from "@/lib/types";
import PropiedadesHome from "@/components/home/PropiedadesHome";
import { conPropietarioVerificado } from "@/lib/propiedades/verificados";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Plus, ArrowRight, Building2, Eye, Map as MapIcon, Percent } from "lucide-react";
import ServiciosEcosistema from "@/components/servicios/ServiciosEcosistema";
import Counter from "@/components/ui/Counter";
import FadeIn from "@/components/ui/FadeIn";
import Caminos from "@/components/home/Caminos";
import ComoTrabajamos from "@/components/home/ComoTrabajamos";
import Respaldo from "@/components/home/Respaldo";
import Apertura from "@/components/home/Apertura";
import { BARRIOS_CABA, PARTIDOS_PBA } from "@/lib/ubicaciones";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Espacio Inmobiliario · Propiedades directas de dueños en Argentina",
  description: "Comprá o vendé propiedades directamente con los dueños, sin comisiones y con acompañamiento profesional. Espacio Inmobiliario, Buenos Aires.",
  alternates: { canonical: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000" },
  openGraph: {
    title: "Espacio Inmobiliario · Dueños Directos",
    description: "Propiedades directas de dueños en Buenos Aires. Sin comisiones.",
    type: "website",
  },
};

export default async function HomePage() {
  const supabase = await createClient();

  // Las tres consultas van en paralelo: el tiempo total es el de la más
  // lenta, no la suma. Las estadísticas las agrega Postgres (home_stats).
  // getUser va aparte a propósito: dentro de un Promise.all junto a otras
  // consultas, el adaptador de cookies de Supabase falla. Está cacheado por
  // request, así que el Navbar reusa esta misma llamada.
  const user = await getCurrentUser();

  // Estas dos sí van en paralelo: el tiempo total es el de la más lenta.
  // Las estadísticas las agrega Postgres (home_stats) en vez de traer
  // todas las filas para sumarlas en JavaScript.
  const [{ data: properties }, { data: statsRow }] = await Promise.all([
    supabase
      .from("properties").select(PROPERTY_CARD_COLS).eq("status", "activa")
      .order("created_at", { ascending: false }).limit(TOPE_HOME),
    supabase.rpc("home_stats").maybeSingle<{ total_activas: number; total_views: number }>(),
  ]);

  const destacadas = await conPropietarioVerificado(supabase, (properties ?? []) as PropertyCardData[]);

  const activeCount = statsRow?.total_activas ?? 0;
  const totalViews = statsRow?.total_views ?? 0;
  const totalZonas = BARRIOS_CABA.length + PARTIDOS_PBA.length;

  const stats: { icon: typeof Building2; to: number; suffix: string; label: string; static?: string }[] = [
    { icon: Building2, to: activeCount, suffix: "", label: "Propiedades publicadas" },
    { icon: Eye,       to: totalViews,        suffix: "", label: "Visitas totales" },
    { icon: MapIcon,   to: totalZonas,        suffix: "", label: "Barrios y partidos" },
    { icon: Percent,   to: 0,                 suffix: "%", label: "Comisiones", static: "0%" },
  ];

  return (
    <div>
      <Navbar />

      {/* ── Apertura (hero) ─────────────────────────────────── */}
      <Apertura logueado={!!user} />

      {/* ── Banda de estadísticas ─────────────────────────────── */}
      <section style={{ background: "var(--navy-900)", borderTop: "1px solid rgba(185,159,102,.25)", borderBottom: "1px solid rgba(185,159,102,.25)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 0%, rgba(185,159,102,.10), transparent 60%)", pointerEvents: "none" }} />
        <div className="grid-stats-band" style={{ position: "relative", maxWidth: "var(--container)", margin: "0 auto", padding: "clamp(36px,5vw,52px) 24px" }}>
          {stats.map((s, i) => {
            const Icon = s.icon;
            return (
              <FadeIn key={s.label} delay={i * 100} direction="up" className="stat-cell">
                <span className="stat-number">
                  {s.static ?? <Counter to={s.to} suffix={s.suffix} />}
                </span>
                <span className="stat-rule" />
                <span className="stat-label">
                  <Icon size={13} strokeWidth={2} color="var(--gold-400)" />
                  {s.label}
                </span>
              </FadeIn>
            );
          })}
        </div>
      </section>

      {/* ── Las cuatro puertas ─────────────────────────────────── */}
      <section className="hm-sect" style={{ background: "var(--cream)", borderBottom: "1px solid var(--gold-200)" }}>
        <div style={{ maxWidth: "var(--container)", margin: "0 auto" }}>
          <Caminos />
        </div>
      </section>

      {/* ── Últimas propiedades ───────────────────────────────── */}
      <section className="section-pad" style={{ maxWidth: "var(--container)", margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 24, gap: 12 }}>
          <div>
            <div className="es-eyebrow" style={{ marginBottom: 8 }}>El portal es solo el comienzo</div>
            <h2 className="section-heading">Últimas propiedades</h2>
          </div>
          <Link href="/propiedades" style={{
            fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 14,
            color: "var(--gold-700)", display: "inline-flex", alignItems: "center",
            gap: 4, textDecoration: "none", whiteSpace: "nowrap", flexShrink: 0,
          }}>
            Ver todas <ArrowRight size={15} strokeWidth={2} />
          </Link>
        </div>

        {!properties?.length ? (
          <div style={{ textAlign: "center", padding: "48px 24px", background: "#fff", borderRadius: "var(--radius-lg)", border: "1px solid var(--line-200)" }}>
            <p style={{ fontFamily: "var(--font-sans)", color: "var(--ink-500)", marginBottom: 16 }}>
              Todavía no hay propiedades publicadas.
            </p>
            <Link href="/auth/registro" style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 14, background: "var(--navy-800)", color: "#fff", borderRadius: "var(--radius-sm)", padding: "11px 22px", display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
              <Plus size={15} strokeWidth={2} /> Publicar la primera
            </Link>
          </div>
        ) : (
          <>
            <PropiedadesHome
              iniciales={destacadas}
              totalActivas={activeCount}
            />
          </>
        )}
      </section>

      {/* ── Cómo trabajamos ───────────────────────────────────── */}
      <section className="hm-sect" style={{ background: "var(--cream)", borderTop: "1px solid var(--gold-200)" }}>
        <div style={{ maxWidth: "var(--container)", margin: "0 auto" }}>
          <FadeIn direction="up">
            <div className="hm-concepto" style={{ marginBottom: "clamp(24px,3.5vw,36px)" }}>
              <div className="es-eyebrow" style={{ marginBottom: 10 }}>Cómo trabajamos</div>
              <h2>Te acompañamos en <span className="hm-i">cada paso</span></h2>
            </div>
          </FadeIn>
          <ComoTrabajamos />
        </div>
      </section>

      {/* ── Respaldo ──────────────────────────────────────────────
          Ocupa el lugar del viejo bloque "¿Sos dueño y querés vender?",
          que repetía palabra por palabra el camino "Quiero vender" de
          más arriba. Su CTA de publicar se conservó acá dentro. Trae
          su propia <section>: el fondo y la cinta van a todo el ancho. */}
      <Respaldo />

      {/* ── Ecosistema de servicios ───────────────────────────── */}
      <ServiciosEcosistema isLoggedIn={!!user} />

      {/* ── Footer ───────────────────────────────────────────── */}
      <Footer />
    </div>
  );
}
