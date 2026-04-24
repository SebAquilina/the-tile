export type JournalPost = {
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: string;
  author: string;
  body: string;
};

const POST_MARBLE_MALTA = `
Marble-effect porcelain is one of the easiest pieces to fall for in a showroom. It reads as luxurious, it photographs well, and it carries the quiet authority that real marble does — without the maintenance, the cost per square metre, or the fragile etching problem that comes with acid splashes in a kitchen.

For a Malta summer home, the appeal is practical as much as aesthetic. Coastal humidity, sun that punches through windows at odd angles for six months of the year, sand that finds its way in on every pair of shoes — real marble does not love any of that. Porcelain stoneware does not notice it at all.

## What actually matters

Three questions, usually in this order:

1. **What is the finish?** Natural, lappato, or polished. Natural is the easiest to live with — matte, low-glare, forgiving of small scratches and footprint marks. Lappato sits between matte and polished and has become our most-requested finish. Polished reads most like real marble and is beautiful under directional light, but it shows everything.
2. **What size and thickness?** Larger formats (60 × 120 and up) read cleaner and calmer because there are fewer grout lines. Thicker tiles (10mm plus) are what you want for floors. The 20mm outdoor range is a separate conversation — it is designed for patios and lifts out if a section needs replacing.
3. **What colour family?** White with grey veining is the default for a reason; it goes with almost every cabinetry and furniture decision you will make later. Warm cream and beige tones read softer and tend to flatter skin in bathrooms. Dramatic black or brown marble is a statement choice — beautiful, but commit fully or not at all.

## A note on veining

Unlike real marble, porcelain-stoneware marble effect is printed. Good-quality ranges use a variety of face designs within a single box, so the pattern does not repeat obviously across a floor. When you lay it out in the showroom, the veins should flow across multiple tiles in a way that feels natural, not tiled. If the pattern repeats every third tile, keep looking.

## What to ask for in the showroom

Bring a photo of the room, or the architect's plan if you have it. Bring a scrap of flooring or cabinetry from the existing house if there is one. Bring the light — take a photo at the time of day you will mostly use the room. We will pull two or three options, lay them out on a bench under the correct colour temperature, and you will know quickly which one wants to live with you.

Marble-effect porcelain will last three or four decades of ordinary domestic wear without complaint. That is a long relationship. Start with the room, not the tile.
`;

const POST_PORCELAIN_VS_STONE = `
Natural stone has a pull — the weight of it, the geological story, the sense that you are walking on a piece of earth. We understand. We also sell almost no natural stone, and for good reason.

Porcelain stoneware is the dominant material in Italian tile because, for most applications, it is simply better. Here is the short version.

## Water absorption

Natural stone absorbs water. Even sealed, even the dense varieties — over years, moisture works its way in. In a coastal climate like Malta, that matters: you get staining, efflorescence, and in the worst cases, slow degradation of the surface.

Porcelain stoneware, correctly classified as **BIa under EN 14411**, absorbs less than 0.5% water by weight. For outdoor paving, this is the single most important number. Drive a car over a wet porcelain slab on a cold night and it does not care.

## Frost resistance

Malta almost never freezes, but "almost" is the operative word. Natural stone that has absorbed water can fracture when the trapped moisture expands. Porcelain does not have that failure mode. On a shaded patio that catches the wrong winter morning, porcelain keeps its face.

## Maintenance

Natural stone wants sealing every two or three years, depending on exposure. It wants pH-neutral cleaners. It etches from lemon juice, red wine, tomato sauce. A good porcelain stoneware tile wants a damp mop and a mild detergent, forever.

## Slip resistance

This is the under-appreciated point. Porcelain finishes are specified to **DIN 51130 R-ratings** — R9 for dry indoor, R10 for most domestic kitchens, R11 for wet areas, R12 and R13 for outdoor ramps and industrial. You choose the rating for the room. Natural stone's slip performance is what the quarry happened to produce that week.

## Cost per square metre

Here porcelain usually wins, and wins quietly. A good Italian porcelain stoneware in 60 × 120 costs roughly a third of equivalent natural marble, and less than half of good natural slate. The installation cost is similar. The lifetime maintenance cost is dramatically lower.

## Where natural stone still makes sense

Feature walls, small bathrooms, interior accents, certain heritage renovations in old Maltese houses where the texture and provenance of real stone carries the project. We source it when we need to. But for a patio, a bathroom floor, a pool surround, a kitchen — porcelain, every time.

Start with how you want the room to feel, then ask which material actually gives you that without costing you a weekend every year.
`;

export const JOURNAL_POSTS: JournalPost[] = [
  {
    slug: "choosing-marble-effect-tiles-malta-summer-home",
    title: "Choosing marble-effect tiles for a Malta summer home",
    excerpt:
      "Three questions that matter, one about finish, one about size, one about colour — and why the order is never the other way around.",
    publishedAt: "2026-04-10",
    author: "The Tile editorial",
    body: POST_MARBLE_MALTA.trim(),
  },
  {
    slug: "why-porcelain-outperforms-natural-stone-outdoors",
    title: "Why porcelain outperforms natural stone outdoors",
    excerpt:
      "Water absorption, frost behaviour, slip ratings, and the cost-per-square-metre conversation — the reasons we specify porcelain for almost every Malta patio.",
    publishedAt: "2026-03-18",
    author: "The Tile editorial",
    body: POST_PORCELAIN_VS_STONE.trim(),
  },
];

export function getAllJournalPosts(): JournalPost[] {
  return [...JOURNAL_POSTS].sort((a, b) =>
    b.publishedAt.localeCompare(a.publishedAt),
  );
}

export function getJournalPostBySlug(slug: string): JournalPost | null {
  return JOURNAL_POSTS.find((p) => p.slug === slug) ?? null;
}

export function estimateReadingMinutes(body: string): number {
  const words = body.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 225));
}
