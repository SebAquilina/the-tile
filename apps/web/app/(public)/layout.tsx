import type { ReactNode } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ToastProvider } from "@/components/ui";
import { SaveListProvider } from "@/lib/save-list";
import { AgentMount } from "@/components/agent/AgentMount";
import { getSettings } from "@/lib/settings/store";
import { getMenu } from "@/lib/navigation/store";

export const revalidate = 60;
// Per ref 22 — D1 bindings aren't available at next build time, so without
// 'force-dynamic' the layout gets baked with DEFAULTS as the menu/settings
// data (because getMenu/getSettings see db()=null and fall through). Force
// per-request rendering on the edge so D1 reads happen at request time
// when bindings are present.
export const dynamic = "force-dynamic";
export const runtime = "edge";

export default async function PublicLayout({ children }: { children: ReactNode }) {
  // Read site settings + menus from D1 so /admin/settings and
  // /admin/navigation edits actually reach the public site. Phantom-UI
  // fix per CR-B3 / CR-B4 / audit P0-F1.
  const [settings, headerMenu, footerMenu] = await Promise.all([
    getSettings().catch(() => null),
    getMenu("header").catch(() => null),
    getMenu("footer").catch(() => null),
  ]);

  return (
    <ToastProvider>
      <SaveListProvider>
        <div className="flex min-h-dvh flex-col">
          <Header settings={settings} headerMenu={headerMenu} />
          <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
            {children}
          </main>
          <Footer settings={settings} footerMenu={footerMenu} />
        </div>
        <AgentMount />
      </SaveListProvider>
    </ToastProvider>
  );
}
