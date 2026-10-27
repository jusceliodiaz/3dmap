"use client";
import { useEffect, useState } from "react";
import { brand } from "@/content/site";
import { useI18n } from "@/lib/i18n";
import { useShowroom, setState } from "@/lib/store";

export default function Preloader() {
  const { t } = useI18n();
  const ready = useShowroom((s) => s.ready);
  const [pct, setPct] = useState(0);
  const entered = useShowroom((s) => s.entered);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    if (ready) {
      setPct(100);
      return;
    }
    const t0 = performance.now();
    let raf = 0;
    const loop = () => {
      const e = (performance.now() - t0) / 1000;
      // curva assintótica: sobe rápido e desacelera até 92%
      setPct(Math.min(92, Math.round(92 * (1 - Math.exp(-e / 1.6)))));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [ready]);

  useEffect(() => {
    if (!entered) return;
    const id = setTimeout(() => setGone(true), 1100);
    return () => clearTimeout(id);
  }, [entered]);

  if (gone) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-bg transition-opacity duration-1000 ${
        entered ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <div className="flex flex-col items-center gap-10 px-6 text-center">
        <div>
          <p className="kicker mb-4">{brand.studio}</p>
          <h1 className="display text-4xl sm:text-6xl">{brand.full}</h1>
        </div>

        <div className="w-[min(420px,80vw)]">
          <div className="mono mb-3 flex justify-between text-[10px] uppercase tracking-[0.24em] text-muted">
            <span>{ready ? t.loading : t.loadingSeq}</span>
            <span>{String(pct).padStart(2, "0")}%</span>
          </div>
          <div className="h-px w-full bg-[rgba(238,241,247,0.14)]">
            <div
              className="h-px bg-accent transition-[width] duration-200 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <button
          disabled={!ready}
          onClick={() => setState({ entered: true })}
          className="mono group relative overflow-hidden rounded-full border border-[rgba(238,241,247,0.2)] px-9 py-3 text-[11px] uppercase tracking-[0.24em] transition-all duration-500 disabled:opacity-25 hover:border-accent hover:text-accent"
        >
          {t.enter}
        </button>
      </div>
    </div>
  );
}
