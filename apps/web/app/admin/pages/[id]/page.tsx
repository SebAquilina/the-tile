import { notFound } from "next/navigation";
import { getPage } from "@/lib/pages/store";
import { PageEditor } from "@/components/admin/PageEditor";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export default async function PageDetail({
  params,
}: {
  params: { id: string };
}) {
  // Defensive — Next routes /admin/pages/new to ./new/page.tsx (more
  // specific), so this branch should never fire. Kept for safety.
  if (params.id === "new") return null;

  const p = await getPage(params.id);
  if (!p) notFound();

  return <PageEditor initial={p} />;
}
