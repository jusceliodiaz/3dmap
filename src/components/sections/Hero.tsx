"use client";
import { brand, stats } from "@/content/site";
import { summary } from "@/content/masterplan";
import { useI18n } from "@/lib/i18n";
import { useShowroom } from "@/lib/store";

export default function Hero() {
  const { t, lang } = useI18n();
  const entered = useShowroom((s) => s.entered);
  const progress = useShowroom((s) => s.progress);

  const items = [
    { value: String(summary.total), label: lang === "pt" ? "lotes" : "lots" },
    { value: `${summary.avgArea} m²`, label: lang === "pt" ? "lote médio" : "average lot" },
    ...stats.slice(2).map((s) => ({ value: s.value, label: s.label[lang] })),
  ];

  return (
    <section id="view" className="relative z-10 flex min-h-[100svh] flex-col justify-end">
      <div
        className={`relative px-5 pb-32 sm:px-7 lg:pl-44 lg:pr-24 transition-all duration-1000 ${
          entered ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
        }`}
        style={{ opacity: entered ? Math.max(0, 1 - progress * 6) : 0 }}
      >
        <div className="scrim pointer-events-none absolute -inset-x-24 -inset-y-28 -z-10" />
        <p className="kicker mb-5">{t.heroKicker} · {brand.short}</p>
        <h2 className="display max-w-4xl whitespace-pre-line text-[clamp(2.6rem,7vw,5.6rem)]">
          {t.heroTitle}
        </h2>
        <p className="mt-7 max-w-xl text-sm leading-relaxed text-ink/70 sm:text-base">{t.heroText}</p>

        <div className="mt-12 flex flex-wrap gap-x-12 gap-y-6 border-t hair pt-6">
          {items.map((s) => (
            <div key={s.label}>
              <div className="display text-2xl text-accent sm:text-3xl">{s.value}</div>
              <div className="kicker mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div
        className="pointer-events-none absolute inset-x-0 bottom-4 flex flex-col items-center gap-3 transition-opacity duration-700"
        style={{ opacity: entered ? Math.max(0, 1 - progress * 14) : 0 }}
      >
        <span className="mono text-[10px] uppercase tracking-[0.24em] text-muted">{t.scrollHint}</span>
        <span className="h-10 w-px bg-gradient-to-b from-accent to-transparent" />
      </div>
    </section>
  );
}
