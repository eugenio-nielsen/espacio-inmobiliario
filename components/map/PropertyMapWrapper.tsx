"use client";

import dynamic from "next/dynamic";

const PropertyMap = dynamic(() => import("./PropertyMap"), {
  ssr: false,
  loading: () => (
    <div style={{
      height: 320, background: "var(--navy-50)",
      borderRadius: "var(--radius-lg)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <span style={{ fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--ink-400)" }}>
        Cargando mapa…
      </span>
    </div>
  ),
});

export default PropertyMap;
