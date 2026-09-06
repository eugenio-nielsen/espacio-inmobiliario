/**
 * Sello de marca: monograma EN dentro de un anillo de texto que gira.
 *
 * Vive suelto (y no dentro de /como-funciona) porque aparece en dos
 * lugares a propósito: en la firma de la página del método y en el
 * footer de todo el sitio. Repetir la misma pieza es lo que la vuelve
 * reconocible; si cada lugar tuviera su variante, no sería un sello.
 *
 * El monograma va DENTRO del svg y no como texto absoluto encima: así
 * todo escala junto con el viewBox y el sello puede achicarse por CSS
 * en móvil sin que el tamaño de la "EN" quede clavado en píxeles.
 */
export default function SelloEN({
  size = 168,
  tono = "claro",
  etiqueta = "Responsable",
  className,
}: {
  size?: number;
  /** "claro" para fondos crema, "oscuro" para fondos navy. */
  tono?: "claro" | "oscuro";
  etiqueta?: string;
  className?: string;
}) {
  const oscuro = tono === "oscuro";
  const anillo = oscuro ? "var(--gold-400)" : "var(--gold-600)";
  const monograma = oscuro ? "#fff" : "var(--navy-800)";
  const pie = oscuro ? "var(--gold-400)" : "var(--gold-700)";

  // El id debe ser único por instancia: si el sello apareciera dos veces
  // en la misma página, dos <path id="..."> iguales harían que el segundo
  // textPath apuntara al primero.
  const id = `sello-arco-${size}-${tono}`;

  return (
    <div
      className={className}
      // El ancho sale de una custom property con el prop como fallback:
      // un width inline en píxeles le ganaría siempre a la hoja de
      // estilos y no se podría achicar el sello por media query.
      style={{
        width: `var(--sello-size, ${size}px)`,
        maxWidth: "100%",
        flexShrink: 0,
        lineHeight: 0,
      }}
    >
      <svg
        viewBox="0 0 200 200"
        style={{ width: "100%", height: "auto", display: "block" }}
        role="img"
        aria-label="Espacio Inmobiliario · Eugenio Nielsen"
      >
        <defs>
          <path id={id} d="M100,100 m-74,0 a74,74 0 1,1 148,0 a74,74 0 1,1 -148,0" fill="none" />
        </defs>

        {/* Anillo de texto girando sin parar */}
        <g className="sello-gira">
          <text
            fill={anillo}
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: "3.4px",
              textTransform: "uppercase",
            }}
          >
            <textPath href={`#${id}`} startOffset="0">
              Espacio Inmobiliario · Eugenio Nielsen · Buenos Aires ·
            </textPath>
          </text>
        </g>

        <circle cx="100" cy="100" r="60" fill="none" stroke={anillo} strokeWidth="1" opacity=".55" />
        <circle cx="100" cy="100" r="54" fill="none" stroke={anillo} strokeWidth="1" opacity=".3" />

        <text
          x="100"
          y={etiqueta ? 108 : 118}
          textAnchor="middle"
          fill={monograma}
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 600,
            fontSize: 52,
            letterSpacing: "1px",
          }}
        >
          EN
        </text>

        {etiqueta && (
          <text
            x="100"
            y="130"
            textAnchor="middle"
            fill={pie}
            style={{
              fontFamily: "var(--font-sans)",
              fontWeight: 500,
              fontSize: 10,
              letterSpacing: "3px",
              textTransform: "uppercase",
            }}
          >
            {etiqueta}
          </text>
        )}
      </svg>
    </div>
  );
}
