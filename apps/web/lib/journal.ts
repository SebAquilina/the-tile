/**
 * Journal posts. Phase 0 stub — the [pages] subagent populates real posts.
 * Shape matches what app/sitemap.ts imports.
 */
export type JournalPost = {
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: string;
  author: string;
  body: string;
};

export const JOURNAL_POSTS: JournalPost[] = [];

export function getAllJournalPosts(): JournalPost[] {
  return JOURNAL_POSTS;
}

export function getJournalPostBySlug(slug: string): JournalPost | null {
  return JOURNAL_POSTS.find((p) => p.slug === slug) ?? null;
}
