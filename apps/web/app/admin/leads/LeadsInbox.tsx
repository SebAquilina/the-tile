"use client";

import { useMemo, useState } from "react";
import {
  Archive,
  CheckCheck,
  ExternalLink,
  Inbox,
  Mail,
  MessageCircleReply,
  Phone,
  Search,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { Button, useToast } from "@/components/ui";
import type { Lead } from "@/lib/admin-store";
import { BUSINESS } from "@/lib/business-info";

type StatusFilter = "all" | "new" | "replied" | "archived";

export function LeadsInbox({ leads: initial }: { leads: Lead[] }) {
  const toast = useToast();
  const [leads, setLeads] = useState<Lead[]>(initial);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return leads.filter((l) => {
      if (status !== "all" && l.status !== status) return false;
      if (!q) return true;
      return `${l.name} ${l.email} ${l.message}`.toLowerCase().includes(q);
    });
  }, [leads, query, status]);

  async function setLeadStatus(id: string, next: Lead["status"]) {
    // Optimistic
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status: next } : l)));
    try {
      const res = await fetch(`/api/admin/leads/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (err) {
      toast.error(`Couldn't update: ${(err as Error).message}`);
      setLeads(initial);
    }
  }

  const counts = {
    all: leads.length,
    new: leads.filter((l) => l.status === "new").length,
    replied: leads.filter((l) => l.status === "replied").length,
    archived: leads.filter((l) => l.status === "archived").length,
  };

  return (
    <div className="space-y-space-6">
      <header className="flex flex-wrap items-baseline justify-between gap-space-3">
        <div>
          <h1 className="font-display text-3xl text-ink">Leads</h1>
          <p className="mt-space-2 text-sm text-ink-muted">
            Contact-form enquiries land here. Reply from your email, then mark
            as replied so they drop off the new queue.
          </p>
        </div>
      </header>

      <div className="sticky top-[64px] z-20 -mx-space-5 bg-canvas px-space-5 py-space-3 md:-mx-space-7 md:px-space-7">
        <div className="flex flex-wrap items-center gap-space-3">
          <label className="relative flex flex-1 items-center min-w-[240px]">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-space-3 h-4 w-4 text-ink-subtle"
            />
            <input
              type="search"
              placeholder="Search by name, email, message…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={cn(
                "h-11 w-full rounded-md border border-line bg-surface pl-space-7 pr-space-3 text-sm",
                "placeholder:text-ink-subtle",
                "focus:border-umber focus:outline-none focus:ring-2 focus:ring-focus-ring",
              )}
            />
          </label>
          <div className="flex items-stretch rounded-md border border-line bg-surface">
            {(["all", "new", "replied", "archived"] as StatusFilter[]).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setStatus(k)}
                className={cn(
                  "px-space-4 py-space-2 text-xs uppercase tracking-wider",
                  "transition-colors duration-fast ease-out",
                  "focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-[-2px]",
                  status === k
                    ? "bg-umber text-surface"
                    : "text-ink-muted hover:text-ink",
                )}
              >
                {k} ({counts[k]})
              </button>
            ))}
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-space-3 rounded-md border border-dashed border-line bg-surface p-space-10 text-center">
          <Inbox aria-hidden="true" className="h-8 w-8 text-ink-subtle" />
          <p className="text-ink-muted">
            {leads.length === 0
              ? "No leads yet. When someone submits the contact form they'll appear here."
              : "No leads match these filters."}
          </p>
        </div>
      ) : (
        <ul className="space-y-space-4">
          {filtered.map((l) => (
            <LeadCard key={l.id} lead={l} onStatus={setLeadStatus} />
          ))}
        </ul>
      )}

      <p className="text-xs text-ink-subtle">
        Tip: every enquiry is also sent to{" "}
        <a
          href={`mailto:${BUSINESS.email}`}
          className="text-ink-muted underline underline-offset-2 hover:text-ink"
        >
          {BUSINESS.email}
        </a>{" "}
        — reply from there and it threads like any other customer email.
      </p>
    </div>
  );
}

function LeadCard({
  lead,
  onStatus,
}: {
  lead: Lead;
  onStatus: (id: string, status: Lead["status"]) => void;
}) {
  const dateStr = new Date(lead.createdAt).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const replyTo = `mailto:${lead.email}?subject=${encodeURIComponent(
    `Re: your tile enquiry`,
  )}&body=${encodeURIComponent(
    `Hi ${lead.name.split(" ")[0] ?? ""},\n\n\n\n— The Tile, San Gwann\n${BUSINESS.website}`,
  )}`;

  return (
    <li
      className={cn(
        "rounded-md border bg-surface p-space-5 transition-colors duration-fast ease-out",
        lead.status === "new"
          ? "border-umber/40"
          : lead.status === "archived"
            ? "border-line opacity-60"
            : "border-line",
      )}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-space-3">
        <div>
          <p className="font-medium text-ink">
            {lead.name}{" "}
            {lead.status === "new" ? (
              <span className="ml-space-2 inline-block rounded-full bg-umber px-space-2 py-[1px] text-xs text-surface">
                new
              </span>
            ) : lead.status === "replied" ? (
              <span className="ml-space-2 inline-block rounded-full border border-line px-space-2 py-[1px] text-xs text-ink-subtle">
                replied
              </span>
            ) : (
              <span className="ml-space-2 inline-block rounded-full border border-line px-space-2 py-[1px] text-xs text-ink-subtle">
                archived
              </span>
            )}
          </p>
          <p className="mt-space-1 text-xs text-ink-subtle">{dateStr}</p>
        </div>
        <div className="flex items-center gap-space-3 text-sm">
          <a
            href={`mailto:${lead.email}`}
            className="inline-flex items-center gap-space-1 text-umber underline-offset-4 hover:underline"
          >
            <Mail aria-hidden="true" className="h-4 w-4" />
            {lead.email}
          </a>
          {lead.phone ? (
            <a
              href={`tel:${lead.phone}`}
              className="inline-flex items-center gap-space-1 text-ink-muted hover:text-ink"
            >
              <Phone aria-hidden="true" className="h-4 w-4" />
              {lead.phone}
            </a>
          ) : null}
        </div>
      </div>

      <p className="mt-space-4 whitespace-pre-wrap text-ink">{lead.message}</p>

      {lead.saveListIds && lead.saveListIds.length > 0 ? (
        <p className="mt-space-4 text-xs text-ink-muted">
          Shortlist attached ({lead.saveListIds.length}): {lead.saveListIds.join(", ")}
        </p>
      ) : null}

      <div className="mt-space-5 flex flex-wrap gap-space-3 border-t border-line pt-space-4">
        <a
          href={replyTo}
          className="inline-flex items-center gap-space-2 rounded-md bg-umber px-space-4 py-space-2 text-sm font-medium text-surface hover:bg-umber-strong focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2"
        >
          <MessageCircleReply aria-hidden="true" className="h-4 w-4" />
          Reply via email
          <ExternalLink aria-hidden="true" className="h-3 w-3" />
        </a>
        {lead.status !== "replied" ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onStatus(lead.id, "replied")}
          >
            <CheckCheck aria-hidden="true" className="h-4 w-4" /> Mark replied
          </Button>
        ) : null}
        {lead.status !== "archived" ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onStatus(lead.id, "archived")}
          >
            <Archive aria-hidden="true" className="h-4 w-4" /> Archive
          </Button>
        ) : null}
      </div>
    </li>
  );
}
