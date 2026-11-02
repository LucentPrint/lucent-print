import { z } from "zod";

export const EXTRAS_REFERENCE = "LP-2026-1101-EX";
export const EXTRAS_AMOUNT = 40614;
export const EXTRAS_CURRENCY = "usd";
export const EXTRAS_SERVICE = "deepgram-additional-merchandise-expenses";
export const EXTRAS_VERSION = "1";
export const EXTRAS_NAME = "Deepgram additional merchandise and reimbursement";
export const extrasCheckoutSchema = z.object({
  clientRequestId: z.uuid(),
}).strict();

export type ExtrasCheckoutInput = z.infer<typeof extrasCheckoutSchema>;
