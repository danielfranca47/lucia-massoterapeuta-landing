"use client";

import { useLang } from "@/i18n/LangProvider";
import { INSTAGRAM_HANDLE, INSTAGRAM_URL } from "@/data/contact";

export default function Social() {
  const { t } = useLang();

  return (
    <section className="social">
      <div className="wrap">
        <div className="eyebrow">{t.social.eyebrow}</div>
        <p className="quote">{t.social.quote}</p>
        <div className="quote-attr">{t.social.quoteAttr}</div>
        <div className="ig-strip">
          <a
            className="ig-card"
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener"
          >
            <div className="ig-icn">◎</div>
            <div>{t.social.igReels}</div>
          </a>
          <a
            className="ig-card"
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener"
          >
            <div className="ig-icn">@</div>
            <div>{INSTAGRAM_HANDLE}</div>
          </a>
        </div>
      </div>
    </section>
  );
}
