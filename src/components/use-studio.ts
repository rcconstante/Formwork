"use client";

import { useSyncExternalStore } from "react";
import { studioFrom, type Studio } from "@/lib/studio";
import { read, type Entry } from "@/lib/project";

const key = "formwork.studio.v1";
const events = new Set<() => void>();
let unsaved: string | null = null;
const getServerSnapshot = () => null;
function subscribe(callback: () => void) {
  events.add(callback);
  window.addEventListener("storage", callback);
  return () => {
    events.delete(callback);
    window.removeEventListener("storage", callback);
  };
}
function getStudioSnapshot() {
  try { return unsaved ?? localStorage.getItem(key); } catch { return unsaved; }
}
function getEntriesSnapshot() {
  try { return localStorage.getItem("formwork.project.v1"); } catch { return null; }
}

export function useStudio() {
  const snapshot = useSyncExternalStore(subscribe, getStudioSnapshot, getServerSnapshot);
  function patch(update: Partial<Studio> | ((current: Studio) => Partial<Studio>)) {
    const current = studioFrom(getStudioSnapshot());
    const next = JSON.stringify({ ...current, ...(typeof update === "function" ? update(current) : update) });
    try {
      localStorage.setItem(key, next);
      unsaved = null;
    } catch {
      unsaved = next;
    }
    events.forEach((notify) => notify());
  }
  return { data: studioFrom(snapshot), patch, unsaved: snapshot !== null && snapshot === unsaved };
}

export function useEntries(): Entry[] {
  const snapshot = useSyncExternalStore(subscribe, getEntriesSnapshot, getServerSnapshot);
  if (!snapshot) return [];
  try { return read(); } catch { return []; }
}

