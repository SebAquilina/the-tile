import { PageEditor } from "@/components/admin/PageEditor";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export default function NewPagePage() {
  return <PageEditor initial={null} />;
}
