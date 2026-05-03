"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui";

interface Tag { id: string; tag: string; color: string | null; }
interface Note { id: string; body: string; pinned: number; created_at: number; created_by: string | null; }

const SUGGESTED_TAGS = [
  { tag: "VIP", color: "#facc15" },
  { tag: "Hot lead", color: "#ef4444" },
  { tag: "Tire-kicker", color: "#6b7280" },
  { tag: "Referral", color: "#10b981" },
  { tag: "Press", color: "#3b82f6" },
  { tag: "Returning", color: "#a855f7" },
];

export function CustomerTagsAndNotes({
  leadId, initialTags, initialNotes,
}: { leadId: string; initialTags: Tag[]; initialNotes: Note[] }) {
  const router = useRouter();
  const toast = useToast();
  const [tags, setTags] = useState<Tag[]>(initialTags);
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [tagInput, setTagInput] = useState("");
  const [noteInput, setNoteInput] = useState("");
  const [pinNew, setPinNew] = useState(false);
  const [busy, setBusy] = useState(false);

  async function addTag(tag: string, color?: string) {
    if (!tag.trim()) return;
    setBusy(true);
    const r = await fetch(`/api/admin/leads/${leadId}/tags`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ tag, color }),
    });
    setBusy(false);
    if (!r.ok) { toast.error("Tag failed" ); return; }
    const j = (await r.json()) as { ok: boolean; tag?: Tag };
    if (j.tag) {
      setTags((prev) => prev.find((t) => t.tag === j.tag!.tag) ? prev : [...prev, j.tag!]);
      setTagInput("");
      toast.success("Tag added" );
    }
    router.refresh();
  }

  async function removeTag(tag: string) {
    setBusy(true);
    const r = await fetch(`/api/admin/leads/${leadId}/tags`, {
      method: "DELETE", headers: { "content-type": "application/json" },
      body: JSON.stringify({ tag }),
    });
    setBusy(false);
    if (!r.ok) { toast.error("Remove failed" ); return; }
    setTags((prev) => prev.filter((t) => t.tag !== tag));
    router.refresh();
  }

  async function addNote() {
    if (!noteInput.trim()) return;
    setBusy(true);
    const r = await fetch(`/api/admin/leads/${leadId}/notes`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ body: noteInput, pinned: pinNew }),
    });
    setBusy(false);
    if (!r.ok) { toast.error("Note failed" ); return; }
    const j = (await r.json()) as { ok: boolean; note?: Note };
    if (j.note) {
      setNotes((prev) => [j.note!, ...prev].sort((a, b) => b.pinned - a.pinned || b.created_at - a.created_at));
      setNoteInput("");
      setPinNew(false);
      toast.success("Note added" );
    }
    router.refresh();
  }

  async function deleteNote(id: string) {
    if (!confirm("Delete this note?")) return;
    setBusy(true);
    const r = await fetch(`/api/admin/leads/${leadId}/notes`, {
      method: "DELETE", headers: { "content-type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setBusy(false);
    if (!r.ok) return;
    setNotes((prev) => prev.filter((n) => n.id !== id));
    router.refresh();
  }

  async function togglePin(id: string) {
    setBusy(true);
    const r = await fetch(`/api/admin/leads/${leadId}/notes`, {
      method: "PATCH", headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, action: "toggle_pin" }),
    });
    setBusy(false);
    if (!r.ok) return;
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, pinned: n.pinned ? 0 : 1 } : n))
        .sort((a, b) => b.pinned - a.pinned || b.created_at - a.created_at)
    );
    router.refresh();
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
      <section>
        <h3 style={{ margin: "0 0 0.4rem" }}>Tags</h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "0.5rem" }}>
          {tags.length === 0 ? <span className="muted">No tags yet.</span> : null}
          {tags.map((t) => (
            <span key={t.id} style={{
              background: t.color ?? "var(--color-primary, #d04a1a)", color: "white",
              padding: "0.2rem 0.6rem", borderRadius: "999px", fontSize: "0.85em",
              display: "inline-flex", alignItems: "center", gap: "0.3rem",
            }}>
              {t.tag}
              <button type="button" onClick={() => removeTag(t.tag)} disabled={busy}
                aria-label={`Remove ${t.tag}`}
                style={{ background: "transparent", border: "none", color: "white", cursor: "pointer", fontSize: "1em", lineHeight: 1, padding: 0 }}>
                ×
              </button>
            </span>
          ))}
        </div>
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "0.4rem" }}>
          {SUGGESTED_TAGS.filter((s) => !tags.find((t) => t.tag === s.tag)).map((s) => (
            <button key={s.tag} type="button" onClick={() => addTag(s.tag, s.color)}
              disabled={busy} className="btn btn-sm btn-secondary" style={{ borderColor: s.color }}>
              + {s.tag}
            </button>
          ))}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); addTag(tagInput); }} style={{ display: "flex", gap: "0.4rem" }}>
          <input type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)}
            placeholder="Custom tag…" maxLength={60} style={{ flex: 1 }} />
          <button type="submit" className="btn btn-sm btn-primary" disabled={busy || !tagInput.trim()}>Add</button>
        </form>
      </section>

      <section>
        <h3 style={{ margin: "0 0 0.4rem" }}>Internal notes</h3>
        <textarea rows={3} value={noteInput} onChange={(e) => setNoteInput(e.target.value)}
          placeholder="What did you learn from this lead? Visible only to staff."
          style={{ width: "100%", marginBottom: "0.4rem" }} maxLength={4000} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
          <label style={{ fontSize: "0.85em", display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <input type="checkbox" checked={pinNew} onChange={(e) => setPinNew(e.target.checked)} /> Pin this note
          </label>
          <button type="button" onClick={addNote} disabled={busy || !noteInput.trim()} className="btn btn-sm btn-primary">
            Save note
          </button>
        </div>
        {notes.length === 0 ? (
          <p className="muted" style={{ fontSize: "0.9em" }}>No notes yet.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {notes.map((n) => (
              <li key={n.id} style={{
                background: n.pinned ? "rgba(208,74,26,0.08)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${n.pinned ? "var(--color-primary)" : "var(--color-border, rgba(255,255,255,0.1))"}`,
                borderRadius: "0.5rem", padding: "0.6rem 0.8rem", fontSize: "0.92em",
              }}>
                <div style={{ whiteSpace: "pre-wrap" }}>{n.body}</div>
                <div className="muted" style={{ fontSize: "0.78em", marginTop: "0.3rem", display: "flex", gap: "0.6rem", alignItems: "center" }}>
                  <span>{new Date(n.created_at).toLocaleString()}</span>
                  {n.created_by ? <span>· {n.created_by}</span> : null}
                  <button type="button" onClick={() => togglePin(n.id)} disabled={busy}
                    style={{ marginLeft: "auto", background: "transparent", border: "none", color: "inherit", cursor: "pointer", fontSize: "inherit", textDecoration: "underline" }}>
                    {n.pinned ? "Unpin" : "Pin"}
                  </button>
                  <button type="button" onClick={() => deleteNote(n.id)} disabled={busy}
                    style={{ background: "transparent", border: "none", color: "inherit", cursor: "pointer", fontSize: "inherit", textDecoration: "underline" }}>
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
