import { getAllLeads } from "@/lib/admin-store";
import { LeadsInbox } from "./LeadsInbox";

export const runtime = 'edge';
export const dynamic = "force-dynamic";

export default async function AdminLeadsPage() {
  const leads = await getAllLeads();
  return <LeadsInbox leads={leads} />;
}
