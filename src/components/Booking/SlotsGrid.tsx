"use client";

import { useLang } from "@/i18n/LangProvider";
import { isTaken } from "@/lib/calendar";
import type { Service, ServiceKey } from "@/data/services";

interface Props {
  service: Service;
  serviceKey: ServiceKey;
  day: number;
  selectedSlot: string | null;
  onSelect: (slot: string) => void;
}

export default function SlotsGrid({ service, serviceKey, day, selectedSlot, onSelect }: Props) {
  const { t } = useLang();

  return (
    <div className="slots">
      <div className="field-label">{t.booking.slotsLabel}</div>
      <div className="slots-grid">
        {service.slots.map((slot) => {
          const taken = isTaken(serviceKey, day, slot);
          const classes = ["slot"];
          if (taken) classes.push("taken");
          if (!taken && selectedSlot === slot) classes.push("selected");
          return (
            <div
              key={slot}
              className={classes.join(" ")}
              onClick={taken ? undefined : () => onSelect(slot)}
            >
              {slot}
            </div>
          );
        })}
      </div>
    </div>
  );
}
