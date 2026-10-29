"use client";

import { useEffect, useSyncExternalStore } from "react";

const key = "lucent-background-paused";
const eventName = "lucent-background-motion";
let fallbackPaused = false;
function snapshot() {
  try { return window.localStorage.getItem(key) === "true"; }
  catch { return fallbackPaused; }
}
function subscribe(listener: () => void) {
  window.addEventListener(eventName, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(eventName, listener);
    window.removeEventListener("storage", listener);
  };
}
const serverSnapshot = () => true;

export function CascadeBackground() {
  const paused = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  useEffect(() => {
    document.documentElement.dataset.cascadeMotion = paused ? "paused" : "running";
  }, [paused]);
  return <div className="lp-cascade-background" aria-hidden="true"><div className="lp-cascade-fall" /></div>;
}

export function CascadeMotionControl() {
  const paused = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  function toggle() {
    fallbackPaused = !paused;
    try { window.localStorage.setItem(key, String(!paused)); } catch { /* Keep the choice for this visit. */ }
    window.dispatchEvent(new Event(eventName));
  }
  return <div className="lp-motion-control">
    <button type="button" onClick={toggle} aria-pressed={paused} aria-label="Pause decorative background motion">{paused ? "Resume background motion" : "Pause background motion"}</button>
    <p>Reduced-motion settings always keep the background still.</p>
  </div>;
}
