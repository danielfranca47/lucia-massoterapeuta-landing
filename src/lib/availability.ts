import type { Service } from "@/data/services";

export interface BusyInterval {
  start: string; // ISO datetime
  end: string; // ISO datetime
}

// Folga mínima entre o fim de um atendimento e o início do próximo (e antes
// do primeiro do dia) — decisão do negócio, ver "Decisões confirmadas" em
// docs/implementations/sincronizacao-google-agenda.md.
export const BUFFER_MINUTES = 30;

// Intervalo de varredura pra gerar candidatos a horário de início dentro do
// expediente — mesmo valor da folga, cobre os expedientes reais de hoje.
export const SLOT_GRANULARITY_MINUTES = 30;

function parseHHMM(value: string, base: Date): Date {
  const [hours, minutes] = value.split(":").map(Number);
  return new Date(base.getFullYear(), base.getMonth(), base.getDate(), hours, minutes);
}

function formatHHMM(date: Date): string {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

/**
 * Gera os horários de início realmente disponíveis pra um serviço num dia,
 * varrendo o expediente do serviço em passos de `SLOT_GRANULARITY_MINUTES`
 * e descartando qualquer horário cuja janela (duração da sessão + folga de
 * `BUFFER_MINUTES` antes/depois) sobreponha um intervalo ocupado da agenda.
 */
export function generateSlotsForDay(
  service: Service,
  date: Date,
  busy: BusyInterval[],
  now: Date = new Date(),
): string[] {
  const windowStart = parseHHMM(service.workWindow.start, date);
  const windowEnd = parseHHMM(service.workWindow.end, date);
  const durationMs = service.durationMinutes * 60_000;
  const bufferMs = BUFFER_MINUTES * 60_000;
  const stepMs = SLOT_GRANULARITY_MINUTES * 60_000;

  const busyRanges = busy.map((interval) => ({
    start: new Date(interval.start),
    end: new Date(interval.end),
  }));

  const slots: string[] = [];
  for (
    let slotStart = windowStart;
    slotStart.getTime() + durationMs <= windowEnd.getTime();
    slotStart = new Date(slotStart.getTime() + stepMs)
  ) {
    if (slotStart < now) continue;

    const slotEnd = new Date(slotStart.getTime() + durationMs);
    const bufferedStart = new Date(slotStart.getTime() - bufferMs);
    const bufferedEnd = new Date(slotEnd.getTime() + bufferMs);

    const overlapsBusy = busyRanges.some(
      (busyRange) => bufferedStart < busyRange.end && busyRange.start < bufferedEnd,
    );

    if (!overlapsBusy) {
      slots.push(formatHHMM(slotStart));
    }
  }

  return slots;
}
