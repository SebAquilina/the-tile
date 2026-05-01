import { z } from "zod";

/**
 * Zod schemas that back the product / category / brand / agent contracts.
 *
 * Note on leniency: the seed JSON data is sparse — many products only have
 * id/name/effect/summary/url. We follow the canonical shape from
 * docs/spec/the-tile/08-product-schema.json but keep nearly everything
 * optional so ProductSchema.parse() works on every seed item.
 */

// --- Enums (kept lenient: we fall back to string where the seed may drift) ---

export const EffectEnum = z.enum([
  "marble",
  "wood",
  "stone",
  "slate",
  "concrete",
  "terrazzo",
  "terracotta",
  "gesso",
  "full-colour",
]);

export const UsageEnum = z.enum([
  "indoor",
  "outdoor",
  "bathroom",
  "outdoor-paving",
  "paving-20mm",
  "commercial",
  "wet-area",
  "high-traffic",
]);

export const MaterialEnum = z.enum([
  "porcelain stoneware",
  "glazed ceramic",
  "unglazed porcelain",
  "pressed porcelain",
]);

export const FinishEnum = z.enum([
  "natural",
  "polished",
  "lappato",
  "semi-polished",
  "honed",
  "textured",
  "anti-slip",
  "matte",
  "structured",
  "bush-hammered",
]);

export const SlipRatingEnum = z.enum(["R9", "R10", "R11", "R12", "R13"]);
export const WaterAbsorptionEnum = z.enum(["BIa", "BIb", "BIIa", "BIIb", "BIII"]);

export const CategoryTypeEnum = z.enum(["effect", "usage"]);

// --- Product ---

export const ProductImageSchema = z
  .object({
    src: z.string(),
    alt: z.string().optional().default(""),
    caption: z.string().optional(),
    context: z.enum(["flat", "in-room", "detail", "lifestyle"]).optional(),
    width: z.number().optional(),
    height: z.number().optional(),
  })
  .passthrough();

export const ProductAttributesSchema = z
  .object({
    material: MaterialEnum.or(z.string()).optional(),
    formats: z.array(z.string()).optional(),
    finishes: z.array(FinishEnum.or(z.string())).optional(),
    thicknesses: z.array(z.number()).optional(),
    slipRating: SlipRatingEnum.or(z.string()).optional(),
    waterAbsorption: WaterAbsorptionEnum.or(z.string()).optional(),
    frostResistant: z.boolean().optional(),
    colours: z.array(z.string()).optional(),
    rectified: z.boolean().optional(),
    colourBody: z.boolean().optional(),
  })
  .passthrough();

export const ProductSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1).max(200),
    // Lenient: spec says enum but if seed ever drifts we don't want to break boot
    effect: EffectEnum.or(z.string()),
    usage: z.array(UsageEnum.or(z.string())).optional().default([]),
    brand: z.string().nullable().optional(),
    summary: z.string(),
    description: z.string().optional().default(""),
    url: z.string(),
    sourceUrl: z.string().nullable().optional(),
    attributes: ProductAttributesSchema.optional().default({}),
    images: z.array(ProductImageSchema).optional().default([]),
    tags: z.array(z.string()).optional().default([]),
    bestFor: z.array(z.string()).optional().default([]),
    relatedIds: z.array(z.string()).optional().default([]),
    inStock: z.boolean().optional().default(true),
    showInCatalog: z.boolean().optional().default(true),
    updatedAt: z.string().optional(),
  })
  .passthrough();

export type Product = z.infer<typeof ProductSchema>;

// --- Category ---

export const CategorySchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    type: CategoryTypeEnum.or(z.string()),
    summary: z.string().optional().default(""),
    sourceUrl: z.string().nullable().optional(),
  })
  .passthrough();

export type Category = z.infer<typeof CategorySchema>;

// --- Brand ---

export const BrandSchema = z
  .object({
    name: z.string().min(1),
    logoUrl: z.string().nullable().optional(),
  })
  .passthrough();

export type Brand = z.infer<typeof BrandSchema>;

// --- Home / content ---

export const HomeContentSchema = z
  .object({
    version: z.number().optional(),
    home_intro: z
      .object({
        title: z.string().optional(),
        tagline_legacy: z.string().optional(),
        since: z.number().optional(),
        paragraphs: z.array(z.string()).optional().default([]),
      })
      .passthrough()
      .optional(),
    about: z
      .object({
        title: z.string().optional(),
        paragraphs: z.array(z.string()).optional().default([]),
        sourceUrl: z.string().optional(),
      })
      .passthrough()
      .optional(),
    contact: z
      .object({
        title: z.string().optional(),
        paragraphs: z.array(z.string()).optional().default([]),
        address: z.string().optional(),
        sourceUrl: z.string().optional(),
        note: z.string().optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

export type HomeContent = z.infer<typeof HomeContentSchema>;

// --- Agent chat ---

export const AgentRoleEnum = z.enum(["user", "assistant", "system"]);

export const AgentMessageSchema = z.object({
  id: z.string().optional(),
  role: AgentRoleEnum,
  content: z.string().max(4000),
  createdAt: z.union([z.string(), z.number()]).optional(),
});

export type AgentMessage = z.infer<typeof AgentMessageSchema>;

export const AgentChatRequestSchema = z.object({
  messages: z.array(AgentMessageSchema).min(1).max(40),
  sessionId: z.string().min(1).max(120),
  isFirstMessage: z.boolean().optional(),
  turnstileToken: z.string().optional(),
});

export type AgentChatRequest = z.infer<typeof AgentChatRequestSchema>;

// --- Contact / lead ---

export const ContactLeadSchema = z.object({
  name: z.string().min(2).max(200),
  email: z.string().email().max(254),
  phone: z.string().max(40).optional(),
  message: z.string().min(1).max(4000),
  preferredContactMethod: z.enum(["email", "phone", "whatsapp"]).optional(),
  consentGiven: z.literal(true),
  saveListIds: z.array(z.string().max(120)).max(50).optional(),
});

export type ContactLead = z.infer<typeof ContactLeadSchema>;
