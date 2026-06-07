"use client";

import { useState, useTransition } from "react";
import { Camera, FileText, Truck, Wrench, Sparkles, X, CheckCircle } from "lucide-react";
import { requestServiceConnection } from "@/lib/actions/servicios";

const SERVICIOS = [
  {
    id: "fotografia",
    icon: Camera,
    titulo: "Fotografía profesional",
    descripcion: "Fotos y video que destacan tu propiedad y generan más consultas.",
  },
  {
    id: "escribania",
    icon: FileText,
    titulo: "Escribanía",
    descripcion: "Gestión de escrituras, certificados y trámites notariales.",
  },
  {
    id: "mudanzas",
    icon: Truck,
    titulo: "Mudanzas",
    descripcion: "Traslados seguros con embalaje y logística completa.",
  },
  {
    id: "refacciones",
    icon: Wrench,
    titulo: "Refacciones y pintura",
    descripcion: "Mejoras para preparar tu propiedad antes de vender.",
  },
] as const;

type ServicioId = (typeof SERVICIOS)[number]["id"];

interface Props {
  isLoggedIn: boolean;
}

export default function ServiciosEcosistema({ isLoggedIn }: Props) {
  const [selected, setSelected]   = useState<ServicioId | null>(null);
  const [success, setSuccess]     = useState<ServicioId | null>(null);
  const [error, setError]         = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedServicio = SERVICIOS.find(s => s.id === selected);

  function openModal(id: ServicioId) {
    if (!isLoggedIn) {
      window.location.href = "/auth/login?redirect=/";
      return;
    }
    setSelected(id);
    setError(null);
  }

  function closeModal() {
    setSelected(null);
    setError(null);
  }

  function handleConfirm() {
    if (!selectedServicio) return;
    startTransition(async () => {
      const result = await requestServiceConnection(selectedServicio.titulo);
      if (result.ok) {
        setSuccess(selectedServicio.id);
        setSelected(null);
      } else {
        setError(result.error || "Ocurrió un error. Intentá de nuevo.");
      }
    });
  }

  return (
    <>
      <section
        id="servicios"
        className="section-pad"
        style={{ background: "var(--navy-800)", color: "#fff", position: "relative", overflow: "hidden" }}
      >
        {/* fondo sutil */}
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(circle at 80% 50%, rgba(185,159,102,.07), transparent 55%)",
          pointerEvents: "none",
        }} />

        <div style={{ position: "relative", maxWidth: "var(--container)", margin: "0 auto" }}>
          {/* encabezado */}
          <div style={{ textAlign: "center", marginBottom: "clamp(28px,4vw,44px)" }}>
            <div className="es-eyebrow es-eyebrow-light" style={{ marginBottom: 10 }}>
              <Sparkles size={13} strokeWidth={2} style={{ display: "inline", marginRight: 6, verticalAlign: "middle", color: "var(--gold-400)" }} />
              Ecosistema de servicios
            </div>
            <h2 style={{
              fontFamily: "var(--font-display)", fontWeight: 700,
              fontSize: "clamp(22px,4vw,36px)", letterSpacing: "-.02em",
              margin: "0 0 12px", color: "#fff",
            }}>
              Todo lo que necesitás para vender,{" "}
              <span style={{ fontStyle: "italic", color: "var(--gold-300)" }}>en un solo lugar</span>
            </h2>
            <p style={{
              fontFamily: "var(--font-sans)", fontSize: "clamp(14px,2vw,16px)",
              color: "rgba(255,255,255,.70)", maxWidth: 520, margin: "0 auto",
              lineHeight: 1.65,
            }}>
              Conectamos a los dueños con profesionales de confianza para cada etapa del proceso.
            </p>
          </div>

          {/* grid de cards (carrusel horizontal en mobile) */}
          <div className="hscroll-cards">
            {SERVICIOS.map(s => {
              const Icon = s.icon;
              const done = success === s.id;
              return (
                <div
                  key={s.id}
                  style={{
                    background: "rgba(255,255,255,.05)",
                    border: done ? "1px solid rgba(185,159,102,.5)" : "1px solid rgba(255,255,255,.10)",
                    borderRadius: "var(--radius-lg)",
                    padding: "24px 22px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                    transition: "border-color .2s, background .2s",
                  }}
                >
                  <div style={{
                    width: 44, height: 44,
                    background: "rgba(185,159,102,.15)",
                    borderRadius: "var(--radius-md)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <Icon size={22} strokeWidth={1.75} color="var(--gold-400)" />
                  </div>

                  <div style={{ flex: 1 }}>
                    <h3 style={{
                      fontFamily: "var(--font-sans)", fontWeight: 700,
                      fontSize: 15.5, color: "#fff", margin: "0 0 6px",
                    }}>
                      {s.titulo}
                    </h3>
                    <p style={{
                      fontFamily: "var(--font-sans)", fontSize: 13.5,
                      color: "rgba(255,255,255,.62)", margin: 0, lineHeight: 1.55,
                    }}>
                      {s.descripcion}
                    </p>
                  </div>

                  {done ? (
                    <div style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 600,
                      color: "var(--gold-400)",
                    }}>
                      <CheckCircle size={15} strokeWidth={2} />
                      Solicitud enviada
                    </div>
                  ) : (
                    <button
                      onClick={() => openModal(s.id)}
                      style={{
                        alignSelf: "flex-start",
                        fontFamily: "var(--font-sans)", fontWeight: 600,
                        fontSize: 13, padding: "9px 18px",
                        background: "transparent",
                        border: "1px solid rgba(185,159,102,.6)",
                        color: "var(--gold-300)",
                        borderRadius: "var(--radius-sm)",
                        cursor: "pointer",
                        transition: "background .15s, border-color .15s",
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLButtonElement).style.background = "rgba(185,159,102,.12)";
                        (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--gold-400)";
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                        (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(185,159,102,.6)";
                      }}
                    >
                      Quiero conectar →
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* nota al pie */}
          <p style={{
            textAlign: "center", marginTop: 24,
            fontFamily: "var(--font-sans)", fontSize: 12.5,
            color: "rgba(255,255,255,.35)",
          }}>
            Te conectamos con el profesional adecuado. Sin costo adicional.
          </p>
        </div>
      </section>

      {/* ── Modal de confirmación ───────────────────────────────── */}
      {selected && selectedServicio && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={e => { if (e.target === e.currentTarget) closeModal(); }}
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "rgba(14,44,80,.6)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "20px",
          }}
        >
          <div style={{
            background: "#fff", borderRadius: "var(--radius-lg)",
            padding: "32px 28px", maxWidth: 420, width: "100%",
            boxShadow: "0 20px 60px rgba(14,44,80,.2)",
            position: "relative",
          }}>
            <button
              onClick={closeModal}
              style={{
                position: "absolute", top: 16, right: 16,
                background: "none", border: "none", cursor: "pointer",
                color: "var(--ink-400)", padding: 4,
              }}
              aria-label="Cerrar"
            >
              <X size={18} />
            </button>

            <div style={{
              width: 48, height: 48,
              background: "var(--cream)",
              borderRadius: "var(--radius-md)",
              display: "flex", alignItems: "center", justifyContent: "center",
              marginBottom: 16,
            }}>
              {(() => { const Icon = selectedServicio.icon; return <Icon size={24} strokeWidth={1.75} color="var(--gold-700)" />; })()}
            </div>

            <h3 style={{
              fontFamily: "var(--font-display)", fontWeight: 700,
              fontSize: 20, color: "var(--navy-800)", margin: "0 0 8px",
            }}>
              {selectedServicio.titulo}
            </h3>
            <p style={{
              fontFamily: "var(--font-sans)", fontSize: 14.5,
              color: "var(--ink-500)", margin: "0 0 24px", lineHeight: 1.6,
            }}>
              Te vamos a conectar con un profesional de <strong>{selectedServicio.titulo.toLowerCase()}</strong>. Nos comunicamos con vos a la brevedad.
            </p>

            {error && (
              <p style={{
                fontFamily: "var(--font-sans)", fontSize: 13,
                color: "#DC2626", marginBottom: 16,
                background: "#FEF2F2", borderRadius: 8, padding: "10px 14px",
              }}>
                {error}
              </p>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={closeModal}
                style={{
                  flex: 1, fontFamily: "var(--font-sans)", fontWeight: 600,
                  fontSize: 14, padding: "12px 0",
                  background: "var(--line-100)", border: "1px solid var(--line-200)",
                  borderRadius: "var(--radius-sm)", cursor: "pointer", color: "var(--ink-600)",
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                disabled={isPending}
                style={{
                  flex: 2, fontFamily: "var(--font-sans)", fontWeight: 700,
                  fontSize: 14, padding: "12px 0",
                  background: isPending ? "var(--navy-400)" : "var(--navy-800)",
                  border: "none", borderRadius: "var(--radius-sm)",
                  cursor: isPending ? "not-allowed" : "pointer",
                  color: "#fff", transition: "background .15s",
                }}
              >
                {isPending ? "Enviando..." : "Sí, quiero conectar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
