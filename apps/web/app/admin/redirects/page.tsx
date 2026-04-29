import { listRedirects } from "@/lib/redirects/store";

import { RedirectsEditor } from "@/components/admin/RedirectsEditor";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export default async function RedirectsAdmin() {

  const redirects = await listRedirects();
  return (
    <>
      <header className="admin-header">
        <h1>URL redirects</h1>
        <p className="muted">301s for old URLs. Used when migrating from Weebly / when product slugs change.</p>
      </header>
      <RedirectsEditor initial={redirects} />
    </>
  );
}
