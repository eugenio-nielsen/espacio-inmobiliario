import { SkeletonBox, SkeletonPropertyCard } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div style={{ padding: "8px 0 40px" }}>
      <SkeletonBox height={30} width={280} style={{ marginBottom: 10 }} />
      <SkeletonBox height={15} width={400} style={{ marginBottom: 28 }} />

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 14, marginBottom: 28 }}>
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} style={{ background: "#fff", border: "1px solid var(--line-200)", borderRadius: "var(--radius-lg)", padding: 18 }}>
            <SkeletonBox height={12} width="60%" style={{ marginBottom: 12 }} />
            <SkeletonBox height={26} width="40%" />
          </div>
        ))}
      </div>

      <SkeletonBox height={48} radius="var(--radius-md)" style={{ marginBottom: 22 }} />

      <div className="grid-properties">
        {Array.from({ length: 3 }, (_, i) => <SkeletonPropertyCard key={i} />)}
      </div>
    </div>
  );
}
