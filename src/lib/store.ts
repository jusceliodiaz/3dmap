"use client";
import { useSyncExternalStore } from "react";

export type ShowroomState = {
  loadPct: number;
  ready: boolean;      // cena 3D carregada
  entered: boolean;    // usuário iniciou a experiência
  progress: number;    // 0..1 — progresso de scroll da página
  section: string;
  focusLot: string | null;
  hoverLot: string | null;
  month: number;       // 0..11
  hour: number;        // 0..24 (decimal)
  sunAz: number;
  sunAlt: number;
  bearing: number;
};

const state: ShowroomState = {
  loadPct: 0,
  ready: false,
  entered: false,
  progress: 0,
  section: "view",
  focusLot: null,
  hoverLot: null,
  month: 2,
  hour: 16,
  sunAz: 0,
  sunAlt: 0,
  bearing: 0,
};

const listeners = new Set<() => void>();
let snapshot: ShowroomState = { ...state };

export function setState(patch: Partial<ShowroomState>) {
  let changed = false;
  for (const k of Object.keys(patch) as (keyof ShowroomState)[]) {
    if (state[k] !== patch[k]) {
      (state as Record<string, unknown>)[k] = patch[k];
      changed = true;
    }
  }
  if (!changed) return;
  snapshot = { ...state };
  listeners.forEach((l) => l());
}

/** Leitura sem re-render — usado dentro do loop de animação. */
export function getState(): ShowroomState {
  return state;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useShowroom<T>(selector: (s: ShowroomState) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(snapshot),
    () => selector(snapshot)
  );
}
