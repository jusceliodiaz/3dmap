"use client";
import { useState } from "react";
import { brand } from "@/content/site";
import { useI18n } from "@/lib/i18n";

export default function Contact() {
  const { t, lang } = useI18n();
  const [sent, setSent] = useState(false);

  return (
    <section id="contato" className="relative z-10 py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-7 lg:pl-40 lg:pr-24">
        <div className="glass grid gap-10 rounded-2xl p-8 sm:p-12 lg:grid-cols-2">
          <div>
            <p className="kicker mb-4">{brand.short}</p>
            <h3 className="display mb-5 text-[clamp(2rem,4vw,3.2rem)]">{t.contactTitle}</h3>
            <p className="max-w-md text-sm leading-relaxed text-ink/60">{t.contactText}</p>
            <a
              href={brand.cta.whatsapp}
              target="_blank"
              rel="noreferrer"
              className="mono mt-8 inline-block rounded-full border border-accent px-7 py-3 text-[10px] uppercase tracking-[0.22em] text-accent transition-colors hover:bg-accent hover:text-bg"
            >
              WhatsApp
            </a>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              // TODO: conectar ao seu CRM / endpoint (ver README)
              setSent(true);
            }}
            className="space-y-5"
          >
            {([
              ["name", t.name, "text"],
              ["email", t.email, "email"],
              ["phone", t.phone, "tel"],
            ] as const).map(([k, label, type]) => (
              <label key={k} className="block">
                <span className="kicker mb-2 block">{label}</span>
                <input
                  required={k !== "phone"}
                  type={type}
                  name={k}
                  className="w-full border-b hair bg-transparent py-2 text-sm outline-none transition-colors focus:border-accent"
                />
              </label>
            ))}
            <label className="block">
              <span className="kicker mb-2 block">{t.message}</span>
              <textarea
                name="message"
                rows={3}
                className="w-full resize-none border-b hair bg-transparent py-2 text-sm outline-none transition-colors focus:border-accent"
              />
            </label>
            <button
              type="submit"
              className="mono w-full rounded-full bg-accent px-7 py-3 text-[10px] uppercase tracking-[0.22em] text-bg transition-opacity hover:opacity-85"
            >
              {sent ? t.sent : t.send}
            </button>
          </form>
        </div>

        <footer className="mono mt-10 flex flex-wrap items-center justify-between gap-4 border-t hair pt-6 text-[10px] uppercase tracking-[0.2em] text-muted">
          <span>
            © {new Date().getFullYear()} {brand.full}
          </span>
          <span>
            {t.madeBy} <span className="text-ink/70">{brand.studio}</span>
          </span>
          <span>{lang === "pt" ? "Imagens meramente ilustrativas" : "Illustrative images only"}</span>
        </footer>
      </div>
    </section>
  );
}
