"use client";

import { useLang } from "@/i18n/LangProvider";

export default function Ritual() {
  const { t } = useLang();

  return (
    <section className="ritual" id="ritual">
      <div className="wrap">
        <div className="section-head">
          <div className="eyebrow">{t.ritual.eyebrow}</div>
          <h2>{t.ritual.title}</h2>
        </div>
        <div className="ritual-steps">
          {t.ritual.steps.map((step) => (
            <div className="ritual-step" key={step.stage}>
              <div className="stage">{step.stage}</div>
              <h3>{step.title}</h3>
              {"items" in step ? (
                <ul>
                  {step.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p>{step.paragraph}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
