"use client";

import { useEffect, useReducer, useState } from "react";
import { useLang } from "@/i18n/LangProvider";
import { SERVICES, type ServiceKey } from "@/data/services";
import { formatSummaryDate } from "@/lib/calendar";
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

// Agosto/2026 — mesmo mês inicial do protótipo original
const INITIAL_MONTH = new Date(2026, 7, 1);

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
  const { requestedService, clearRequest } = useBookingSelection();

  // Pré-seleciona o serviço quando um card de Services pede reserva
  useEffect(() => {
    if (requestedService) {
      dispatch({ type: "SELECT_SERVICE", key: requestedService });
      clearRequest();
    }
  }, [requestedService, clearRequest]);

  const service = state.serviceKey ? SERVICES[state.serviceKey] : null;
  const monthLabel = t.booking.monthNames[state.currentMonth.getMonth()];
  const summaryDate =
    service && state.selectedDay
      ? formatSummaryDate(state.selectedDay, monthLabel, state.currentMonth.getFullYear())
      : t.booking.summary.empty;

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
          <CalendarPanel state={state} dispatch={dispatch} service={service} />

          {state.slotsVisible && service && state.serviceKey && state.selectedDay && (
            <SlotsGrid
              service={service}
              serviceKey={state.serviceKey}
              day={state.selectedDay}
              selectedSlot={state.selectedSlot}
              onSelect={(slot) => dispatch({ type: "SELECT_SLOT", slot })}
            />
          )}

          {state.hintVisible && (
            <p className="empty-hint">
              {state.hintMode === "initial" ? EMPTY_HINT_INITIAL_PT : t.booking.emptyHintServiceChosen}
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
