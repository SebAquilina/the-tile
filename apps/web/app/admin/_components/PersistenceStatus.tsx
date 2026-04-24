import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Honest banner about how edits persist.
 *
 * Green when GITHUB_TOKEN is set — publish writes back to the seed and
 * the site rebuilds. Amber when it isn't — admin is "read-mostly" and
 * edits stay in-session only.
 */
export function PersistenceStatus() {
  const canPublish = Boolean(process.env.GITHUB_TOKEN);

  return (
    <div
      className={cn(
        "rounded-md border p-space-5 text-sm",
        canPublish
          ? "border-line bg-surface text-ink-muted"
          : "border-warning/40 bg-warning/10 text-ink",
      )}
    >
      <div className="flex items-start gap-space-3">
        {canPublish ? (
          <CheckCircle2
            aria-hidden="true"
            className="mt-[2px] h-5 w-5 flex-shrink-0 text-success"
          />
        ) : (
          <AlertTriangle
            aria-hidden="true"
            className="mt-[2px] h-5 w-5 flex-shrink-0 text-warning"
          />
        )}
        {canPublish ? (
          <div>
            <p className="font-medium text-ink">Publish is live</p>
            <p className="mt-space-1">
              Changes published here commit to{" "}
              <code>docs/spec/the-tile/seed/products.seed.json</code> on the
              <code>main</code> branch, and the site rebuilds automatically.
            </p>
          </div>
        ) : (
          <div>
            <p className="font-medium">Publish is not configured yet</p>
            <p className="mt-space-1">
              Set <code>GITHUB_TOKEN</code> in the Cloudflare Pages environment
              (personal access token with <code>contents: write</code> on{" "}
              <code>SebAquilina/the-tile</code>) so admin edits commit back
              and trigger rebuilds. Until then, changes stage in your browser
              session but cannot be published live.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
