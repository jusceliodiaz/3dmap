"use client";
import { useEffect } from "react";
import { setState } from "@/lib/store";

/** Traduz a rolagem da página em progresso do sobrevoo + seção ativa. */
export default function ScrollDriver({ sections }: { sections: string[] }) {
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const max = document.body.scrollHeight - window.innerHeight;
        setState({ progress: max > 0 ? Math.min(1, window.scrollY / max) : 0 });
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          setState({ section: e.target.id });
          // ao sair da seção de lotes a câmera volta ao roteiro do sobrevoo
          if (e.target.id !== "lotes") setState({ focusLot: null });
        });
      },
      { rootMargin: "-45% 0px -45% 0px" }
    );
    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });

    return () => {
      window.removeEventListener("scroll", onScroll);
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [sections]);

  return null;
}
