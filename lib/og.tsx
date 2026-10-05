import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_TYPE = "image/png";

/**
 * Imagen para compartir (WhatsApp, redes, buscadores): la marca sobre el
 * navy del sitio. Cada sección arma la suya con un rótulo, un título y
 * una línea de apoyo, así los links se distinguen entre sí.
 */
export function imagenOg({ rotulo, titulo, apoyo }: { rotulo: string; titulo: string; apoyo?: string }) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%", display: "flex", flexDirection: "column",
          justifyContent: "space-between", padding: "64px 72px",
          background: "linear-gradient(135deg, #07182C 0%, #0E2C50 100%)", color: "#fff",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 44, height: 4, background: "#B99F66" }} />
          <div style={{ fontSize: 26, letterSpacing: 4, textTransform: "uppercase", color: "#B99F66" }}>{rotulo}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div style={{ fontSize: titulo.length > 48 ? 62 : 76, fontWeight: 700, lineHeight: 1.08, letterSpacing: -1.5 }}>{titulo}</div>
          {apoyo && <div style={{ fontSize: 31, color: "rgba(255,255,255,.76)", lineHeight: 1.35 }}>{apoyo}</div>}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 28 }}>
          <div style={{ fontWeight: 600 }}>Espacio Inmobiliario</div>
          <div style={{ color: "#B99F66" }}>espacioinmobiliario.com.ar</div>
        </div>
      </div>
    ),
    { ...OG_SIZE },
  );
}
