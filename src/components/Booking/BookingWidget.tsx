"use client";

import { useEffect, useReducer } from "react";
import { useLang } from "@/i18n/LangProvider";
import { SERVICES, type ServiceKey } from "@/data/services";
import { formatSummaryDate } from "@/lib/calendar";
import { useBookingSelection } from "./BookingSelectionContext";
import ServiceSelect from "./ServiceSelect";
import CalendarPanel from "./CalendarPanel";

export interface BookingState {
  serviceKey: ServiceKey | null;
  currentMonth: Date; // primeiro dia do mês em exibição
  selectedDay: number | null;
  selectedSlot: string | null;
}

export type BookingAction =
  | { type: "SELECT_SERVICE"; key: ServiceKey }
  | { type: "CHANGE_MONTH"; delta: number }
  | { type: "SELECT_DAY"; day: number }
  | { type: "SELECT_SLOT"; slot: string };

// Agosto/2026 — mesmo mês inicial do protótipo original
const INITIAL_MONTH = new Date(2026, 7, 1);

const initialState: BookingState = {
  serviceKey: null,
  currentMonth: INITIAL_MONTH,
  selectedDay: null,
  selectedSlot: null,
};

function bookingReducer(state: BookingState, action: BookingAction): BookingState {
  switch (action.type) {
    case "SELECT_SERVICE":
      return { ...state, serviceKey: action.key, selectedDay: null, selectedSlot: null };
    case "CHANGE_MONTH": {
      const currentMonth = new Date(state.currentMonth);
      currentMonth.setMonth(currentMonth.getMonth() + action.delta);
      return { ...state, currentMonth, selectedDay: null, selectedSlot: null };
    }
    case "SELECT_DAY":
      return { ...state, selectedDay: action.day, selectedSlot: null };
    case "SELECT_SLOT":
      return { ...state, selectedSlot: action.slot };
    default:
      return state;
  }
}

export default function BookingWidget() {
  const { lang, t } = useLang();
  const [state, dispatch] = useReducer(bookingReducer, initialState);
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

          <div className="summary-box">
            <div>
              <span className="k">{t.booking.summary.service}</span>
              <span>{service ? service.name[lang] : t.booking.summary.empty}</span>
            </div>
            <div>
              <span className="k">{t.booking.summary.location}</span>
              <span>{service ? service.location[lang] : t.booking.summary.empty}</span>
            </div>
            <div>
              <span className="k">{t.booking.summary.date}</span>
              <span>{summaryDate}</span>
            </div>
            <div>
              <span className="k">{t.booking.summary.time}</span>
              <span>{state.selectedSlot ?? t.booking.summary.empty}</span>
            </div>
            <div style={{ marginTop: 10 }}>
              <span className="k">{t.booking.summary.total}</span>
              <span className="total">
                {service ? `${service.price} €` : t.booking.summary.empty}
              </span>
            </div>
          </div>
        </div>

        <CalendarPanel state={state} dispatch={dispatch} service={service} />
      </div>
    </div>
  );
}
