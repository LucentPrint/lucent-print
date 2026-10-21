import { z } from "zod";

export const DEEPGRAM_INVOICE_NUMBER = "LP-2026-1020";
export const DEEPGRAM_PAYMENT_AMOUNT = 61500;
export const DEEPGRAM_CURRENCY = "usd";
export const DEEPGRAM_SERVICE = "deepgram-centerpieces";
export const DEEPGRAM_VERSION = "1";

export const deepgramCheckoutSchema = z.object({
  part: z.enum(["deposit", "balance"]),
  clientRequestId: z.uuid(),
}).strict();

export type DeepgramCheckoutInput = z.infer<typeof deepgramCheckoutSchema>;
export type DeepgramPaymentPart = DeepgramCheckoutInput["part"];

export function deepgramPaymentName(part: DeepgramPaymentPart) {
  return `Deepgram centerpieces — ${part}`;
}
