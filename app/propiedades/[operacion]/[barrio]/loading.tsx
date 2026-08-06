import Navbar from "@/components/Navbar";
import { SkeletonBox, SkeletonPropertyGrid } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)" }}>
      <Navbar />
      <main style={{ maxWidth: "var(--container)", margin: "0 auto", padding: "clamp(20px,4vw,32px) 20px clamp(40px,6vw,64px)" }}>
        <SkeletonBox height={13} width={230} style={{ marginBottom: 18 }} />
        <SkeletonBox height={38} width={420} style={{ marginBottom: 24 }} />
        <SkeletonBox height={62} radius="var(--radius-md)" style={{ marginBottom: 24 }} />
        <div style={{ maxWidth: 720, marginBottom: 36 }}>
          <SkeletonBox height={14} style={{ marginBottom: 10 }} />
          <SkeletonBox height={14} style={{ marginBottom: 10 }} />
          <SkeletonBox height={14} width="70%" />
        </div>
        <SkeletonPropertyGrid count={3} />
      </main>
    </div>
  );
}
