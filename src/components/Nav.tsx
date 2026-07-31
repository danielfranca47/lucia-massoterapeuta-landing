"use client";

import { useLang } from "@/i18n/LangProvider";

export default function Nav() {
  const { lang, setLang, t } = useLang();

  return (
    <header>
      <nav className="wrap">
        <div className="logo">
          Lúcia<span>.</span>
        </div>
        <div className="navlinks">
          <a href="#servicos">{t.nav.services}</a>
          <a href="#ritual">{t.nav.ritual}</a>
          <a href="#locais">{t.nav.locations}</a>
          <a href="#reservar">{t.nav.book}</a>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div className="lang-toggle">
            <button
              className={lang === "pt" ? "active" : undefined}
              onClick={() => setLang("pt")}
              type="button"
            >
              PT
            </button>
            <button
              className={lang === "en" ? "active" : undefined}
              onClick={() => setLang("en")}
              type="button"
            >
              EN
            </button>
          </div>
          <a href="#reservar" className="btn">
            {t.nav.bookCta}
          </a>
        </div>
      </nav>
    </header>
  );
}
