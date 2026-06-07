import { List } from "lucide-react";
import type { TocItem } from "@/lib/blog/markdown";

export default function TableOfContents({ items }: { items: TocItem[] }) {
  if (items.length < 2) return null;
  return (
    <nav aria-label="Índice de contenidos" style={{
      background: "var(--navy-800)", borderRadius: "var(--radius-lg)",
      padding: "20px 22px", margin: "0 0 36px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <List size={16} color="var(--gold-400)" />
        <span style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 12.5, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--gold-300)" }}>
          En esta nota
        </span>
      </div>
      <ol style={{ listStyle: "none", margin: 0, padding: 0, counterReset: "toc", display: "flex", flexDirection: "column", gap: 2 }}>
        {items.map(item => (
          <li key={item.id} style={{ paddingLeft: item.level === 3 ? 18 : 0 }}>
            <a href={`#${item.id}`} style={{
              display: "block", fontFamily: "var(--font-sans)",
              fontSize: item.level === 3 ? 13.5 : 14.5,
              fontWeight: item.level === 3 ? 400 : 600,
              color: item.level === 3 ? "rgba(255,255,255,.62)" : "rgba(255,255,255,.9)",
              textDecoration: "none", padding: "7px 0", lineHeight: 1.4,
              borderBottom: "1px solid rgba(255,255,255,.06)",
            }}>
              {item.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
