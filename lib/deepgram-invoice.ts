import { z } from "zod";

export const DEEPGRAM_INVOICE_NUMBER = "LP-2026-1020";
const DEEPGRAM_PAYMENT_AMOUNTS = { deposit: 61500, balance: 86500 } as const;
export const DEEPGRAM_CURRENCY = "usd";
export const DEEPGRAM_SERVICE = "deepgram-centerpieces";
export const DEEPGRAM_VERSION = "2";

export const deepgramCheckoutSchema = z.object({
  part: z.enum(["deposit", "balance"]),
  clientRequestId: z.uuid(),
}).strict();

export type DeepgramCheckoutInput = z.infer<typeof deepgramCheckoutSchema>;
export type DeepgramPaymentPart = DeepgramCheckoutInput["part"];

export function deepgramPaymentAmount(part: DeepgramPaymentPart) {
  return DEEPGRAM_PAYMENT_AMOUNTS[part];
}

export function deepgramPaymentName(part: DeepgramPaymentPart) {
  return `Deepgram centerpieces — ${part}`;
}
