"use client";

import { useState, useRef, useTransition } from "react";
import { marked } from "marked";
import { Plus, Save, Check, Trash2, Edit2, ArrowLeft, Image as ImageIcon, Eye, Loader2, ExternalLink } from "lucide-react";
import { savePost, deletePost, uploadBlogImage, type PostInput } from "@/lib/actions/blog";
import { CATEGORIAS_BLOG, type Post } from "@/lib/blog/types";

const inp: React.CSSProperties = {
  width: "100%", border: "1px solid var(--line-200)", borderRadius: "var(--radius-sm)",
  padding: "10px 12px", fontSize: 14, fontFamily: "var(--font-sans)", outline: "none", background: "#fff",
};
const label: React.CSSProperties = {
  display: "block", fontFamily: "var(--font-sans)", fontSize: 12.5, fontWeight: 600, color: "var(--ink-700)", marginBottom: 5,
};
const card: React.CSSProperties = {
  background: "#fff", border: "1px solid var(--line-200)", borderRadius: "var(--radius-lg)", padding: 20, marginBottom: 16,
};

function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 80);
}

const fmtDate = (iso: string | null) => iso ? new Date(iso).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" }) : "—";

export default function BlogAdmin({ initialPosts }: { initialPosts: Post[] }) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [editing, setEditing] = useState<Post | "nuevo" | null>(null);

  if (editing) {
    return <PostEditor
      post={editing === "nuevo" ? null : editing}
      onClose={() => setEditing(null)}
      onSaved={(p) => {
        setPosts(prev => {
          const i = prev.findIndex(x => x.id === p.id);
          if (i >= 0) { const next = [...prev]; next[i] = p; return next; }
          return [p, ...prev];
        });
        setEditing(null);
      }}
      onDeleted={(id) => { setPosts(prev => prev.filter(p => p.id !== id)); setEditing(null); }}
    />;
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--ink-500)", margin: 0 }}>
          {posts.length} nota{posts.length !== 1 ? "s" : ""}
        </p>
        <button onClick={() => setEditing("nuevo")} style={{
          display: "inline-flex", alignItems: "center", gap: 7, fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 13.5,
          padding: "10px 18px", borderRadius: "var(--radius-sm)", cursor: "pointer", background: "var(--navy-800)", color: "#fff", border: "none",
        }}>
          <Plus size={15} /> Nueva nota
        </button>
      </div>

      {posts.length === 0 ? (
        <div style={{ ...card, textAlign: "center", color: "var(--ink-500)" }}>Todavía no hay notas. Creá la primera.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {posts.map(p => (
            <div key={p.id} style={{ ...card, marginBottom: 0, display: "flex", alignItems: "center", gap: 12, padding: "14px 18px" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 14.5, color: "var(--ink-900)" }}>{p.titulo}</span>
                  <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 999,
                    background: p.status === "publicado" ? "#F0FDF4" : "#F1F5F9", color: p.status === "publicado" ? "#15803D" : "#475569" }}>
                    {p.status === "publicado" ? "Publicada" : "Borrador"}
                  </span>
                </div>
                <p style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--ink-500)", margin: "2px 0 0" }}>
                  {p.categoria || "Sin categoría"} · {fmtDate(p.published_at || p.updated_at)} · /{p.slug}
                </p>
              </div>
              {p.status === "publicado" && (
                <a href={`/blog/${p.slug}`} target="_blank" rel="noopener noreferrer" title="Ver la nota" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "var(--font-sans)", fontSize: 12.5, fontWeight: 600, padding: "7px 12px", borderRadius: "var(--radius-sm)", cursor: "pointer", background: "#fff", color: "var(--ink-600)", border: "1px solid var(--line-200)", textDecoration: "none" }}>
                  <ExternalLink size={13} /> Ver
                </a>
              )}
              <button onClick={() => setEditing(p)} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "var(--font-sans)", fontSize: 12.5, fontWeight: 600, padding: "7px 12px", borderRadius: "var(--radius-sm)", cursor: "pointer", background: "var(--navy-50)", color: "var(--navy-800)", border: "1px solid var(--navy-100)" }}>
                <Edit2 size={13} /> Editar
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PostEditor({ post, onClose, onSaved, onDeleted }: {
  post: Post | null;
  onClose: () => void;
  onSaved: (p: Post) => void;
  onDeleted: (id: string) => void;
}) {
  const [form, setForm] = useState({
    titulo: post?.titulo || "",
    slug: post?.slug || "",
    categoria: post?.categoria || CATEGORIAS_BLOG[0],
    resumen: post?.resumen || "",
    contenido: post?.contenido || "",
    cover: post?.cover || "",
    meta_title: post?.meta_title || "",
    meta_description: post?.meta_description || "",
    status: post?.status || "borrador" as "borrador" | "publicado",
    slugTouched: !!post,
  });
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const inlineInputRef = useRef<HTMLInputElement>(null);

  function up<K extends keyof typeof form>(k: K, v: (typeof form)[K]) { setForm(f => ({ ...f, [k]: v })); }

  function onTituloChange(v: string) {
    setForm(f => ({ ...f, titulo: v, slug: f.slugTouched ? f.slug : slugify(v) }));
  }

  // Comprime y redimensiona en el cliente → payload liviano y subida rápida/confiable
  function compressImage(file: File, maxW = 1600, quality = 0.82): Promise<{ dataUrl: string; filename: string }> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new window.Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        const scale = Math.min(1, maxW / img.width);
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("No se pudo procesar la imagen."));
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        const base = file.name.replace(/\.[^.]+$/, "") || "imagen";
        resolve({ dataUrl, filename: `${base}.jpg` });
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Archivo de imagen inválido.")); };
      img.src = url;
    });
  }

  async function handleCover(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true); setError(null);
    try {
      const { dataUrl, filename } = await compressImage(file);
      const r = await uploadBlogImage(dataUrl, filename);
      if (r.ok && r.url) up("cover", r.url);
      else setError(r.error || "Error subiendo la portada.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo subir la portada.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleInline(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true); setError(null);
    try {
      const { dataUrl, filename } = await compressImage(file);
      const r = await uploadBlogImage(dataUrl, filename);
      if (r.ok && r.url) {
        const md = `\n\n![${filename.replace(/\.[^.]+$/, "")}](${r.url})\n\n`;
        const ta = contentRef.current;
        const pos = ta ? ta.selectionStart : form.contenido.length;
        up("contenido", form.contenido.slice(0, pos) + md + form.contenido.slice(pos));
      } else setError(r.error || "Error subiendo la imagen.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo subir la imagen.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function save(status?: "borrador" | "publicado") {
    setError(null);
    const payload: PostInput = {
      id: post?.id,
      slug: form.slug || slugify(form.titulo),
      titulo: form.titulo,
      resumen: form.resumen,
      contenido: form.contenido,
      cover: form.cover || null,
      categoria: form.categoria,
      status: status || form.status,
      meta_title: form.meta_title,
      meta_description: form.meta_description,
    };
    startTransition(async () => {
      const r = await savePost(payload);
      if (!r.ok || !r.id) { setError(r.error || "No se pudo guardar."); return; }
      setSaved(true);
      onSaved({
        ...(post || {}),
        id: r.id,
        ...payload,
        autor: post?.autor || "Eugenio Nielsen",
        published_at: payload.status === "publicado" ? (post?.published_at || new Date().toISOString()) : post?.published_at || null,
        created_at: post?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Post);
    });
  }

  function handleDelete() {
    if (!post) return;
    if (!confirm("¿Eliminar esta nota? No se puede deshacer.")) return;
    startTransition(async () => {
      const r = await deletePost(post.id);
      if (r.ok) onDeleted(post.id); else setError(r.error || "No se pudo eliminar.");
    });
  }

  return (
    <div>
      <button onClick={onClose} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--ink-500)", background: "none", border: "none", cursor: "pointer", marginBottom: 14, padding: 0 }}>
        <ArrowLeft size={15} /> Volver a las notas
      </button>

      <div style={card}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }} className="est-grid2">
          <div>
            <label style={label}>Título *</label>
            <input style={inp} value={form.titulo} onChange={e => onTituloChange(e.target.value)} placeholder="Cómo preparar tu depto para vender" />
          </div>
          <div>
            <label style={label}>Slug (URL)</label>
            <input style={inp} value={form.slug} onChange={e => setForm(f => ({ ...f, slug: slugify(e.target.value), slugTouched: true }))} placeholder="como-preparar-tu-depto" />
          </div>
          <div>
            <label style={label}>Categoría</label>
            <select style={inp} value={form.categoria} onChange={e => up("categoria", e.target.value)}>
              {CATEGORIAS_BLOG.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={label}>Portada</label>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button onClick={() => coverInputRef.current?.click()} disabled={uploading} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 600, padding: "9px 14px", borderRadius: "var(--radius-sm)", cursor: "pointer", background: "var(--navy-50)", color: "var(--navy-800)", border: "1px solid var(--navy-100)" }}>
                <ImageIcon size={14} /> {form.cover ? "Cambiar" : "Subir"}
              </button>
              {form.cover && <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "#15803D" }}>✓ cargada</span>}
              <input ref={coverInputRef} type="file" accept="image/*" hidden onChange={handleCover} />
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={label}>Resumen (aparece en la card y como descripción)</label>
          <textarea style={{ ...inp, resize: "vertical", minHeight: 60 }} value={form.resumen} onChange={e => up("resumen", e.target.value)} maxLength={200} placeholder="Una o dos frases que resuman la nota." />
        </div>

        {/* Contenido */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <label style={{ ...label, marginBottom: 0 }}>Contenido (Markdown)</label>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => inlineInputRef.current?.click()} disabled={uploading} style={miniBtn}>
              {uploading ? <Loader2 size={13} className="spin" /> : <ImageIcon size={13} />} Insertar imagen
            </button>
            <button onClick={() => setPreview(p => !p)} style={{ ...miniBtn, background: preview ? "var(--navy-800)" : "var(--navy-50)", color: preview ? "#fff" : "var(--navy-800)" }}>
              <Eye size={13} /> {preview ? "Editar" : "Vista previa"}
            </button>
            <input ref={inlineInputRef} type="file" accept="image/*" hidden onChange={handleInline} />
          </div>
        </div>
        {preview ? (
          <div className="blog-prose" style={{ border: "1px solid var(--line-200)", borderRadius: "var(--radius-sm)", padding: 18, minHeight: 240, background: "#fff" }}
            dangerouslySetInnerHTML={{ __html: marked.parse(form.contenido || "_Nada para previsualizar._", { async: false }) as string }} />
        ) : (
          <textarea ref={contentRef} style={{ ...inp, resize: "vertical", minHeight: 320, fontFamily: "ui-monospace, monospace", fontSize: 13.5, lineHeight: 1.6 }}
            value={form.contenido} onChange={e => up("contenido", e.target.value)}
            placeholder={"## Subtítulo\n\nEscribí en **Markdown**. Listas con -, links [texto](url), etc."} />
        )}

        {/* SEO */}
        <details style={{ marginTop: 16 }}>
          <summary style={{ fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 600, color: "var(--navy-700)", cursor: "pointer" }}>Opciones SEO (opcional)</summary>
          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={label}>Meta title <span style={{ color: "var(--ink-400)", fontWeight: 400 }}>(si vacío usa el título)</span></label>
              <input style={inp} value={form.meta_title} onChange={e => up("meta_title", e.target.value)} maxLength={65} />
            </div>
            <div>
              <label style={label}>Meta description <span style={{ color: "var(--ink-400)", fontWeight: 400 }}>(si vacío usa el resumen)</span></label>
              <textarea style={{ ...inp, resize: "vertical", minHeight: 50 }} value={form.meta_description} onChange={e => up("meta_description", e.target.value)} maxLength={160} />
            </div>
          </div>
        </details>
      </div>

      {error && <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "#DC2626", background: "#FEF2F2", borderRadius: 8, padding: "10px 14px", marginBottom: 12 }}>{error}</p>}

      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <button onClick={() => save("publicado")} disabled={isPending} style={{ display: "inline-flex", alignItems: "center", gap: 8, fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 14, padding: "12px 24px", borderRadius: "var(--radius-sm)", cursor: "pointer", background: saved ? "#15803D" : "var(--navy-800)", color: "#fff", border: "none" }}>
          {saved ? <Check size={16} /> : <Save size={15} />} {isPending ? "Guardando…" : "Publicar"}
        </button>
        <button onClick={() => save("borrador")} disabled={isPending} style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 14, padding: "12px 20px", borderRadius: "var(--radius-sm)", cursor: "pointer", background: "var(--line-100)", color: "var(--ink-700)", border: "1px solid var(--line-200)" }}>
          Guardar borrador
        </button>
        {post && (
          <button onClick={handleDelete} disabled={isPending} style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 600, padding: "10px 16px", borderRadius: "var(--radius-sm)", cursor: "pointer", background: "#fff", color: "#DC2626", border: "1px solid #FECACA" }}>
            <Trash2 size={14} /> Eliminar
          </button>
        )}
      </div>
    </div>
  );
}

const miniBtn: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "var(--font-sans)", fontSize: 12.5, fontWeight: 600,
  padding: "7px 12px", borderRadius: "var(--radius-sm)", cursor: "pointer", background: "var(--navy-50)", color: "var(--navy-800)", border: "1px solid var(--navy-100)",
};
