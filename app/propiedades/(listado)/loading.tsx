import Navbar from "@/components/Navbar";
import { SkeletonBox, SkeletonPropertyGrid } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)" }}>
      <Navbar />
      <main style={{ maxWidth: "var(--container)", margin: "0 auto", padding: "clamp(20px,4vw,32px) 20px clamp(40px,6vw,64px)" }}>
        <SkeletonBox height={13} width={190} style={{ marginBottom: 18 }} />
        <SkeletonBox height={34} width={320} style={{ marginBottom: 22 }} />
        <SkeletonBox height={56} radius="var(--radius-md)" style={{ marginBottom: 26 }} />
        <div style={{ display: "flex", justifyContent: "space-between", margin: "26px 0 18px" }}>
          <SkeletonBox height={14} width={170} />
          <SkeletonBox height={14} width={120} />
        </div>
        <SkeletonPropertyGrid count={6} />
      </main>
    </div>
  );
}
