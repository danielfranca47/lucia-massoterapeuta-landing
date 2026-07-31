"use client";

import { useLang } from "@/i18n/LangProvider";
import { SERVICES, SERVICE_ORDER, type ServiceKey } from "@/data/services";

interface Props {
  selectedKey: ServiceKey | null;
  onSelect: (key: ServiceKey) => void;
}

export default function ServiceSelect({ selectedKey, onSelect }: Props) {
  const { lang, t } = useLang();

  return (
    <div className="service-select">
      {SERVICE_ORDER.map((key) => {
        const service = SERVICES[key];
        // Preço exibido aqui é o texto de marketing (ex.: "85 €/pessoa" no
        // casal), igual ao card de Services — pode diferir do total real
        // (SERVICES[key].price) usado no resumo, como já era no original.
        const displayPrice = t.services.cards[key].price;
        return (
          <div
            key={key}
            className={`service-opt${selectedKey === key ? " active" : ""}`}
            onClick={() => onSelect(key)}
          >
            <span>{service.name[lang]}</span>
            <span className="opt-price">{displayPrice}</span>
          </div>
        );
      })}
    </div>
  );
}
