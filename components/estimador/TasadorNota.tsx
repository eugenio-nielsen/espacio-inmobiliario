import Guilloche from "@/components/ui/Guilloche";
import Tasador from "@/components/estimador/Tasador";
import { getContextoTasador } from "@/lib/estimador/data";
import "./tasador.css";

/**
 * El tasador dentro de una nota del blog (marcador [[TASADOR]]).
 *
 * Es el mismo de /estimador, en versión para la columna de lectura: una
 * banda nocturna con su guilloché, la pregunta y la hoja de pasos. La
 * ficha lateral no entra en 680px, así que su medidor de precisión pasa
 * arriba de la hoja (ver `embebido` en Tasador).
 */
export default async function TasadorNota() {
  const { barrios, barriosConZonas } = await getContextoTasador();
  return (
    <section className="ts-nota" aria-label="Tasador de departamentos en CABA">
      <Guilloche id="ts-gq-nota" className="ts-nota-gq" />
      <header className="ts-nota-cab">
        <p className="ts-eyebrow">Tasador · Departamentos en CABA</p>
        <p className="ts-nota-t">¿Cuánto vale <em>tu departamento?</em></p>
      </header>
      <Tasador barrios={barrios} barriosConZonas={barriosConZonas} embebido />
    </section>
  );
}
