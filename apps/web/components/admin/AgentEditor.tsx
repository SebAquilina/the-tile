"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input, Textarea, Button, useToast } from "@/components/ui";
import { useUnsavedChanges, useCmdS } from "@/lib/use-unsaved-changes";
import { StickySaveBar } from "@/app/admin/_components/StickySaveBar";

type AgentRow = {
  persona_name: string;
  voice: string;
  rules_json: string[];
  fallback_contact?: string;
  hand_off_phone?: string;
  hand_off_email?: string;
  custom_kb_md?: string;
  version: number;
};

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-md border border-line bg-surface p-space-5 md:p-space-6">
      <header className="mb-space-5">
        <h2 className="font-display text-2xl text-ink">{title}</h2>
        {description ? (
          <p className="mt-space-1 text-sm text-ink-muted">{description}</p>
        ) : null}
      </header>
      {children}
    </section>
  );
}

const KB_MAX = 50_000;

export function AgentEditor({ initial }: { initial: AgentRow }) {
  const router = useRouter();
  const [a, setA] = useState<AgentRow>(initial);
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const { dirty, markSaved } = useUnsavedChanges(initial, a);

  function set<K extends keyof AgentRow>(k: K, v: AgentRow[K]) {
    setA((prev) => ({ ...prev, [k]: v }));
  }
  function setRule(i: number, v: string) {
    setA((p) => ({ ...p, rules_json: p.rules_json.map((r, j) => (j === i ? v : r)) }));
  }
  function addRule() {
    setA((p) => ({ ...p, rules_json: [...p.rules_json, ""] }));
  }
  function delRule(i: number) {
    setA((p) => ({ ...p, rules_json: p.rules_json.filter((_, j) => j !== i) }));
  }
  function moveRule(from: number, to: number) {
    setA((p) => {
      const next = p.rules_json.slice();
      const [r] = next.splice(from, 1);
      next.splice(to, 0, r);
      return { ...p, rules_json: next };
    });
  }

  async function save() {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/agent", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          persona_name: a.persona_name,
          voice: a.voice,
          rules_json: a.rules_json.filter((r) => r.trim()),
          fallback_contact: a.fallback_contact || undefined,
          hand_off_phone: a.hand_off_phone || undefined,
          hand_off_email: a.hand_off_email || undefined,
          custom_kb_md: a.custom_kb_md || undefined,
        }),
      });
      if (res.ok) {
        toast.success("Agent settings saved");
        markSaved(a);
        router.refresh();
      } else {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(`Save failed: ${j.error || res.status}`);
      }
    } finally {
      setBusy(false);
    }
  }

  useCmdS(() => {
    if (dirty && !busy) save();
  });

  const kbLen = (a.custom_kb_md ?? "").length;

  return (
    <>
      <div className="space-y-space-6 pb-space-12">
        <Section
          title="Identity"
          description="The persona name customers see and the voice the concierge speaks in."
        >
          <div className="grid grid-cols-1 gap-space-5">
            <Input
              label="Persona name (what the customer sees)"
              value={a.persona_name}
              onChange={(e) => set("persona_name", e.target.value)}
              maxLength={80}
            />
            <Textarea
              label="Voice"
              helpText="Tone, register, what to lean into. Becomes the heart of the system prompt."
              value={a.voice}
              onChange={(e) => set("voice", e.target.value)}
              rows={5}
              maxLength={2000}
            />
          </div>
        </Section>

        <Section
          title="Rules"
          description="Hard constraints. The agent treats each as non-negotiable."
        >
          <ul className="flex flex-col gap-space-3">
            {a.rules_json.map((r, i) => (
              <li key={i} className="flex items-start gap-space-2">
                <div className="flex flex-col gap-space-1 pt-space-2">
                  <button
                    type="button"
                    aria-label="Move up"
                    onClick={() => i > 0 && moveRule(i, i - 1)}
                    disabled={i === 0}
                    className="text-sm text-ink-muted hover:text-ink disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    aria-label="Move down"
                    onClick={() => i < a.rules_json.length - 1 && moveRule(i, i + 1)}
                    disabled={i === a.rules_json.length - 1}
                    className="text-sm text-ink-muted hover:text-ink disabled:opacity-30"
                  >
                    ↓
                  </button>
                </div>
                <Input
                  containerClassName="flex-1"
                  value={r}
                  onChange={(e) => setRule(i, e.target.value)}
                  placeholder="One rule per line"
                  maxLength={500}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => delRule(i)}
                  aria-label="Delete rule"
                >
                  ×
                </Button>
              </li>
            ))}
          </ul>
          <div className="mt-space-4">
            <Button variant="secondary" size="sm" onClick={addRule}>
              + Add rule
            </Button>
          </div>
        </Section>

        <Section
          title="Hand-off"
          description="Where the agent points the visitor when they want a human."
        >
          <div className="grid grid-cols-1 gap-space-5 md:grid-cols-3">
            <Input
              label="Fallback URL"
              placeholder="/contact"
              value={a.fallback_contact ?? ""}
              onChange={(e) => set("fallback_contact", e.target.value)}
              maxLength={500}
            />
            <Input
              label="Phone"
              placeholder="+356 ..."
              value={a.hand_off_phone ?? ""}
              onChange={(e) => set("hand_off_phone", e.target.value)}
              maxLength={40}
            />
            <Input
              label="Email"
              type="email"
              placeholder="info@..."
              value={a.hand_off_email ?? ""}
              onChange={(e) => set("hand_off_email", e.target.value)}
              maxLength={200}
            />
          </div>
        </Section>

        <Section
          title="Custom knowledge"
          description="Anything the agent should know that isn't in the product catalogue. Markdown supported."
        >
          <Textarea
            value={a.custom_kb_md ?? ""}
            onChange={(e) => set("custom_kb_md", e.target.value)}
            rows={12}
            maxLength={KB_MAX}
            placeholder="# Hours&#10;Mon-Fri 09:00-18:00, Sat 09:00-13:00&#10;&#10;# Delivery&#10;..."
          />
          <p className="mt-space-2 text-right text-xs text-ink-subtle">
            {kbLen.toLocaleString()} / {KB_MAX.toLocaleString()} characters
          </p>
        </Section>
      </div>

      <StickySaveBar dirty={dirty} saving={busy} onSave={save} />
    </>
  );
}
