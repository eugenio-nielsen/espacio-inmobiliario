/**
 * Valor vigente de los aranceles del Registro de la Propiedad Inmueble de
 * la Capital Federal (Ley 17.050). Fuente única: la usa la calculadora
 * del blog.
 *
 * Los aranceles se fijan en módulos; cuando el Registro actualiza el
 * valor del módulo se cambia acá y todo el sitio queda al día.
 *
 * Fuente: dnrpi.jus.gob.ar/tabla_valores · Disposición Administrativa
 * 6/2026 · vigente desde el 03/08/2026 · verificado el 02/11/2026.
 */
export const VALOR_MODULO = 300;
export const VIGENCIA = "3 de agosto de 2026";
export const VERIFICADO = "2 de noviembre de 2026";

export const pesos = (n: number) => `$${new Intl.NumberFormat("es-AR").format(n)}`;
