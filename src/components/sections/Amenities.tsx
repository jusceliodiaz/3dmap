"use client";
import { amenities } from "@/content/site";
import { useI18n } from "@/lib/i18n";

const ICONS: Record<string, string> = {
  water: "M2 16c3 0 3-3 6-3s3 3 6 3 3-3 6-3M2 9c3 0 3-3 6-3s3 3 6 3 3-3 6-3",
  house: "M3 11l9-7 9 7M6 10v9h12v-9",
  trail: "M4 20c4-2 3-7 7-8s5-4 9-6M8 12l.01 0M14 7l.01 0",
  sport: "M4 4h16v16H4zM12 4v16M4 12h16",
  pet: "M9 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM17 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM6 20c0-4 3-6 6-6s6 2 6 6",
  view: "M3 19l6-9 4 5 3-4 5 8zM8 6a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z",
};

export default function Amenities() {
  const { t, lang } = useI18n();
  return (
    <section id="amenidades" className="relative z-10 py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-7 lg:pl-40 lg:pr-24">
        <div className="relative mb-10 max-w-2xl"><div className="scrim pointer-events-none absolute -inset-x-24 -inset-y-24 -z-10" />
          <p className="kicker mb-4">{t.amenTitle}</p>
          <h3 className="display text-[clamp(2rem,4vw,3.4rem)]">{t.amenText}</h3>
        </div>

        <div className="grid gap-px overflow-hidden rounded-2xl border hair bg-[rgba(238,241,247,0.1)] sm:grid-cols-2 lg:grid-cols-3">
          {amenities.map((a) => (
            <article
              key={a.id}
              className="group relative flex min-h-[260px] flex-col justify-between bg-[rgba(9,11,20,0.66)] p-7 backdrop-blur-xl transition-colors duration-500 hover:bg-[rgba(20,24,38,0.78)]"
            >
              <div className="flex items-start justify-between">
                <svg viewBox="0 0 24 24" className="h-7 w-7 stroke-accent" fill="none" strokeWidth="1.1">
                  <path d={ICONS[a.icon]} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="mono text-[10px] uppercase tracking-[0.2em] text-muted">{a.meta[lang]}</span>
              </div>
              <div>
                <h4 className="display mb-3 text-2xl">{a.title[lang]}</h4>
                <p className="text-sm leading-relaxed text-ink/60">{a.text[lang]}</p>
              </div>
              <span className="absolute inset-x-0 bottom-0 h-px w-0 bg-accent transition-all duration-700 group-hover:w-full" />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
