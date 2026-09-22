import { Ear, LineChart, Lightbulb, ClipboardCheck, Handshake } from "lucide-react";
import FadeIn from "@/components/ui/FadeIn";

/**
 * El método en cinco etapas.
 *
 * En móvil van en dos columnas: apilados eran cinco pantallas de scroll
 * para decir algo que se entiende de un vistazo. La quinta ocupa el
 * ancho completo — no por descarte, sino porque es el cierre del
 * proceso y la frase que sigue se apoya en ella.
 */
const PASOS = [
  { icon: Ear, t: "Escuchamos", d: "Entendemos qué buscás y cuáles son tus objetivos." },
  { icon: LineChart, t: "Analizamos", d: "Evaluamos propiedades, valores, ubicación y condiciones." },
  { icon: Lightbulb, t: "Asesoramos", d: "Te ayudamos a entender las alternativas antes de decidir." },
  { icon: ClipboardCheck, t: "Gestionamos", d: "Coordinamos visitas, documentación y los actores involucrados." },
  { icon: Handshake, t: "Acompañamos", d: "Seguimos el proceso hasta la concreción de la operación." },
];

export default function ComoTrabajamos() {
  return (
    <>
      <div className="hm-pasos">
        {PASOS.map((p, i) => {
          const Icon = p.icon;
          return (
            <FadeIn key={p.t} delay={i * 80} direction="up" className="hm-paso-wrap">
              <div className="hm-paso" style={{ ["--sheen" as string]: `${i * 650}ms` }}>
                <div className="hm-paso-top">
                  <Icon size={17} strokeWidth={1.6} />
                  <span className="hm-paso-n" aria-hidden="true">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="hm-paso-t">{p.t}</h3>
                <p className="hm-paso-d">{p.d}</p>
              </div>
            </FadeIn>
          );
        })}
      </div>

      <p className="hm-pasos-cierre">
        Porque nuestro trabajo no termina cuando encontrás una propiedad.
      </p>
    </>
  );
}
