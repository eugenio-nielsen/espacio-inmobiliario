import { Fragment } from "react";

/**
 * Cinta que se desplaza sin parar. Es CSS puro (sin estado ni efectos),
 * asi que corre como Server Component.
 *
 * La pista se duplica y la animación recorre exactamente -100% de una
 * copia: al terminar, la segunda copia está donde arrancó la primera y
 * el salto es invisible. Por eso hay dos <div> con el mismo contenido.
 */
export default function Cinta({ frases }: { frases: string[] }) {
  const pista = (
    <div className="cf-marquee-track" aria-hidden="true">
      {frases.map((f, i) => (
        <Fragment key={`${f}-${i}`}>
          <span className="cf-marquee-item">{f}</span>
          <span className="cf-marquee-dot" />
        </Fragment>
      ))}
    </div>
  );

  return (
    <div
      className="cf-marquee"
      style={{
        borderTop: "1px solid var(--cf-hair)",
        borderBottom: "1px solid var(--cf-hair)",
        background: "var(--navy-950)",
        padding: "18px 0",
      }}
    >
      {/* Texto real para lectores de pantalla y para el buscador */}
      <span className="sr-only">{frases.join(". ")}</span>
      {pista}
      {pista}
    </div>
  );
}
