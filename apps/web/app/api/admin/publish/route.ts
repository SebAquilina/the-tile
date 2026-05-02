import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = 'edge';

/**
 * POST /api/admin/publish
 *
 * Takes the admin's in-browser draft and applies it to the products seed
 * JSON on GitHub's `main` branch as a single commit per file. The repo
 * stores the seed in TWO locations that must stay in sync:
 *
 *   - `docs/spec/the-tile/seed/products.seed.json`  (source of truth)
 *   - `apps/web/data/seed/products.seed.json`        (read by the Next app)
 *
 * `apps/web/scripts/sync-data.ts` copies docs/spec → apps/web during the
 * postinstall hook on Cloudflare Pages, but we write both here so the
 * repo stays consistent between rebuilds and so reviewers can diff one
 * canonical change.
 *
 * Requires:
 *   GITHUB_TOKEN  — PAT with `contents: write` on SebAquilina/the-tile
 *   GITHUB_REPO   — "SebAquilina/the-tile"  (optional; defaults if unset)
 *   GITHUB_BRANCH — "main"                   (optional; defaults if unset)
 *
 * Authentication: delegated to middleware.ts (Basic auth on /api/admin/*).
 */

const ImagePatchSchema = z.object({
  src: z.string().min(1),
  alt: z.string().optional(),
  caption: z.string().optional(),
  source: z.string().optional(),
  isPlaceholder: z.boolean().optional(),
  provenance: z.record(z.unknown()).optional(),
});

const PatchSchema = z.object({
  inStock: z.boolean().optional(),
  showInCatalog: z.boolean().optional(),
  summary: z.string().min(1).max(600).optional(),
  description: z.string().max(8000).optional(),
  bestFor: z.array(z.string().min(1).max(120)).max(20).optional(),
  tags: z.array(z.string().min(1).max(60)).max(40).optional(),
  images: z.array(ImagePatchSchema).max(40).optional(),
});

const PublishSchema = z.object({
  products: z.record(z.string(), PatchSchema),
  commitMessage: z.string().min(3).max(160).optional(),
});

type ProductPatch = z.infer<typeof PatchSchema>;

const REPO = process.env.GITHUB_REPO || "SebAquilina/the-tile";
const BRANCH = process.env.GITHUB_BRANCH || "main";
const FILE_PATHS = [
  "docs/spec/the-tile/seed/products.seed.json",
  "apps/web/data/seed/products.seed.json",
] as const;

type GitHubFileResponse = {
  content: string; // base64
  sha: string;
  encoding: "base64";
};

async function githubGetFile(token: string, path: string): Promise<GitHubFileResponse> {
  const res = await fetch(
    `https://api.github.com/repos/${REPO}/contents/${path}?ref=${BRANCH}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "the-tile-admin",
      },
      cache: "no-store",
    },
  );
  if (!res.ok) {
    throw new Error(`GitHub GET ${path} failed: ${res.status} ${await res.text()}`);
  }
  return (await res.json()) as GitHubFileResponse;
}

async function githubPutFile(
  token: string,
  path: string,
  sha: string,
  contentB64: string,
  message: string,
): Promise<void> {
  const res = await fetch(
    `https://api.github.com/repos/${REPO}/contents/${path}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
        "User-Agent": "the-tile-admin",
      },
      body: JSON.stringify({
        message,
        content: contentB64,
        sha,
        branch: BRANCH,
        committer: {
          name: "the-tile-admin",
          email: "admin@the-tile.com",
        },
      }),
    },
  );
  if (!res.ok) {
    throw new Error(`GitHub PUT ${path} failed: ${res.status} ${await res.text()}`);
  }
}

// Edge runtime: btoa for base64 of utf-8 strings.
function utf8ToBase64(s: string): string {
  // btoa works on binary strings; encode utf-8 first.
  // eslint-disable-next-line no-restricted-globals
  return btoa(unescape(encodeURIComponent(s)));
}

function base64ToUtf8(b64: string): string {
  // eslint-disable-next-line no-restricted-globals
  return decodeURIComponent(escape(atob(b64)));
}

function applyPatch(product: Record<string, unknown>, patch: ProductPatch) {
  if (patch.inStock !== undefined) product.inStock = patch.inStock;
  if (patch.showInCatalog !== undefined) product.showInCatalog = patch.showInCatalog;
  if (patch.summary !== undefined) product.summary = patch.summary;
  if (patch.description !== undefined) product.description = patch.description;
  if (patch.bestFor !== undefined) product.bestFor = patch.bestFor;
  if (patch.tags !== undefined) product.tags = patch.tags;
  if (patch.images !== undefined) {
    // Replace the array wholesale. The admin sends back the full edited list.
    product.images = patch.images.map((img) => {
      const out: Record<string, unknown> = { src: img.src };
      if (img.alt !== undefined) out.alt = img.alt;
      if (img.caption !== undefined) out.caption = img.caption;
      if (img.source !== undefined) out.source = img.source;
      if (img.isPlaceholder !== undefined) out.isPlaceholder = img.isPlaceholder;
      if (img.provenance !== undefined) out.provenance = img.provenance;
      return out;
    });
  }
}

export async function POST(request: Request) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "publish-not-configured: set GITHUB_TOKEN in the CF Pages env to a PAT with repo contents:write.",
      },
      { status: 503 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = PublishSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { products: draftPatches, commitMessage } = parsed.data;
  const patchEntries = Object.entries(draftPatches);
  if (patchEntries.length === 0) {
    return NextResponse.json(
      { ok: false, error: "no-changes: the draft is empty." },
      { status: 400 },
    );
  }

  try {
    const touched: string[] = [];
    const notFound: string[] = [];

    for (const path of FILE_PATHS) {
      const file = await githubGetFile(token, path);
      const seedJson = JSON.parse(base64ToUtf8(file.content)) as {
        products: Array<Record<string, unknown>>;
      };

      // Reset for second file so we don't double-count, but track touched
      // ids only for the first file (canonical) so the response is stable.
      const isCanonical = path === FILE_PATHS[0];
      const localTouched: string[] = [];
      const localNotFound: string[] = [];

      for (const [productId, patch] of patchEntries) {
        const product = seedJson.products.find((p) => p.id === productId);
        if (!product) {
          localNotFound.push(productId);
          continue;
        }
        applyPatch(product, patch);
        product.updatedAt = new Date().toISOString();
        localTouched.push(productId);
      }

      if (localTouched.length === 0) {
        return NextResponse.json(
          {
            ok: false,
            error: "no-matching-products",
            notFound: localNotFound,
          },
          { status: 400 },
        );
      }

      if (isCanonical) {
        touched.push(...localTouched);
        notFound.push(...localNotFound);
      }

      const nextContent = JSON.stringify(seedJson, null, 2) + "\n";
      const nextB64 = utf8ToBase64(nextContent);
      const message =
        commitMessage ??
        `admin: publish ${localTouched.length} product ${
          localTouched.length === 1 ? "change" : "changes"
        }${isCanonical ? "" : " (sync apps/web seed)"}`;

      await githubPutFile(token, path, file.sha, nextB64, message);
    }

    return NextResponse.json({
      ok: true,
      touched,
      notFound,
      commitMessage:
        commitMessage ??
        `admin: publish ${touched.length} product ${
          touched.length === 1 ? "change" : "changes"
        }`,
      rebuildWithin: "~3 minutes",
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 502 },
    );
  }
}
