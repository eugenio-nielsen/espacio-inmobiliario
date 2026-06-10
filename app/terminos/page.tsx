import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Términos y condiciones",
  description: "Términos y condiciones de uso de Espacio Inmobiliario.",
  alternates: { canonical: `${process.env.NEXT_PUBLIC_SITE_URL}/terminos` },
};

export default function TerminosPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)" }}>
      <Navbar />

      <main style={{ maxWidth: 760, margin: "0 auto", padding: "clamp(28px,5vw,48px) 20px clamp(48px,7vw,80px)" }}>
        <h1 style={{
          fontFamily: "var(--font-display)", fontWeight: 600,
          fontSize: "clamp(26px,4.5vw,38px)", letterSpacing: "-.02em",
          color: "var(--navy-800)", margin: "0 0 8px",
        }}>
          Términos y condiciones
        </h1>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--ink-500)", margin: "0 0 32px" }}>
          Última actualización: junio de 2026
        </p>

        <article className="blog-prose">
          <h2>1. Qué es Espacio Inmobiliario</h2>
          <p>
            Espacio Inmobiliario (espacioinmobiliario.com.ar, en adelante &ldquo;la Plataforma&rdquo;) es un
            sitio de publicación de propiedades en venta que conecta a propietarios con personas
            interesadas, para que traten en forma directa. Al usar la Plataforma aceptás estos
            términos y condiciones.
          </p>

          <h2>2. Rol de la Plataforma</h2>
          <p>
            La Plataforma es un medio de publicación y contacto. <strong>No somos parte de las
            operaciones de compraventa</strong>: no intervenimos en la negociación, no recibimos pagos
            por cuenta de las partes, no percibimos comisión por las operaciones y no garantizamos
            la concreción, validez o resultado de ninguna operación entre usuarios. La decisión de
            comprar o vender, la verificación de la contraparte y de la documentación, y las
            condiciones del negocio son responsabilidad exclusiva de las partes. Recomendamos
            siempre contar con escribano y asesoramiento profesional para concretar una operación.
          </p>

          <h2>3. Cuentas de usuario</h2>
          <p>
            Para publicar una propiedad es necesario crear una cuenta con datos veraces y
            mantenerlos actualizados. Sos responsable de la confidencialidad de tu contraseña y de
            toda actividad realizada desde tu cuenta. Podemos suspender o eliminar cuentas que
            incumplan estos términos.
          </p>

          <h2>4. Publicaciones</h2>
          <p>Al publicar una propiedad declarás que:</p>
          <ul>
            <li>Sos el titular de la propiedad o contás con autorización suficiente para ofrecerla en venta.</li>
            <li>La información publicada (precio, superficie, fotos, características) es veraz y no induce a error.</li>
            <li>Las fotos que subís son propias o tenés derecho a usarlas.</li>
          </ul>
          <p>
            Nos reservamos el derecho de pausar o eliminar publicaciones con contenido falso,
            ilícito, ofensivo o que infrinja derechos de terceros, sin que esto genere derecho a
            indemnización alguna.
          </p>

          <h2>5. Consultas y contacto entre usuarios</h2>
          <p>
            Cuando enviás una consulta por una propiedad, tus datos de contacto (nombre, email y
            teléfono si lo indicás) se comparten con el propietario para que pueda responderte.
            El uso posterior que las partes hagan de esos datos es responsabilidad de cada una.
          </p>

          <h2>6. Estimador de precios</h2>
          <p>
            El estimador de valores de la Plataforma entrega un resultado <strong>orientativo</strong>,
            calculado a partir de valores de referencia del mercado y de los datos que ingresás.
            <strong> No constituye una tasación oficial</strong> ni asesoramiento profesional, y no
            debe usarse como única base para decidir una operación.
          </p>

          <h2>7. Propiedad intelectual</h2>
          <p>
            El diseño, la marca, los textos y el software de la Plataforma son de su titular.
            El contenido de cada publicación (fotos, descripciones) pertenece a quien lo publica,
            que nos otorga una licencia gratuita para mostrarlo en la Plataforma y difundirlo con
            fines de promoción de la publicación.
          </p>

          <h2>8. Limitación de responsabilidad</h2>
          <p>
            La Plataforma se ofrece &ldquo;tal como está&rdquo;. No garantizamos disponibilidad
            ininterrumpida del servicio ni la exactitud del contenido publicado por los usuarios.
            En la máxima medida permitida por la ley, no respondemos por daños derivados de
            operaciones entre usuarios ni del uso de la información publicada.
          </p>

          <h2>9. Modificaciones</h2>
          <p>
            Podemos actualizar estos términos. Si el cambio es relevante lo comunicaremos en la
            Plataforma. El uso posterior a la publicación de los cambios implica su aceptación.
          </p>

          <h2>10. Ley aplicable y jurisdicción</h2>
          <p>
            Estos términos se rigen por las leyes de la República Argentina. Cualquier
            controversia se someterá a los tribunales ordinarios de la Ciudad Autónoma de
            Buenos Aires, salvo norma de orden público en contrario.
          </p>

          <h2>11. Contacto</h2>
          <p>
            Por consultas sobre estos términos: <a href="mailto:eugenio@espacioinmobiliario.com.ar">eugenio@espacioinmobiliario.com.ar</a>.
          </p>
        </article>
      </main>

      <Footer />
    </div>
  );
}
