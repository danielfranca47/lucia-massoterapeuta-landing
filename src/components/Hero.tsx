"use client";

import { useLang } from "@/i18n/LangProvider";

export default function Hero() {
  const { t } = useLang();

  return (
    <section className="hero">
      <img src="/images/hero.jpg" alt="Terraço ao pôr do sol em Olhão" />
      <div className="hero-content">
        <div className="eyebrow">{t.hero.eyebrow}</div>
        <h1 dangerouslySetInnerHTML={{ __html: t.hero.titleHtml }} />
        <p className="hero-sub">{t.hero.sub}</p>
        <div className="hero-cta">
          <a href="#reservar" className="btn">
            {t.hero.ctaAvailability}
          </a>
          <a href="#servicos" className="btn ghost">
            {t.hero.ctaServices}
          </a>
        </div>
      </div>
      <div className="scroll-cue">{t.hero.scrollCue}</div>
    </section>
  );
}
