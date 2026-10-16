"use client";

import { useEffect } from "react";

export function ReservationDraftClear() {
  useEffect(() => {
    try { sessionStorage.removeItem("lucent.reservation.draft.v1"); } catch { /* Storage may be disabled. */ }
  }, []);
  return null;
}
