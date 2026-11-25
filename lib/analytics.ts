/**
 * Eventos de Google Analytics del sitio, en un solo lugar.
 *
 * Inventario de lo que se mide. Los nombres van en español y snake_case, y
 * ningún evento lleva datos personales (nombre, mail, teléfono):
 *
 *   Altas y publicación (los manda <EventoGA> en la página a la que se llega)
 *     sign_up                  cuenta creada
 *     publicar_propiedad       propiedad publicada
 *
 *   Demanda (compradores e inquilinos)
 *     consulta_propiedad       consulta enviada desde una ficha
 *     solicitud_visita         pedido de visita desde una ficha
 *     clic_consultar           botón "Consultar" de la barra fija de la ficha
 *
 *   Herramientas y servicios
 *     tasacion_completada      el tasador mostró la estimación
 *     consulta_servicio        formulario de contacto, asesoría o ayuda para vender
 *
 *   Clics (los detecta <ClicksGA> en todo el sitio, sin tocar cada botón)
 *     clic_whatsapp            WhatsApp de Espacio Inmobiliario
 *     clic_telefono            llamada
 *     clic_email               mail
 *     clic_publicar            botones hacia "publicar propiedad"
 *     clic_registro            botones hacia "crear cuenta"
 *     clic_tasador             botones hacia el tasador
 *     share                    compartir (parámetro method: whatsapp, facebook, x, linkedin, copiar)
 *
 * Para que GA muestre los parámetros (ubicacion, tipo, operacion…) en sus
 * informes hay que registrarlos como "dimensiones personalizadas" en
 * Administrar → Definiciones personalizadas. Los eventos se cuentan igual sin
 * eso; con eso se pueden abrir por ubicación del botón, tipo de propiedad, etc.
 *
 * Para que un evento cuente como conversión hay que marcarlo como "evento
 * clave" en Administrar → Eventos.
 */

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export type ParamsGA = Record<string, string | number | boolean | null | undefined>;

/**
 * Manda un evento a Google Analytics. Solo corre en el navegador.
 *
 * El script de GA carga "afterInteractive" y puede llegar después que el
 * evento: si gtag todavía no existe, el evento queda en la cola de dataLayer
 * con el mismo formato que usa gtag, y se envía cuando el script carga.
 *
 * Los parámetros vacíos se descartan y los textos se cortan en 100
 * caracteres, que es el máximo que acepta GA.
 */
export function enviarEventoGA(nombre: string, params: ParamsGA = {}): void {
  if (typeof window === "undefined") return;

  const limpios: Record<string, string | number | boolean> = {};
  for (const [clave, valor] of Object.entries(params)) {
    if (valor === null || valor === undefined || valor === "") continue;
    limpios[clave] = typeof valor === "string" ? valor.slice(0, 100) : valor;
  }

  // En desarrollo GA no se carga: se deja el rastro en la consola para ver
  // qué se mandaría
  if (process.env.NODE_ENV !== "production") console.debug("[GA]", nombre, limpios);

  window.dataLayer = window.dataLayer || [];
  const gtag =
    window.gtag ??
    function () {
      // gtag encola el objeto `arguments`, no un array: se respeta
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer!.push(arguments);
    };
  gtag("event", nombre, limpios);
}
