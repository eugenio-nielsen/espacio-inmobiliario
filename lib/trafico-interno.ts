/**
 * Tráfico propio en Analytics.
 *
 * El navegador que entró al superadmin queda marcado (esta clave en
 * localStorage) y desde la carga siguiente Google Analytics recibe todo con
 * `traffic_type = internal`, el valor que mira el filtro de datos "Internal
 * Traffic" de la propiedad. Funciona en cualquier red y celular, sin depender
 * de la IP (en Argentina suele ser compartida y cambia).
 *
 * Para que un equipo nuevo quede marcado: entrar una vez a /panel/admin.
 */
export const CLAVE_TRAFICO_INTERNO = "ei-interno";
