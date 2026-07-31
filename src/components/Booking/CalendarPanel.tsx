"use client";

import type { Dispatch } from "react";
import { useLang } from "@/i18n/LangProvider";
import { getMonthGrid } from "@/lib/calendar";
import type { Service } from "@/data/services";
import type { BookingAction, BookingState } from "./BookingWidget";

interface Props {
  state: BookingState;
  dispatch: Dispatch<BookingAction>;
  service: Service | null;
}

export default function CalendarPanel({ state, dispatch, service }: Props) {
  const { t } = useLang();
  const year = state.currentMonth.getFullYear();
  const month = state.currentMonth.getMonth();
  const monthLabel = `${t.booking.monthNames[month]} ${year}`;
  const cells = getMonthGrid(year, month, service, state.serviceKey);

  return (
    <div className="booking-right">
      <h3>{t.booking.step2Title}</h3>
      <p>{t.booking.step2Sub}</p>

      <div className="cal-header">
        <h4>{monthLabel}</h4>
        <div className="cal-nav">
          <button type="button" onClick={() => dispatch({ type: "CHANGE_MONTH", delta: -1 })}>
            ‹
          </button>
          <button type="button" onClick={() => dispatch({ type: "CHANGE_MONTH", delta: 1 })}>
            ›
          </button>
        </div>
      </div>

      <div className="cal-grid">
        {t.booking.dow.map((label, i) => (
          <div className="dow" key={i}>
            {label}
          </div>
        ))}
        {cells.map((cell, i) => {
          if (cell.kind === "blank") {
            return <div className="cal-day blank" key={i} />;
          }
          const classes = ["cal-day"];
          if (cell.availability === "available") classes.push("available");
          if (cell.availability === "full") classes.push("full");
          if (cell.availability === "available" && state.selectedDay === cell.day) {
            classes.push("selected");
          }
          return (
            <div
              key={i}
              className={classes.join(" ")}
              style={cell.isPast ? { opacity: 0.2 } : undefined}
              onClick={
                cell.availability === "available"
                  ? () => dispatch({ type: "SELECT_DAY", day: cell.day })
                  : undefined
              }
            >
              {cell.day}
            </div>
          );
        })}
      </div>

      {/* Horários, dica de estado vazio e formulário entram na Fase 4 */}
    </div>
  );
}
