import type { Service } from "@/data/services";
import { generateSlotsForDay, type BusyInterval } from "@/lib/availability";

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
  busy: BusyInterval[],
  now: Date = new Date(),
): CalendarCell[] {
  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7; // grade começa na segunda-feira
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const cells: CalendarCell[] = [];
  for (let i = 0; i < startOffset; i++) {
    cells.push({ kind: "blank" });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const isPast = date < todayMidnight;
    let availability: "none" | "available" | "full" = "none";

    if (service && !isPast) {
      const dow = date.getDay();
      if (service.days.includes(dow)) {
        const openSlots = generateSlotsForDay(service, date, busy, now);
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
