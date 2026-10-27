"use client";
import { createContext, useContext, useState, type ReactNode } from "react";
import { dict, type Lang, type Dict } from "@/content/site";

const Ctx = createContext<{ lang: Lang; t: Dict; setLang: (l: Lang) => void }>({
  lang: "pt",
  t: dict.pt,
  setLang: () => {},
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("pt");
  return <Ctx.Provider value={{ lang, t: dict[lang] as Dict, setLang }}>{children}</Ctx.Provider>;
}

export const useI18n = () => useContext(Ctx);
