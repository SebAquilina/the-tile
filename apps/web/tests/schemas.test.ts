import { describe, expect, it } from "vitest";
import {
  ContactLeadSchema,
  ProductSchema,
} from "@/lib/schemas";
// eslint-disable-next-line @typescript-eslint/no-var-requires
import rawSeed from "@/data/seed/products.seed.json";

type Seed = { products: unknown[]; categories?: unknown[] };
const seed = rawSeed as unknown as Seed;

describe("ProductSchema", () => {
  it("parses every product in the seed cleanly", () => {
    const failures: { id: unknown; errors: unknown }[] = [];
    for (const p of seed.products) {
      const res = ProductSchema.safeParse(p);
      if (!res.success) {
        failures.push({
          id: (p as { id?: unknown }).id,
          errors: res.error.flatten(),
        });
      }
    }
    expect(failures).toEqual([]);
    expect(seed.products.length).toBeGreaterThanOrEqual(60);
  });

  it("accepts a minimal product", () => {
    const minimal = {
      id: "demo",
      name: "Demo",
      effect: "marble",
      summary: "a short summary",
      url: "/collections/marble/demo",
    };
    const res = ProductSchema.safeParse(minimal);
    expect(res.success).toBe(true);
  });

  it("rejects a product missing id", () => {
    const invalid = {
      name: "Demo",
      effect: "marble",
      summary: "a short summary",
      url: "/collections/marble/demo",
    };
    const res = ProductSchema.safeParse(invalid);
    expect(res.success).toBe(false);
  });
});

describe("ContactLeadSchema", () => {
  const validLead = {
    name: "Anna",
    email: "anna@example.com",
    message: "Thinking about a bathroom refresh.",
    consentGiven: true,
  };

  it("accepts a valid lead", () => {
    const res = ContactLeadSchema.safeParse(validLead);
    expect(res.success).toBe(true);
  });

  it("rejects when consent is not given", () => {
    const res = ContactLeadSchema.safeParse({ ...validLead, consentGiven: false });
    expect(res.success).toBe(false);
  });

  it("rejects a bad email", () => {
    const res = ContactLeadSchema.safeParse({ ...validLead, email: "not-an-email" });
    expect(res.success).toBe(false);
  });
});
