"use client";
import { neighborhood, brand } from "@/content/site";
import { useI18n } from "@/lib/i18n";
import { round } from "@/lib/math";

export default function Neighborhood() {
  const { t, lang } = useI18n();
  const maxMin = Math.max(...neighborhood.map((n) => n.min));

  return (
    <section id="vizinhanca" className="relative z-10 py-24">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 sm:px-7 lg:grid-cols-2 lg:pl-40 lg:pr-24">
        <div className="relative">
          <div className="scrim pointer-events-none absolute -inset-x-24 -inset-y-24 -z-10" />
          <p className="kicker mb-4">{t.neighTitle}</p>
          <h3 className="display mb-6 text-[clamp(2rem,4vw,3.4rem)]">{t.neighText}</h3>
          <ul className="divide-y divide-[rgba(238,241,247,0.1)] border-y hair">
            {[...neighborhood]
              .sort((a, b) => a.min - b.min)
              .map((n) => (
                <li key={n.id} className="flex items-baseline justify-between py-4">
                  <span className="text-sm text-ink/75">{n.title[lang]}</span>
                  <span className="mono text-[11px] tracking-[0.18em] text-accent">
                    {n.min} {t.minutes}
                  </span>
                </li>
              ))}
          </ul>
        </div>

        <div className="glass rounded-2xl p-6">
          <svg viewBox="-220 -220 440 440" className="w-full">
            {[0.34, 0.62, 0.9].map((f, i) => (
              <g key={f}>
                <circle cx="0" cy="0" r={200 * f} fill="none" stroke="rgba(238,241,247,0.12)" strokeDasharray="2 5" />
                <text
                  x="4"
                  y={-200 * f + 12}
                  fontSize="9"
                  fill="rgba(238,241,247,0.35)"
                  fontFamily="var(--font-mono)"
                  letterSpacing="0.6"
                >
                  {Math.round(maxMin * [0.34, 0.62, 0.9][i])} {t.minutes}
                </text>
              </g>
            ))}
            {neighborhood.map((n) => {
              const ang = Math.atan2(n.y, n.x);
              const r = 40 + (n.min / maxMin) * 158;
              const x = round(Math.cos(ang) * r);
              const y = round(-Math.sin(ang) * r);
              return (
                <g key={n.id}>
                  <line x1="0" y1="0" x2={x} y2={y} stroke="rgba(238,241,247,0.13)" />
                  <circle cx={x} cy={y} r="3.4" fill="var(--accent)" />
                  <text
                    x={x + (x > 0 ? 9 : -9)}
                    y={y + 3.5}
                    textAnchor={x > 0 ? "start" : "end"}
                    fontSize="9.5"
                    fill="rgba(238,241,247,0.7)"
                    fontFamily="var(--font-mono)"
                    letterSpacing="0.4"
                  >
                    {n.title[lang]}
                  </text>
                </g>
              );
            })}
            <circle cx="0" cy="0" r="26" fill="none" stroke="var(--accent-2)" strokeOpacity="0.5" />
            <circle cx="0" cy="0" r="5" fill="var(--accent-2)" />
            <text
              x="0"
              y="-34"
              textAnchor="middle"
              fontSize="10"
              fill="var(--accent-2)"
              fontFamily="var(--font-mono)"
              letterSpacing="1"
            >
              {brand.short.toUpperCase()}
            </text>
          </svg>
        </div>
      </div>
    </section>
  );
}
