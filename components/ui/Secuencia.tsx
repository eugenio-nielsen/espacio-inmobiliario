import Escena from "@/components/ui/Escena";
import "./secuencia.css";

const ROMANOS = ["I", "II", "III", "IV", "V", "VI"];

/**
 * Pasos en orden, como una secuencia de títulos de cine.
 *
 * Reemplaza a las tarjetas con icono en círculo y número calado, que
 * ocupaban una caja entera para dos líneas de texto. Acá cada paso es
 * solo numeral, título y una frase, colgados de un riel dorado.
 *
 * Al entrar en pantalla el riel se traza de izquierda a derecha y cada
 * rombo se enciende cuando la línea llega a él; el texto aparece detrás.
 * Después queda un destello que recorre el riel cada tanto: movimiento
 * que acompaña, no que pide atención. En móvil el riel pasa a vertical.
 *
 * Estilos en secuencia.css (prefijo .sq-).
 */
export default function Secuencia({
  pasos,
  tono = "oscuro",
}: {
  pasos: readonly { t: string; d: string }[];
  /** "oscuro" sobre navy, "claro" sobre crema. */
  tono?: "oscuro" | "claro";
}) {
  return (
    <Escena className={`sq sq-${tono}`} style={{ ["--n" as string]: pasos.length }}>
      <div className="sq-riel" aria-hidden="true">
        <span className="sq-destello" />
      </div>
      <ol className="sq-pasos">
        {pasos.map((p, i) => (
          <li key={p.t} className="sq-paso" style={{ ["--i" as string]: i }}>
            <span className="sq-num" aria-hidden="true">{ROMANOS[i]}</span>
            <span className="sq-nodo" aria-hidden="true" />
            <h3 className="sq-t">{p.t}</h3>
            <p className="sq-d">{p.d}</p>
          </li>
        ))}
      </ol>
    </Escena>
  );
}
