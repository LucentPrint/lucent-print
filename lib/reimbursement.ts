import { z } from "zod";

export const REIMBURSEMENT_REFERENCE = "LP-DG-SOUNDON-2026-REIMBURSEMENT";
export const REIMBURSEMENT_AMOUNT = 69107;
export const REIMBURSEMENT_CURRENCY = "usd";
export const REIMBURSEMENT_SERVICE = "deepgram-materials-reimbursement";
export const REIMBURSEMENT_VERSION = "1";
export const REIMBURSEMENT_NAME = "Deepgram Sound On 2026 materials reimbursement";
export const REIMBURSEMENT_ITEMS = [
  { name: "Hobby Lobby", amount: 13907 },
  { name: "Amazon", amount: 55200 },
] as const;

export const reimbursementCheckoutSchema = z.object({
  clientRequestId: z.uuid(),
}).strict();

export type ReimbursementCheckoutInput = z.infer<typeof reimbursementCheckoutSchema>;
