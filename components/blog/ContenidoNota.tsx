import CalculadoraAranceles from "@/components/blog/CalculadoraAranceles";

/**
 * Renderiza el cuerpo de la nota permitiendo intercalar componentes
 * interactivos. En el markdown se escribe el marcador en su propia línea,
 * por ejemplo:
 *
 *     [[CALCULADORA_ARANCELES]]
 *
 * y acá se reemplaza por el componente correspondiente. Si el marcador no
 * aparece, la nota se muestra igual que siempre.
 */
const WIDGETS: Record<string, React.ReactNode> = {
  CALCULADORA_ARANCELES: <CalculadoraAranceles />,
};

// El markdown envuelve el marcador en un <p>, con o sin espacios alrededor
const MARCADOR = /<p>\s*\[\[([A-Z_]+)\]\]\s*<\/p>/g;

export default function ContenidoNota({ html }: { html: string }) {
  if (!MARCADOR.test(html)) {
    MARCADOR.lastIndex = 0;
    return <div className="blog-prose" dangerouslySetInnerHTML={{ __html: html }} />;
  }
  MARCADOR.lastIndex = 0;

  const partes: React.ReactNode[] = [];
  let ultimo = 0;
  let m: RegExpExecArray | null;
  let i = 0;

  while ((m = MARCADOR.exec(html)) !== null) {
    const previo = html.slice(ultimo, m.index);
    if (previo.trim()) {
      partes.push(
        <div key={`html-${i}`} className="blog-prose" dangerouslySetInnerHTML={{ __html: previo }} />
      );
    }
    const widget = WIDGETS[m[1]];
    if (widget) partes.push(<div key={`widget-${i}`}>{widget}</div>);
    ultimo = m.index + m[0].length;
    i++;
  }

  const resto = html.slice(ultimo);
  if (resto.trim()) {
    partes.push(
      <div key={`html-${i}`} className="blog-prose" dangerouslySetInnerHTML={{ __html: resto }} />
    );
  }

  return <>{partes}</>;
}
