/**
 * Customer reviews — Phase 2 placeholder content.
 *
 * FABRICATED for demo purposes. Before launch, replace this module with
 * reviews the client has sourced from Google Business / Facebook /
 * customer surveys, with permission to publish. Each review must have a
 * real first name and the visitor's explicit consent on file.
 *
 * The shape matches schema.org/Review so we can emit rich-result markup
 * later without renaming anything.
 */

export type ReviewAuthor = {
  /** First name + last initial only — never a full surname in placeholder data. */
  name: string;
  /** Free-text location used on the card (e.g. "Sliema"). */
  locality?: string;
};

export type Review = {
  id: string;
  author: ReviewAuthor;
  rating: 1 | 2 | 3 | 4 | 5;
  publishedAt: string;
  body: string;
  /** Optional — the series id this reviewer commented on. Used to surface
   *  the review on that product's detail page. */
  productId?: string;
  /** Optional headline / title the reviewer gave their note. */
  headline?: string;
  /** Marks this as a fabricated placeholder. Always true in Phase 2. */
  placeholder: true;
};

export const REVIEWS: Review[] = [
  {
    id: "r1",
    author: { name: "Karen M.", locality: "Sliema" },
    rating: 5,
    publishedAt: "2026-02-18",
    headline: "Unhurried, honest, genuinely knowledgeable",
    body:
      "I walked in with a Pinterest board and a kitchen plan and walked out forty minutes later with three samples, none of which were the tiles I thought I wanted. Two months later I am sitting in the kitchen and they were absolutely right. Thank you.",
    productId: "tele-di-marmo-revolution",
    placeholder: true,
  },
  {
    id: "r2",
    author: { name: "Matthew G.", locality: "Birkirkara" },
    rating: 5,
    publishedAt: "2026-01-30",
    headline: "The outdoor 20mm delivered a month early",
    body:
      "We were dreading the Italian lead time. The 20mm paving came in under five weeks, was laid before Easter, and has survived a full winter without a mark. Good advice on the slip rating — R11 was the right call for the pool edge.",
    placeholder: true,
  },
  {
    id: "r3",
    author: { name: "Ruth S.", locality: "Naxxar" },
    rating: 5,
    publishedAt: "2026-01-12",
    headline: "Bathroom feels like a hotel now",
    body:
      "Gesso in the 60x120 format across floor and walls. Calm, soft, slightly warm. The concierge chatbot on the site was actually helpful — it pointed me at the series and then the team in the showroom backed up what it said.",
    productId: "gesso",
    placeholder: true,
  },
  {
    id: "r4",
    author: { name: "Paul D.", locality: "St Julian's" },
    rating: 4,
    publishedAt: "2025-12-08",
    headline: "Good tile, patient advice on the grout",
    body:
      "Bought Salt Stone for a hallway and a small kitchen. The tile is beautiful; my issue was with the grout colour which we got slightly wrong on the first box. The team replaced the grout, no fuss, and the finished floor looks like it was laid by someone who knew what they were doing.",
    productId: "salt_stone",
    placeholder: true,
  },
  {
    id: "r5",
    author: { name: "Maria C.", locality: "Mdina" },
    rating: 5,
    publishedAt: "2025-11-26",
    headline: "Thirty years of taste",
    body:
      "My parents bought tiles from The Tile in the nineties. It is a different generation running the showroom now but the taste is still there. We did a full renovation on an old Mdina house and the porcelain we picked sits properly with the limestone and the wood. No cheap sheen.",
    placeholder: true,
  },
  {
    id: "r6",
    author: { name: "Andrei V.", locality: "Msida" },
    rating: 5,
    publishedAt: "2025-10-14",
    headline: "Actually understood what a commercial floor needs",
    body:
      "Specified for a physio clinic — R10, porcelain, colour-body, high-traffic tolerance. The team asked all the right questions and the Ergon range they pulled was exactly the brief. Installation went clean.",
    placeholder: true,
  },
  {
    id: "r7",
    author: { name: "Sarah B.", locality: "Mellieha" },
    rating: 5,
    publishedAt: "2025-09-02",
    headline: "Showroom visit worth the drive",
    body:
      "Drove from Mellieha on a Saturday morning, half expecting to be rushed through. Spent the best part of an hour with the owner looking at wood-effect in different lights. No pressure, no upsell. Booked the Provoak the next week and it has been installed since July.",
    productId: "provoak",
    placeholder: true,
  },
  {
    id: "r8",
    author: { name: "Joseph F.", locality: "Qormi" },
    rating: 4,
    publishedAt: "2025-08-19",
    body:
      "Stone-effect for an outdoor courtyard. Arrived on schedule, laid beautifully. Four stars because the pricing felt a touch ambitious, but the quality is there and the support after the sale is what will bring me back for the next project.",
    placeholder: true,
  },
  {
    id: "r9",
    author: { name: "Elena T.", locality: "Gzira" },
    rating: 5,
    publishedAt: "2025-07-03",
    headline: "Large format, no fuss",
    body:
      "120x240 marble-effect slabs for a feature wall. Everyone told me it would be a nightmare to install. The team recommended a fitter who actually knew how to handle large formats and the result is one of the best rooms in the house.",
    productId: "tele-di-marmo-onyx",
    placeholder: true,
  },
  {
    id: "r10",
    author: { name: "Conrad A.", locality: "Swieqi" },
    rating: 5,
    publishedAt: "2025-06-21",
    headline: "Concrete-effect that does not look cheap",
    body:
      "Concrete-effect is everywhere now and most of it looks awful. Viva's range here is the exception. We put it in the living area and the contrast with the wooden ceiling is perfect. Compliments every time a guest walks in.",
    placeholder: true,
  },
  {
    id: "r11",
    author: { name: "Anna B.", locality: "Attard" },
    rating: 5,
    publishedAt: "2025-05-12",
    headline: "Samples, samples, samples",
    body:
      "I took eight samples home and lived with them for ten days. The team never once chased me. When I came back with my pick, they already knew my brief and had the formats confirmed. That is service.",
    placeholder: true,
  },
  {
    id: "r12",
    author: { name: "David P.", locality: "Gharghur" },
    rating: 4,
    publishedAt: "2025-04-04",
    body:
      "Restoring a townhouse. Wanted terracotta-effect that read authentic. The Kotto range they showed us was spot on. Delivery had a minor snag — the wrong box arrived first — but was corrected within a week. Would recommend for anyone doing a heritage project.",
    placeholder: true,
  },
  {
    id: "r13",
    author: { name: "Michela C.", locality: "Lija" },
    rating: 5,
    publishedAt: "2025-03-18",
    headline: "Renovation sanity-saver",
    body:
      "We are doing a whole-house renovation and tile choices were sinking me. One afternoon in the San Gwann showroom with the team laying out combinations and suddenly every room had a direction. The quote was thorough, the fitter they recommended was excellent.",
    placeholder: true,
  },
];

export function getAllReviews(): Review[] {
  return [...REVIEWS].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export function getReviewsForProduct(productId: string): Review[] {
  return REVIEWS.filter((r) => r.productId === productId);
}

export function getFeaturedReviews(count = 3): Review[] {
  return getAllReviews()
    .filter((r) => r.rating === 5 && r.headline)
    .slice(0, count);
}

export function averageRating(): number {
  if (REVIEWS.length === 0) return 0;
  const sum = REVIEWS.reduce((acc, r) => acc + r.rating, 0);
  return Number((sum / REVIEWS.length).toFixed(2));
}
