import { Resend } from "resend";

// Inicialización lazy — evita crash si la key no está configurada en el entorno
function getResend() {
  if (!process.env.RESEND_API_KEY) return null;
  return new Resend(process.env.RESEND_API_KEY);
}

const FROM    = process.env.FROM_EMAIL    || "onboarding@resend.dev";
const ADMIN   = process.env.ADMIN_EMAIL   || "eugenio@espacioinmobiliario.com.ar";
const SITE    = process.env.NEXT_PUBLIC_SITE_URL || "https://espacio-inmobiliario-one.vercel.app";

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

function baseLayout(content: string): string {
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&display=swap" rel="stylesheet"/>
</head><body style="${styles.body}">
<div style="${styles.wrap}">
  <div style="${styles.header}">
    <a href="${SITE}" style="${styles.logo}">Espacio Inmobiliario</a>
  </div>
  ${content}
  <div style="${styles.footer}">
    © ${new Date().getFullYear()} Espacio Inmobiliario · <a href="${SITE}" style="color:#A39C8F;">${SITE.replace("https://","")}</a>
  </div>
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
        Hola ${data.ownerNombre}, alguien está interesado en tu propiedad
        <strong style="color:#0E2C50;">"${data.propertyTitulo}"</strong>.
      </p>

      <div style="${styles.card}">
        <p style="${styles.label}">Nombre</p>
        <p style="${styles.value}">${data.interesadoNombre}</p>

        <p style="${styles.label}">Email</p>
        <p style="${styles.value}"><a href="mailto:${data.interesadoEmail}" style="color:#0E2C50;">${data.interesadoEmail}</a></p>

        ${data.interesadoTelefono ? `
        <p style="${styles.label}">Teléfono / WhatsApp</p>
        <p style="${styles.value}"><a href="https://wa.me/${data.interesadoTelefono.replace(/\D/g,"")}" style="color:#15803D;">${data.interesadoTelefono}</a></p>
        ` : ""}
      </div>

      <p style="${styles.label}">Mensaje</p>
      <p style="${styles.message}">"${data.mensaje}"</p>

      <a href="${data.propertyUrl}" style="${styles.btn}">Ver propiedad →</a>
    </div>
  `);

  const resend = getResend(); if (!resend) return;
  await resend.emails.send({
    from: FROM,
    to: data.ownerEmail,
    bcc: ADMIN,           // vos siempre recibís una copia
    subject: `Nueva consulta: "${data.propertyTitulo}"`,
    html,
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
        Hola ${data.interesadoNombre}, recibimos tu consulta sobre
        <strong style="color:#0E2C50;">"${data.propertyTitulo}"</strong>.
        El dueño se comunicará con vos a la brevedad.
      </p>
      <a href="${data.propertyUrl}" style="${styles.btn}">Ver la propiedad →</a>
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
    html,
  });
}

// ── Lead del Estimador de Precios → al admin ──────────────────
export async function sendEstimacionLead(data: {
  nombre: string;
  email: string;
  telefono?: string;
  barrio: string;
  resultado: { estimado: number; rangoMin: number; rangoMax: number };
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
        <p style="${styles.value}">${data.nombre}</p>

        <p style="${styles.label}">Email</p>
        <p style="${styles.value}"><a href="mailto:${data.email}" style="color:#0E2C50;">${data.email}</a></p>

        ${data.telefono ? `
        <p style="${styles.label}">Teléfono / WhatsApp</p>
        <p style="${styles.value}"><a href="https://wa.me/${data.telefono.replace(/\D/g,"")}" style="color:#15803D;">${data.telefono}</a></p>
        ` : ""}

        <p style="${styles.label}">Barrio</p>
        <p style="${styles.value}">${data.barrio}</p>

        <p style="${styles.label}">Estimación generada</p>
        <p style="${styles.value}">${fmt(data.resultado.estimado)} <span style="color:#8C7641;font-weight:400;">(rango ${fmt(data.resultado.rangoMin)} – ${fmt(data.resultado.rangoMax)})</span></p>
      </div>
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

// ── Consulta de asesoría / acompañamiento → al admin ──────────
export async function sendAsesoriaLead(data: {
  nombre: string;
  email: string;
  telefono?: string;
  mensaje: string;
}) {
  if (!process.env.RESEND_API_KEY) return;

  const html = baseLayout(`
    <div style="${styles.body_p}">
      <h1 style="${styles.h1}">Nueva consulta de asesoría</h1>
      <p style="${styles.lead}">Un propietario quiere conversar sobre el acompañamiento para vender.</p>

      <div style="${styles.card}">
        <p style="${styles.label}">Nombre</p>
        <p style="${styles.value}">${data.nombre}</p>

        <p style="${styles.label}">Email</p>
        <p style="${styles.value}"><a href="mailto:${data.email}" style="color:#0E2C50;">${data.email}</a></p>

        ${data.telefono ? `
        <p style="${styles.label}">Teléfono / WhatsApp</p>
        <p style="${styles.value}"><a href="https://wa.me/${data.telefono.replace(/\D/g,"")}" style="color:#15803D;">${data.telefono}</a></p>
        ` : ""}
      </div>

      <p style="${styles.label}">Mensaje</p>
      <p style="${styles.message}">"${data.mensaje}"</p>
    </div>
  `);

  const resend = getResend(); if (!resend) return;
  await resend.emails.send({
    from: FROM,
    to: ADMIN,
    replyTo: data.email,
    subject: `Asesoría: ${data.nombre}`,
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
        <strong style="color:#0E2C50;">${data.servicio}</strong>.
      </p>

      <div style="${styles.card}">
        <p style="${styles.label}">Nombre</p>
        <p style="${styles.value}">${data.nombre}</p>

        <p style="${styles.label}">Email</p>
        <p style="${styles.value}"><a href="mailto:${data.email}" style="color:#0E2C50;">${data.email}</a></p>

        <p style="${styles.label}">Servicio solicitado</p>
        <p style="${styles.value}">${data.servicio}</p>
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
  };

  const html = baseLayout(`
    <div style="${styles.body_p}">
      <h1 style="${styles.h1}">Nueva propiedad publicada</h1>
      <p style="${styles.lead}">Se publicó una nueva propiedad en el sitio.</p>

      <div style="${styles.card}">
        <p style="${styles.label}">Propiedad</p>
        <p style="${styles.value}">${data.titulo}</p>

        <p style="${styles.label}">Tipo · Ubicación</p>
        <p style="${styles.value}">${TIPO_LABEL[data.tipo] || data.tipo} · ${ubicacion}</p>

        <p style="${styles.label}">Precio</p>
        <p style="${styles.value}">${precio}</p>

        <p style="${styles.label}">Publicada por</p>
        <p style="${styles.value}">${data.ownerNombre} · <a href="mailto:${data.ownerEmail}" style="color:#0E2C50;">${data.ownerEmail}</a></p>
      </div>

      <div style="display:flex;gap:12px;flex-wrap:wrap;">
        <a href="${data.publicUrl}" style="${styles.btn}">Ver publicación →</a>
        <a href="${data.panelUrl}" style="display:inline-block;background:#F7F4EE;color:#0E2C50;font-size:14px;font-weight:700;padding:13px 24px;border-radius:10px;text-decoration:none;border:1px solid #E8DFC8;">
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
