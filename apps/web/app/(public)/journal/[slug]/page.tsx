import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { articleLd, breadcrumbLd, jsonLdToString } from "@/lib/jsonld";
import {
  estimateReadingMinutes,
  getAllJournalPosts,
  getJournalPostBySlug,
} from "@/lib/journal";

export function generateStaticParams() {
  return getAllJournalPosts().map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const post = getJournalPostBySlug(params.slug);
  if (!post) return { title: "Not found" };
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt,
      publishedTime: post.publishedAt,
    },
  };
}

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "https://www.the-tile.com";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function JournalPostPage({ params }: { params: { slug: string } }) {
  const post = getJournalPostBySlug(params.slug);
  if (!post) notFound();

  const breadcrumbs = [
    { name: "Home", url: `${SITE_URL}/` },
    { name: "Journal", url: `${SITE_URL}/journal` },
    { name: post.title, url: `${SITE_URL}/journal/${post.slug}` },
  ];

  const article = articleLd({
    slug: post.slug,
    title: post.title,
    datePublished: post.publishedAt,
    author: post.author,
    description: post.excerpt,
  });

  return (
    <article className="mx-auto max-w-content px-space-5 py-space-10 md:px-space-7">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: jsonLdToString({
            "@context": "https://schema.org",
            "@graph": [breadcrumbLd(breadcrumbs), article],
          }),
        }}
      />

      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Journal", href: "/journal" },
          { label: post.title },
        ]}
      />

      <header className="mx-auto mt-space-7 max-w-prose">
        <div className="flex flex-wrap items-baseline gap-space-3 text-xs uppercase tracking-widest text-ink-subtle">
          <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
          <span aria-hidden="true">·</span>
          <span>{estimateReadingMinutes(post.body)} min read</span>
          <span aria-hidden="true">·</span>
          <span>{post.author}</span>
        </div>
        <h1 className="mt-space-4 font-display text-4xl leading-tight text-ink md:text-5xl">
          {post.title}
        </h1>
        <p className="mt-space-5 text-lg text-ink-muted">{post.excerpt}</p>
      </header>

      <div className="journal-prose mx-auto mt-space-10 max-w-prose">
        <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{post.body}</ReactMarkdown>
      </div>

      <aside className="mx-auto mt-space-11 max-w-prose border-t border-line pt-space-7">
        <h2 className="font-display text-2xl text-ink">
          Talk to the concierge about your project
        </h2>
        <p className="mt-space-3 text-ink-muted">
          Bring the room, the light, and the timeline. We will pull two or
          three tiles that fit and lay them out.
        </p>
        <Link
          href="/contact"
          className="mt-space-5 inline-block rounded-md bg-umber px-space-5 py-space-3 text-sm font-medium text-surface hover:bg-umber-strong focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2"
        >
          Contact the showroom
        </Link>
      </aside>
    </article>
  );
}
