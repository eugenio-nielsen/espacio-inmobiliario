import { redirect } from "next/navigation";

/**
 * /propietarios todavía no tiene portada propia: lleva a la página de
 * publicar, que es la primera del espacio. Cuando haya más páginas,
 * acá va el índice.
 */
export default function PropietariosPage() {
  redirect("/propietarios/publicar");
}
