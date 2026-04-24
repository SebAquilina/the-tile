import type { Metadata } from "next";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { SaveListView } from "./SaveListView";

export const metadata: Metadata = {
  title: "Your shortlist",
  description: "The tiles you have saved. Ready when you want a quote.",
};

export default function SaveListPage() {
  return (
    <div className="mx-auto max-w-content px-space-5 py-space-10 md:px-space-7">
      <Breadcrumb
        items={[{ label: "Home", href: "/" }, { label: "Shortlist" }]}
      />

      <header className="mt-space-7 max-w-prose">
        <p className="text-xs uppercase tracking-widest text-ink-subtle">
          Your shortlist
        </p>
        <h1 className="mt-space-3 font-display text-4xl leading-tight text-ink md:text-5xl">
          The tiles you are considering
        </h1>
        <p className="mt-space-5 text-lg text-ink-muted">
          A short list sharpens a showroom visit. When you are ready, send it
          through and we will come back with a quote, lead times, and a
          thought on formats and finishes.
        </p>
      </header>

      <SaveListView />
    </div>
  );
}
