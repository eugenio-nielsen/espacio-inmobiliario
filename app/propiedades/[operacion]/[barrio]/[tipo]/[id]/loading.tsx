import Navbar from "@/components/Navbar";
import { SkeletonBox } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)" }}>
      <Navbar />
      <main style={{ maxWidth: "var(--container)", margin: "0 auto", padding: "clamp(16px,4vw,28px) 20px clamp(40px,6vw,64px)" }}>
        <SkeletonBox height={12} width={260} style={{ marginBottom: 18 }} />

        {/* Galería */}
        <SkeletonBox height={420} radius="var(--radius-lg)" style={{ marginBottom: 28 }} />

        <div className="grid-detail">
          {/* Columna izquierda */}
          <div>
            <SkeletonBox height={24} width={160} style={{ marginBottom: 14 }} />
            <SkeletonBox height={34} width="85%" style={{ marginBottom: 12 }} />
            <SkeletonBox height={15} width="55%" style={{ marginBottom: 28 }} />

            <SkeletonBox height={13} width={110} style={{ marginBottom: 14 }} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 16, marginBottom: 32 }}>
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <SkeletonBox height={38} width={38} />
                  <SkeletonBox height={14} width={110} />
                </div>
              ))}
            </div>

            <SkeletonBox height={320} radius="var(--radius-lg)" style={{ marginBottom: 32 }} />
          </div>

          {/* Sidebar */}
          <div className="detail-sidebar">
            <div style={{ background: "#fff", border: "1px solid var(--line-200)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-md)", padding: 24 }}>
              <SkeletonBox height={13} width={110} style={{ marginBottom: 10 }} />
              <SkeletonBox height={34} width={200} style={{ marginBottom: 20 }} />
              <div style={{ display: "flex", alignItems: "center", gap: 12, paddingTop: 14, borderTop: "1px solid var(--line-100)", marginBottom: 18 }}>
                <SkeletonBox height={44} width={44} radius="999px" />
                <div style={{ flex: 1 }}>
                  <SkeletonBox height={14} width="70%" style={{ marginBottom: 6 }} />
                  <SkeletonBox height={12} width="45%" />
                </div>
              </div>
              <SkeletonBox height={46} style={{ marginBottom: 10 }} />
              <SkeletonBox height={46} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
