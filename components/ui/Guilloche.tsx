import "./guilloche.css";

/**
 * Guilloché: las rosetas de líneas entrelazadas de los billetes, los
 * títulos y las escrituras. Es el lenguaje visual del papel que respalda
 * algo, y por eso aparece detrás del sello en el bloque de Respaldo.
 *
 * Cada anillo es UNA curva (un círculo ondulado: r + a·sin(k·θ)) repetida
 * con <use> y girada una fracción de lóbulo por copia. Así el entramado
 * pesa lo que una sola curva en el HTML, en vez de decenas de paths.
 *
 * Cada anillo va en su propio svg y gira despacio en sentido contrario al
 * de al lado: el cruce de las líneas produce un moiré que se mueve sin que
 * se vea girar nada. El giro es por CSS (.gq-anillo) sobre la caja, que el
 * navegador compone en GPU sin repintar las curvas.
 *
 * El color sale de `color` (currentColor), así el mismo componente sirve
 * sobre crema o sobre navy.
 */
type Anillo = { r: number; a: number; lobulos: number; copias: number; vuelta: number; inverso?: boolean };

const ANILLOS: Anillo[] = [
  { r: 196, a: 9, lobulos: 26, copias: 12, vuelta: 420 },
  { r: 150, a: 17, lobulos: 16, copias: 14, vuelta: 300, inverso: true },
  { r: 98, a: 13, lobulos: 11, copias: 12, vuelta: 240 },
];

function curva(r: number, a: number, k: number) {
  const pasos = k * 14;
  let d = "";
  for (let i = 0; i < pasos; i++) {
    const t = (i / pasos) * Math.PI * 2;
    const rr = r + a * Math.sin(k * t);
    d += `${i ? "L" : "M"}${(rr * Math.cos(t)).toFixed(1)} ${(rr * Math.sin(t)).toFixed(1)}`;
  }
  return `${d}Z`;
}

export default function Guilloche({
  id,
  className,
  style,
}: {
  /** Prefijo único por instancia: los <use> apuntan a ids del documento. */
  id: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const caja = "-220 -220 440 440";
  return (
    <div className={`gq${className ? ` ${className}` : ""}`} style={style} aria-hidden="true">
      <svg viewBox={caja} className="gq-capa">
        <circle r="212" />
        <circle r="206" />
        <circle r="120" />
        <circle r="72" />
      </svg>
      {ANILLOS.map((an, n) => {
        const ref = `${id}-${n}`;
        const paso = 360 / an.lobulos / an.copias;
        return (
          <svg
            key={ref}
            viewBox={caja}
            className={`gq-capa gq-anillo${an.inverso ? " gq-inverso" : ""}`}
            style={{ animationDuration: `${an.vuelta}s` }}
          >
            <defs>
              <path id={ref} d={curva(an.r, an.a, an.lobulos)} />
            </defs>
            {Array.from({ length: an.copias }, (_, i) => (
              <use key={i} href={`#${ref}`} transform={`rotate(${(paso * i).toFixed(3)})`} />
            ))}
          </svg>
        );
      })}
    </div>
  );
}
