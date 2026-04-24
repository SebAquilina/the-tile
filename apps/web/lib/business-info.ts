/**
 * Canonical business data for The Tile.
 *
 * Populated from public listings on yellow.com.mt, sangwannconnect.com,
 * near-place.com, and the-tile.com itself (April 2026). If the client
 * reports different values during the pitch review, update this module —
 * every page imports from here so there is one place to edit.
 */

export const BUSINESS = {
  name: "The Tile",
  legalName: "The Tile",
  foundedYear: 1990,
  locality: "San Gwann",
  region: "Malta",
  country: "MT",
  postalCode: "SGN 2690",
  streetAddress: "Triq Bellavista",
  addressDisplay: "Triq Bellavista, San Gwann SGN 2690, Malta",

  phone: "+356 2137 1891",
  phoneDisplay: "+356 2137 1891",
  phoneTel: "+35621371891",

  whatsapp: "+356 2137 1891",
  whatsappLink: "https://wa.me/35621371891",

  email: "info@the-tile.com",
  leadInboxFallback: "info@the-tile.com",

  website: "https://www.the-tile.com",

  // Approximate geo for San Gwann Malta — replace with geocoded values once
  // the client confirms the exact storefront pin.
  geo: { latitude: 35.9115, longitude: 14.4788 } as const,

  hours: [
    { day: "Monday", open: "09:00", close: "12:30" },
    { day: "Monday", open: "16:00", close: "19:00" },
    { day: "Tuesday", open: "09:00", close: "12:30" },
    { day: "Tuesday", open: "16:00", close: "19:00" },
    { day: "Wednesday", open: "09:00", close: "12:30" },
    { day: "Wednesday", open: "16:00", close: "19:00" },
    { day: "Thursday", open: "09:00", close: "12:30" },
    { day: "Thursday", open: "16:00", close: "19:00" },
    { day: "Friday", open: "09:00", close: "12:30" },
    { day: "Friday", open: "16:00", close: "19:00" },
    { day: "Saturday", open: "09:30", close: "12:30" },
  ] as const,

  hoursSummary: [
    { label: "Monday to Friday", value: "9:00 – 12:30 · 16:00 – 19:00" },
    { label: "Saturday", value: "9:30 – 12:30" },
    { label: "Sunday", value: "Closed" },
  ] as const,

  social: {
    facebook: "https://www.facebook.com/Thetilemalta/",
    instagram: "https://www.instagram.com/thetilemalta/",
  },

  priceRange: "€€",

  /** Confirmed from the-tile.com: these are the Italian houses currently carried. */
  confirmedBrands: ["Emilceramica", "Emilgroup", "Ergon", "Provenza", "Viva"] as const,

  /** Reply-SLA promise used on contact + journal pages. */
  replyWithin: "two working days",
} as const;

/**
 * Schema.org openingHoursSpecification entries. Groups the split-shift hours
 * into the shape Google expects.
 */
export const OPENING_HOURS_SPECIFICATION = [
  {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    opens: "09:00",
    closes: "12:30",
  },
  {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    opens: "16:00",
    closes: "19:00",
  },
  {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Saturday"],
    opens: "09:30",
    closes: "12:30",
  },
] as const;
