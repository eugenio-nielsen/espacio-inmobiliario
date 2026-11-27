import { Resend } from "resend";
import { datosDeclarados } from "@/lib/estimador/declarado";
import type { EstimadorResultado, FactorAplicado } from "@/lib/estimador/types";
import { HERRAMIENTAS } from "@/lib/herramientas";
import { WHATSAPP, TELEFONO_TEXTO } from "@/lib/contacto";
import { ACLARATORIO } from "@/lib/estimador/aclaratorio";

// Inicialización lazy — evita crash si la key no está configurada en el entorno
function getResend() {
  if (!process.env.RESEND_API_KEY) return null;
  return new Resend(process.env.RESEND_API_KEY);
}

const FROM    = process.env.FROM_EMAIL    || "onboarding@resend.dev";
const ADMIN   = process.env.ADMIN_EMAIL   || "eugenio@espacioinmobiliario.com.ar";
const SITE    = process.env.NEXT_PUBLIC_SITE_URL || "https://espacio-inmobiliario-one.vercel.app";

/**
 * Todo lo que escribe la gente (nombres, mensajes, títulos, direcciones) se
 * escapa antes de entrar a un mail: un texto con HTML no puede alterar el
 * email ni meter enlaces con nuestro remitente.
 */
const escHtml = (t: string) =>
  t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * Marca (utm) los enlaces al sitio de un mail a la persona, para que Analytics
 * sepa de qué correo vino la visita. Los avisos al admin no se marcan: sus
 * clics no son de usuarios.
 */
function conUtm(html: string, campana: string): string {
  const base = SITE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const enlaceAlSitio = new RegExp(`href="(${base}(?:/[^"#?]*)?(?:\\?[^"#]*)?)(#[^"]*)?"`, "g");
  return html.replace(enlaceAlSitio, (_todo, url: string, ancla: string = "") => {
    const union = url.includes("?") ? "&amp;" : "?";
    return `href="${url}${union}utm_source=correo&amp;utm_medium=email&amp;utm_campaign=${campana}${ancla}"`;
  });
}

// ── Shared styles ──────────────────────────────────────────────
const styles = {
  body:    "margin:0;padding:0;background:#F7F4EE;font-family:'Outfit',system-ui,sans-serif;",
  wrap:    "max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(14,44,80,.08);",
  header:  "background:#0E2C50;padding:28px 32px;",
  logo:    "color:#B99F66;font-size:18px;font-weight:700;letter-spacing:-.01em;text-decoration:none;",
  body_p:  "padding:28px 32px;",
  h1:      "color:#0E2C50;font-size:22px;font-weight:700;margin:0 0 8px;",
  lead:    "color:#595349;font-size:15px;line-height:1.6;margin:0 0 20px;",
  card:    "background:#F7F4EE;border-radius:10px;padding:18px 20px;margin:0 0 20px;border:1px solid #E8DFC8;",
  label:   "color:#8C7641;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;margin:0 0 4px;",
  value:   "color:#0E2C50;font-size:15px;font-weight:600;margin:0 0 12px;",
  message: "background:#fff;border:1px solid #E7E2D8;border-radius:8px;padding:14px 16px;color:#595349;font-size:14px;line-height:1.7;margin:0 0 20px;font-style:italic;",
  btn:     "display:inline-block;background:#0E2C50;color:#fff;font-size:14px;font-weight:700;padding:13px 24px;border-radius:10px;text-decoration:none;",
  footer:  "border-top:1px solid #F0ECE3;padding:18px 32px;text-align:center;color:#A39C8F;font-size:12px;",
};

// Imágenes: PNG en /public/email (los clientes de correo no muestran SVG).
// Se regeneran con scripts/generar-assets-email.mjs.
const IMG = `${SITE}/email`;
const SERIF = "'Playfair Display',Georgia,'Times New Roman',serif";
const SANS = "'Outfit',system-ui,-apple-system,'Segoe UI',Arial,sans-serif";

/** Logo sobre su fondo crema, con filete dorado debajo. Va en todos los mails. */
const cabecera = `
  <div style="background:#F8F9F4;padding:22px 32px 18px;text-align:center;border-bottom:3px solid #B99F66;">
    <a href="${SITE}" style="text-decoration:none;"><img src="${IMG}/logo.png" width="190" alt="Espacio Inmobiliario" style="display:inline-block;border:0;height:auto;max-width:100%;"/></a>
  </div>`;

/** Pie corto: mails operativos (avisos al admin, al dueño, validaciones…). */
function pieCorto(): string {
  return `
  <div style="${styles.footer}">
    © ${new Date().getFullYear()} Espacio Inmobiliario · <a href="${SITE}" style="color:#A39C8F;">${SITE.replace("https://","")}</a>
  </div>`;
}

/** Firma de Eugenio, como la del sitio: el trazo, el nombre y las vías de contacto. */
function bloqueFirma(): string {
  return `
  <div style="padding:6px 32px 30px;">
    <p style="margin:0 0 6px;color:#595349;font-size:14px;line-height:1.6;">Te esperamos,</p>
    <img src="${IMG}/firma.png" width="210" alt="" style="display:block;border:0;height:auto;margin:0 0 2px -4px;"/>
    <p style="margin:0;color:#0E2C50;font-family:${SERIF};font-size:18px;font-weight:700;">Eugenio Nielsen</p>
    <p style="margin:2px 0 10px;color:#8C7641;font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;">Fundador · Espacio Inmobiliario</p>
    <p style="margin:0;font-size:13px;line-height:1.8;color:#595349;">
      <a href="https://wa.me/${WHATSAPP}" style="color:#15803D;text-decoration:none;font-weight:600;">WhatsApp ${TELEFONO_TEXTO}</a><br/>
      <a href="mailto:${ADMIN}" style="color:#0E2C50;text-decoration:none;">${ADMIN}</a>
    </p>
  </div>`;
}

/** Las herramientas gratuitas (misma lista que el menú y el footer del sitio). */
function bloqueHerramientas(): string {
  const celda = (h: { href: string; label: string; detalle: string }) => `
    <td class="col" valign="top" width="50%" style="padding:0 6px 12px;">
      <a href="${SITE}${h.href}" style="display:block;text-decoration:none;background:#fff;border:1px solid #E8DFC8;border-radius:12px;padding:16px 16px 14px;">
        <span style="display:block;color:#0E2C50;font-size:15px;font-weight:700;line-height:1.3;">${h.label}</span>
        <span style="display:block;color:#595349;font-size:13px;line-height:1.5;margin:4px 0 10px;">${h.detalle}</span>
        <span style="color:#8C7641;font-size:13px;font-weight:700;">Abrir &rarr;</span>
      </a>
    </td>`;
  return `
  <div style="background:#F7F4EE;padding:26px 26px 14px;border-top:1px solid #E8DFC8;">
    <p style="${styles.label};padding:0 6px;">Herramientas gratuitas</p>
    <p style="margin:0 0 14px;padding:0 6px;color:#0E2C50;font-family:${SERIF};font-size:20px;font-weight:700;">Números claros antes de decidir</p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>
      ${HERRAMIENTAS.map(celda).join("")}
    </tr></table>
  </div>`;
}

/** Pie completo, a tono con el del sitio: navy y oro, con los accesos y el contacto. */
function pieCompleto(bajaUrl?: string): string {
  const enlace = (t: string, href: string) => `<a href="${SITE}${href}" style="color:#CBB585;text-decoration:none;font-size:13px;line-height:2;">${t}</a>`;
  return `
  <div style="background:#0E2C50;padding:28px 32px 8px;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>
      <td class="col" valign="top" width="50%" style="padding-bottom:18px;">
        <p style="margin:0 0 6px;color:#fff;font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;">Espacio</p>
        ${enlace("Cómo funciona", "/como-funciona")}<br/>
        ${enlace("Blog", "/blog")}<br/>
        ${enlace("Tertulia Inmobiliaria (foro)", "/foro")}<br/>
        ${enlace("Cátedra Inmobiliaria", "/catedra")}
      </td>
      <td class="col" valign="top" width="50%" style="padding-bottom:18px;">
        <p style="margin:0 0 6px;color:#fff;font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;">Propiedades</p>
        ${enlace("Ver todas", "/propiedades")}<br/>
        ${enlace("Precio del m² por barrio", "/precios-m2")}<br/>
        ${enlace("Vender mi propiedad", "/vender")}<br/>
        ${enlace("Comprar con respaldo", "/comprar")}
      </td>
    </tr></table>
    <p style="margin:6px 0 0;border-top:1px solid #234C7A;padding:16px 0 4px;color:#8AA1BD;font-size:12px;line-height:1.7;text-align:center;">
      Buenos Aires, Argentina · <a href="https://wa.me/${WHATSAPP}" style="color:#CBB585;text-decoration:none;">${TELEFONO_TEXTO}</a><br/>
      <a href="${SITE}/terminos" style="color:#8AA1BD;">Términos</a> · <a href="${SITE}/privacidad" style="color:#8AA1BD;">Privacidad</a>${bajaUrl ? ` · <a href="${bajaUrl}" style="color:#8AA1BD;">Darme de baja</a>` : ""}
    </p>
    <p style="margin:0;padding:6px 0 20px;color:#8AA1BD;font-size:12px;text-align:center;">© ${new Date().getFullYear()} Espacio Inmobiliario</p>
  </div>`;
}

function baseLayout(content: string, opts?: { completo?: boolean; bajaUrl?: string }): string {
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet"/>
<style>@media (max-width:480px){.col{display:block!important;width:100%!important;box-sizing:border-box}}</style>
</head><body style="${styles.body}">
<div style="${styles.wrap}">
  ${cabecera}
  ${content}
  ${opts?.completo ? pieCompleto(opts.bajaUrl) : pieCorto()}
</div></body></html>`;
}

// ── 1. Nueva consulta → al dueño ───────────────────────────────
export async function sendInquiryToOwner(data: {
  ownerEmail: string;
  ownerNombre: string;
  propertyTitulo: string;
  propertyUrl: string;
  interesadoNombre: string;
  interesadoEmail: string;
  interesadoTelefono?: string | null;
  mensaje: string;
}) {
  if (!process.env.RESEND_API_KEY) return;

  const html = baseLayout(`
    <div style="${styles.body_p}">
      <h1 style="${styles.h1}">¡Tenés una nueva consulta!</h1>
      <p style="${styles.lead}">
        Hola ${escHtml(data.ownerNombre)}, alguien está interesado en tu propiedad
        <strong style="color:#0E2C50;">"${escHtml(data.propertyTitulo)}"</strong>.
      </p>

      <div style="${styles.card}">
        <p style="${styles.label}">Nombre</p>
        <p style="${styles.value}">${escHtml(data.interesadoNombre)}</p>

        <p style="${styles.label}">Email</p>
        <p style="${styles.value}"><a href="mailto:${escHtml(data.interesadoEmail)}" style="color:#0E2C50;">${escHtml(data.interesadoEmail)}</a></p>

        ${data.interesadoTelefono ? `
        <p style="${styles.label}">Teléfono / WhatsApp</p>
        <p style="${styles.value}"><a href="https://wa.me/${data.interesadoTelefono.replace(/\D/g,"")}" style="color:#15803D;">${escHtml(data.interesadoTelefono)}</a></p>
        ` : ""}
      </div>

      <p style="${styles.label}">Mensaje</p>
      <p style="${styles.message}">"${escHtml(data.mensaje)}"</p>

      <a href="${escHtml(data.propertyUrl)}" style="${styles.btn}">Ver propiedad →</a>
    </div>
  `);

  const resend = getResend(); if (!resend) return;
  await resend.emails.send({
    from: FROM,
    to: data.ownerEmail,
    bcc: ADMIN,           // vos siempre recibís una copia
    subject: `Nueva consulta: "${data.propertyTitulo}"`,
    html: conUtm(html, "consulta-recibida"),
  });
}

// ── 2. Nueva consulta → al interesado (confirmación) ──────────
export async function sendInquiryConfirmation(data: {
  interesadoEmail: string;
  interesadoNombre: string;
  propertyTitulo: string;
  propertyUrl: string;
}) {
  if (!process.env.RESEND_API_KEY) return;

  const html = baseLayout(`
    <div style="${styles.body_p}">
      <h1 style="${styles.h1}">Tu consulta fue enviada</h1>
      <p style="${styles.lead}">
        Hola ${escHtml(data.interesadoNombre)}, recibimos tu consulta sobre
        <strong style="color:#0E2C50;">"${escHtml(data.propertyTitulo)}"</strong>.
        El dueño se comunicará con vos a la brevedad.
      </p>
      <a href="${escHtml(data.propertyUrl)}" style="${styles.btn}">Ver la propiedad →</a>
      <p style="color:#A39C8F;font-size:13px;margin-top:20px;">
        Si no enviaste esta consulta, podés ignorar este email.
      </p>
    </div>
  `);

  const resend = getResend(); if (!resend) return;
  await resend.emails.send({
    from: FROM,
    to: data.interesadoEmail,
    subject: `Tu consulta fue enviada — ${data.propertyTitulo}`,
    html: conUtm(html, "consulta-enviada"),
  });
}

// ── Lead del Estimador de Precios → al admin ──────────────────
export async function sendEstimacionLead(data: {
  nombre: string;
  email: string;
  telefono?: string;
  barrio: string;
  resultado: { estimado: number; rangoMin: number; rangoMax: number } & Partial<Pick<EstimadorResultado, "precioM2Resultante" | "precioM2Referencia" | "ajustePct" | "confianza" | "factoresPositivos" | "factoresNegativos">>;
  /** Lo que completó la persona en el estimador: va completo en el mail. */
  input?: unknown;
}) {
  if (!process.env.RESEND_API_KEY) return;

  const fmt = (n: number) => `US$ ${new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(n)}`;

  const html = baseLayout(`
    <div style="${styles.body_p}">
      <h1 style="${styles.h1}">Nueva solicitud del Estimador</h1>
      <p style="${styles.lead}">
        Alguien usó el Estimador de Precios y pidió que revises su estimación.
      </p>

      <div style="${styles.card}">
        <p style="${styles.label}">Nombre</p>
        <p style="${styles.value}">${escHtml(data.nombre)}</p>

        <p style="${styles.label}">Email</p>
        <p style="${styles.value}"><a href="mailto:${escHtml(data.email)}" style="color:#0E2C50;">${escHtml(data.email)}</a></p>

        ${data.telefono ? `
        <p style="${styles.label}">Teléfono / WhatsApp</p>
        <p style="${styles.value}"><a href="https://wa.me/${data.telefono.replace(/\D/g,"")}" style="color:#15803D;">${escHtml(data.telefono)}</a></p>
        ` : ""}

        <p style="${styles.label}">Barrio</p>
        <p style="${styles.value}">${escHtml(data.barrio)}</p>

        <p style="${styles.label}">Estimación generada</p>
        <p style="${styles.value}">${fmt(data.resultado.estimado)} <span style="color:#8C7641;font-weight:400;">(rango ${fmt(data.resultado.rangoMin)} – ${fmt(data.resultado.rangoMax)})</span></p>
        ${data.resultado.precioM2Resultante ? `<p style="${styles.label}">Valor por m² · referencia del barrio · precisión</p>
        <p style="${styles.value}">${fmt(data.resultado.precioM2Resultante)}/m² · ${fmt(data.resultado.precioM2Referencia ?? 0)}/m² · ${escHtml(data.resultado.confianza ?? "—")}</p>` : ""}
      </div>
      ${detalleEstimacion(data.input, data.resultado)}
    </div>
  `);

  const resend = getResend(); if (!resend) return;
  await resend.emails.send({
    from: FROM,
    to: ADMIN,
    subject: `Estimador: ${data.nombre} — ${data.barrio} (${fmt(data.resultado.estimado)})`,
    html,
  });
}

/** Los datos del formulario y los factores aplicados, para que el aviso se pueda leer sin abrir el panel. */
function detalleEstimacion(
  input: unknown,
  resultado: { factoresPositivos?: FactorAplicado[]; factoresNegativos?: FactorAplicado[] },
  /** true: en vez del desglose factor por factor, solo el total de lo que sumó y de lo que restó. */
  soloTotales = false,
): string {
  if (!input || typeof input !== "object") return "";
  const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const pct = (c: number) => `${c > 1 ? "+" : "−"}${Math.abs((c - 1) * 100).toLocaleString("es-AR", { maximumFractionDigits: 1 })}%`;
  const celda = "padding:3px 0;font-size:13px;color:#475569;";
  const grupos = datosDeclarados(input).map((g) => `
    <p style="${styles.label}">${g.titulo}</p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:10px;">
      ${g.filas.map(([k, v]) => `<tr><td style="${celda}">${esc(k)}</td><td align="right" style="${celda}font-weight:600;color:#0E2C50;">${esc(v)}</td></tr>`).join("")}
    </table>`).join("");
  const factores = (t: string, lista: FactorAplicado[] = []) => lista.length ? `
    <p style="${styles.label}">${t}</p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:10px;">
      ${lista.map((f) => `<tr><td style="${celda}">${esc(f.label)} · ${esc(f.detalle)}</td><td align="right" style="${celda}font-weight:600;color:${f.positivo ? "#15803D" : "#B91C1C"};">${pct(f.coef)}</td></tr>`).join("")}
    </table>` : "";
  // Total de cada lado: el producto de sus coeficientes (así se combinan en el modelo)
  const total = (lista: FactorAplicado[] = []) => lista.reduce((p, f) => p * f.coef, 1);
  const totales = (t: string, lista: FactorAplicado[] = [], positivo: boolean) => lista.length ? `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:6px;">
      <tr><td style="${styles.label};padding:3px 0;">${t}</td><td align="right" style="${celda}font-weight:700;font-size:15px;color:${positivo ? "#15803D" : "#B91C1C"};">${pct(total(lista))}</td></tr>
    </table>` : "";
  const cierre = soloTotales
    ? totales("Lo que sumó", resultado.factoresPositivos, true) + totales("Lo que restó", resultado.factoresNegativos, false)
    : factores("Lo que sumó", resultado.factoresPositivos) + factores("Lo que restó", resultado.factoresNegativos);
  return `<div style="${styles.card}">${grupos}${cierre}</div>`;
}

// ── Consulta de asesoría / acompañamiento → al admin ──────────
export async function sendAsesoriaLead(data: {
  nombre: string;
  email: string;
  telefono?: string;
  mensaje: string;
  /** Qué vino a resolver: vender, comprar, invertir u otra consulta. */
  motivo?: string;
}) {
  if (!process.env.RESEND_API_KEY) return;

  const html = baseLayout(`
    <div style="${styles.body_p}">
      <h1 style="${styles.h1}">Nueva consulta${data.motivo ? `: ${escHtml(data.motivo)}` : " de asesoría"}</h1>
      <p style="${styles.lead}">Alguien quiere conversar desde el sitio.</p>

      <div style="${styles.card}">
        ${data.motivo ? `
        <p style="${styles.label}">Motivo</p>
        <p style="${styles.value}">${escHtml(data.motivo)}</p>
        ` : ""}

        <p style="${styles.label}">Nombre</p>
        <p style="${styles.value}">${escHtml(data.nombre)}</p>

        <p style="${styles.label}">Email</p>
        <p style="${styles.value}"><a href="mailto:${escHtml(data.email)}" style="color:#0E2C50;">${escHtml(data.email)}</a></p>

        ${data.telefono ? `
        <p style="${styles.label}">Teléfono / WhatsApp</p>
        <p style="${styles.value}"><a href="https://wa.me/${data.telefono.replace(/\D/g,"")}" style="color:#15803D;">${escHtml(data.telefono)}</a></p>
        ` : ""}
      </div>

      <p style="${styles.label}">Mensaje</p>
      <p style="${styles.message}">"${escHtml(data.mensaje)}"</p>
    </div>
  `);

  const resend = getResend(); if (!resend) return;
  await resend.emails.send({
    from: FROM,
    to: ADMIN,
    replyTo: data.email,
    subject: data.motivo ? `${data.motivo} — ${data.nombre}` : `Asesoría: ${data.nombre}`,
    html,
  });
}

// ── 3. Interés en servicio del ecosistema → al admin ──────────
export async function sendServiceInterest(data: {
  nombre: string;
  email: string;
  servicio: string;
}) {
  if (!process.env.RESEND_API_KEY) return;

  const html = baseLayout(`
    <div style="${styles.body_p}">
      <h1 style="${styles.h1}">Nuevo interés en servicio del ecosistema</h1>
      <p style="${styles.lead}">
        Un dueño solicitó ser conectado con un profesional de
        <strong style="color:#0E2C50;">${escHtml(data.servicio)}</strong>.
      </p>

      <div style="${styles.card}">
        <p style="${styles.label}">Nombre</p>
        <p style="${styles.value}">${escHtml(data.nombre)}</p>

        <p style="${styles.label}">Email</p>
        <p style="${styles.value}"><a href="mailto:${escHtml(data.email)}" style="color:#0E2C50;">${escHtml(data.email)}</a></p>

        <p style="${styles.label}">Servicio solicitado</p>
        <p style="${styles.value}">${escHtml(data.servicio)}</p>
      </div>
    </div>
  `);

  const resend = getResend(); if (!resend) return;
  await resend.emails.send({
    from: FROM,
    to: ADMIN,
    subject: `Interés en servicio: ${data.servicio} — ${data.nombre}`,
    html,
  });
}

// ── 4. Nueva propiedad → al admin ─────────────────────────────
export async function sendNewPropertyToAdmin(data: {
  titulo: string;
  tipo: string;
  precio: number;
  moneda: string;
  barrio?: string | null;
  ciudad: string;
  ownerNombre: string;
  ownerEmail: string;
  publicUrl: string;
  panelUrl: string;
}) {
  if (!process.env.RESEND_API_KEY) return;

  const precio = `${data.moneda === "USD" ? "US$" : "$"} ${new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(Math.round(data.precio))}`;
  const ubicacion = data.barrio ? `${data.barrio}, ${data.ciudad}` : data.ciudad;

  const TIPO_LABEL: Record<string, string> = {
    casa: "Casa", departamento: "Departamento", terreno: "Terreno", local: "Local", oficina: "Oficina",
    cochera: "Cochera",
  };

  const html = baseLayout(`
    <div style="${styles.body_p}">
      <h1 style="${styles.h1}">Nueva propiedad publicada</h1>
      <p style="${styles.lead}">Se publicó una nueva propiedad en el sitio.</p>

      <div style="${styles.card}">
        <p style="${styles.label}">Propiedad</p>
        <p style="${styles.value}">${escHtml(data.titulo)}</p>

        <p style="${styles.label}">Tipo · Ubicación</p>
        <p style="${styles.value}">${escHtml(TIPO_LABEL[data.tipo] || data.tipo)} · ${escHtml(ubicacion)}</p>

        <p style="${styles.label}">Precio</p>
        <p style="${styles.value}">${precio}</p>

        <p style="${styles.label}">Publicada por</p>
        <p style="${styles.value}">${escHtml(data.ownerNombre)} · <a href="mailto:${escHtml(data.ownerEmail)}" style="color:#0E2C50;">${escHtml(data.ownerEmail)}</a></p>
      </div>

      <div style="display:flex;gap:12px;flex-wrap:wrap;">
        <a href="${escHtml(data.publicUrl)}" style="${styles.btn}">Ver publicación →</a>
        <a href="${escHtml(data.panelUrl)}" style="display:inline-block;background:#F7F4EE;color:#0E2C50;font-size:14px;font-weight:700;padding:13px 24px;border-radius:10px;text-decoration:none;border:1px solid #E8DFC8;">
          Ver en el panel
        </a>
      </div>
    </div>
  `);

  const resend = getResend(); if (!resend) return;
  await resend.emails.send({
    from: FROM,
    to: ADMIN,
    subject: `Nueva propiedad: "${data.titulo}" — ${ubicacion}`,
    html,
  });
}

// ── Pedido de ayuda para vender → al admin ─────────────────────
export async function sendAyudaVenta(data: {
  propiedadTitulo: string;
  propiedadPrecio: number;
  propiedadMoneda: string;
  propiedadZona: string;
  ownerNombre: string;
  ownerEmail: string;
  ownerTelefono: string | null;
}) {
  const resend = getResend(); if (!resend) return;

  const precio = `${data.propiedadMoneda === "USD" ? "US$" : "$"} ${new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(Math.round(data.propiedadPrecio))}`;
  const wa = data.ownerTelefono ? data.ownerTelefono.replace(/\D/g, "") : null;

  const html = baseLayout(`
    <div style="${styles.body_p}">
      <strong>${escHtml(data.ownerNombre)}</strong> pidió ayuda para vender una propiedad.
    </div>
    <div style="${styles.body_p}">
      <strong>Propiedad:</strong> ${escHtml(data.propiedadTitulo)}<br>
      <strong>Zona:</strong> ${escHtml(data.propiedadZona || "—")}<br>
      <strong>Precio publicado:</strong> ${precio}
    </div>
    <div style="${styles.body_p}">
      <strong>Contacto:</strong><br>
      Email: <a href="mailto:${escHtml(data.ownerEmail)}">${escHtml(data.ownerEmail)}</a><br>
      Teléfono: ${escHtml(data.ownerTelefono ?? "no informado")}
      ${wa ? `<br><a href="https://wa.me/${wa}">Escribirle por WhatsApp</a>` : ""}
    </div>
    <div style="${styles.body_p}">
      Es una oportunidad para ofrecerle el acompañamiento de venta.
    </div>
  `);

  await resend.emails.send({
    from: FROM,
    to: ADMIN,
    subject: `Pedido de ayuda para vender: "${data.propiedadTitulo}"`,
    html,
  });
}

// ── Agenda de visitas ─────────────────────────────────────────

/** Pedido de visita → al dueño (con copia al admin) */
export async function sendVisitaToOwner(data: {
  ownerEmail: string;
  ownerNombre: string;
  propertyTitulo: string;
  propertyUrl: string;
  cuando: string;
  interesadoNombre: string;
  interesadoEmail: string;
  interesadoTelefono: string;
  mensaje?: string | null;
}) {
  if (!process.env.RESEND_API_KEY) return;

  const html = baseLayout(`
    <div style="${styles.body_p}">
      <h1 style="${styles.h1}">Te pidieron una visita</h1>
      <p style="${styles.lead}">
        Hola ${escHtml(data.ownerNombre)}, quieren conocer
        <strong style="color:#0E2C50;">"${escHtml(data.propertyTitulo)}"</strong>.
        Confirmá o proponé otro horario desde tu panel.
      </p>

      <div style="${styles.card}">
        <p style="${styles.label}">Horario pedido</p>
        <p style="${styles.value}">${escHtml(data.cuando)}</p>

        <p style="${styles.label}">Nombre</p>
        <p style="${styles.value}">${escHtml(data.interesadoNombre)}</p>

        <p style="${styles.label}">Teléfono / WhatsApp</p>
        <p style="${styles.value}"><a href="https://wa.me/${data.interesadoTelefono.replace(/\D/g,"")}" style="color:#15803D;">${escHtml(data.interesadoTelefono)}</a></p>

        <p style="${styles.label}">Email</p>
        <p style="${styles.value}"><a href="mailto:${escHtml(data.interesadoEmail)}" style="color:#0E2C50;">${escHtml(data.interesadoEmail)}</a></p>
      </div>

      ${data.mensaje ? `
      <p style="${styles.label}">Mensaje</p>
      <p style="${styles.message}">"${escHtml(data.mensaje)}"</p>
      ` : ""}

      <a href="${SITE}/panel" style="${styles.btn}">Confirmar la visita &rarr;</a>

      <p style="color:#A39C8F;font-size:13px;margin-top:20px;">
        El interesado ya sabe que el horario está a la espera de tu confirmación.
      </p>
    </div>
  `);

  const resend = getResend(); if (!resend) return;
  await resend.emails.send({
    from: FROM,
    to: data.ownerEmail,
    bcc: ADMIN,
    subject: `Pedido de visita: "${data.propertyTitulo}" — ${data.cuando}`,
    html: conUtm(html, "visita-recibida"),
  });
}

/** Pedido de visita → al interesado (acuse) */
export async function sendVisitaPendiente(data: {
  interesadoEmail: string;
  interesadoNombre: string;
  propertyTitulo: string;
  propertyUrl: string;
  cuando: string;
}) {
  if (!process.env.RESEND_API_KEY) return;

  const html = baseLayout(`
    <div style="${styles.body_p}">
      <h1 style="${styles.h1}">Pedimos tu visita</h1>
      <p style="${styles.lead}">
        Hola ${escHtml(data.interesadoNombre)}, le avisamos al dueño de
        <strong style="color:#0E2C50;">"${escHtml(data.propertyTitulo)}"</strong>
        que querés visitarla. Te escribimos apenas confirme.
      </p>

      <div style="${styles.card}">
        <p style="${styles.label}">Horario pedido</p>
        <p style="${styles.value}">${escHtml(data.cuando)}</p>
      </div>

      <a href="${escHtml(data.propertyUrl)}" style="${styles.btn}">Ver la propiedad &rarr;</a>

      <p style="color:#A39C8F;font-size:13px;margin-top:20px;">
        Todavía no está confirmada: esperá nuestro aviso antes de viajar.
      </p>
    </div>
  `);

  const resend = getResend(); if (!resend) return;
  await resend.emails.send({
    from: FROM,
    to: data.interesadoEmail,
    subject: `Pedido de visita enviado — ${data.propertyTitulo}`,
    html: conUtm(html, "visita-enviada"),
  });
}

/** El dueño confirmó o rechazó → al interesado */
export async function sendVisitaRespuesta(data: {
  interesadoEmail: string;
  interesadoNombre: string;
  propertyTitulo: string;
  propertyUrl: string;
  cuando: string;
  confirmada: boolean;
  direccion?: string | null;
  ownerNombre: string;
  nota?: string | null;
}) {
  if (!process.env.RESEND_API_KEY) return;

  const cuerpo = data.confirmada
    ? `
      <h1 style="${styles.h1}">¡Visita confirmada!</h1>
      <p style="${styles.lead}">
        Hola ${escHtml(data.interesadoNombre)}, ${escHtml(data.ownerNombre)} confirmó tu visita a
        <strong style="color:#0E2C50;">"${escHtml(data.propertyTitulo)}"</strong>.
      </p>

      <div style="${styles.card}">
        <p style="${styles.label}">Cuándo</p>
        <p style="${styles.value}">${escHtml(data.cuando)}</p>

        ${data.direccion ? `
        <p style="${styles.label}">Dónde</p>
        <p style="${styles.value}">${escHtml(data.direccion)}</p>
        ` : ""}

      </div>

      ${data.nota ? `
      <p style="${styles.label}">Mensaje del dueño</p>
      <p style="${styles.message}">"${escHtml(data.nota)}"</p>
      ` : ""}

      <a href="${escHtml(data.propertyUrl)}" style="${styles.btn}">Ver la propiedad &rarr;</a>

      <p style="color:#A39C8F;font-size:13px;margin-top:20px;">
        Si no vas a poder ir, avisale al dueño con tiempo.
      </p>
    `
    : `
      <h1 style="${styles.h1}">Ese horario no le sirve al dueño</h1>
      <p style="${styles.lead}">
        Hola ${escHtml(data.interesadoNombre)}, ${escHtml(data.ownerNombre)} no puede recibirte
        el ${escHtml(data.cuando)} en <strong style="color:#0E2C50;">"${escHtml(data.propertyTitulo)}"</strong>.
      </p>

      ${data.nota ? `
      <p style="${styles.label}">Mensaje del dueño</p>
      <p style="${styles.message}">"${escHtml(data.nota)}"</p>
      ` : ""}

      <p style="${styles.lead}">Podés elegir otro horario disponible desde la publicación.</p>

      <a href="${escHtml(data.propertyUrl)}#visitas" style="${styles.btn}">Elegir otro horario &rarr;</a>
    `;

  const resend = getResend(); if (!resend) return;
  await resend.emails.send({
    from: FROM,
    to: data.interesadoEmail,
    subject: data.confirmada
      ? `Visita confirmada: ${data.propertyTitulo} — ${data.cuando}`
      : `Sobre tu visita a ${data.propertyTitulo}`,
    html: conUtm(baseLayout(`<div style="${styles.body_p}">${cuerpo}</div>`), "visita-respuesta"),
  });
}

// ── Validaciones (identidad y dominio) ────────────────────────

/** Alguien envió documentación → al admin */
export async function sendValidacionPendiente(data: {
  tipo: "identidad" | "dominio";
  adminEmail: string;
  quien: string;
  detalle: string;
}) {
  if (!process.env.RESEND_API_KEY) return;

  const titulo = data.tipo === "identidad"
    ? "Nueva validación de identidad"
    : "Nueva validación de dominio";

  const html = baseLayout(`
    <div style="${styles.body_p}">
      <h1 style="${styles.h1}">${titulo}</h1>
      <p style="${styles.lead}">Hay documentación esperando revisión.</p>

      <div style="${styles.card}">
        <p style="${styles.label}">Usuario</p>
        <p style="${styles.value}">${escHtml(data.quien)}</p>
        <p style="${styles.label}">Detalle</p>
        <p style="${styles.value}">${escHtml(data.detalle)}</p>
      </div>

      <a href="${SITE}/panel/admin" style="${styles.btn}">Revisar en el panel &rarr;</a>
    </div>
  `);

  const resend = getResend(); if (!resend) return;
  await resend.emails.send({
    from: FROM,
    to: data.adminEmail,
    subject: `${titulo} — ${data.quien}`,
    html,
  });
}

/** Se aprobó o rechazó → a la persona */
export async function sendValidacionResuelta(data: {
  para: string;
  nombre: string;
  tipo: "identidad" | "dominio";
  aprobada: boolean;
  motivo?: string | null;
  propiedad?: string;
}) {
  if (!process.env.RESEND_API_KEY) return;

  const queEs = data.tipo === "identidad" ? "identidad" : "dominio";
  const saludo = data.nombre ? `Hola ${escHtml(data.nombre.split(" ")[0])}, ` : "Hola, ";

  const cuerpo = data.aprobada
    ? `
      <h1 style="${styles.h1}">Validación aprobada</h1>
      <p style="${styles.lead}">
        ${saludo}revisamos tu documentación y tu <strong style="color:#0E2C50;">validación de ${queEs}</strong>
        quedó aprobada${data.propiedad ? ` para <strong style="color:#0E2C50;">"${escHtml(data.propiedad)}"</strong>` : ""}.
      </p>
      <p style="${styles.lead}">
        ${data.tipo === "identidad"
          ? "Desde ahora tus publicaciones muestran que sos un propietario verificado."
          : "La publicación ya muestra que el dominio está verificado."}
      </p>
      <a href="${SITE}/panel/perfil" style="${styles.btn}">Ver mi perfil &rarr;</a>
    `
    : `
      <h1 style="${styles.h1}">Necesitamos que reenvíes la documentación</h1>
      <p style="${styles.lead}">
        ${saludo}revisamos tu <strong style="color:#0E2C50;">validación de ${queEs}</strong>
        ${data.propiedad ? `para <strong style="color:#0E2C50;">"${escHtml(data.propiedad)}"</strong> ` : ""}y no pudimos aprobarla.
      </p>
      ${data.motivo ? `
      <p style="${styles.label}">Motivo</p>
      <p style="${styles.message}">"${escHtml(data.motivo)}"</p>
      ` : ""}
      <p style="${styles.lead}">Podés volver a subirla desde tu perfil.</p>
      <a href="${SITE}/panel/perfil" style="${styles.btn}">Reenviar documentación &rarr;</a>
    `;

  const resend = getResend(); if (!resend) return;
  await resend.emails.send({
    from: FROM,
    to: data.para,
    bcc: ADMIN,
    subject: data.aprobada
      ? `Tu validación de ${queEs} fue aprobada`
      : `Sobre tu validación de ${queEs}`,
    html: conUtm(baseLayout(`<div style="${styles.body_p}">${cuerpo}</div>`), "validacion"),
  });
}

// ── Tertulia Inmobiliaria (foro) ──────────────────────────────

/** Pie de los avisos del foro: por qué te llega y cómo dejar de recibirlo. */
function pieAvisos(bajaUrl: string) {
  return `<p style="margin:22px 0 0;color:#A39C8F;font-size:12px;line-height:1.6;">
    Te llega porque participás en la Tertulia Inmobiliaria.
    <a href="${bajaUrl}" style="color:#8C7641;">No quiero recibir más avisos</a>.
  </p>`;
}

async function enviarForo(para: string, asunto: string, contenido: string, campana?: string) {
  const resend = getResend(); if (!resend) return;
  const html = baseLayout(`<div style="${styles.body_p}">${contenido}</div>`);
  await resend.emails.send({
    from: FROM,
    to: para,
    subject: asunto,
    html: campana ? conUtm(html, campana) : html,
  });
}

/** Aviso a un miembro: nueva respuesta, comentario o solución elegida */
export async function sendForoAviso(data: {
  para: string;
  alias: string;
  asunto: string;
  titulo: string;
  lead: string;
  cita?: string | null;
  url: string;
  cta: string;
  bajaUrl: string;
}) {
  if (!process.env.RESEND_API_KEY) return;
  await enviarForo(data.para, data.asunto, `
    <h1 style="${styles.h1}">${escHtml(data.titulo)}</h1>
    <p style="${styles.lead}">Hola ${escHtml(data.alias)}, ${escHtml(data.lead)}</p>
    ${data.cita ? `<p style="${styles.message}">"${escHtml(data.cita)}"</p>` : ""}
    <a href="${data.url}" style="${styles.btn}">${escHtml(data.cta)} &rarr;</a>
    ${pieAvisos(data.bajaUrl)}
  `, "aviso-tertulia");
}

/** Aviso al admin: tema nuevo, reporte o pedido de verificación */
export async function sendForoAdmin(data: { asunto: string; titulo: string; lineas: [string, string][]; url: string; cta: string }) {
  if (!process.env.RESEND_API_KEY) return;
  await enviarForo(ADMIN, data.asunto, `
    <h1 style="${styles.h1}">${escHtml(data.titulo)}</h1>
    <div style="${styles.card}">
      ${data.lineas.map(([k, v]) => `
        <p style="${styles.label}">${escHtml(k)}</p>
        <p style="${styles.value}">${escHtml(v)}</p>`).join("")}
    </div>
    <a href="${data.url}" style="${styles.btn}">${escHtml(data.cta)} &rarr;</a>
  `);
}

// ── Mails a la persona: estimación y bienvenida ──────────────────
// Lo que escribe la gente va siempre escapado con escHtml.

const fmtUsd = (n: number) => `US$ ${new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(Math.round(n))}`;

/** Resultado del estimador → a quien lo usó. */
export async function sendEstimacionAlUsuario(data: {
  para: string;
  nombre: string;
  barrio: string;
  /** Lo que completó la persona en el estimador: va completo, de la ubicación a la situación. */
  input?: unknown;
  resultado: Pick<EstimadorResultado, "estimado" | "rangoMin" | "rangoMax"> &
    Partial<Pick<EstimadorResultado, "precioM2Resultante" | "confianza" | "factoresPositivos" | "factoresNegativos">>;
}) {
  const resend = getResend(); if (!resend) return;

  const primerNombre = escHtml(data.nombre.trim().split(" ")[0] || "");

  const html = baseLayout(`
    <div style="background:#0E2C50;padding:36px 32px 32px;">
      <p style="margin:0 0 10px;color:#CBB585;font-size:11px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;">Tu estimación · ${escHtml(data.barrio)}</p>
      <p style="margin:0 0 4px;color:#DCE4EE;font-size:15px;line-height:1.6;">
        Hola${primerNombre ? ` ${primerNombre}` : ""}, este es el valor que calculamos para tu propiedad:
      </p>
      <p style="margin:0 0 6px;color:#fff;font-family:${SERIF};font-size:42px;line-height:1.15;font-weight:700;">${fmtUsd(data.resultado.estimado)}</p>
      <p style="margin:0;color:#CBB585;font-size:14px;">Rango: ${fmtUsd(data.resultado.rangoMin)} – ${fmtUsd(data.resultado.rangoMax)}</p>
    </div>

    <div style="padding:28px 32px 8px;">
      ${data.resultado.precioM2Resultante ? `
      <div style="${styles.card}">
        <p style="${styles.label}">Valor por m²</p>
        <p style="${styles.value}">${fmtUsd(data.resultado.precioM2Resultante)}/m²${data.resultado.confianza ? ` <span style="color:#8C7641;font-weight:400;">· precisión ${escHtml(data.resultado.confianza)}</span>` : ""}</p>
      </div>` : ""}

      <p style="${styles.label};margin-top:6px;">Los datos que cargaste</p>
      ${detalleEstimacion(data.input, data.resultado, true)}

      <p style="${styles.lead}">
        ${ACLARATORIO} La calculamos con los datos que cargaste y los valores
        del barrio. Para afinarla, lo mejor es revisarla con vos.
      </p>

      <a href="${SITE}/contacto?motivo=vender" style="${styles.btn}">Revisarla con Eugenio &rarr;</a>
      <p style="margin:18px 0 0;font-size:14px;color:#595349;">
        ¿Ya sabés que querés vender? <a href="${SITE}/propietarios/publicar" style="color:#8C7641;font-weight:600;">Publicá tu propiedad gratis</a>.
      </p>
      <p style="color:#A39C8F;font-size:12px;margin:22px 0 24px;line-height:1.6;">
        Te escribimos porque pediste esta estimación en ${SITE.replace("https://", "")}. Si no fuiste vos, podés ignorar este email.
      </p>
    </div>

    ${bloqueHerramientas()}
    <div style="background:#fff;padding-top:26px;border-top:1px solid #E8DFC8;">${bloqueFirma()}</div>
  `, { completo: true });

  await resend.emails.send({
    from: FROM,
    to: data.para,
    replyTo: ADMIN,
    subject: `Tu estimación: ${data.barrio} — ${fmtUsd(data.resultado.estimado)}`,
    html: conUtm(html, "tasacion"),
  });
}

/** Cuenta nueva (ya con el email confirmado) → bienvenida con los primeros pasos. */
export async function sendBienvenida(data: { para: string; nombre: string }) {
  const resend = getResend(); if (!resend) return;

  const primerNombre = escHtml(data.nombre.trim().split(" ")[0] || "");
  const paso = (n: string, titulo: string, texto: string, href: string) => `
    <tr>
      <td valign="top" style="padding:0 14px 16px 0;color:#B99F66;font-family:${SERIF};font-size:20px;font-weight:700;width:34px;">${n}</td>
      <td style="padding:0 0 16px;">
        <a href="${href}" style="color:#0E2C50;font-size:15px;font-weight:700;text-decoration:none;">${titulo}</a>
        <p style="margin:2px 0 0;color:#595349;font-size:14px;line-height:1.6;">${texto}</p>
      </td>
    </tr>`;

  const html = baseLayout(`
    <div style="background:#0E2C50;padding:38px 32px 34px;">
      <p style="margin:0 0 10px;color:#CBB585;font-size:11px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;">Tu cuenta está lista</p>
      <h1 style="margin:0 0 12px;color:#fff;font-family:${SERIF};font-size:30px;line-height:1.2;font-weight:700;">
        Te damos la bienvenida${primerNombre ? `, <span style="color:#CBB585;font-style:italic;">${primerNombre}</span>` : ""}
      </h1>
      <p style="margin:0;color:#DCE4EE;font-size:15px;line-height:1.7;">
        En Espacio Inmobiliario publicar es gratis y el contacto con los interesados es directo,
        sin intermediarios. Estos son los primeros pasos:
      </p>
    </div>

    <div style="padding:30px 32px 8px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 8px;">
        ${paso("I", "Cargá tu propiedad", "Con buenas fotos y una descripción clara, las consultas llegan más rápido.", `${SITE}/panel/propiedades/nueva`)}
        ${paso("II", "Validá tu identidad", "Las publicaciones de propietarios verificados generan más confianza.", `${SITE}/panel/perfil`)}
        ${paso("III", "Calculá cuánto vale", "Usá el estimador para fijar un precio con criterio antes de publicar. " + ACLARATORIO, `${SITE}/estimador`)}
      </table>
      <a href="${SITE}/panel" style="${styles.btn}">Ir a mi panel &rarr;</a>
    </div>

    <div style="padding:20px 32px 8px;">
      <p style="${styles.label}">Cómo empezar, en video</p>
      <p style="margin:0 0 14px;color:#595349;font-size:14px;line-height:1.7;">
        En poco más de un minuto: crear la cuenta, publicar, buscar, estimar valores y llevar tus operaciones desde un solo lugar.
      </p>
      <a href="${SITE}/#recorrido" style="display:block;text-decoration:none;">
        <img src="${SITE}/video/explainer-poster.jpg" alt="Ver el recorrido: de la cuenta a la escritura" width="536" style="display:block;width:100%;max-width:536px;height:auto;border:0;border-radius:10px;" />
      </a>
      <p style="margin:12px 0 0;font-size:14px;">
        <a href="${SITE}/#recorrido" style="color:#8C7641;font-weight:600;">Ver el recorrido &rarr;</a>
      </p>
    </div>

    <div style="padding:26px 32px 24px;">
      <p style="${styles.label}">Y si querés conversar</p>
      <p style="margin:0;color:#595349;font-size:14px;line-height:1.7;">
        Sumate a la <a href="${SITE}/foro" style="color:#8C7641;font-weight:600;">Tertulia Inmobiliaria</a>
        para preguntar y compartir con otros propietarios, o escribinos cuando quieras:
        te responde Eugenio en persona.
      </p>
    </div>

    ${bloqueHerramientas()}
    <div style="background:#fff;padding-top:26px;border-top:1px solid #E8DFC8;">${bloqueFirma()}</div>
  `, { completo: true });

  await resend.emails.send({
    from: FROM,
    to: data.para,
    replyTo: ADMIN,
    subject: "Bienvenido/a a Espacio Inmobiliario",
    html: conUtm(html, "bienvenida"),
  });
}

// ── Acuses al usuario: propiedad, ayuda para vender, asesoría ──
// Mismo esquema que la bienvenida: hero navy, cuerpo, firma y pie completo.

/** Estructura común de los mails a la persona. `cuerpo` y `lead` ya vienen escapados. */
function mailUsuario(o: { eyebrow: string; titulo: string; lead: string; cuerpo: string; herramientas?: boolean }): string {
  return baseLayout(`
    <div style="background:#0E2C50;padding:36px 32px 32px;">
      <p style="margin:0 0 10px;color:#CBB585;font-size:11px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;">${o.eyebrow}</p>
      <h1 style="margin:0 0 12px;color:#fff;font-family:${SERIF};font-size:28px;line-height:1.25;font-weight:700;">${o.titulo}</h1>
      <p style="margin:0;color:#DCE4EE;font-size:15px;line-height:1.7;">${o.lead}</p>
    </div>
    <div style="padding:28px 32px 26px;">${o.cuerpo}</div>
    ${o.herramientas ? bloqueHerramientas() : ""}
    <div style="background:#fff;padding-top:26px;border-top:1px solid #E8DFC8;">${bloqueFirma()}</div>
  `, { completo: true });
}

const pasoMail = (n: string, titulo: string, texto: string, href?: string) => `
  <tr>
    <td valign="top" style="padding:0 14px 16px 0;color:#B99F66;font-family:${SERIF};font-size:20px;font-weight:700;width:34px;">${n}</td>
    <td style="padding:0 0 16px;">
      ${href ? `<a href="${href}" style="color:#0E2C50;font-size:15px;font-weight:700;text-decoration:none;">${titulo}</a>` : `<span style="color:#0E2C50;font-size:15px;font-weight:700;">${titulo}</span>`}
      <p style="margin:2px 0 0;color:#595349;font-size:14px;line-height:1.6;">${texto}</p>
    </td>
  </tr>`;

const primerNombreDe = (n: string) => escHtml(n.trim().split(" ")[0] || "");

const TIPOS_PROPIEDAD: Record<string, string> = { casa: "Casa", departamento: "Departamento", terreno: "Terreno", local: "Local", oficina: "Oficina", cochera: "Cochera" };

/** Propiedad cargada → confirmación al dueño. */
export async function sendPropiedadPublicada(data: {
  para: string;
  nombre: string;
  titulo: string;
  tipo: string;
  ubicacion: string;
  precio: number;
  moneda: string;
  publicUrl: string;
  cantidadFotos: number;
}) {
  const resend = getResend(); if (!resend) return;

  const precio = `${data.moneda === "USD" ? "US$" : "$"} ${new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(Math.round(data.precio))}`;
  const nombre = primerNombreDe(data.nombre);

  const pasos = [
    data.cantidadFotos < 5
      ? pasoMail("I", "Sumá más fotos", `Tu publicación tiene ${data.cantidadFotos === 1 ? "1 foto" : `${data.cantidadFotos} fotos`}. Con 5 o más, y una buena portada, las consultas llegan antes.`, `${SITE}/panel`)
      : pasoMail("I", "Revisá la portada", "La primera foto es lo que se ve en los listados: elegí la mejor y ponela primera.", `${SITE}/panel`),
    pasoMail("II", "Validá tu identidad", "Las publicaciones de propietarios verificados generan más confianza y se consultan más.", `${SITE}/panel/perfil`),
    pasoMail("III", "Abrí tu agenda de visitas", "Elegí en qué días y horarios podés mostrarla y los interesados piden visita directamente.", `${SITE}/panel`),
  ].join("");

  const html = mailUsuario({
    eyebrow: "Publicación creada",
    titulo: "Tu propiedad ya está publicada",
    lead: `Hola${nombre ? ` ${nombre}` : ""}, ya podés compartir el link: cuando alguien consulte, te avisamos por email.`,
    cuerpo: `
      <div style="${styles.card}">
        <p style="${styles.label}">Propiedad</p>
        <p style="${styles.value}">${escHtml(data.titulo)}</p>
        <p style="${styles.label}">Tipo · Ubicación</p>
        <p style="${styles.value}">${escHtml(TIPOS_PROPIEDAD[data.tipo] || data.tipo)} · ${escHtml(data.ubicacion)}</p>
        <p style="${styles.label}">Precio</p>
        <p style="${styles.value}">${precio}</p>
      </div>
      <a href="${data.publicUrl}" style="${styles.btn}">Ver mi publicación &rarr;</a>
      <p style="${styles.label};margin:28px 0 12px;">Para que rinda más</p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">${pasos}</table>
      <p style="margin:6px 0 0;color:#595349;font-size:14px;line-height:1.7;">
        ¿No sabés si el precio es el correcto? Probá el
        <a href="${SITE}/estimador" style="color:#8C7641;font-weight:600;">estimador</a>.
      </p>`,
    herramientas: true,
  });

  await resend.emails.send({
    from: FROM,
    to: data.para,
    replyTo: ADMIN,
    subject: `Tu propiedad ya está publicada — ${data.titulo}`,
    html: conUtm(html, "propiedad-publicada"),
  });
}

/** Pedido de ayuda para vender → acuse al dueño. */
export async function sendAyudaVentaAcuse(data: { para: string; nombre: string; propiedadTitulo: string }) {
  const resend = getResend(); if (!resend) return;
  const nombre = primerNombreDe(data.nombre);

  const html = mailUsuario({
    eyebrow: "Acompañamiento de venta",
    titulo: "Recibimos tu pedido",
    lead: `Hola${nombre ? ` ${nombre}` : ""}, vimos que querés ayuda para vender <strong style="color:#fff;">"${escHtml(data.propiedadTitulo)}"</strong>. Eugenio se va a comunicar con vos.`,
    cuerpo: `
      <p style="${styles.label};margin:0 0 12px;">Qué sigue</p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        ${pasoMail("I", "Revisamos tu publicación", "Miramos el precio, las fotos y la descripción para ver dónde se puede mejorar.")}
        ${pasoMail("II", "Te contactamos", "Eugenio te escribe por WhatsApp o por email para conversar, sin compromiso.")}
        ${pasoMail("III", "Armamos el plan", "Definimos juntos cómo seguir: visitas, documentación y el camino hasta la escritura.")}
      </table>
      <p style="margin:6px 0 20px;color:#595349;font-size:14px;line-height:1.7;">
        Mientras tanto, si querés agregar algún dato o tenés una duda, respondé este email.
      </p>
      <a href="${SITE}/panel" style="${styles.btn}">Ir a mi panel &rarr;</a>`,
  });

  await resend.emails.send({
    from: FROM,
    to: data.para,
    replyTo: ADMIN,
    subject: "Recibimos tu pedido de ayuda para vender",
    html: conUtm(html, "ayuda-vender"),
  });
}

/** Consulta de asesoría → acuse a quien escribió (con copia de su mensaje). */
export async function sendAsesoriaAcuse(data: { para: string; nombre: string; mensaje: string; motivo?: string }) {
  const resend = getResend(); if (!resend) return;
  const nombre = primerNombreDe(data.nombre);

  const html = mailUsuario({
    eyebrow: data.motivo ? escHtml(data.motivo) : "Tu consulta",
    titulo: "Recibimos tu mensaje",
    lead: `Hola${nombre ? ` ${nombre}` : ""}, gracias por escribirnos. Te responde Eugenio Nielsen en persona, a la brevedad.`,
    cuerpo: `
      <p style="${styles.label}">Lo que nos escribiste</p>
      <p style="${styles.message}">"${escHtml(data.mensaje)}"</p>
      <p style="margin:0 0 20px;color:#595349;font-size:14px;line-height:1.7;">
        Si querés agregar algo, respondé este email. Y si es urgente, escribinos por WhatsApp.
      </p>
      <a href="https://wa.me/${WHATSAPP}" style="${styles.btn}">Escribir por WhatsApp &rarr;</a>
      <p style="color:#A39C8F;font-size:12px;margin:22px 0 0;line-height:1.6;">
        Te escribimos porque enviaste una consulta en ${SITE.replace("https://", "")}. Si no fuiste vos, podés ignorar este email.
      </p>`,
    herramientas: true,
  });

  await resend.emails.send({
    from: FROM,
    to: data.para,
    replyTo: ADMIN,
    subject: "Recibimos tu consulta — Espacio Inmobiliario",
    html: conUtm(html, "asesoria"),
  });
}

// ── Plantillas para Supabase (mails de la cuenta) ──────────────
// No se envían desde el código: los manda Supabase Auth.
// scripts/generar-plantillas-supabase.mts las escribe en emails/supabase/ para
// pegarlas en Supabase → Authentication → Emails. {{ .ConfirmationURL }} lo
// completa Supabase. No llevan el nombre de la persona a propósito: salen a
// direcciones sin confirmar y el nombre lo escribe quien hace el pedido.

export function plantillaCuenta(tipo: "confirmar" | "clave"): string {
  const t = tipo === "confirmar"
    ? {
        titulo: "Confirmá tu cuenta",
        lead: "Gracias por registrarte en Espacio Inmobiliario. Para terminar, confirmá que este email es tuyo.",
        boton: "Confirmar mi cuenta",
        nota: "Si no creaste una cuenta, ignorá este mensaje.",
        campana: "confirmar-cuenta",
      }
    : {
        titulo: "Elegí una contraseña nueva",
        lead: "Pediste recuperar el acceso a tu cuenta de Espacio Inmobiliario. Abrí el enlace en el mismo navegador donde hiciste el pedido.",
        boton: "Cambiar mi contraseña",
        nota: "Si no lo pediste, ignorá este mensaje: tu contraseña sigue siendo la misma.",
        campana: "recuperar-clave",
      };
  const enlace = "{{ .ConfirmationURL }}";

  const html = baseLayout(`
    <div style="${styles.body_p}">
      <h1 style="${styles.h1};font-family:${SERIF};font-size:26px;">${t.titulo}</h1>
      <p style="${styles.lead}">${t.lead}</p>
      <p style="margin:0 0 24px;"><a href="${enlace}" style="${styles.btn}">${t.boton} &rarr;</a></p>
      <p style="margin:0 0 6px;color:#595349;font-size:13px;line-height:1.6;">Si el botón no funciona, copiá y pegá esta dirección en tu navegador:</p>
      <p style="margin:0 0 20px;font-size:12px;line-height:1.6;word-break:break-all;"><a href="${enlace}" style="color:#8C7641;">${enlace}</a></p>
      <p style="margin:0;color:#595349;font-size:13px;line-height:1.6;">El enlace sirve una sola vez y vence. ${t.nota}</p>
    </div>
  `);
  return conUtm(html, t.campana);
}

// ── Plantillas para Resend (Broadcasts) ────────────────────────
// No se envían desde el código: scripts/generar-plantillas-resend.mts las
// escribe en emails/resend/ para pegarlas en Resend. Usan las variables de
// Resend ({{{FIRST_NAME}}}, {{{RESEND_UNSUBSCRIBE_URL}}}), no datos nuestros.

/** Seguimiento a los 7 días: cómo le fue con la estimación o con el portal. */
export function plantillaSeguimiento(origen: "tasador" | "registro"): string {
  const t = origen === "tasador"
    ? {
        eyebrow: "Una semana después",
        titulo: "¿Qué te pareció tu estimación?",
        lead: `hace unos días te enviamos la estimación de tu propiedad. ${ACLARATORIO} Nos gustaría saber cómo te fue.`,
        preguntas: [
          "¿El valor se acercó a lo que esperabas?",
          "¿Qué dato te faltó o te pareció que no reflejaba tu propiedad?",
          "¿Ya decidiste qué hacer: vender, esperar, alquilar?",
        ],
        asunto: "Mi estimación",
        secundario: { href: "/contacto?motivo=vender", texto: "Revisar mi estimación con Eugenio" },
        terciario: { href: "/propietarios/publicar", texto: "Publicar mi propiedad gratis" },
      }
    : {
        eyebrow: "Una semana después",
        titulo: "¿Qué te pareció el portal?",
        lead: "hace una semana creaste tu cuenta en Espacio Inmobiliario. Queremos saber cómo te fue.",
        preguntas: [
          "¿Pudiste cargar tu propiedad sin trabas?",
          "¿Hubo algo que no entendiste o que no funcionó?",
          "¿Qué te gustaría que el portal tuviera?",
        ],
        asunto: "Mi experiencia en el portal",
        secundario: { href: "/panel/propiedades/nueva", texto: "Cargar mi propiedad" },
        terciario: { href: "/panel/perfil", texto: "Validar mi identidad" },
      };

  const items = t.preguntas.map((p, i) => `
    <tr>
      <td valign="top" style="padding:0 14px 12px 0;color:#B99F66;font-family:${SERIF};font-size:20px;font-weight:700;width:34px;">${["I", "II", "III"][i]}</td>
      <td style="padding:2px 0 12px;color:#0E2C50;font-size:15px;line-height:1.5;font-weight:600;">${p}</td>
    </tr>`).join("");

  const html = baseLayout(`
    <div style="background:#0E2C50;padding:36px 32px 32px;">
      <p style="margin:0 0 10px;color:#CBB585;font-size:11px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;">${t.eyebrow}</p>
      <h1 style="margin:0 0 12px;color:#fff;font-family:${SERIF};font-size:28px;line-height:1.25;font-weight:700;">${t.titulo}</h1>
      <p style="margin:0;color:#DCE4EE;font-size:15px;line-height:1.7;">Hola {{{FIRST_NAME|}}}, ${t.lead}</p>
    </div>

    <div style="padding:28px 32px 26px;">
      <p style="${styles.label};margin:0 0 12px;">Lo que nos interesa saber</p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">${items}</table>
      <p style="margin:6px 0 22px;color:#595349;font-size:14px;line-height:1.7;">
        Con una línea nos alcanza: <strong>respondé este email</strong> y te lee Eugenio en persona.
        Tu opinión nos ayuda a mejorar.
      </p>
      <a href="mailto:${ADMIN}?subject=${encodeURIComponent(t.asunto)}" style="${styles.btn}">Contanos cómo te fue &rarr;</a>
      <p style="margin:20px 0 0;font-size:14px;line-height:1.9;color:#595349;">
        <a href="${SITE}${t.secundario.href}" style="color:#8C7641;font-weight:600;">${t.secundario.texto}</a><br/>
        <a href="${SITE}${t.terciario.href}" style="color:#8C7641;font-weight:600;">${t.terciario.texto}</a>
      </p>
    </div>

    ${bloqueHerramientas()}
    <div style="background:#fff;padding-top:26px;border-top:1px solid #E8DFC8;">${bloqueFirma()}</div>
  `, { completo: true, bajaUrl: "{{{RESEND_UNSUBSCRIBE_URL}}}" });
  return conUtm(html, `seguimiento-${origen}`);
}
