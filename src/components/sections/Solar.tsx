"use client";
import { useMemo } from "react";
import { brand } from "@/content/site";
import { useI18n } from "@/lib/i18n";
import { setState, useShowroom } from "@/lib/store";
import { sunPath, sunPosition, MONTHS, OCTANT_LABELS } from "@/lib/solar";
import { round } from "@/lib/math";

/** Projeção estereográfica simples: horizonte na borda, zênite no centro. */
function project(azimuth: number, altitude: number, R = 150) {
  const r = R * (1 - Math.max(0, altitude) / 90);
  const a = ((azimuth - 90) * Math.PI) / 180;
  return [round(Math.cos(a) * r), round(Math.sin(a) * r)] as [number, number];
}

export default function Solar() {
  const { t, lang } = useI18n();
  const month = useShowroom((s) => s.month);
  const hour = useShowroom((s) => s.hour);
  const lat = brand.site.latitude;

  const { pathD, now, dayPaths } = useMemo(() => {
    const pts = sunPath(lat, month, 0.2).filter((p) => p.altitude > -1);
    const d = pts
      .map((p, i) => {
        const [x, y] = project(p.azimuth, p.altitude);
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
    const others = [0, 5, 11].map((m) =>
      sunPath(lat, m, 0.35)
        .filter((p) => p.altitude > -1)
        .map((p, i) => {
          const [x, y] = project(p.azimuth, p.altitude);
          return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(" ")
    );
    return { pathD: d, now: sunPosition(lat, month, hour), dayPaths: others };
  }, [lat, month, hour]);

  const above = now.altitude > 0;
  const [sx, sy] = project(now.azimuth, Math.max(now.altitude, 0));
  const octant = Math.round(now.azimuth / 45) % 8;

  return (
    <section id="solar" className="relative z-10 py-24">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 sm:px-7 lg:grid-cols-[0.9fr_1.1fr] lg:pl-40 lg:pr-24">
        <div className="relative">
          <div className="scrim pointer-events-none absolute -inset-x-24 -inset-y-24 -z-10" />
          <p className="kicker mb-4">{t.solarTitle}</p>
          <h3 className="display mb-6 text-[clamp(2rem,4vw,3.4rem)]">{t.solarText}</h3>

          <div className="space-y-8">
            <div>
              <div className="mb-3 flex items-baseline justify-between">
                <span className="kicker">{t.month}</span>
                <span className="mono text-sm tracking-[0.2em] text-accent">{MONTHS[lang][month]}</span>
              </div>
              <input
                type="range"
                min={0}
                max={11}
                step={1}
                value={month}
                onChange={(e) => setState({ month: Number(e.target.value) })}
                className="h-px w-full appearance-none bg-[rgba(238,241,247,0.2)] accent-[var(--accent)]"
              />
              <div className="mono mt-2 flex justify-between text-[9px] uppercase tracking-[0.16em] text-muted">
                {MONTHS[lang].map((m) => (
                  <span key={m}>{m[0]}</span>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-baseline justify-between">
                <span className="kicker">{t.hour}</span>
                <span className="mono text-sm tracking-[0.2em] text-accent">
                  {String(Math.floor(hour)).padStart(2, "0")}:{String(Math.round((hour % 1) * 60)).padStart(2, "0")}
                </span>
              </div>
              <input
                type="range"
                min={4}
                max={20}
                step={0.25}
                value={hour}
                onChange={(e) => setState({ hour: Number(e.target.value) })}
                className="h-px w-full appearance-none bg-[rgba(238,241,247,0.2)] accent-[var(--accent)]"
              />
            </div>

            <div className="grid grid-cols-3 gap-6 border-t hair pt-6">
              <div>
                <p className="kicker mb-1">{t.azimuth}</p>
                <p className="display text-2xl">{Math.round(now.azimuth)}°</p>
              </div>
              <div>
                <p className="kicker mb-1">{t.altitude}</p>
                <p className="display text-2xl">{Math.round(now.altitude)}°</p>
              </div>
              <div>
                <p className="kicker mb-1">{lang === "pt" ? "Direção" : "Direction"}</p>
                <p className="display text-2xl text-accent">
                  {above ? OCTANT_LABELS[lang][octant] : "—"}
                </p>
              </div>
            </div>
            {!above && <p className="mono text-[10px] uppercase tracking-[0.2em] text-muted">{t.night}</p>}
          </div>
        </div>

        <div className="glass rounded-2xl p-6">
          <svg viewBox="-180 -180 360 360" className="w-full">
            <circle cx="0" cy="0" r="150" fill="rgba(78,201,214,0.04)" stroke="rgba(238,241,247,0.16)" />
            <circle cx="0" cy="0" r="100" fill="none" stroke="rgba(238,241,247,0.08)" strokeDasharray="2 6" />
            <circle cx="0" cy="0" r="50" fill="none" stroke="rgba(238,241,247,0.08)" strokeDasharray="2 6" />
            {OCTANT_LABELS[lang].map((l, i) => {
              const a = ((i * 45 - 90) * Math.PI) / 180;
              return (
                <text
                  key={l}
                  x={round(Math.cos(a) * 166)}
                  y={round(Math.sin(a) * 166 + 4)}
                  textAnchor="middle"
                  fontSize={i === 0 ? 12 : 10}
                  fill={i === 0 ? "var(--accent)" : "rgba(238,241,247,0.45)"}
                  fontFamily="var(--font-mono)"
                >
                  {l}
                </text>
              );
            })}
            {dayPaths.map((d, i) => (
              <path key={i} d={d} fill="none" stroke="rgba(238,241,247,0.14)" strokeWidth="0.8" />
            ))}
            <path d={pathD} fill="none" stroke="var(--accent)" strokeWidth="1.4" strokeOpacity="0.85" />
            {above && (
              <g>
                <circle cx={sx} cy={sy} r="14" fill="var(--accent)" opacity="0.12" />
                <circle cx={sx} cy={sy} r="6" fill="var(--accent)" />
                <line x1="0" y1="0" x2={sx} y2={sy} stroke="var(--accent)" strokeOpacity="0.3" strokeDasharray="3 4" />
              </g>
            )}
            <circle cx="0" cy="0" r="2.5" fill="rgba(238,241,247,0.5)" />
          </svg>
          <p className="mono mt-4 text-center text-[10px] uppercase tracking-[0.2em] text-muted">
            {lang === "pt" ? "O sobrevoo ao fundo acompanha o sol em tempo real" : "The flyover behind follows the sun in real time"}
          </p>
        </div>
      </div>
    </section>
  );
}
