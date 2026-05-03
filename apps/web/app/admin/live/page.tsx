import { LiveDashboard } from "@/components/admin/LiveDashboard";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export default function LivePage() {
  return (
    <>
      <header className="admin-header"><h1>Live View</h1></header>
      <p className="muted" style={{ marginTop: 0 }}>
        Real-time visitors. Updates every 3 seconds. Pins are visitors active in the last 60 seconds.
      </p>
      <LiveDashboard />
    </>
  );
}
