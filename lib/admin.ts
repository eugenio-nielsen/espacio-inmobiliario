/**
 * Único lugar donde se define quién es el superadmin. Cualquier chequeo
 * de permisos de admin tiene que importar de acá.
 */
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "eugenio@espacioinmobiliario.com.ar";

export const esAdminEmail = (email?: string | null) => !!email && email === ADMIN_EMAIL;
