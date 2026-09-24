/**
 * El trazo de la firma de Eugenio Nielsen, suelto.
 *
 * Solo el svg: quien lo usa decide cuándo se dibuja, envolviéndolo en un
 * elemento con .cf-firma que reciba .is-in al entrar en pantalla (la firma
 * de /como-funciona y el documento de Respaldo en la home).
 *
 * `pathLength={1400}` normaliza el largo real de la curva al mismo valor
 * del stroke-dasharray de .cf-firma en globals.css. Sin eso habría que
 * medir el path a mano y el dibujo terminaría antes o después de tiempo.
 */
export default function FirmaTrazo({
  height = 62,
  color = "var(--gold-500)",
  grosor = 2,
}: {
  height?: number;
  color?: string;
  /** En unidades del viewBox (520 de ancho): una firma chica pide más. */
  grosor?: number;
}) {
  return (
    <svg viewBox="0 0 520 84" width="100%" height={height} aria-hidden="true" style={{ overflow: "visible", display: "block" }}>
      <path
        pathLength={1400}
        d="M12 60 C 78 26, 168 18, 246 34 C 300 45, 348 58, 396 49 C 436 41, 454 24, 441 14 C 430 5, 412 15, 419 31 C 427 49, 460 54, 508 39"
        fill="none"
        stroke={color}
        strokeWidth={grosor}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
