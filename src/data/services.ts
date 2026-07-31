export interface Service {
  name: { pt: string; en: string };
  price: number;
  location: { pt: string; en: string };
  days: number[]; // 0=dom..6=sáb, mesmo formato de Date#getDay()
  /** Duração real da sessão, em minutos — usada pra cruzar com a agenda. */
  durationMinutes: number;
  /** Expediente do serviço: janela de horários de início possíveis. */
  workWindow: { start: string; end: string }; // "HH:MM"
}

export type ServiceKey = "premium" | "sunset" | "couple";
export type Services = Record<ServiceKey, Service>;

export const SERVICE_ORDER: ServiceKey[] = ["premium", "sunset", "couple"];

export const SERVICES: Services = {
  premium: {
    name: { pt: "Premium Massage — Faro", en: "Premium Massage — Faro" },
    price: 85,
    location: { pt: "Gabinete privado, Faro", en: "Private studio, Faro" },
    days: [1, 2, 3, 4, 5, 6, 0],
    durationMinutes: 60,
    workWindow: { start: "10:00", end: "20:00" },
  },
  sunset: {
    name: { pt: "Sunset Amazon Massage — Olhão", en: "Sunset Amazon Massage — Olhão" },
    price: 55,
    location: { pt: "Terraço, Olhão", en: "Terrace, Olhão" },
    days: [5, 6, 0],
    durationMinutes: 30,
    workWindow: { start: "19:30", end: "20:30" },
  },
  couple: {
    name: { pt: "Amazon Relax Premium — Casal", en: "Amazon Relax Premium — Couple" },
    price: 170,
    location: { pt: "Rooftop privado, Olhão", en: "Private rooftop, Olhão" },
    days: [5, 6, 0],
    durationMinutes: 60,
    workWindow: { start: "18:00", end: "20:00" },
  },
};
