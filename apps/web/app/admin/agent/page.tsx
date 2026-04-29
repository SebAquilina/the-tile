import { getAgentSettings } from "@/lib/agent-config/store";

import { AgentEditor } from "@/components/admin/AgentEditor";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export default async function AgentAdmin() {

  const a = await getAgentSettings();
  return (
    <>
      <header className="admin-header">
        <h1>Agent</h1>
        <p className="muted">The concierge's persona, voice, and knowledge. Edits propagate at request time — no redeploy.</p>
      </header>
      <AgentEditor initial={a} />
    </>
  );
}
