"use client";
import { brand } from "@/content/site";
import { useI18n } from "@/lib/i18n";
import { useShowroom } from "@/lib/store";
import Compass from "./Compass";

const SECTIONS = [
  { id: "view", key: "view" },
  { id: "lotes", key: "lots" },
  { id: "amenidades", key: "amenities" },
  { id: "vizinhanca", key: "neighborhood" },
  { id: "solar", key: "solar" },
] as const;

export default function Hud() {
  const { t, lang, setLang } = useI18n();
  const entered = useShowroom((s) => s.entered);
  const section = useShowroom((s) => s.section);
  const progress = useShowroom((s) => s.progress);

  return (
    <div
      className={`pointer-events-none fixed inset-0 z-40 transition-opacity duration-1000 ${
        entered ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* véus de leitura */}
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[rgba(6,7,13,0.8)] to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[rgba(6,7,13,0.75)] to-transparent" />

      {/* topo */}
      <header className="pointer-events-auto absolute inset-x-0 top-0 flex items-start justify-between p-5 sm:p-7">
        <a href="#view" className="block leading-none">
          <span className="display block text-lg tracking-tight sm:text-xl">{brand.short}</span>
          <span className="kicker mt-1 block">{brand.site.city} · {brand.site.state}</span>
        </a>

        <div className="flex items-center gap-4">
          <div className="mono flex items-center gap-1 text-[10px] uppercase tracking-[0.2em]">
            {(["pt", "en"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-2 py-1 transition-colors ${lang === l ? "text-accent" : "text-muted hover:text-ink"}`}
              >
                {l}
              </button>
            ))}
          </div>
          <a
            href="#contato"
            className="mono hidden rounded-full border border-[rgba(238,241,247,0.22)] px-5 py-2 text-[10px] uppercase tracking-[0.22em] transition-colors hover:border-accent hover:text-accent sm:block"
          >
            {brand.cta.label[lang]}
          </a>
        </div>
      </header>

      {/* navegação lateral */}
      <nav className="pointer-events-auto absolute left-5 top-1/2 hidden -translate-y-1/2 flex-col gap-4 sm:left-7 lg:flex">
        {SECTIONS.map((s) => {
          const active = section === s.id;
          return (
            <a key={s.id} href={`#${s.id}`} className="group flex items-center gap-3">
              <span
                className={`h-px transition-all duration-500 ${active ? "w-8 bg-accent" : "w-4 bg-[rgba(238,241,247,0.3)] group-hover:w-6"}`}
              />
              <span
                className={`mono text-[10px] uppercase tracking-[0.22em] transition-colors ${
                  active ? "text-accent" : "text-muted group-hover:text-ink"
                }`}
              >
                {t.nav[s.key]}
              </span>
            </a>
          );
        })}
      </nav>

      {/* bússola */}
      <div className="absolute right-5 top-1/2 hidden -translate-y-1/2 sm:right-7 lg:block">
        <Compass />
      </div>

      {/* barra de progresso do sobrevoo */}
      <div className="absolute bottom-0 left-0 h-px w-full bg-[rgba(238,241,247,0.08)]">
        <div className="h-px bg-accent/70" style={{ width: `${Math.round(progress * 100)}%` }} />
      </div>

      {/* rodapé do HUD */}
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-5 sm:p-7">
        <span className="mono text-[10px] uppercase tracking-[0.22em] text-muted">
          {brand.site.latitude.toFixed(2)}° / {brand.site.longitude.toFixed(2)}°
        </span>
        <a
          href={brand.cta.whatsapp}
          target="_blank"
          rel="noreferrer"
          className="pointer-events-auto mono text-[10px] uppercase tracking-[0.22em] text-muted transition-colors hover:text-accent"
        >
          {brand.studio}
        </a>
      </div>
    </div>
  );
}
