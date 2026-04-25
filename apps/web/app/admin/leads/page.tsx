import { getAllLeads } from "@/lib/admin-store";
import { LeadsInbox } from "./LeadsInbox";

export const runtime = 'edge';

export default function AdminLeadsPage() {
  const leads = getAllLeads();
  return <LeadsInbox leads={leads} />;
}
