"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui";

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function NewPageForm() {
  const router = useRouter();
  const toast = useToast();
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("# New page\n\nWrite content here.\n");
  const [isPolicy, setIsPolicy] = useState(false);
  const [busy, setBusy] = useState(false);

  // Auto-derive slug from title until the user types in the slug field.
  const [slugTouched, setSlugTouched] = useState(false);
  function onTitle(v: string) {
    setTitle(v);
    if (!slugTouched) {
      setSlug(
        v
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
          .slice(0, 64),
      );
    }
  }

  async function create() {
    if (!SLUG_RE.test(slug)) {
      toast.error("Slug must be lowercase, alphanumeric with internal dashes.");
      return;
    }
    if (!title.trim()) {
      toast.error("Title is required.");
      return;
    }
    setBusy(true);
    const res = await fetch(`/api/admin/pages`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        slug,
        title,
        body_md: body,
        is_policy: isPolicy,
        status: "draft",
      }),
    });
    if (res.status === 409) {
      setBusy(false);
      toast.error("That slug is already in use.");
      return;
    }
    if (!res.ok) {
      setBusy(false);
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      toast.error(`Create failed: ${j.error ?? res.status}`);
      return;
    }
    const j = (await res.json()) as { page: { id: string } };
    toast.success("Page created");
    router.push(`/admin/pages/${j.page.id}`);
  }

  return (
    <div className="form" style={{ maxWidth: 720, display: "flex", flexDirection: "column", gap: "1rem" }}>
      <label>
        Title
        <input value={title} onChange={(e) => onTitle(e.target.value)} placeholder="About the showroom" />
      </label>
      <label>
        Slug
        <input
          value={slug}
          onChange={(e) => { setSlug(e.target.value); setSlugTouched(true); }}
          placeholder="about-the-showroom"
        />
        <span className="muted" style={{ fontSize: "0.85em" }}>
          Public URL: <code>/{slug || "your-slug"}</code>
        </span>
      </label>
      <label>
        <input type="checkbox" checked={isPolicy} onChange={(e) => setIsPolicy(e.target.checked)} />
        {" "}This is a policy page (privacy / terms / cookie etc.)
      </label>
      <label>
        Body (markdown)
        <textarea rows={12} value={body} onChange={(e) => setBody(e.target.value)} />
      </label>
      <button type="button" className="btn btn-primary" disabled={busy} onClick={create}>
        {busy ? "Creating..." : "Create page (draft)"}
      </button>
      <p className="muted" style={{ fontSize: "0.85em" }}>
        Created in draft status. Open the page after create to edit and publish.
      </p>
    </div>
  );
}
