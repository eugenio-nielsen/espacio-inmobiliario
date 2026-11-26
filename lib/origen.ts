/**
 * De dónde llegó la persona, para saber qué canal trae altas.
 *
 * Los utm del anuncio o del enlace vienen solo en la primera página que se
 * abre: si la persona navega un rato antes de crear la cuenta, ya no están en
 * la URL. Por eso se guardan al llegar (registrarOrigen, desde
 * <OrigenVisita> en el layout) y los formularios de alta los leen al enviar
 * (completarOrigen).
 *
 * Se guarda lo mismo que ya iba a los metadatos de la cuenta: los utm y el
 * dominio desde el que llegó, sin ruta ni parámetros. Nada de eso identifica
 * a nadie. Dura 30 días. Sin almacenamiento del navegador (modo privado) se
 * usa lo que traiga la URL de la página.
 *
 * Solo corre en el navegador.
 */

const CLAVE = "ei-origen";
const VIGENCIA_MS = 30 * 24 * 60 * 60 * 1000;
const UTM = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;

export type Origen = Partial<Record<(typeof UTM)[number] | "referrer", string>>;

function utmDeLaUrl(): Origen {
  const q = new URLSearchParams(window.location.search);
  const origen: Origen = {};
  for (const k of UTM) {
    const v = q.get(k)?.trim().slice(0, 120);
    if (v) origen[k] = v;
  }
  return origen;
}

/** El dominio desde el que llegó, si no es el propio sitio. */
function dominioDeOrigen(): string | undefined {
  try {
    const propio = window.location.hostname.replace(/^www\./, "");
    const ajeno = new URL(document.referrer).hostname.replace(/^www\./, "");
    return ajeno && ajeno !== propio ? ajeno.slice(0, 120) : undefined;
  } catch {
    return undefined; // sin referrer, o uno que no es una URL
  }
}

function leerGuardado(): Origen {
  try {
    const crudo = window.localStorage.getItem(CLAVE);
    if (!crudo) return {};
    const { ts, origen } = JSON.parse(crudo) as { ts?: number; origen?: Origen };
    if (typeof ts !== "number" || Date.now() - ts > VIGENCIA_MS) return {};
    return origen && typeof origen === "object" ? origen : {};
  } catch {
    return {}; // sin acceso al almacenamiento, o un valor que no es nuestro
  }
}

/**
 * Guarda de dónde llegó, al abrir una página. Una campaña nueva (utm en la
 * URL) reemplaza a la anterior; sin campaña se conserva lo que había, y solo
 * si no había nada se guarda el dominio de origen.
 */
export function registrarOrigen(): void {
  try {
    const utm = utmDeLaUrl();
    const referrer = dominioDeOrigen();
    let nuevo: Origen | null = null;

    if (Object.keys(utm).length) nuevo = { ...utm, ...(referrer ? { referrer } : {}) };
    else if (referrer && !Object.keys(leerGuardado()).length) nuevo = { referrer };

    if (nuevo) window.localStorage.setItem(CLAVE, JSON.stringify({ ts: Date.now(), origen: nuevo }));
  } catch {
    // sin almacenamiento no se guarda nada: el alta usa lo que traiga la URL
  }
}

/**
 * Suma al formulario los datos de origen que tenga guardados o en la URL.
 * No pisa lo que el formulario ya traiga (por ejemplo la página del alta).
 */
export function completarOrigen(datos: FormData): void {
  const origen = { ...leerGuardado(), ...utmDeLaUrl() };
  for (const [clave, valor] of Object.entries(origen)) {
    if (valor && !datos.get(clave)) datos.set(clave, valor);
  }
}
