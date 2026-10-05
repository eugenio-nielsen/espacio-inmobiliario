/**
 * Los datos que cargó la persona en el tasador, listos para mostrar.
 *
 * Una sola fuente para el informe que ve el usuario, la ficha del
 * superadmin y el mail de aviso: así ningún campo del formulario queda
 * afuera de uno de los tres. Recibe el input tal como se guardó en
 * `estimaciones.input`, que en registros viejos puede traer menos
 * campos (o la cochera como true/false), así que lee todo con tolerancia.
 */

export type FilaDeclarada = [etiqueta: string, valor: string];
export type GrupoDeclarado = { titulo: string; filas: FilaDeclarada[] };

const NO_INFORMADO = "No informó";

const OBRA: Record<string, string> = { usado: "Usado", a_estrenar: "A estrenar", pozo: "En pozo" };
const ESTADO: Record<string, string> = { a_reciclar: "A reciclar", bueno: "Bueno", muy_bueno: "Muy bueno", excelente: "Excelente" };
const CATEGORIA: Record<string, string> = { regular: "Regular", estandar: "Estándar", premium: "Premium" };
const DISPOSICION: Record<string, string> = { frente: "Frente", contrafrente: "Contrafrente", interno: "Interno" };
const VISTA: Record<string, string> = { abierta: "Abierta", despejada: "Despejada", a_la_calle: "A la calle", interna: "Interna" };
const EXPENSAS: Record<string, string> = { bajas: "Bajas", medias: "Medias", altas: "Altas" };
const COCHERA: Record<string, string> = { no: "Sin cochera", descubierta: "Descubierta", movil: "Cubierta móvil", fija: "Cubierta fija" };
const CALEFACCION: Record<string, string> = { losa: "Losa radiante", central: "Central", individual: "Individual", sin: "Sin calefacción" };
const OCUPACION: Record<string, string> = { libre: "Libre", alquilada: "Alquilada", ocupada: "Ocupada" };
const DOMINIAL: Record<string, string> = { escritura: "Escritura al día", sucesion: "En sucesión", observaciones: "Con observaciones" };
const ORIENTACION: Record<string, string> = {
  norte: "Norte", noreste: "Noreste", este: "Este", sureste: "Sureste",
  sur: "Sur", suroeste: "Suroeste", oeste: "Oeste", noroeste: "Noroeste",
};
const AMENITIES: [clave: string, etiqueta: string][] = [
  ["pileta", "Piscina"], ["sum", "SUM"], ["gimnasio", "Gimnasio"], ["seguridad", "Seguridad 24 h"], ["parrilla", "Parrilla"],
];

const fmtNum = (n: number) => new Intl.NumberFormat("es-AR", { maximumFractionDigits: 1 }).format(n);

export function datosDeclarados(raw: unknown): GrupoDeclarado[] {
  const i = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;

  const num = (k: string): number | undefined => (typeof i[k] === "number" && Number.isFinite(i[k]) ? (i[k] as number) : undefined);
  const txt = (k: string): string => (typeof i[k] === "string" ? (i[k] as string).trim() : "");
  const lista = (k: string, mapa: Record<string, string>): string => {
    const v = txt(k);
    return v ? mapa[v] ?? v : NO_INFORMADO;
  };
  const sino = (k: string): string => (i[k] === true ? "Sí" : "No");

  const usado = txt("condicionObra") === "" || txt("condicionObra") === "usado";
  const piso = num("piso");
  const cubiertos = num("m2Cubiertos");
  const balcon = num("m2Semicubierto") ?? 0;
  const patio = num("m2Descubiertos") ?? 0;
  const total = (cubiertos ?? 0) + balcon + patio;

  // Registros viejos guardaban la cochera como true/false
  const cochera = typeof i.cochera === "boolean" ? (i.cochera ? "Sí" : COCHERA.no) : lista("cochera", COCHERA);

  const amenities = (i.amenities && typeof i.amenities === "object" ? i.amenities : {}) as Record<string, unknown>;
  const conAmenities = AMENITIES.filter(([k]) => amenities[k] === true).map(([, l]) => l);

  const grupos: GrupoDeclarado[] = [
    {
      titulo: "Ubicación",
      filas: [
        ["Barrio", txt("barrio") || NO_INFORMADO],
        ["Dirección", txt("direccion") || NO_INFORMADO],
      ],
    },
    {
      titulo: "Superficie",
      filas: [
        ["Cubierta", cubiertos != null ? `${fmtNum(cubiertos)} m²` : NO_INFORMADO],
        ["Balcón", `${fmtNum(balcon)} m²`],
        ["Patio o terraza", `${fmtNum(patio)} m²`],
        ["Total declarado", `${fmtNum(total)} m²`],
      ],
    },
    {
      titulo: "La unidad",
      filas: [
        ["Ambientes", num("ambientes") != null ? (num("ambientes") === 1 ? "Monoambiente" : `${num("ambientes")}${num("ambientes")! >= 5 ? " o más" : ""}`) : NO_INFORMADO],
        ...(num("dormitorios") != null ? [["Dormitorios", String(num("dormitorios"))] as FilaDeclarada] : []),
        ["Baños", num("banos") != null ? `${num("banos")}${num("banos")! >= 3 ? " o más" : ""}` : NO_INFORMADO],
        ["Piso", piso == null ? NO_INFORMADO : piso === 0 ? "Planta baja" : `${piso}°`],
        ["Ascensor", sino("ascensor")],
        ["Último piso", sino("ultimoPiso")],
        ["Disposición", lista("disposicion", DISPOSICION)],
        ["Orientación", lista("orientacion", ORIENTACION)],
        ["Vista", lista("vista", VISTA)],
      ],
    },
    {
      titulo: "El edificio",
      filas: [
        ["Condición de obra", lista("condicionObra", OBRA)],
        ["Antigüedad", !usado ? "No aplica" : num("antiguedad") == null ? NO_INFORMADO : num("antiguedad") === 0 ? "Menos de un año" : `${num("antiguedad")} años`],
        ["Estado de conservación", !usado ? "No aplica" : lista("estado", ESTADO)],
        ["Categoría", lista("categoria", CATEGORIA)],
        ["Amenities", conAmenities.length ? conAmenities.join(", ") : "Ninguno"],
      ],
    },
    {
      titulo: "Comodidades y gastos",
      filas: [
        ["Cochera", cochera],
        ["Baulera", sino("baulera")],
        ["Dependencia de servicio", sino("dependenciaServicio")],
        ["Calefacción", lista("calefaccion", CALEFACCION)],
        ["Expensas", lista("expensas", EXPENSAS)],
        ["Apto crédito hipotecario", sino("aptoCredito")],
      ],
    },
    {
      titulo: "Situación",
      filas: [
        ["Ocupación", lista("ocupacion", OCUPACION)],
        ["Situación dominial", lista("situacionDominial", DOMINIAL)],
        ["Vecinos especiales", sino("vecinosEspeciales")],
      ],
    },
  ];

  return grupos;
}
