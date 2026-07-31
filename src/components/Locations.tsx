"use client";

import { useLang } from "@/i18n/LangProvider";
import { MAPS_FARO_URL } from "@/data/contact";

export default function Locations() {
  const { t } = useLang();

  return (
    <section id="locais">
      <div className="wrap">
        <div className="section-head">
          <div className="eyebrow">{t.locations.eyebrow}</div>
          <h2>{t.locations.title}</h2>
        </div>
        <div className="locations-grid locations-grid-2">
          <div className="loc-card">
            <div className="eyebrow">{t.locations.faro.eyebrow}</div>
            <h3>{t.locations.faro.title}</h3>
            <p>{t.locations.faro.description}</p>
            <a
              className="maplink"
              href={MAPS_FARO_URL}
              target="_blank"
              rel="noopener"
            >
              {t.locations.faro.linkLabel}
            </a>
          </div>
          <div className="loc-card">
            <div className="eyebrow">{t.locations.olhao.eyebrow}</div>
            <h3>{t.locations.olhao.title}</h3>
            <p>{t.locations.olhao.description}</p>
            <a className="maplink" href="#reservar">
              {t.locations.olhao.linkLabel}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
