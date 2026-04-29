/**
 * Tiny client-side markdown renderer for the live preview pane.
 * Mirrors the server-side renderer in lib/pages/store.ts.
 */
export function renderMarkdown(md: string): string {
  let html = md
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  html = html
    .replace(/^###### (.+)$/gm, "<h6>$1</h6>")
    .replace(/^##### (.+)$/gm, "<h5>$1</h5>")
    .replace(/^#### (.+)$/gm, "<h4>$1</h4>")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>");
  html = html
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  html = html.replace(/(^|\n)((?:- .+(?:\n|$))+)/g, (_m, lead, block) => {
    const items = block.trim().split(/\n/).map((l: string) => `<li>${l.replace(/^- /, "")}</li>`).join("");
    return `${lead}<ul>${items}</ul>`;
  });
  html = html.split(/\n{2,}/).map((chunk) => {
    const t = chunk.trim();
    if (!t) return "";
    if (/^<(h\d|ul|ol|pre|blockquote|p|div|table)[\s>]/.test(t)) return t;
    return `<p>${t.replace(/\n/g, "<br />")}</p>`;
  }).join("\n");
  return html;
}
