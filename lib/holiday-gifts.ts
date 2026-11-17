import { z } from "zod";

export const HOLIDAY_BUNDLES = {
  set: { label: "The coordinated set", cents: 2500, includes: "Tumbler, coaster, dog tag and air freshener" },
  shirt: { label: "Set + custom shirt", cents: 4500, includes: "The four-piece set plus one custom shirt" },
  complete: { label: "Set + shirt + phone grip", cents: 5000, includes: "The four-piece set, one custom shirt and one phone grip" },
} as const;
export const HOLIDAY_DESIGNS = { custom: "My own idea", gwaup: "GWAUP Boys", wns: "WNS", deepgram: "Deepgram", exotica: "Exotica", bulldogs: "Bulldogs / Coach" } as const;
export const HOLIDAY_SIZES = ["2T", "3T", "4T", "5T", "YXS", "YS", "YM", "YL", "YXL", "S", "M", "L", "XL", "2XL", "3XL"] as const;
export const holidaySchema = z.object({
  bundle: z.enum(["set", "shirt", "complete"]),
  design: z.enum(["custom", "gwaup", "wns", "deepgram", "exotica", "bulldogs"]),
  quantity: z.number().int().min(1).max(50),
  wording: z.string().trim().max(120),
  colors: z.string().trim().max(100),
  details: z.string().trim().min(3, "Tell us what you would like on your set.").max(500),
  shirtSize: z.union([z.enum(HOLIDAY_SIZES), z.literal("")]),
  neededBy: z.string().regex(/^$|^\d{4}-\d{2}-\d{2}$/),
  fulfillment: z.enum(["discuss", "pickup", "shipping"]),
}).strict().superRefine((value, ctx) => {
  if (value.bundle !== "set" && !value.shirtSize) ctx.addIssue({ code: "custom", path: ["shirtSize"], message: "Choose your shirt size." });
  if (value.bundle === "set" && value.shirtSize) ctx.addIssue({ code: "custom", path: ["shirtSize"], message: "This bundle does not include a shirt." });
});
export type HolidayInput = z.infer<typeof holidaySchema>;
export function holidaySubtotal(input: Pick<HolidayInput, "bundle" | "quantity">) {
  return HOLIDAY_BUNDLES[input.bundle].cents * input.quantity;
}
export function holidaySummary(input: HolidayInput) {
  return ["HOLIDAY GIFT REQUEST", `Bundle: ${HOLIDAY_BUNDLES[input.bundle].label}`, `Includes: ${HOLIDAY_BUNDLES[input.bundle].includes}`, `Design: ${HOLIDAY_DESIGNS[input.design]}`, `Quantity: ${input.quantity}`, `Bundle subtotal: $${(holidaySubtotal(input) / 100).toFixed(2)} USD`, "Tax and delivery not included in this estimate; final total requires confirmation.", `Name / exact wording: ${input.wording || "None"}`, `Colors: ${input.colors || "As shown"}`, `Design details: ${input.details}`, ...(input.bundle !== "set" ? [`Shirt size: ${input.shirtSize}`] : []), `Date requested: ${input.neededBy || "Flexible"} (not guaranteed)`, `Delivery preference: ${input.fulfillment} (to be confirmed)`, "Please confirm artwork, availability, timing and final total before sending a payment link."].join("\n");
}
// Fail closed: existing shop shipping rates do not establish this offer's policy.
// Do not turn this into an environment-only toggle. See docs/holiday-checkout.md.
export const HOLIDAY_PAYMENTS_READY = false;
