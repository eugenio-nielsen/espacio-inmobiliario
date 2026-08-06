import Navbar from "@/components/Navbar";
import { SkeletonBox } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)" }}>
      <Navbar />
      <main style={{ maxWidth: "var(--container)", margin: "0 auto", padding: "clamp(20px,4vw,32px) 20px clamp(40px,6vw,64px)" }}>
        <SkeletonBox height={38} width={260} style={{ marginBottom: 12 }} />
        <SkeletonBox height={15} width={420} style={{ marginBottom: 34 }} />
        <div className="grid-properties">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} style={{ background: "#fff", border: "1px solid var(--line-200)", borderRadius: "var(--radius-lg)", overflow: "hidden", boxShadow: "var(--shadow-xs)" }}>
              <SkeletonBox height={0} width="100%" radius="0" style={{ aspectRatio: "16/9", height: "auto" }} />
              <div style={{ padding: 18 }}>
                <SkeletonBox height={16} width="90%" style={{ marginBottom: 9 }} />
                <SkeletonBox height={16} width="65%" style={{ marginBottom: 16 }} />
                <SkeletonBox height={12} width="50%" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
