"use client";

import { useEffect, useRef, useState } from "react";
import { Bold, ImagePlus, Italic, Link2, List, Quote, X } from "lucide-react";
import { renderForo } from "@/lib/foro/markdown";
import { compressImage } from "@/lib/utils/compressImage";

/**
 * Editor de la Tertulia: un papel con cinco botones de formato (negrita,
 * cursiva, lista, cita y enlace) que escriben Markdown, y una vista
 * previa que se renderiza igual que la publicación (mismo sanitizado).
 * Ctrl/Cmd + Enter envía.
 *
 * El textarea queda montado en la vista previa (oculto) para que el
 * formulario siga mandando el texto.
 */
export default function Editor({
  valor,
  onCambio,
  nombre = "cuerpo",
  placeholder,
  max = 10000,
  filas = 7,
  autoFocus,
  pie,
  etiqueta,
}: {
  valor: string;
  onCambio: (v: string) => void;
  nombre?: string;
  placeholder?: string;
  max?: number;
  filas?: number;
  autoFocus?: boolean;
  /** Lo que va a la izquierda del pie (fotos, ayuda). */
  pie?: React.ReactNode;
  etiqueta: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [previa, setPrevia] = useState(false);

  function seleccionar(desde: number, hasta: number) {
    requestAnimationFrame(() => {
      ref.current?.focus();
      ref.current?.setSelectionRange(desde, hasta);
    });
  }

  function envolver(antes: string, despues: string, relleno: string) {
    const ta = ref.current;
    if (!ta) return;
    const { selectionStart: a, selectionEnd: b } = ta;
    const sel = valor.slice(a, b) || relleno;
    onCambio(valor.slice(0, a) + antes + sel + despues + valor.slice(b));
    seleccionar(a + antes.length, a + antes.length + sel.length);
  }

  function prefijar(marca: string, relleno: string) {
    const ta = ref.current;
    if (!ta) return;
    const { selectionStart: a, selectionEnd: b } = ta;
    const inicio = valor.lastIndexOf("\n", a - 1) + 1;
    const bloque = valor.slice(inicio, b) || relleno;
    const nuevo = bloque.split("\n").map(l => (l.startsWith(marca) ? l : marca + l)).join("\n");
    // Una lista o cita necesita una línea en blanco antes para que Markdown la tome
    const separador = inicio > 0 && valor[inicio - 2] !== "\n" && valor.slice(0, inicio).trim() ? "\n" : "";
    onCambio(valor.slice(0, inicio) + separador + nuevo + valor.slice(b));
    const desde = inicio + separador.length;
    seleccionar(desde, desde + nuevo.length);
  }

  function enlace() {
    const ta = ref.current;
    if (!ta) return;
    const { selectionStart: a, selectionEnd: b } = ta;
    const texto = valor.slice(a, b) || "texto del enlace";
    const insertado = `[${texto}](https://)`;
    onCambio(valor.slice(0, a) + insertado + valor.slice(b));
    const url = a + texto.length + 3;
    seleccionar(url, url + 8);
  }

  function teclas(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    const mod = e.metaKey || e.ctrlKey;
    if (!mod) return;
    if (e.key === "Enter") {
      e.preventDefault();
      e.currentTarget.form?.requestSubmit();
    } else if (e.key.toLowerCase() === "b") {
      e.preventDefault();
      envolver("**", "**", "negrita");
    } else if (e.key.toLowerCase() === "i") {
      e.preventDefault();
      envolver("_", "_", "cursiva");
    }
  }

  const cerca = valor.length > max * 0.9;

  return (
    <div className="fo-editor">
      <div className="fo-editor-barra" role="toolbar" aria-label="Formato del texto">
        {!previa && (
          <>
            <button type="button" onClick={() => envolver("**", "**", "negrita")} title="Negrita (Ctrl+B)" aria-label="Negrita"><Bold size={16} strokeWidth={2} /></button>
            <button type="button" onClick={() => envolver("_", "_", "cursiva")} title="Cursiva (Ctrl+I)" aria-label="Cursiva"><Italic size={16} strokeWidth={2} /></button>
            <button type="button" onClick={() => prefijar("- ", "elemento")} title="Lista" aria-label="Lista"><List size={16} strokeWidth={2} /></button>
            <button type="button" onClick={() => prefijar("> ", "cita")} title="Cita" aria-label="Cita"><Quote size={16} strokeWidth={2} /></button>
            <button type="button" onClick={enlace} title="Enlace" aria-label="Enlace"><Link2 size={16} strokeWidth={2} /></button>
          </>
        )}
        <div className="fo-editor-tabs">
          <button type="button" aria-pressed={!previa} onClick={() => setPrevia(false)}>Escribir</button>
          <button type="button" aria-pressed={previa} onClick={() => setPrevia(true)}>Vista previa</button>
        </div>
      </div>

      <textarea
        ref={ref}
        name={nombre}
        value={valor}
        onChange={e => onCambio(e.target.value)}
        onKeyDown={teclas}
        placeholder={placeholder}
        rows={filas}
        maxLength={max}
        autoFocus={autoFocus}
        aria-label={etiqueta}
        hidden={previa}
      />
      {previa && (
        valor.trim()
          ? <div className="fo-editor-previa fo-texto" dangerouslySetInnerHTML={{ __html: renderForo(valor) }} />
          : <div className="fo-editor-previa fo-editor-previa-vacia">Todavía no escribiste nada.</div>
      )}

      <div className="fo-editor-pie">
        {pie}
        <span className="fo-editor-cuenta" data-cerca={cerca}>
          {cerca ? `${valor.length.toLocaleString("es-AR")} / ${max.toLocaleString("es-AR")}` : ""}
        </span>
      </div>
    </div>
  );
}

// ── Fotos ────────────────────────────────────────────────────

type Nueva = { file: File; url: string };

/**
 * Estado de las fotos de un formulario: las que ya estaban (al editar) y
 * las nuevas, comprimidas en el navegador antes de subir (una foto de
 * celular de 8 MB queda en ~300 KB).
 */
export function useFotos(previas: string[] = [], max = 4) {
  const [conservar, setConservar] = useState<string[]>(previas);
  const [nuevas, setNuevas] = useState<Nueva[]>([]);
  const [preparando, setPreparando] = useState(false);

  // Liberar las vistas previas al desmontar
  const vivas = useRef<Nueva[]>([]);
  vivas.current = nuevas;
  useEffect(() => () => vivas.current.forEach(n => URL.revokeObjectURL(n.url)), []);

  const total = conservar.length + nuevas.length;

  async function agregar(lista: FileList | null) {
    if (!lista?.length) return;
    const lugar = max - total;
    const elegidas = Array.from(lista).filter(f => f.type.startsWith("image/")).slice(0, Math.max(0, lugar));
    if (!elegidas.length) return;
    setPreparando(true);
    const listas: Nueva[] = [];
    for (const f of elegidas) {
      const file = await compressImage(f);
      listas.push({ file, url: URL.createObjectURL(file) });
    }
    setNuevas(prev => [...prev, ...listas].slice(0, max - conservar.length));
    setPreparando(false);
  }

  function quitarNueva(i: number) {
    setNuevas(prev => {
      URL.revokeObjectURL(prev[i]?.url);
      return prev.filter((_, j) => j !== i);
    });
  }

  function quitarPrevia(url: string) {
    setConservar(prev => prev.filter(u => u !== url));
  }

  function vaciar() {
    nuevas.forEach(n => URL.revokeObjectURL(n.url));
    setNuevas([]);
  }

  function adjuntar(fd: FormData) {
    fd.delete("fotos");
    fd.delete("conservar");
    conservar.forEach(u => fd.append("conservar", u));
    nuevas.forEach(n => fd.append("fotos", n.file));
  }

  return { conservar, nuevas, total, max, preparando, agregar, quitarNueva, quitarPrevia, vaciar, adjuntar };
}

export function SelectorFotos({ fotos }: { fotos: ReturnType<typeof useFotos> }) {
  return (
    <div className="fo-selfotos">
      {fotos.conservar.map(url => (
        <span key={url} className="fo-selfoto">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="" />
          <button type="button" onClick={() => fotos.quitarPrevia(url)} aria-label="Quitar la foto"><X size={12} strokeWidth={2.4} /></button>
        </span>
      ))}
      {fotos.nuevas.map((n, i) => (
        <span key={n.url} className="fo-selfoto">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={n.url} alt="" />
          <button type="button" onClick={() => fotos.quitarNueva(i)} aria-label="Quitar la foto"><X size={12} strokeWidth={2.4} /></button>
        </span>
      ))}
      {fotos.total < fotos.max && (
        <label className="fo-selfotos-agregar">
          <ImagePlus size={16} strokeWidth={1.7} />
          {fotos.preparando ? "Preparando…" : fotos.total ? "Otra foto" : `Fotos (hasta ${fotos.max})`}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            onChange={e => {
              fotos.agregar(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
      )}
    </div>
  );
}

// ── Borradores ───────────────────────────────────────────────

/**
 * Guarda lo que se está escribiendo en este navegador, para no perderlo
 * si se cierra la pestaña o hay que ir a confirmar el email. Si el
 * almacenamiento no está disponible, simplemente no guarda.
 */
export function useBorrador<T extends object>(clave: string | null, valor: T, restaurar: (v: T) => void) {
  const listo = useRef(false);

  useEffect(() => {
    if (!clave) return;
    try {
      const guardado = localStorage.getItem(clave);
      if (guardado) restaurar(JSON.parse(guardado) as T);
    } catch {}
    listo.current = true;
    // Solo al montar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave]);

  useEffect(() => {
    if (!clave || !listo.current) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(clave, JSON.stringify(valor));
      } catch {}
    }, 400);
    return () => clearTimeout(t);
  }, [clave, valor]);

  return () => {
    if (!clave) return;
    try {
      localStorage.removeItem(clave);
    } catch {}
  };
}
