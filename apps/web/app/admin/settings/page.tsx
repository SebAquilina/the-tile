import { getSettings } from "@/lib/settings/store";
import { SettingsEditor } from "@/components/admin/SettingsEditor";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export default async function SettingsAdmin() {
  const s = await getSettings();
  return (
    <div className="space-y-space-6">
      <header className="space-y-space-2">
        <h1 className="font-display text-3xl text-ink">Settings</h1>
        <p className="max-w-prose text-sm text-ink-muted">
          Site-wide values used across the public site, the AI concierge, and
          the page metadata.
        </p>
      </header>
      <SettingsEditor initial={s} />
    </div>
  );
}
