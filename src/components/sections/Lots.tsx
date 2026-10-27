"use client";
import { useMemo, useState } from "react";
import { lots, lakePolygon, ringPolyline, summary, amenitySpots, type LotStatus } from "@/content/masterplan";
import { amenities } from "@/content/site";
import { useI18n } from "@/lib/i18n";
import { setState, useShowroom } from "@/lib/store";
import { OCTANT_LABELS } from "@/lib/solar";

const path = (pts: [number, number][], close = true) =>
  pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ") + (close ? " Z" : "");

const STATUS_FILL: Record<LotStatus, string> = {
  available: "var(--accent)",
  reserved: "var(--accent-2)",
  sold: "#5a6076",
};

export default function Lots() {
  const { t, lang } = useI18n();
  const focus = useShowroom((s) => s.focusLot);
  const [filter, setFilter] = useState<LotStatus | "all">("all");
  const [minArea, setMinArea] = useState(summary.minArea);

  const visible = useMemo(
    () => lots.filter((l) => (filter === "all" || l.status === filter) && l.area >= minArea),
    [filter, minArea]
  );
  const visibleIds = useMemo(() => new Set(visible.map((l) => l.id)), [visible]);
  const selected = lots.find((l) => l.id === focus) ?? null;

  const counts: { key: LotStatus | "all"; label: string; n: number }[] = [
    { key: "all", label: t.filterAll, n: summary.total },
    { key: "available", label: t.available, n: summary.available },
    { key: "reserved", label: t.reserved, n: summary.reserved },
    { key: "sold", label: t.sold, n: summary.sold },
  ];

  return (
    <section id="lotes" className="relative z-10 py-24">
      <div className="mx-auto grid max-w-7xl gap-6 px-5 sm:px-7 lg:grid-cols-[1.25fr_0.75fr] lg:pl-40 lg:pr-24">
        {/* mapa */}
        <div className="glass rounded-2xl p-4 sm:p-6">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="kicker mb-2">{t.lotsTitle}</p>
              <p className="max-w-md text-sm text-ink/65">{t.lotsText}</p>
            </div>
            <div className="mono flex flex-wrap gap-1 text-[10px] uppercase tracking-[0.18em]">
              {counts.map((c) => (
                <button
                  key={c.key}
                  onClick={() => setFilter(c.key)}
                  className={`rounded-full border px-3 py-1.5 transition-colors ${
                    filter === c.key
                      ? "border-accent text-accent"
                      : "border-[rgba(238,241,247,0.16)] text-muted hover:text-ink"
                  }`}
                >
                  {c.label} <span className="opacity-50">{c.n}</span>
                </button>
              ))}
            </div>
          </div>

          <svg viewBox="-300 -300 600 600" className="mx-auto aspect-square w-full max-h-[62vh] touch-none">
            <g transform="scale(1,-1)">
              {/* vias */}
              {[14, 68, 112, 156].map((o) => (
                <path
                  key={o}
                  d={path(ringPolyline(o, 120))}
                  fill="none"
                  stroke="rgba(238,241,247,0.13)"
                  strokeWidth={o === 14 ? 5 : 4}
                />
              ))}
              {/* lago */}
              <path d={path(lakePolygon)} fill="rgba(78,201,214,0.16)" stroke="var(--accent-2)" strokeWidth="0.8" />

              {/* lotes */}
              {lots.map((l) => {
                const on = visibleIds.has(l.id);
                const isSel = focus === l.id;
                return (
                  <path
                    key={l.id}
                    d={path(l.polygon)}
                    fill={isSel ? "#fff" : STATUS_FILL[l.status]}
                    fillOpacity={isSel ? 0.95 : on ? (l.status === "sold" ? 0.16 : 0.4) : 0.05}
                    stroke={isSel ? "#fff" : STATUS_FILL[l.status]}
                    strokeOpacity={on ? 0.75 : 0.12}
                    strokeWidth="0.7"
                    className="cursor-pointer transition-[fill-opacity] duration-200 hover:fill-opacity-80"
                    onMouseEnter={() => setState({ hoverLot: l.id })}
                    onMouseLeave={() => setState({ hoverLot: null })}
                    onClick={() => setState({ focusLot: isSel ? null : l.id })}
                  >
                    <title>{`${t.lot} ${l.id} — ${l.area} m²`}</title>
                  </path>
                );
              })}

              {/* amenidades */}
              {Object.entries(amenitySpots).map(([key, s]) => (
                <g key={key}>
                  <circle cx={s.x} cy={s.y} r="7" fill="none" stroke="var(--accent)" strokeOpacity="0.55" strokeWidth="0.8" />
                  <circle cx={s.x} cy={s.y} r="2" fill="var(--accent)" />
                </g>
              ))}
            </g>
            {/* rótulos das amenidades (fora do flip para não espelhar o texto) */}
            {Object.entries(amenitySpots).map(([key, s]) => {
              const a = amenities.find((x) => x.id === key);
              if (!a) return null;
              return (
                <text
                  key={key}
                  x={s.x}
                  y={-s.y - 12}
                  textAnchor="middle"
                  fontSize="9"
                  fill="rgba(238,241,247,0.72)"
                  fontFamily="var(--font-mono)"
                  letterSpacing="0.6"
                  stroke="rgba(6,7,13,0.9)"
                  strokeWidth="2.6"
                  paintOrder="stroke"
                >
                  {a.title[lang].toUpperCase()}
                </text>
              );
            })}
          </svg>

          <div className="mt-4 flex items-center gap-4 border-t hair pt-4">
            <span className="mono text-[10px] uppercase tracking-[0.2em] text-muted">
              {t.area} ≥ {minArea} m²
            </span>
            <input
              type="range"
              min={summary.minArea}
              max={summary.maxArea}
              value={minArea}
              onChange={(e) => setMinArea(Number(e.target.value))}
              className="h-px flex-1 appearance-none bg-[rgba(238,241,247,0.2)] accent-[var(--accent)]"
            />
            <span className="mono text-[10px] tracking-[0.2em] text-accent">{visible.length}</span>
          </div>
        </div>

        {/* ficha do lote */}
        <div className={`glass flex-col rounded-2xl p-6 ${selected ? "flex" : "hidden lg:flex"}`}>
          {selected ? (
            <div className="fade-up flex h-full flex-col">
              <div className="flex items-start justify-between">
                <div>
                  <p className="kicker mb-2">
                    {t.block} {selected.block}
                  </p>
                  <h3 className="display text-5xl">{selected.id}</h3>
                </div>
                <span
                  className="mono rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.18em]"
                  style={{
                    color: STATUS_FILL[selected.status],
                    border: `1px solid ${STATUS_FILL[selected.status]}`,
                  }}
                >
                  {t[selected.status]}
                </span>
              </div>

              <dl className="mt-8 grid grid-cols-2 gap-y-6">
                {[
                  [t.area, `${selected.area} m²`],
                  [t.front, `${selected.front} m`],
                  [t.facing, OCTANT_LABELS[lang][selected.octant]],
                  [t.view, selected.lakeView ? (lang === "pt" ? "Lago" : "Lake") : lang === "pt" ? "Bosque" : "Grove"],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="kicker mb-1">{k}</dt>
                    <dd className="display text-2xl">{v}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-8 border-t hair pt-6 text-sm text-ink/60">
                <p>
                  {lang === "pt"
                    ? `Testada voltada a ${OCTANT_LABELS.pt[selected.octant]} — sol da tarde ${
                        [3, 4, 5, 6].includes(selected.octant) ? "direto sobre o fundo" : "lateral"
                      }.`
                    : `Frontage facing ${OCTANT_LABELS.en[selected.octant]} — afternoon sun ${
                        [3, 4, 5, 6].includes(selected.octant) ? "straight onto the back yard" : "from the side"
                      }.`}
                </p>
              </div>

              <div className="mt-auto flex gap-3 pt-8">
                <a
                  href="#contato"
                  className="mono flex-1 rounded-full border border-accent px-5 py-3 text-center text-[10px] uppercase tracking-[0.22em] text-accent transition-colors hover:bg-accent hover:text-bg"
                >
                  {lang === "pt" ? "Reservar este lote" : "Reserve this lot"}
                </a>
                <button
                  onClick={() => setState({ focusLot: null })}
                  className="mono rounded-full border border-[rgba(238,241,247,0.18)] px-5 py-3 text-[10px] uppercase tracking-[0.22em] text-muted hover:text-ink"
                >
                  ✕
                </button>
              </div>
            </div>
          ) : (
            <div className="flex h-full min-h-[320px] flex-col justify-center gap-4 text-center">
              <p className="display text-3xl text-ink/40">
                {lang === "pt" ? "Selecione um lote" : "Select a lot"}
              </p>
              <p className="mx-auto max-w-xs text-sm text-ink/45">
                {lang === "pt"
                  ? "A câmera do sobrevoo acompanha a sua escolha em tempo real."
                  : "The flyover camera follows your choice in real time."}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
