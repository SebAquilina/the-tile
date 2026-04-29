import Link from "next/link";
import { listPages } from "@/lib/pages/store";


export const runtime = "edge";
export const dynamic = "force-dynamic";

export default async function PagesAdmin() {

  const pages = await listPages({ status: "all" });
  return (
    <>
      <header className="admin-header">
        <h1>Pages</h1>
        <Link href="/admin/pages/new" className="btn btn-primary">New page</Link>
      </header>
      {pages.length === 0 ? (
        <div className="empty-state">
          <p>No pages yet. The about / faq / care-guide / privacy / terms pages live here.</p>
          <Link href="/admin/pages/new" className="btn btn-primary">Create first page</Link>
        </div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr><th>Title</th><th>Slug</th><th>Status</th><th>Policy?</th><th>Updated</th><th /></tr>
          </thead>
          <tbody>
            {pages.map((p) => (
              <tr key={p.id}>
                <td><Link href={`/admin/pages/${p.id}`}>{p.title}</Link></td>
                <td className="muted">/{p.slug}</td>
                <td><span className={`badge badge--${p.status}`}>{p.status}</span></td>
                <td>{p.is_policy ? "yes" : "—"}</td>
                <td className="muted">{new Date(p.updated_at).toLocaleDateString()}</td>
                <td><Link href={`/admin/pages/${p.id}`}>Edit</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
