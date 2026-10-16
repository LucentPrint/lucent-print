import { z } from "zod";

export const RESERVATION_NAME = "Reservation Booking Service";
export const RESERVATION_PRICE = 39000;
export const RESERVATION_CURRENCY = "usd";
export const RESERVATION_TIME_ZONE = "America/Los_Angeles";
export const RESERVATION_SERVICE = "reservation-booking";
export const RESERVATION_VERSION = "1";
export const EVENT_TYPES = [
  "Birthday", "Baby shower", "Graduation", "Corporate event", "Family celebration", "Other",
] as const;

export function pacificDateTime(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: RESERVATION_TIME_ZONE,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((entry) => entry.type === type)!.value;
  return { date: `${part("year")}-${part("month")}-${part("day")}`, time: `${part("hour")}:${part("minute")}` };
}

function isCalendarDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export const reservationSchema = z.object({
  clientRequestId: z.uuid(),
  fullName: z.string().trim().min(2, "Enter your full name.").max(100),
  email: z.email("Enter a valid email address.").trim().max(254),
  phone: z.string().trim().min(7).max(32).refine((value) => {
    const digits = value.replace(/\D/g, "");
    return /^[+\d\s().-]+$/.test(value) && digits.length >= 7 && digits.length <= 15;
  }, "Enter a valid phone number, including area code."),
  eventType: z.enum(EVENT_TYPES),
  preferredDate: z.string().refine(isCalendarDate, "Choose a valid event date."),
  preferredTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Choose a valid event time."),
  guestCount: z.number().int().min(1).max(10000),
  location: z.string().trim().min(2, "Enter the event location or city.").max(180),
  details: z.string().trim().max(450).default(""),
  acknowledged: z.literal(true, { error: "Confirm that your requested date still needs confirmation." }),
}).strict().superRefine((input, context) => {
  if (!isCalendarDate(input.preferredDate)) return;
  const now = pacificDateTime();
  if (`${input.preferredDate}T${input.preferredTime}` <= `${now.date}T${now.time}`) {
    context.addIssue({ code: "custom", path: ["preferredDate"], message: "Choose a future date and time in Pacific time." });
  }
});

export type ReservationInput = z.infer<typeof reservationSchema>;
