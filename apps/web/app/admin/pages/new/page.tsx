import { NewPageForm } from "@/components/admin/NewPageForm";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export default function NewPagePage() {
  return (
    <>
      <header className="admin-header">
        <h1>New page</h1>
      </header>
      <NewPageForm />
    </>
  );
}
