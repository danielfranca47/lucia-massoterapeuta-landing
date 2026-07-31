"use client";

import { useLang } from "@/i18n/LangProvider";
import { useBookingSelection } from "@/components/Booking/BookingSelectionContext";
import type { Dictionary } from "@/i18n/dictionaries/pt";

type ServiceKey = keyof Dictionary["services"]["cards"];

const CARD_IMAGES: Record<ServiceKey, { src: string; alt: string }> = {
  premium: {
    src: "/images/service-premium.jpg",
    alt: "Massagem premium no terraço privado",
  },
  sunset: {
    src: "/images/service-sunset.jpg",
    alt: "Terraço com rede ao pôr do sol em Olhão",
  },
  couple: {
    src: "/images/service-couple.jpg",
    alt: "Duas macas preparadas lado a lado para casal",
  },
};

const CARD_ORDER: ServiceKey[] = ["premium", "sunset", "couple"];

export default function Services() {
  const { t } = useLang();
  const { requestService } = useBookingSelection();
  const cards = t.services.cards;

  return (
    <section id="servicos">
      <div className="wrap">
        <div className="section-head">
          <div className="eyebrow">{t.services.eyebrow}</div>
          <h2>{t.services.title}</h2>
          <p>{t.services.sub}</p>
        </div>
        <div className="services-grid">
          {CARD_ORDER.map((key) => {
            const card = cards[key];
            const image = CARD_IMAGES[key];
            return (
              <div className="service-card" key={key}>
                <div className="service-media">
                  <img
                    src={image.src}
                    alt={image.alt}
                    className={`service-img service-img--${key}`}
                  />
                  <div className="service-price">{card.price}</div>
                  <div className="service-loc">{card.loc}</div>
                </div>
                <div className="service-body">
                  <div className="sub">{card.sub}</div>
                  <h3>{card.title}</h3>
                  <p>{card.description}</p>
                  <div className="service-foot">
                    <span className="service-note">{card.note}</span>
                    <button
                      className="pick-btn"
                      type="button"
                      onClick={() => requestService(key)}
                    >
                      <span>{t.services.bookLabel}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
