import { getSettings } from "@/lib/settings/store";

import { SettingsEditor } from "@/components/admin/SettingsEditor";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export default async function SettingsAdmin() {

  const s = await getSettings();
  return (
    <>
      <header className="admin-header">
        <h1>Settings</h1>
      </header>
      <SettingsEditor initial={s} />
    </>
  );
}
