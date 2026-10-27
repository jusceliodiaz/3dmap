"use client";
import dynamic from "next/dynamic";
import Preloader from "@/components/Preloader";
import Hud from "@/components/Hud";
import ScrollDriver from "@/components/ScrollDriver";
import Hero from "@/components/sections/Hero";
import Lots from "@/components/sections/Lots";
import Amenities from "@/components/sections/Amenities";
import Neighborhood from "@/components/sections/Neighborhood";
import Solar from "@/components/sections/Solar";
import Contact from "@/components/sections/Contact";

const FlyoverScene = dynamic(() => import("@/components/FlyoverScene"), { ssr: false });

const SECTIONS = ["view", "lotes", "amenidades", "vizinhanca", "solar", "contato"];

export default function Page() {
  return (
    <main className="vignette relative">
      <FlyoverScene />
      <Preloader />
      <Hud />
      <ScrollDriver sections={SECTIONS} />

      <Hero />
      <Lots />
      <Amenities />
      <Neighborhood />
      <Solar />
      <Contact />
    </main>
  );
}
