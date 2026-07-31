"use client";

import { useLang } from "@/i18n/LangProvider";
import type { Service } from "@/data/services";

interface Props {
  service: Service | null;
  dateLabel: string;
  slot: string | null;
}

export default function SummaryBox({ service, dateLabel, slot }: Props) {
  const { lang, t } = useLang();
  const empty = t.booking.summary.empty;

  return (
    <div className="summary-box">
      <div>
        <span className="k">{t.booking.summary.service}</span>
        <span>{service ? service.name[lang] : empty}</span>
      </div>
      <div>
        <span className="k">{t.booking.summary.location}</span>
        <span>{service ? service.location[lang] : empty}</span>
      </div>
      <div>
        <span className="k">{t.booking.summary.date}</span>
        <span>{dateLabel}</span>
      </div>
      <div>
        <span className="k">{t.booking.summary.time}</span>
        <span>{slot ?? empty}</span>
      </div>
      <div style={{ marginTop: 10 }}>
        <span className="k">{t.booking.summary.total}</span>
        <span className="total">{service ? `${service.price} €` : empty}</span>
      </div>
    </div>
  );
}
