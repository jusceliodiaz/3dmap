"use client";
import { useShowroom } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { OCTANT_LABELS } from "@/lib/solar";
import { round } from "@/lib/math";

export default function Compass() {
  const bearing = useShowroom((s) => s.bearing);
  const { lang } = useI18n();
  const labels = OCTANT_LABELS[lang];

  return (
    <div className="relative h-[94px] w-[94px] select-none">
      <svg viewBox="0 0 100 100" className="h-full w-full">
        <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(238,241,247,0.14)" />
        <circle cx="50" cy="50" r="33" fill="none" stroke="rgba(238,241,247,0.07)" />
        <g style={{ transform: `rotate(${-bearing}deg)`, transformOrigin: "50px 50px", transition: "transform 120ms linear" }}>
          {labels.map((l, i) => {
            const a = ((i * 45 - 90) * Math.PI) / 180;
            const x = round(50 + Math.cos(a) * 42);
            const y = round(50 + Math.sin(a) * 42);
            return (
              <text
                key={l}
                x={x}
                y={y + 2.6}
                textAnchor="middle"
                fontSize={i % 2 ? 5.4 : 7}
                fill={i === 0 ? "var(--accent)" : "rgba(238,241,247,0.55)"}
                fontFamily="var(--font-mono)"
                letterSpacing="0.5"
              >
                {l}
              </text>
            );
          })}
          {Array.from({ length: 72 }).map((_, i) => {
            const a = ((i * 5 - 90) * Math.PI) / 180;
            const r1 = i % 9 === 0 ? 27 : 30;
            return (
              <line
                key={i}
                x1={round(50 + Math.cos(a) * r1)}
                y1={round(50 + Math.sin(a) * r1)}
                x2={round(50 + Math.cos(a) * 32)}
                y2={round(50 + Math.sin(a) * 32)}
                stroke="rgba(238,241,247,0.22)"
                strokeWidth="0.5"
              />
            );
          })}
        </g>
        <path d="M50 14 L46.5 22 L53.5 22 Z" fill="var(--accent)" />
      </svg>
      <span className="mono absolute inset-0 flex items-center justify-center text-[11px] tracking-[0.12em] text-ink/80">
        {String(Math.round(bearing)).padStart(3, "0")}°
      </span>
    </div>
  );
}
