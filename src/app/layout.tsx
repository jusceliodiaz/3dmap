import type { Metadata, Viewport } from "next";
import "./globals.css";
import { brand } from "@/content/site";
import { I18nProvider } from "@/lib/i18n";

/* Para usar fontes web (requer internet no build):
import { Cormorant_Garamond, Inter, JetBrains_Mono } from "next/font/google";
const display = Cormorant_Garamond({ subsets: ["latin"], weight: ["300","400"], variable: "--font-display" });
*/

export const metadata: Metadata = {
  title: `${brand.full} — Showroom Digital`,
  description:
    "Showroom digital imersivo: sobrevoe o masterplan, explore os lotes disponíveis, as amenidades, a vizinhança e o estudo solar em uma experiência cinematográfica.",
  openGraph: {
    title: `${brand.full} — Showroom Digital`,
    description: "Sobrevoe o loteamento, escolha seu lote e acompanhe o sol durante o ano.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: brand.colors.bg,
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full text-ink">
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
