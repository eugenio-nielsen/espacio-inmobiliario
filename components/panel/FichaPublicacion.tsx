/**
 * La ficha que acompaña la carga: se va escribiendo con cada respuesta y
 * muestra la portada, el precio y los datos tal como se van a leer.
 * Usa los estilos de la ficha del estimador (.ts-ficha, .ts-linea).
 */
export default function FichaPublicacion({
  portada,
  titulo,
  precio,
  lineas,
}: {
  /** URL de la primera foto (guardada o vista previa local). */
  portada?: string;
  titulo: string;
  precio: string | null;
  lineas: { k: string; v: string | null }[];
}) {
  return (
    <aside className="ts-ficha pf-ficha" aria-label="Ficha de la publicación">
      <span className="ts-ficha-k">Ficha de tu publicación</span>
      <div className="pf-portada">
        {portada ? (
          // La vista previa puede ser blob: local, por eso img nativa
          // eslint-disable-next-line @next/next/no-img-element
          <img src={portada} alt="Portada de la publicación" />
        ) : (
          <span>Acá va tu portada</span>
        )}
      </div>
      <p className={`pf-ficha-precio${precio ? "" : " pf-vacio"}`}>{precio ?? "Precio a definir"}</p>
      <p className={`pf-ficha-titulo${titulo ? "" : " pf-vacio"}`}>{titulo || "Tu título"}</p>
      <div className="ts-doble" aria-hidden="true" />
      <dl className="ts-lineas">
        {lineas.map(l => (
          <div key={l.k} className="ts-linea">
            <dt>{l.k}</dt>
            <dd>
              {l.v
                // La key por valor hace que cada dato nuevo se vuelva a "escribir"
                ? <span key={l.v} className="ts-linea-v">{l.v}</span>
                : <span className="ts-linea-vacia">—</span>}
            </dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}
