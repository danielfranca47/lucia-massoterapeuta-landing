"use client";

import { useLang } from "@/i18n/LangProvider";

interface Props {
  slots: string[];
  selectedSlot: string | null;
  onSelect: (slot: string) => void;
}

export default function SlotsGrid({ slots, selectedSlot, onSelect }: Props) {
  const { t } = useLang();

  return (
    <div className="slots">
      <div className="field-label">{t.booking.slotsLabel}</div>
      <div className="slots-grid">
        {slots.map((slot) => {
          const classes = ["slot"];
          if (selectedSlot === slot) classes.push("selected");
          return (
            <div key={slot} className={classes.join(" ")} onClick={() => onSelect(slot)}>
              {slot}
            </div>
          );
        })}
      </div>
    </div>
  );
}
