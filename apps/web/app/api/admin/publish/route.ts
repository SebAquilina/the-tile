import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = 'edge';

/**
 * POST /api/admin/publish
 *
 * Takes the admin's in-browser draft and applies it to
 * `docs/spec/the-tile/seed/products.seed.json` on GitHub's `main` branch
 * as a single commit. That triggers Cloudflare Pages to rebuild with the
 * durable change included.
 *
 * Requires:
 *   GITHUB_TOKEN  — PAT with `contents: write` on SebAquilina/the-tile
 *   GITHUB_REPO   — "SebAquilina/the-tile"  (optional; defaults if unset)
 *   GITHUB_BRANCH — "main"                   (optional; defaults if unset)
 *
 * Authentication: delegated to middleware.ts (Basic auth on /api/admin/*).
 */

const PatchSchema = z.object({
  inStock: z.boolean().optional(),
  showInCatalog: z.boolean().optional(),
  summary: z.string().min(10).max(300).optional(),
});

const PublishSchema = z.object({
  products: z.record(z.string(), PatchSchema),
  commitMessage: z.string().min(3).max(120).optional(),
});

type ProductPatch = z.infer<typeof PatchSchema>;

const REPO = process.env.GITHUB_REPO || "SebAquilina/the-tile";
const BRANCH = process.env.GITHUB_BRANCH || "main";
const FILE_PATH = "docs/spec/the-tile/seed/products.seed.json";

type GitHubFileResponse = {
  content: string; // base64
  sha: string;
  encoding: "base64";
};

async function githubGetFile(token: string): Promise<GitHubFileResponse> {
  const res = await fetch(
    `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}?ref=${BRANCH}`,
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
    throw new Error(`GitHub GET failed: ${res.status} ${await res.text()}`);
  }
  return (await res.json()) as GitHubFileResponse;
}

async function githubPutFile(
  token: string,
  sha: string,
  contentB64: string,
  message: string,
): Promise<void> {
  const res = await fetch(
    `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`,
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
    throw new Error(`GitHub PUT failed: ${res.status} ${await res.text()}`);
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
    const file = await githubGetFile(token);
    const seedJson = JSON.parse(
      Buffer.from(file.content, "base64").toString("utf8"),
    ) as { products: Array<Record<string, unknown>> };

    const touched: string[] = [];
    const notFound: string[] = [];

    for (const [productId, patch] of patchEntries) {
      const product = seedJson.products.find((p) => p.id === productId);
      if (!product) {
        notFound.push(productId);
        continue;
      }
      applyPatch(product, patch);
      product.updatedAt = new Date().toISOString();
      touched.push(productId);
    }

    if (touched.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "no-matching-products",
          notFound,
        },
        { status: 400 },
      );
    }

    const nextContent = JSON.stringify(seedJson, null, 2) + "\n";
    const nextB64 = Buffer.from(nextContent, "utf8").toString("base64");
    const message =
      commitMessage ??
      `admin: publish ${touched.length} product ${
        touched.length === 1 ? "change" : "changes"
      }`;

    await githubPutFile(token, file.sha, nextB64, message);

    return NextResponse.json({
      ok: true,
      touched,
      notFound,
      commitMessage: message,
      rebuildWithin: "~3 minutes",
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 502 },
    );
  }
}

function applyPatch(product: Record<string, unknown>, patch: ProductPatch) {
  if (patch.inStock !== undefined) product.inStock = patch.inStock;
  if (patch.showInCatalog !== undefined) product.showInCatalog = patch.showInCatalog;
  if (patch.summary !== undefined) product.summary = patch.summary;
}
