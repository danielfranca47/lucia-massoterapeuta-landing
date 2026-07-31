import type { Service, ServiceKey } from "@/data/services";

// "Hoje" fixo do protótipo — ver CLAUDE.md "Do protótipo à produção"
export const DEMO_TODAY = new Date(2026, 6, 31);

export function isTaken(serviceKey: string, dayNum: number, slot: string): boolean {
  const seed = (serviceKey.charCodeAt(0) * 31 + dayNum * 7 + Number(slot.replace(":", ""))) % 5;
  return seed === 0;
}

export type CalendarCell =
  | { kind: "blank" }
  | {
      kind: "day";
      day: number;
      isPast: boolean;
      availability: "none" | "available" | "full";
    };

export function getMonthGrid(
  year: number,
  month: number,
  service: Service | null,
  serviceKey: ServiceKey | null,
  today: Date = DEMO_TODAY,
): CalendarCell[] {
  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7; // grade começa na segunda-feira
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: CalendarCell[] = [];
  for (let i = 0; i < startOffset; i++) {
    cells.push({ kind: "blank" });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const isPast = date < today;
    let availability: "none" | "available" | "full" = "none";

    if (service && serviceKey && !isPast) {
      const dow = date.getDay();
      if (service.days.includes(dow)) {
        const openSlots = service.slots.filter((slot) => !isTaken(serviceKey, day, slot));
        availability = openSlots.length > 0 ? "available" : "full";
      }
    }

    cells.push({ kind: "day", day, isPast, availability });
  }

  return cells;
}

export function formatSummaryDate(day: number, monthLabel: string, year: number): string {
  return `${day} ${monthLabel.slice(0, 3).toLowerCase()} ${year}`;
}
