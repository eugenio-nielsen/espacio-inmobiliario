import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Logo from "@/components/Logo";
import {
  UserRound, Camera, MessageSquare, Handshake,
  Search, Phone, BadgeCheck, ShieldCheck, Star,
  ArrowRight, Plus, Scale,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Cómo funciona — Espacio Inmobiliario",
  description: "Publicá tu propiedad gratis con el respaldo de un martillero público matriculado. Sin comisiones ni intermediarios. Conocé cómo funciona Espacio Inmobiliario.",
  alternates: { canonical: `${process.env.NEXT_PUBLIC_SITE_URL}/como-funciona` },
  openGraph: {
    title: "Cómo funciona — Espacio Inmobiliario",
    description: "Publicá tu propiedad gratis con el respaldo de un martillero público matriculado.",
    type: "website",
  },
};

const STEPS_DUENO = [
  {
    num: "01",
    icon: UserRound,
    titulo: "Creá tu cuenta gratuita",
    descripcion:
      "Registrarte toma menos de dos minutos. Solo necesitás tu nombre, email y teléfono. Sin cargos, sin datos de tarjeta, sin letra chica.",
  },
  {
    num: "02",
    icon: Camera,
    titulo: "Publicá tu propiedad",
    descripcion:
      "Cargá fotos, descripción, precio y ubicación. Tu publicación queda visible de inmediato para miles de interesados activos en Buenos Aires y alrededores.",
  },
  {
    num: "03",
    icon: MessageSquare,
    titulo: "Recibí consultas directamente",
    descripcion:
      "Los interesados te escriben a vos — sin pasar por una agencia ni pagar comisión. Cada consulta llega a tu email y a tu panel en tiempo real.",
  },
  {
    num: "04",
    icon: Handshake,
    titulo: "Cerrá con respaldo profesional",
    descripcion:
      "Durante todo el proceso contás con el asesoramiento de Eugenio Nielsen, martillero público matriculado. No estás solo: hay un profesional detrás de cada transacción.",
  },
];

const STEPS_COMPRADOR = [
  {
    num: "01",
    icon: Search,
    titulo: "Explorá el catálogo",
    descripcion:
      "Propiedades reales, publicadas directamente por sus dueños. Sin inflación de precio por comisiones de agencia. Lo que ves es el precio que pide el propietario.",
  },
  {
    num: "02",
    icon: Phone,
    titulo: "Contactá al dueño directo",
    descripcion:
      "Cada ficha tiene un formulario de consulta que llega directo al propietario. Sin intermediarios que filtren la información ni demoren las respuestas.",
  },
  {
    num: "03",
    icon: BadgeCheck,
    titulo: "Negociá a precio de mercado",
    descripcion:
      "Al no haber comisiones implícitas en el precio, accedés a valores competitivos y reales. Y si necesitás orientación, el equipo de Espacio está disponible para asesorarte.",
  },
];

const DIFERENCIALES = [
  {
    icon: ShieldCheck,
    titulo: "Auditado por un martillero público",
    descripcion:
      "Eugenio Nielsen, martillero público matriculado, revisa y respalda cada publicación. No somos solo una plataforma — hay un profesional responsable detrás.",
  },
  {
    icon: Scale,
    titulo: "Sin comisiones, precio justo",
    descripcion:
      "El dueño vende al precio que considera justo. El comprador accede a ese precio directamente, sin el recargo de una comisión inmobiliaria implícita.",
  },
  {
    icon: Star,
    titulo: "Gratis para siempre",
    descripcion:
      "Publicar en Espacio Inmobiliario no tiene costo. Creemos que acceder al mercado inmobiliario debería ser un derecho, no un privilegio.",
  },
];

export default function ComoFuncionaPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)" }}>
      <Navbar />

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section style={{
        background: "var(--navy-800)",
        color: "#fff",
        position: "relative",
        overflow: "hidden",
        padding: "clamp(56px,9vw,100px) 24px clamp(64px,10vw,112px)",
        textAlign: "center",
      }}>
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(circle at 60% 0%, rgba(185,159,102,.14), transparent 55%)",
          pointerEvents: "none",
        }} />
        <div style={{ position: "relative", maxWidth: 720, margin: "0 auto" }}>
          <div className="es-eyebrow es-eyebrow-light" style={{ marginBottom: 16 }}>
            Transparencia en cada paso
          </div>
          <h1 style={{
            fontFamily: "var(--font-display)", fontWeight: 700,
            fontSize: "clamp(30px,5vw,54px)", lineHeight: 1.12,
            letterSpacing: "-.02em", margin: "0 0 20px",
          }}>
            Un mercado inmobiliario{" "}
            <span style={{ fontStyle: "italic", color: "var(--gold-300)" }}>
              abierto y sin comisiones
            </span>
          </h1>
          <p style={{
            fontFamily: "var(--font-sans)",
            fontSize: "clamp(15px,2.2vw,17.5px)",
            lineHeight: 1.7, color: "rgba(255,255,255,.72)",
            maxWidth: 560, margin: "0 auto 36px",
          }}>
            Espacio Inmobiliario conecta a dueños con compradores de manera directa,
            gratuita y con el respaldo de un martillero público matriculado.
            Sin intermediarios. Sin letra chica.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <a href="/auth/registro" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 14.5,
              background: "var(--gold-500)", color: "var(--navy-900)",
              padding: "14px 28px", borderRadius: "var(--radius-sm)",
              textDecoration: "none", transition: "background .15s",
            }}>
              <Plus size={16} strokeWidth={2.5} />
              Publicar mi propiedad gratis
            </a>
            <a href="/propiedades" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 14.5,
              background: "transparent", color: "#fff",
              border: "1.5px solid rgba(255,255,255,.3)",
              padding: "14px 28px", borderRadius: "var(--radius-sm)",
              textDecoration: "none",
            }}>
              Explorar propiedades
              <ArrowRight size={15} strokeWidth={2} />
            </a>
          </div>
        </div>
      </section>

      {/* ── Para dueños ───────────────────────────────────────── */}
      <section className="section-pad" style={{ maxWidth: "var(--container)", margin: "0 auto" }}>
        <div style={{ marginBottom: "clamp(28px,4vw,48px)" }}>
          <div className="es-eyebrow" style={{ marginBottom: 10 }}>Para propietarios</div>
          <h2 style={{
            fontFamily: "var(--font-display)", fontWeight: 700,
            fontSize: "clamp(24px,4vw,38px)", letterSpacing: "-.02em",
            color: "var(--navy-800)", margin: "0 0 12px",
          }}>
            Vendé tu propiedad con visibilidad real
          </h2>
          <p style={{
            fontFamily: "var(--font-sans)", fontSize: "clamp(14px,2vw,16px)",
            color: "var(--ink-500)", lineHeight: 1.65, maxWidth: 560,
          }}>
            Publicar en Espacio Inmobiliario es gratuito y te da acceso a un canal
            de venta profesional, con el asesoramiento de un martillero público durante todo el proceso.
          </p>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 20,
        }}>
          {STEPS_DUENO.map((step) => {
            const Icon = step.icon;
            return (
              <div key={step.num} style={{
                background: "#fff",
                border: "1px solid var(--line-200)",
                borderRadius: "var(--radius-lg)",
                padding: "28px 24px",
                boxShadow: "var(--shadow-xs)",
                position: "relative",
              }}>
                {/* Número de fondo */}
                <span style={{
                  position: "absolute", top: 20, right: 22,
                  fontFamily: "var(--font-display)", fontWeight: 800,
                  fontSize: 52, color: "var(--navy-50)",
                  lineHeight: 1, userSelect: "none",
                }}>
                  {step.num}
                </span>

                <div style={{
                  width: 46, height: 46,
                  background: "var(--navy-800)",
                  borderRadius: "var(--radius-md)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: 18,
                }}>
                  <Icon size={22} strokeWidth={1.75} color="var(--gold-400)" />
                </div>

                <h3 style={{
                  fontFamily: "var(--font-sans)", fontWeight: 700,
                  fontSize: 16, color: "var(--navy-800)",
                  margin: "0 0 10px",
                }}>
                  {step.titulo}
                </h3>
                <p style={{
                  fontFamily: "var(--font-sans)", fontSize: 14,
                  color: "var(--ink-500)", lineHeight: 1.65, margin: 0,
                }}>
                  {step.descripcion}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Divider diferencial ───────────────────────────────── */}
      <section style={{
        background: "var(--navy-800)",
        padding: "clamp(48px,7vw,80px) 24px",
      }}>
        <div style={{ maxWidth: "var(--container)", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "clamp(28px,4vw,48px)" }}>
            <div className="es-eyebrow es-eyebrow-light" style={{ marginBottom: 12 }}>
              Nuestros diferenciales
            </div>
            <h2 style={{
              fontFamily: "var(--font-display)", fontWeight: 700,
              fontSize: "clamp(22px,4vw,36px)", letterSpacing: "-.02em",
              color: "#fff", margin: "0 0 12px",
            }}>
              Por qué elegir Espacio Inmobiliario
            </h2>
            <p style={{
              fontFamily: "var(--font-sans)", fontSize: "clamp(14px,2vw,16px)",
              color: "rgba(255,255,255,.65)", maxWidth: 480, margin: "0 auto",
              lineHeight: 1.65,
            }}>
              No somos una inmobiliaria. Somos una plataforma pública, gratuita
              y profesionalmente supervisada.
            </p>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 20,
          }}>
            {DIFERENCIALES.map((d) => {
              const Icon = d.icon;
              return (
                <div key={d.titulo} style={{
                  background: "rgba(255,255,255,.05)",
                  border: "1px solid rgba(255,255,255,.10)",
                  borderRadius: "var(--radius-lg)",
                  padding: "28px 24px",
                }}>
                  <div style={{
                    width: 46, height: 46,
                    background: "rgba(185,159,102,.15)",
                    borderRadius: "var(--radius-md)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    marginBottom: 18,
                  }}>
                    <Icon size={22} strokeWidth={1.75} color="var(--gold-400)" />
                  </div>
                  <h3 style={{
                    fontFamily: "var(--font-sans)", fontWeight: 700,
                    fontSize: 16, color: "#fff", margin: "0 0 10px",
                  }}>
                    {d.titulo}
                  </h3>
                  <p style={{
                    fontFamily: "var(--font-sans)", fontSize: 14,
                    color: "rgba(255,255,255,.62)", lineHeight: 1.65, margin: 0,
                  }}>
                    {d.descripcion}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Para compradores ──────────────────────────────────── */}
      <section className="section-pad" style={{ maxWidth: "var(--container)", margin: "0 auto" }}>
        <div style={{ marginBottom: "clamp(28px,4vw,48px)" }}>
          <div className="es-eyebrow" style={{ marginBottom: 10 }}>Para compradores</div>
          <h2 style={{
            fontFamily: "var(--font-display)", fontWeight: 700,
            fontSize: "clamp(24px,4vw,38px)", letterSpacing: "-.02em",
            color: "var(--navy-800)", margin: "0 0 12px",
          }}>
            Accedé a propiedades a precio real
          </h2>
          <p style={{
            fontFamily: "var(--font-sans)", fontSize: "clamp(14px,2vw,16px)",
            color: "var(--ink-500)", lineHeight: 1.65, maxWidth: 520,
          }}>
            Sin comisiones ocultas en el precio. Tratás directamente con el dueño
            y comprás a lo que la propiedad realmente vale.
          </p>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 20,
        }}>
          {STEPS_COMPRADOR.map((step) => {
            const Icon = step.icon;
            return (
              <div key={step.num} style={{
                background: "#fff",
                border: "1px solid var(--line-200)",
                borderRadius: "var(--radius-lg)",
                padding: "28px 24px",
                boxShadow: "var(--shadow-xs)",
                position: "relative",
              }}>
                <span style={{
                  position: "absolute", top: 20, right: 22,
                  fontFamily: "var(--font-display)", fontWeight: 800,
                  fontSize: 52, color: "var(--navy-50)",
                  lineHeight: 1, userSelect: "none",
                }}>
                  {step.num}
                </span>

                <div style={{
                  width: 46, height: 46,
                  background: "rgba(185,159,102,.12)",
                  border: "1.5px solid var(--gold-300)",
                  borderRadius: "var(--radius-md)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: 18,
                }}>
                  <Icon size={22} strokeWidth={1.75} color="var(--gold-700)" />
                </div>

                <h3 style={{
                  fontFamily: "var(--font-sans)", fontWeight: 700,
                  fontSize: 16, color: "var(--navy-800)",
                  margin: "0 0 10px",
                }}>
                  {step.titulo}
                </h3>
                <p style={{
                  fontFamily: "var(--font-sans)", fontSize: 14,
                  color: "var(--ink-500)", lineHeight: 1.65, margin: 0,
                }}>
                  {step.descripcion}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Respaldo profesional ──────────────────────────────── */}
      <section style={{
        background: "var(--cream)",
        borderTop: "1px solid var(--gold-200)",
        borderBottom: "1px solid var(--gold-200)",
        padding: "clamp(48px,7vw,80px) 24px",
      }}>
        <div style={{
          maxWidth: 760, margin: "0 auto",
          display: "grid", gridTemplateColumns: "auto 1fr", gap: 40,
          alignItems: "center",
        }}
          className="como-funciona-pro"
        >
          {/* Avatar profesional */}
          <div style={{
            width: 96, height: 96, borderRadius: 999,
            background: "var(--navy-800)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
            boxShadow: "0 4px 20px rgba(14,44,80,.18)",
          }}>
            <span style={{
              fontFamily: "var(--font-display)", fontWeight: 700,
              fontSize: 36, color: "var(--gold-400)", lineHeight: 1,
            }}>
              EN
            </span>
          </div>

          <div>
            <div className="es-eyebrow" style={{ marginBottom: 10 }}>
              Respaldo profesional
            </div>
            <h2 style={{
              fontFamily: "var(--font-display)", fontWeight: 700,
              fontSize: "clamp(20px,3.5vw,30px)", letterSpacing: "-.02em",
              color: "var(--navy-800)", margin: "0 0 12px",
            }}>
              Martillero público matriculado
            </h2>
            <p style={{
              fontFamily: "var(--font-sans)", fontSize: "clamp(14px,2vw,16px)",
              color: "var(--ink-600)", lineHeight: 1.7, margin: "0 0 20px",
            }}>
              Eugenio Nielsen es martillero público matriculado y el profesional responsable
              detrás de Espacio Inmobiliario. Cada publicación es revisada y el proceso
              de compraventa cuenta con su asesoramiento, garantizando que tanto dueños
              como compradores operen dentro de un marco legal y transparente.
            </p>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <a href="https://wa.me/5491164519421" target="_blank" rel="noopener noreferrer"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 14,
                  background: "#25D366", color: "#fff",
                  padding: "11px 20px", borderRadius: "var(--radius-sm)",
                  textDecoration: "none",
                }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Consultá con Eugenio
              </a>
              <a href="mailto:eugenio@espacioinmobiliario.com.ar"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 14,
                  color: "var(--navy-800)", border: "1.5px solid var(--navy-200)",
                  background: "#fff",
                  padding: "11px 20px", borderRadius: "var(--radius-sm)",
                  textDecoration: "none",
                }}>
                eugenio@espacioinmobiliario.com.ar
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA final ─────────────────────────────────────────── */}
      <section className="section-pad" style={{ textAlign: "center" }}>
        <div style={{ maxWidth: 620, margin: "0 auto" }}>
          <div className="es-eyebrow" style={{ marginBottom: 14 }}>Empezá ahora</div>
          <h2 style={{
            fontFamily: "var(--font-display)", fontWeight: 700,
            fontSize: "clamp(24px,4vw,38px)", letterSpacing: "-.02em",
            color: "var(--navy-800)", margin: "0 0 14px",
          }}>
            ¿Listo para dar el primer paso?
          </h2>
          <p style={{
            fontFamily: "var(--font-sans)", fontSize: "clamp(14px,2vw,16.5px)",
            color: "var(--ink-500)", lineHeight: 1.65, margin: "0 auto 32px",
            maxWidth: 480,
          }}>
            Publicar tu propiedad es gratis, sin compromisos y lleva menos de 5 minutos.
            Contás con un martillero público disponible ante cualquier consulta.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <a href="/auth/registro" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 15,
              background: "var(--navy-800)", color: "#fff",
              padding: "15px 32px", borderRadius: "var(--radius-sm)",
              textDecoration: "none",
            }}>
              <Plus size={16} strokeWidth={2.5} />
              Publicar mi propiedad gratis
            </a>
            <a href="/propiedades" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 15,
              color: "var(--gold-700)",
              border: "1.5px solid var(--gold-300)",
              background: "#fff",
              padding: "15px 32px", borderRadius: "var(--radius-sm)",
              textDecoration: "none",
            }}>
              Ver propiedades
              <ArrowRight size={15} strokeWidth={2} />
            </a>
          </div>
        </div>
      </section>

      {/* ── Footer mínimo ─────────────────────────────────────── */}
      <footer style={{ background: "var(--navy-800)" }}>
        <div style={{
          maxWidth: "var(--container)", margin: "0 auto",
          padding: "32px 24px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap", gap: 16,
        }}>
          <Logo className="h-12 w-auto" />
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            {[
              ["Propiedades", "/propiedades"],
              ["Publicar gratis", "/auth/registro"],
              ["Inicio", "/"],
            ].map(([label, href]) => (
              <a key={label} href={href} style={{
                fontFamily: "var(--font-sans)", fontSize: 13.5,
                color: "rgba(255,255,255,.7)", textDecoration: "none",
              }}>
                {label}
              </a>
            ))}
          </div>
        </div>
        <div style={{
          borderTop: "1px solid var(--navy-700)", padding: "16px 24px",
          textAlign: "center", fontFamily: "var(--font-sans)",
          fontSize: 12.5, color: "var(--navy-300)",
        }}>
          © {new Date().getFullYear()} Espacio Inmobiliario · Martillero Público Matriculado
        </div>
      </footer>
    </div>
  );
}
