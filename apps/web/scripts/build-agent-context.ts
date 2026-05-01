/**
 * Concatenates 07-agent-system-prompt.md (fenced code block) + 06-site-knowledge.md
 * and writes to apps/web/lib/agent-system-prompt.ts as an exported constant.
 *
 * Also copies 06-site-knowledge.md to apps/web/data/site-knowledge.md for runtime
 * availability (optional; constant is the source of truth for the API proxy).
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const specDir = resolve(here, "../../../docs/spec/the-tile");
const promptMd = resolve(specDir, "07-agent-system-prompt.md");
const knowledgeMd = resolve(specDir, "06-site-knowledge.md");
const outTs = resolve(here, "../lib/agent-system-prompt.ts");
const outData = resolve(here, "../data/site-knowledge.md");

if (!existsSync(promptMd) || !existsSync(knowledgeMd)) {
  console.warn(`[build-agent-context] spec files missing; skipping.`);
  process.exit(0);
}

const promptSrc = readFileSync(promptMd, "utf8");
const knowledge = readFileSync(knowledgeMd, "utf8");

// Extract the populated system prompt — the content between the first
// ```...``` after the "## The prompt (copy verbatim below this line)"
// heading and the matching closing fence.
//
// Bug fix: the prompt body itself contains an example wrapped in
// triple-backticks (the action format example), so a non-greedy regex
// would cut off everything after the inner fence — which silently dropped
// the entire action vocabulary, the consent rules, and the navigation
// contract from the model's instructions. We anchor on the section heading
// and walk fence-by-fence, taking content from the first opening fence to
// the LAST closing fence before the next "## " heading.
function extractSystemPrompt(src: string): string {
  const heading = "## The prompt (copy verbatim below this line)";
  const headingIdx = src.indexOf(heading);
  if (headingIdx < 0) return src;
  // Search for the first opening fence after the heading.
  const afterHeading = src.slice(headingIdx);
  const openMatch = afterHeading.match(/```(?:[a-zA-Z0-9_-]*)?\n/);
  if (!openMatch || openMatch.index === undefined) return src;
  const bodyStart = openMatch.index + openMatch[0].length;
  // The next top-level "## " heading after the first opening fence is the
  // upper bound. Find it and search backwards from there for the matching
  // closing fence.
  const nextHeadingMatch = afterHeading.slice(bodyStart).match(/\n## /);
  const upperBound = nextHeadingMatch && nextHeadingMatch.index !== undefined
    ? bodyStart + nextHeadingMatch.index
    : afterHeading.length;
  const slice = afterHeading.slice(bodyStart, upperBound);
  // Last closing fence in this slice is the prompt's terminator.
  const lastFenceIdx = slice.lastIndexOf("\n```");
  if (lastFenceIdx < 0) return src;
  return slice.slice(0, lastFenceIdx);
}
const systemPrompt = extractSystemPrompt(promptSrc);

// --- Runtime-injected behaviour overrides -------------------------------
// These are appended to the populated system prompt from 07-*.md without
// editing the spec file. Keeping them here makes it obvious to future
// implementers that these are opinionated behaviours layered on top of
// the canonical spec prompt.
const BEHAVIOUR_OVERRIDES = `

LINKING POLICY (non-negotiable)
When you mention a specific tile by name, wrap the name in a markdown link
to its product detail page. Use the canonical URL format:
  [Tele di Marmo Revolution](/collections/marble/tele-di-marmo-revolution)

When you mention a whole category (e.g. "marble-effect" or "wood-look"),
link at least once to the effect landing page:
  [marble-effect collections](/collections/marble)
Effect landing URLs: /collections/{marble|wood|stone|slate|concrete|terrazzo|terracotta|gesso|full-colour}

When you mention a supplier brand, link to that brand's page:
  [Emilceramica](/brands/emilceramica)
Brand pages: /brands/{emilceramica|emilgroup|ergon|provenza|viva}

Do not invent slugs. If you are not certain of the exact slug, either use
the knowledge base entry verbatim or skip the link for that specific
reference. Never write a link like /collections/marble/that-nice-white-one.

The "visible text" portion of your reply (before the ---ACTIONS--- trailer)
should be scannable and include at least one inline link whenever you
reference specific catalogue items.

ACTION HONESTY POLICY (non-negotiable)
You can emit actions in the ---ACTIONS--- trailer but you do NOT directly
observe whether they succeeded on the visitor's screen. Do not phrase your
reply as if the action has definitely landed.

Wrong:  "Done, I've added the Unique Marble to your shortlist."
Right:  "I've asked the site to save Unique Marble to your shortlist —
         you'll see a heart appear on the card and a count tick up in the
         top-right. If nothing happens, tap the heart on the card yourself."

Wrong:  "Your filter is applied."
Right:  "Filtering the catalogue to marble bathrooms now — look at the
         left-hand facet panel to confirm."

The frontend shows its own inline receipts for each action; the visitor
will notice if something failed. Your job is to propose and trigger, not
to assert success.

If a visitor asks you to do something you cannot do (add a tile we do not
carry to the shortlist; price a tile; book a showroom slot directly),
say so plainly and route them to the contact form or the showroom.
`;

const combined = `${systemPrompt}\n${BEHAVIOUR_OVERRIDES}\n\nSITE KNOWLEDGE:\n${knowledge}`;

mkdirSync(dirname(outTs), { recursive: true });
mkdirSync(dirname(outData), { recursive: true });

// Escape backticks and ${ for template literal.
const escaped = combined.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${");

const ts = `// AUTO-GENERATED by scripts/build-agent-context.ts — do not edit.
// Rebuilt from docs/spec/the-tile/07-agent-system-prompt.md + 06-site-knowledge.md.

export const AGENT_SYSTEM_PROMPT = \`${escaped}\`;

export const AGENT_SYSTEM_PROMPT_CHARS = ${combined.length};
`;

writeFileSync(outTs, ts, "utf8");
writeFileSync(outData, combined, "utf8");

console.log(
  `[build-agent-context] wrote ${outTs} (${combined.length.toLocaleString()} chars, ~${Math.round(
    combined.length / 4,
  ).toLocaleString()} tokens)`,
);
