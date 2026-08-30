import type { VisitasConfig, Franja } from "@/lib/types";

/**
 * Motor de horarios de la agenda de visitas.
 *
 * Todo el producto es de Argentina, que no aplica horario de verano
 * desde 2009: el offset es fijo en -03:00. Por eso construimos los
 * instantes con el offset escrito a mano en vez de depender de la
 * zona horaria del navegador — si alguien mira el sitio desde España,
 * "sábado 10:00" tiene que seguir siendo 10 de la mañana en Buenos Aires.
 *
 * Las franjas se generan siempre en el servidor y viajan al cliente ya
 * resueltas como instantes ISO, así el navegador solo formatea.
 */
export const TZ = "America/Argentina/Buenos_Aires";
const OFFSET = "-03:00";

/** Cuántos días hacia adelante ofrecemos. */
export const DIAS_A_MOSTRAR = 21;

/** Anticipación mínima: no se puede pedir una visita para dentro de un rato. */
const HORAS_DE_ANTICIPACION = 12;

export const DIAS_SEMANA = [
  "Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado",
] as const;

export const CONFIG_VACIA: VisitasConfig = {
  activa: false,
  duracion: 30,
  franjas: [],
};

export type Slot = {
  /** Instante exacto en ISO — es lo que se guarda en la base. */
  inicio: string;
  /** Clave del día en formato AAAA-MM-DD (hora de Argentina). */
  dia: string;
  /** "10:00" */
  hora: string;
};

export type DiaConSlots = {
  dia: string;
  /** "Sábado 6 de septiembre" */
  etiqueta: string;
  slots: Slot[];
};

/** Fecha de hoy en Argentina, como AAAA-MM-DD. */
function hoyEnArgentina(ahora: Date): string {
  // en-CA da exactamente el formato AAAA-MM-DD
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit",
  }).format(ahora);
}

/** Suma días a una fecha AAAA-MM-DD usando aritmética de calendario pura. */
function sumarDias(fecha: string, dias: number): string {
  const [a, m, d] = fecha.split("-").map(Number);
  const t = new Date(Date.UTC(a, m - 1, d + dias));
  return t.toISOString().slice(0, 10);
}

/** Día de la semana (0 = domingo) de una fecha AAAA-MM-DD. */
function diaDeLaSemana(fecha: string): number {
  const [a, m, d] = fecha.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d)).getUTCDay();
}

/** Convierte "AAAA-MM-DD" + "HH:MM" argentinos al instante exacto. */
export function instanteArgentino(fecha: string, hora: string): Date {
  return new Date(`${fecha}T${hora}:00${OFFSET}`);
}

/** "10:30" → 630 minutos */
function aMinutos(hora: string): number {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
}

/** 630 → "10:30" */
function aHora(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Valida y normaliza lo que venga de la base (jsonb sin tipar). */
export function leerConfig(raw: unknown): VisitasConfig {
  if (!raw || typeof raw !== "object") return CONFIG_VACIA;
  const c = raw as Partial<VisitasConfig>;
  const duracion = [30, 45, 60].includes(Number(c.duracion)) ? Number(c.duracion) : 30;

  const franjas = Array.isArray(c.franjas)
    ? c.franjas.filter(
        (f): f is Franja =>
          !!f &&
          Number.isInteger(f.dia) && f.dia >= 0 && f.dia <= 6 &&
          /^\d{2}:\d{2}$/.test(f.desde) &&
          /^\d{2}:\d{2}$/.test(f.hasta) &&
          aMinutos(f.desde) < aMinutos(f.hasta)
      )
    : [];

  return { activa: c.activa === true && franjas.length > 0, duracion, franjas };
}

/**
 * Devuelve los próximos días con horarios libres.
 *
 * @param ocupadas instantes ISO ya confirmados — se descuentan de la grilla
 * @param ahora    inyectable para poder testear
 */
export function proximosDias(
  config: VisitasConfig,
  ocupadas: string[] = [],
  ahora: Date = new Date()
): DiaConSlots[] {
  if (!config.activa || !config.franjas.length) return [];

  const tomados = new Set(ocupadas.map(o => new Date(o).getTime()));
  const desdeInstante = ahora.getTime() + HORAS_DE_ANTICIPACION * 3600_000;

  const hoy = hoyEnArgentina(ahora);
  const dias: DiaConSlots[] = [];

  for (let i = 0; i < DIAS_A_MOSTRAR; i++) {
    const fecha = sumarDias(hoy, i);
    const dow = diaDeLaSemana(fecha);
    const franjasDelDia = config.franjas.filter(f => f.dia === dow);
    if (!franjasDelDia.length) continue;

    const slots: Slot[] = [];
    for (const franja of franjasDelDia) {
      const fin = aMinutos(franja.hasta);
      for (let m = aMinutos(franja.desde); m + config.duracion <= fin; m += config.duracion) {
        const hora = aHora(m);
        const instante = instanteArgentino(fecha, hora);
        if (instante.getTime() < desdeInstante) continue;
        if (tomados.has(instante.getTime())) continue;
        slots.push({ inicio: instante.toISOString(), dia: fecha, hora });
      }
    }

    if (slots.length) {
      slots.sort((a, b) => a.hora.localeCompare(b.hora));
      dias.push({ dia: fecha, etiqueta: etiquetaDeDia(fecha), slots });
    }
  }

  return dias;
}

/** "2026-09-05" → "Sábado 5 de septiembre" */
export function etiquetaDeDia(fecha: string): string {
  const [a, m, d] = fecha.split("-").map(Number);
  const texto = new Intl.DateTimeFormat("es-AR", {
    weekday: "long", day: "numeric", month: "long", timeZone: "UTC",
  }).format(new Date(Date.UTC(a, m - 1, d)));
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** Formatea un instante como "Sábado 5 de septiembre, 10:00 h" */
export function formatearVisita(iso: string): string {
  const fecha = new Date(iso);
  const texto = new Intl.DateTimeFormat("es-AR", {
    weekday: "long", day: "numeric", month: "long",
    hour: "2-digit", minute: "2-digit", hour12: false, timeZone: TZ,
  }).format(fecha);
  return texto.charAt(0).toUpperCase() + texto.slice(1) + " h";
}

/** Versión corta: "sáb 5/9 · 10:00" */
export function formatearVisitaCorta(iso: string): string {
  const f = new Date(iso);
  const dia = new Intl.DateTimeFormat("es-AR", {
    weekday: "short", day: "numeric", month: "numeric", timeZone: TZ,
  }).format(f);
  const hora = new Intl.DateTimeFormat("es-AR", {
    hour: "2-digit", minute: "2-digit", hour12: false, timeZone: TZ,
  }).format(f);
  return `${dia} · ${hora}`;
}

/**
 * Verifica que un instante pedido caiga realmente en la disponibilidad.
 * Se usa en el servidor: nunca confiamos en el horario que manda el cliente.
 */
export function esSlotValido(config: VisitasConfig, iso: string, ahora: Date = new Date()): boolean {
  const instante = new Date(iso);
  if (Number.isNaN(instante.getTime())) return false;
  if (instante.getTime() < ahora.getTime() + HORAS_DE_ANTICIPACION * 3600_000) return false;

  const fecha = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit",
  }).format(instante);
  const hora = new Intl.DateTimeFormat("es-AR", {
    timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false,
  }).format(instante);

  // Tiene que coincidir exactamente con el arranque de un bloque
  const dow = diaDeLaSemana(fecha);
  return config.franjas.some(f => {
    if (f.dia !== dow) return false;
    const desde = aMinutos(f.desde);
    const hasta = aMinutos(f.hasta);
    const m = aMinutos(hora);
    if (m < desde || m + config.duracion > hasta) return false;
    return (m - desde) % config.duracion === 0;
  });
}
