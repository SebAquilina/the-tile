import { notFound } from "next/navigation";
import { getPage } from "@/lib/pages/store";

import { PageEditor } from "@/components/admin/PageEditor";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export default async function PageDetail({ params }: { params: { id: string } }) {

  if (params.id === "new") {
    // The /new route is rendered by the next file.
    return null;
  }
  const p = await getPage(params.id);
  if (!p) notFound();
  return (
    <>
      <header className="admin-header">
        <h1>Edit page</h1>
        <a href={`/${p.slug}`} target="_blank" rel="noreferrer" className="muted">View public →</a>
      </header>
      <PageEditor initial={p} />
    </>
  );
}
