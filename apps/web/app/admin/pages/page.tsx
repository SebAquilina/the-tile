import { listPages } from "@/lib/pages/store";
import { PagesList } from "@/components/admin/PagesList";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export default async function PagesAdmin() {
  let pages: Awaited<ReturnType<typeof listPages>> = [];
  let loadError: string | null = null;
  try {
    pages = await listPages({ status: "all" });
  } catch (e) {
    loadError = (e as Error).message;
  }

  if (loadError) {
    return (
      <div className="space-y-space-6">
        <header>
          <h1 className="font-display text-3xl text-ink">Pages</h1>
        </header>
        <p
          className="rounded-md border border-line bg-surface p-space-5 text-sm text-ink-muted"
          role="alert"
        >
          Could not load pages from D1: <code>{loadError}</code>. Apply
          the <code>pages</code> migration against the bound database.
        </p>
      </div>
    );
  }

  return <PagesList initial={pages} />;
}
