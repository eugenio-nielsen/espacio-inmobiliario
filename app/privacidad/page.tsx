import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Política de privacidad",
  description: "Política de privacidad y protección de datos personales de Espacio Inmobiliario.",
  alternates: { canonical: `${process.env.NEXT_PUBLIC_SITE_URL}/privacidad` },
};

export default function PrivacidadPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)" }}>
      <Navbar />

      <main style={{ maxWidth: 760, margin: "0 auto", padding: "clamp(28px,5vw,48px) 20px clamp(48px,7vw,80px)" }}>
        <h1 style={{
          fontFamily: "var(--font-display)", fontWeight: 600,
          fontSize: "clamp(26px,4.5vw,38px)", letterSpacing: "-.02em",
          color: "var(--navy-800)", margin: "0 0 8px",
        }}>
          Política de privacidad
        </h1>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--ink-500)", margin: "0 0 32px" }}>
          Última actualización: junio de 2026
        </p>

        <article className="blog-prose">
          <h2>1. Responsable del tratamiento</h2>
          <p>
            El responsable de los datos personales tratados en espacioinmobiliario.com.ar
            (&ldquo;la Plataforma&rdquo;) es Eugenio Nielsen. Contacto:{" "}
            <a href="mailto:eugenio@espacioinmobiliario.com.ar">eugenio@espacioinmobiliario.com.ar</a>.
            Esta política se rige por la Ley 25.326 de Protección de los Datos Personales de la
            República Argentina.
          </p>

          <h2>2. Qué datos recopilamos</h2>
          <ul>
            <li><strong>Cuenta de propietario:</strong> nombre, email, teléfono y contraseña (almacenada en forma cifrada).</li>
            <li><strong>Publicaciones:</strong> datos de la propiedad, incluida su dirección y fotos.</li>
            <li><strong>Consultas:</strong> nombre, email, teléfono (opcional) y mensaje de quien consulta por una propiedad.</li>
            <li><strong>Estimador y asesoría:</strong> los datos del inmueble que ingresás y, si pedís ser contactado, tu nombre, email y teléfono.</li>
            <li><strong>Datos técnicos:</strong> dirección IP (usada para prevenir abuso y spam), cookies de sesión y métricas de uso anónimas vía Google Analytics.</li>
          </ul>

          <h2>3. Para qué los usamos</h2>
          <ul>
            <li>Operar la Plataforma: publicar propiedades, gestionar tu cuenta y tu panel.</li>
            <li>Conectar interesados con propietarios: tu consulta se envía al dueño de la propiedad.</li>
            <li>Enviarte notificaciones del servicio por email (consultas recibidas, confirmaciones).</li>
            <li>Responder pedidos de tasación o asesoría que inicies vos.</li>
            <li>Prevenir abuso, spam y uso fraudulento del sitio.</li>
            <li>Entender el uso del sitio para mejorarlo (estadísticas agregadas).</li>
          </ul>

          <h2>4. Con quién se comparten</h2>
          <p>
            <strong>No vendemos ni alquilamos tus datos.</strong> Se comparten únicamente:
          </p>
          <ul>
            <li>Con el <strong>propietario</strong> de la propiedad que consultás, para que pueda responderte.</li>
            <li>Con proveedores que necesitamos para operar, que actúan por cuenta nuestra:
              Supabase (base de datos y autenticación), Vercel (hosting), Resend (envío de
              emails) y Google Analytics (métricas). Estos proveedores pueden alojar datos fuera
              de la Argentina, en países o marcos con niveles adecuados de protección.</li>
            <li>Con autoridades, si una norma u orden judicial lo exige.</li>
          </ul>

          <h2>5. Conservación</h2>
          <p>
            Conservamos los datos mientras tu cuenta esté activa o mientras sean necesarios para
            las finalidades descriptas. Podés pedir la eliminación de tu cuenta y tus datos en
            cualquier momento.
          </p>

          <h2>6. Tus derechos</h2>
          <p>
            Como titular de los datos podés ejercer en forma gratuita los derechos de{" "}
            <strong>acceso, rectificación, actualización y supresión</strong> escribiendo a{" "}
            <a href="mailto:eugenio@espacioinmobiliario.com.ar">eugenio@espacioinmobiliario.com.ar</a>.
          </p>
          <p>
            La AGENCIA DE ACCESO A LA INFORMACIÓN PÚBLICA, en su carácter de Órgano de Control de
            la Ley N° 25.326, tiene la atribución de atender las denuncias y reclamos que
            interpongan quienes resulten afectados en sus derechos por incumplimiento de las
            normas vigentes en materia de protección de datos personales.
          </p>

          <h2>7. Cookies</h2>
          <p>
            Usamos cookies estrictamente necesarias para mantener tu sesión iniciada y cookies de
            análisis (Google Analytics) para medir el uso del sitio. Podés bloquear las cookies
            desde la configuración de tu navegador; la sesión del panel puede dejar de funcionar
            sin las cookies necesarias.
          </p>

          <h2>8. Seguridad</h2>
          <p>
            Aplicamos medidas técnicas y organizativas razonables para proteger tus datos:
            conexiones cifradas (HTTPS), contraseñas almacenadas con hash, acceso restringido a
            la base de datos y reglas de acceso por usuario. Ningún sistema es infalible; si
            detectamos un incidente que afecte tus datos, te lo comunicaremos.
          </p>

          <h2>9. Cambios a esta política</h2>
          <p>
            Si modificamos esta política lo publicaremos en esta página, actualizando la fecha.
            Los cambios relevantes se comunicarán en la Plataforma.
          </p>
        </article>
      </main>

      <Footer />
    </div>
  );
}
