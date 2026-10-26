"use client";
import { useId, useSyncExternalStore } from "react";
type Preference = "system" | "light" | "dark";
const key = "lucent-color-mode";
function stored(): Preference { try { const value = localStorage.getItem(key); return value === "light" || value === "dark" ? value : "system"; } catch { return "system"; } }
function apply(preference: Preference) {
  const root = document.documentElement;
  root.dataset.themePreference = preference;
  root.dataset.theme = preference === "system" ? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : preference;
  root.style.colorScheme = root.dataset.theme;
}
function subscribe(notify: () => void) {
  const media = matchMedia("(prefers-color-scheme: dark)");
  const changed = () => { apply((document.documentElement.dataset.themePreference as Preference) || "system"); notify(); };
  const storage = () => { apply(stored()); notify(); };
  media.addEventListener("change", changed);
  window.addEventListener("storage", storage);
  window.addEventListener("lucent-theme", changed);
  return () => { media.removeEventListener("change", changed); window.removeEventListener("storage", storage); window.removeEventListener("lucent-theme", changed); };
}
function snapshot() { return document.documentElement.dataset.themePreference || "system"; }
export function ThemeControl() {
  const id = useId();
  const preference = useSyncExternalStore(subscribe, snapshot, () => "system");
  function choose(next: Preference) {
    try { if (next === "system") localStorage.removeItem(key); else localStorage.setItem(key, next); } catch { /* Apply for this visit if storage is unavailable. */ }
    apply(next); window.dispatchEvent(new Event("lucent-theme"));
  }
  return <div className="lp-theme-control" role="group" aria-labelledby={id}><span id={id}>Appearance</span><div className="lp-theme-options">{(["system", "light", "dark"] as const).map(value => <button key={value} type="button" aria-pressed={preference === value} onClick={() => choose(value)}>{value[0].toUpperCase() + value.slice(1)}</button>)}</div></div>;
}
