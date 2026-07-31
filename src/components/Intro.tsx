"use client";

import { useLang } from "@/i18n/LangProvider";

export default function Intro() {
  const { t } = useLang();

  return (
    <section className="intro">
      <div className="wrap intro-grid">
        <div className="intro-media">
          <img
            src="/images/intro.jpg"
            alt="Pôr do sol visto do terraço, com chás servidos"
          />
          <div className="tag">{t.intro.tag}</div>
        </div>
        <div className="intro-text">
          <div className="eyebrow">{t.intro.eyebrow}</div>
          <h3>{t.intro.quote}</h3>
          <p>{t.intro.p1}</p>
          <p>{t.intro.p2}</p>
          <div className="credentials">
            {t.intro.credentials.map((credential) => (
              <div className="credential" key={credential.label}>
                <div className="num">{credential.num}</div>
                <div className="label">{credential.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
