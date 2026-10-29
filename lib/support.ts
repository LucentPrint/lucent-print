import { z } from "zod";

export const SUPPORT_REFERENCE = "LP-2026-1027-ES";
export const SUPPORT_AMOUNT = 135000;
export const SUPPORT_CURRENCY = "usd";
export const SUPPORT_SERVICE = "deepgram-onsite-event-support";
export const SUPPORT_VERSION = "1";
export const SUPPORT_NAME = "Deepgram onsite event support";
export const supportCheckoutSchema = z.object({
  clientRequestId: z.uuid(),
}).strict();

export type SupportCheckoutInput = z.infer<typeof supportCheckoutSchema>;
