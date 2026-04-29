import { getTheme } from "@/lib/theme/store";

import { ThemeEditor } from "@/components/admin/ThemeEditor";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export default async function ThemeAdmin() {

  const theme = await getTheme();
  return (
    <>
      <header className="admin-header">
        <h1>Theme</h1>
        <p className="muted">Brand colors. Changes propagate within ~60s of saving.</p>
      </header>
      <ThemeEditor initial={theme} />
    </>
  );
}
