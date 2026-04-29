import { listMenus } from "@/lib/navigation/store";

import { NavigationEditor } from "@/components/admin/NavigationEditor";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export default async function NavigationAdmin() {

  const menus = await listMenus();
  return (
    <>
      <header className="admin-header">
        <h1>Navigation</h1>
        <p className="muted">Header + footer menus. Drag to reorder. Each item: label + href.</p>
      </header>
      {menus.map((m) => (
        <section key={m.handle} style={{ marginBottom: "var(--space-8)" }}>
          <h2>{m.label}</h2>
          <NavigationEditor handle={m.handle} initialItems={m.items} />
        </section>
      ))}
    </>
  );
}
