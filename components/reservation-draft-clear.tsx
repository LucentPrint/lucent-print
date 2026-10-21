"use client";

import { useEffect } from "react";

export function ReservationDraftClear({ kind = "reservation" }: { kind?: "reservation" | "addon" }) {
  useEffect(() => {
    try { sessionStorage.removeItem(kind === "addon" ? "lucent.reservation.addon.request.v1" : "lucent.reservation.draft.v1"); } catch { /* Storage may be disabled. */ }
  }, [kind]);
  return null;
}
