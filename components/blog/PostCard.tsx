import Image from "next/image";
import Link from "next/link";
import { readingTime } from "@/lib/blog/markdown";
import type { Post } from "@/lib/blog/types";

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" }) : "";

export default function PostCard({ post }: { post: Post }) {
  return (
    <Link href={`/blog/${post.slug}`} className="card-lift" style={{
      display: "flex", flexDirection: "column",
      background: "#fff", border: "1px solid var(--line-200)",
      borderRadius: "var(--radius-lg)", overflow: "hidden",
      textDecoration: "none", boxShadow: "var(--shadow-xs)",
    }}>
      <div style={{ position: "relative", aspectRatio: "16/9", background: "var(--navy-50)" }}>
        {post.cover ? (
          <Image src={post.cover} alt={post.titulo} fill className="object-cover" sizes="(max-width:640px) 100vw, 380px" />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>📄</div>
        )}
      </div>
      <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", flex: 1 }}>
        {post.categoria && (
          <span className="es-eyebrow" style={{ marginBottom: 8 }}>{post.categoria}</span>
        )}
        <h3 style={{
          fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 18.5,
          color: "var(--navy-800)", margin: "0 0 8px", lineHeight: 1.25,
        }}>
          {post.titulo}
        </h3>
        {post.resumen && (
          <p style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--ink-500)", lineHeight: 1.6, margin: "0 0 14px", flex: 1 }}>
            {post.resumen}
          </p>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--ink-400)", marginTop: "auto" }}>
          <span>{fmtDate(post.published_at)}</span>
          <span style={{ width: 3, height: 3, borderRadius: 999, background: "var(--ink-300)" }} />
          <span>{readingTime(post.contenido)} min de lectura</span>
        </div>
      </div>
    </Link>
  );
}
