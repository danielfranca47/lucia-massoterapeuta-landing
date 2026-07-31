"use client";

import { useLang } from "@/i18n/LangProvider";
import { INSTAGRAM_URL, MAPS_FARO_URL } from "@/data/contact";

export default function Footer() {
  const { t } = useLang();

  return (
    <footer>
      <div className="wrap footer-grid">
        <div className="footer-brand">
          <div className="logo">
            Lúcia<span>.</span>
          </div>
          <p>{t.footer.brandTagline}</p>
        </div>
        <div>
          <h4>{t.footer.navHeading}</h4>
          <a href="#servicos">{t.nav.services}</a>
          <a href="#ritual">{t.nav.ritual}</a>
          <a href="#locais">{t.nav.locations}</a>
          <a href="#reservar">{t.nav.book}</a>
        </div>
        <div>
          <h4>{t.footer.contactHeading}</h4>
          <a href={INSTAGRAM_URL} target="_blank" rel="noopener">
            Instagram
          </a>
          <a href="#reservar">{t.footer.contactWhatsapp}</a>
          <a href={MAPS_FARO_URL} target="_blank" rel="noopener">
            {t.footer.contactFaroLocation}
          </a>
        </div>
        <div>
          <h4>{t.footer.standardsHeading}</h4>
          <p>{t.footer.standardsDgs}</p>
          <p>{t.footer.standardsDgert}</p>
        </div>
      </div>
      <div className="wrap footer-bottom">
        <span>© 2026 Lúcia Massoterapeuta</span>
        <span>{t.footer.prototypeNotice}</span>
      </div>
    </footer>
  );
}
