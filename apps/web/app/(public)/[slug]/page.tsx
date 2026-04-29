import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPageBySlug } from "@/lib/pages/store";

export const runtime = "edge";
export const revalidate = 60;
export const dynamicParams = true;

// Routes already handled by other files take precedence — Next picks the
// more-specific one. This catch-all only fires for unhandled top-level slugs.

export async function generateMetadata({
  params,
}: { params: { slug: string } }): Promise<Metadata> {
  const p = await getPageBySlug(params.slug).catch(() => null);
  if (!p || p.status !== "active") return { title: "Not found" };
  return {
    title: p.seo_title || p.title,
    description: p.seo_description ?? undefined,
    alternates: { canonical: `/${p.slug}` },
  };
}

export default async function PublicPage({
  params,
}: { params: { slug: string } }) {
  const p = await getPageBySlug(params.slug).catch(() => null);
  if (!p || p.status !== "active") notFound();

  return (
    <article className={`page page--${p.template}`}>
      <header className="page-header">
        <h1>{p.title}</h1>
      </header>
      <div
        className="page-body"
        // body_html is rendered server-side from operator-authored markdown.
        // The admin store sanitizes HTML by escaping < / > / & before
        // markdown-rendering, so this is safe.
        dangerouslySetInnerHTML={{ __html: p.body_html ?? "" }}
      />
    </article>
  );
}
