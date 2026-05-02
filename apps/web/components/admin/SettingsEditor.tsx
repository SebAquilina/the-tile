"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input, Textarea, useToast } from "@/components/ui";
import { useUnsavedChanges, useCmdS } from "@/lib/use-unsaved-changes";
import { StickySaveBar } from "@/app/admin/_components/StickySaveBar";

type Settings = {
  store_name: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  hours?: string;
  currency: string;
  timezone: string;
  default_locale: string;
  robots_txt_extra?: string;
  google_analytics_id?: string;
  plausible_domain?: string;
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
      <div className="grid grid-cols-1 gap-space-5 md:grid-cols-2">{children}</div>
    </section>
  );
}

export function SettingsEditor({ initial }: { initial: Settings }) {
  const router = useRouter();
  const [s, setS] = useState<Settings>(initial);
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const { dirty, markSaved } = useUnsavedChanges(initial, s);

  function set<K extends keyof Settings>(k: K, v: Settings[K]) {
    setS((prev) => ({ ...prev, [k]: v }));
  }

  async function save() {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(s),
      });
      if (res.ok) {
        toast.success("Settings saved");
        markSaved(s);
        router.refresh();
      } else {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(`Save failed: ${j.error || res.status}`);
      }
    } catch (err) {
      toast.error(`Save failed: ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  useCmdS(() => {
    if (dirty && !busy) save();
  });

  function reset() {
    setS(initial);
  }

  return (
    <div className="max-w-content space-y-space-6">
      <Section
        title="Store info"
        description="The basics shown across the public site (header, footer, JSON-LD)."
      >
        <Input
          label="Store name"
          required
          value={s.store_name}
          onChange={(e) => set("store_name", e.target.value)}
          helpText="Shown in the header, page titles and JSON-LD."
          containerClassName="md:col-span-2"
        />
        <Input
          label="Address"
          value={s.address ?? ""}
          onChange={(e) => set("address", e.target.value)}
          placeholder="Triq Bellavista, San Gwann SGN 2690, Malta"
          helpText="Single-line address shown in the footer."
          containerClassName="md:col-span-2"
        />
      </Section>

      <Section
        title="Contact"
        description="How customers reach you. Used in the footer, on the contact page, and by the AI concierge for hand-off."
      >
        <Input
          type="email"
          label="Contact email"
          value={s.contact_email ?? ""}
          onChange={(e) => set("contact_email", e.target.value)}
          placeholder="info@the-tile.com"
        />
        <Input
          label="Contact phone"
          value={s.contact_phone ?? ""}
          onChange={(e) => set("contact_phone", e.target.value)}
          placeholder="+356 2137 1891"
        />
        <Input
          label="Opening hours"
          value={s.hours ?? ""}
          onChange={(e) => set("hours", e.target.value)}
          placeholder="Mon–Fri 09:00–18:00 · Sat 09:00–13:00"
          helpText="Free-form. Use the dot separator for clarity."
          containerClassName="md:col-span-2"
        />
      </Section>

      <Section
        title="Locale"
        description="Region and currency formatting for prices and dates."
      >
        <Input
          label="Currency"
          value={s.currency}
          onChange={(e) => set("currency", e.target.value.toUpperCase().slice(0, 3))}
          maxLength={3}
          helpText="3-letter ISO code, e.g. EUR, GBP, USD."
        />
        <Input
          label="Time zone"
          value={s.timezone}
          onChange={(e) => set("timezone", e.target.value)}
          placeholder="Europe/Malta"
          helpText="IANA time zone name."
        />
        <Input
          label="Default locale"
          value={s.default_locale}
          onChange={(e) => set("default_locale", e.target.value)}
          placeholder="en"
          helpText="BCP-47 language tag, e.g. en, en-GB, mt."
          containerClassName="md:col-span-2"
        />
      </Section>

      <Section
        title="SEO & analytics"
        description="Tracking pixels and crawler hints. Leave blank if you don't use them."
      >
        <Input
          label="Plausible domain"
          value={s.plausible_domain ?? ""}
          onChange={(e) => set("plausible_domain", e.target.value)}
          placeholder="the-tile.com"
          helpText="The domain configured in your Plausible account."
        />
        <Input
          label="Google Analytics ID"
          value={s.google_analytics_id ?? ""}
          onChange={(e) => set("google_analytics_id", e.target.value)}
          placeholder="G-XXXXXX"
          helpText="GA4 measurement ID."
        />
        <Textarea
          label="robots.txt extra rules"
          value={s.robots_txt_extra ?? ""}
          onChange={(e) => set("robots_txt_extra", e.target.value)}
          rows={5}
          className="font-mono text-sm"
          helpText="Appended after the default robots.txt. One rule per line."
          containerClassName="md:col-span-2"
        />
      </Section>

      <StickySaveBar
        dirty={dirty}
        saving={busy}
        onSave={save}
        onReset={reset}
        saveLabel="Save settings"
        hint="Press Cmd+S to save."
      />
    </div>
  );
}
