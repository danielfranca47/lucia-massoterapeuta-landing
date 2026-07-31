"use client";

import { useEffect, useReducer, useState } from "react";
import { useLang } from "@/i18n/LangProvider";
import { SERVICES, type ServiceKey } from "@/data/services";
import { formatSummaryDate } from "@/lib/calendar";
import { generateSlotsForDay, type BusyInterval } from "@/lib/availability";
import { buildBookingMessage, buildWhatsAppUrl } from "@/lib/whatsapp";
import { useBookingSelection } from "./BookingSelectionContext";
import ServiceSelect from "./ServiceSelect";
import CalendarPanel from "./CalendarPanel";
import SummaryBox from "./SummaryBox";
import SlotsGrid from "./SlotsGrid";
import BookingForm from "./BookingForm";

export interface BookingState {
  serviceKey: ServiceKey | null;
  currentMonth: Date; // primeiro dia do mês em exibição
  selectedDay: number | null;
  selectedSlot: string | null;
  slotsVisible: boolean;
  hintVisible: boolean;
  hintMode: "initial" | "chooseDay";
}

export type BookingAction =
  | { type: "SELECT_SERVICE"; key: ServiceKey }
  | { type: "CHANGE_MONTH"; delta: number }
  | { type: "SELECT_DAY"; day: number }
  | { type: "SELECT_SLOT"; slot: string };

function currentMonthStart(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

const INITIAL_MONTH = currentMonthStart();

interface AvailabilityState {
  status: "error" | "ready";
  monthKey: string;
  busy: BusyInterval[];
}

function monthKeyOf(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}`;
}

// Texto do hint antes de qualquer serviço ser escolhido: fica sempre em
// português no original (não tem par data-pt/data-en, ao contrário do texto
// que aparece depois de escolher um serviço) — preservado de propósito.
const EMPTY_HINT_INITIAL_PT = "Escolha um serviço e depois um dia disponível no calendário.";

const initialState: BookingState = {
  serviceKey: null,
  currentMonth: INITIAL_MONTH,
  selectedDay: null,
  selectedSlot: null,
  slotsVisible: false,
  hintVisible: true,
  hintMode: "initial",
};

function bookingReducer(state: BookingState, action: BookingAction): BookingState {
  switch (action.type) {
    case "SELECT_SERVICE":
      return {
        ...state,
        serviceKey: action.key,
        selectedDay: null,
        selectedSlot: null,
        slotsVisible: false,
        hintVisible: true,
        hintMode: "chooseDay",
      };
    case "CHANGE_MONTH": {
      const currentMonth = new Date(state.currentMonth);
      currentMonth.setMonth(currentMonth.getMonth() + action.delta);
      // hintVisible/hintMode propositalmente não mudam aqui — replica um
      // comportamento do site original: trocar de mês depois de já ter
      // escolhido um dia esconde os horários mas não traz a dica de volta,
      // até o próximo dia disponível ser clicado. Não é bug desta migração.
      return { ...state, currentMonth, selectedDay: null, selectedSlot: null, slotsVisible: false };
    }
    case "SELECT_DAY":
      return { ...state, selectedDay: action.day, selectedSlot: null, slotsVisible: true, hintVisible: false };
    case "SELECT_SLOT":
      return { ...state, selectedSlot: action.slot };
    default:
      return state;
  }
}

export default function BookingWidget() {
  const { lang, t } = useLang();
  const [state, dispatch] = useReducer(bookingReducer, initialState);
  const [message, setMessage] = useState<{ text: string; tone: "error" | "success" } | null>(null);
  const [availability, setAvailability] = useState<AvailabilityState>({ status: "ready", monthKey: "", busy: [] });
  const { requestedService, clearRequest } = useBookingSelection();

  // Pré-seleciona o serviço quando um card de Services pede reserva
  useEffect(() => {
    if (requestedService) {
      dispatch({ type: "SELECT_SERVICE", key: requestedService });
      clearRequest();
    }
  }, [requestedService, clearRequest]);

  // Busca a disponibilidade real (Google Agenda) do mês visível — a mesma
  // pra qualquer serviço, então depende só do mês, não do serviço escolhido.
  // "Carregando" é derivado (monthKey do último fetch concluído ainda não
  // bate com o mês visível), não um setState síncrono no início do efeito.
  useEffect(() => {
    let cancelled = false;
    const year = state.currentMonth.getFullYear();
    const month = state.currentMonth.getMonth();
    const monthKey = monthKeyOf(state.currentMonth);
    fetch(`/api/availability?year=${year}&month=${month}`)
      .then((res) => {
        if (!res.ok) throw new Error("Falha ao consultar disponibilidade");
        return res.json() as Promise<{ busy: BusyInterval[] }>;
      })
      .then((data) => {
        if (!cancelled) setAvailability({ status: "ready", monthKey, busy: data.busy });
      })
      .catch(() => {
        if (!cancelled) setAvailability({ status: "error", monthKey, busy: [] });
      });
    return () => {
      cancelled = true;
    };
  }, [state.currentMonth]);

  const isAvailabilityLoading = availability.monthKey !== monthKeyOf(state.currentMonth);
  const availabilityStatus: "loading" | "error" | "ready" = isAvailabilityLoading ? "loading" : availability.status;

  const service = state.serviceKey ? SERVICES[state.serviceKey] : null;
  const monthLabel = t.booking.monthNames[state.currentMonth.getMonth()];
  const summaryDate =
    service && state.selectedDay
      ? formatSummaryDate(state.selectedDay, monthLabel, state.currentMonth.getFullYear())
      : t.booking.summary.empty;

  const selectedDate =
    state.selectedDay !== null
      ? new Date(state.currentMonth.getFullYear(), state.currentMonth.getMonth(), state.selectedDay)
      : null;
  const availableSlots =
    service && selectedDate && availabilityStatus === "ready"
      ? generateSlotsForDay(service, selectedDate, availability.busy)
      : [];

  let rightPanelHint: string | null = null;
  let rightPanelHintTone: "normal" | "error" = "normal";
  if (service && availabilityStatus === "loading") {
    rightPanelHint = t.booking.loadingAvailability;
  } else if (service && availabilityStatus === "error") {
    rightPanelHint = t.booking.availabilityError;
    rightPanelHintTone = "error";
  } else if (state.hintVisible) {
    rightPanelHint = state.hintMode === "initial" ? EMPTY_HINT_INITIAL_PT : t.booking.emptyHintServiceChosen;
  }

  function handleFormSubmit(values: { name: string; phone: string; note: string }) {
    if (!service || !state.serviceKey || !state.selectedDay || !state.selectedSlot) {
      setMessage({ text: t.booking.incompleteError, tone: "error" });
      return;
    }
    const dateStr = `${state.selectedDay} ${monthLabel} ${state.currentMonth.getFullYear()}`;
    const text = buildBookingMessage({
      serviceName: service.name[lang],
      dateStr,
      slot: state.selectedSlot,
      name: values.name,
      phone: values.phone,
      note: values.note,
    });
    setMessage({ text: t.booking.openingWhatsApp, tone: "success" });
    window.open(buildWhatsAppUrl(text), "_blank");
  }

  return (
    <div className="wrap">
      <div className="section-head">
        <div className="eyebrow">{t.booking.eyebrow}</div>
        <h2>{t.booking.title}</h2>
        <p>{t.booking.sub}</p>
      </div>

      <div className="booking-panel">
        <div className="booking-left">
          <h3>{t.booking.step1Title}</h3>
          <p>{t.booking.step1Sub}</p>

          <ServiceSelect
            selectedKey={state.serviceKey}
            onSelect={(key) => dispatch({ type: "SELECT_SERVICE", key })}
          />

          <SummaryBox service={service} dateLabel={summaryDate} slot={state.selectedSlot} />
        </div>

        <div className="booking-right">
          <CalendarPanel
            state={state}
            dispatch={dispatch}
            service={service}
            busy={availability.busy}
            availabilityReady={availabilityStatus === "ready"}
          />

          {state.slotsVisible && service && state.selectedDay && (
            <SlotsGrid
              slots={availableSlots}
              selectedSlot={state.selectedSlot}
              onSelect={(slot) => dispatch({ type: "SELECT_SLOT", slot })}
            />
          )}

          {rightPanelHint && (
            <p
              className="empty-hint"
              style={rightPanelHintTone === "error" ? { color: "var(--ember)" } : undefined}
            >
              {rightPanelHint}
            </p>
          )}

          <BookingForm onSubmit={handleFormSubmit} />

          {message && (
            <p
              className="booking-msg"
              style={{ display: "block", color: message.tone === "error" ? "var(--ember)" : "var(--signal)" }}
            >
              {message.text}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
