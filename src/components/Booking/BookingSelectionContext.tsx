"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { ServiceKey } from "@/data/services";

interface BookingSelectionValue {
  requestedService: ServiceKey | null;
  requestService: (key: ServiceKey) => void;
  clearRequest: () => void;
}

const BookingSelectionContext = createContext<BookingSelectionValue | null>(null);

export function BookingSelectionProvider({ children }: { children: ReactNode }) {
  const [requestedService, setRequestedService] = useState<ServiceKey | null>(null);

  function requestService(key: ServiceKey) {
    setRequestedService(key);
    document.getElementById("reservar")?.scrollIntoView({ behavior: "smooth" });
  }

  function clearRequest() {
    setRequestedService(null);
  }

  return (
    <BookingSelectionContext.Provider value={{ requestedService, requestService, clearRequest }}>
      {children}
    </BookingSelectionContext.Provider>
  );
}

export function useBookingSelection() {
  const ctx = useContext(BookingSelectionContext);
  if (!ctx) {
    throw new Error("useBookingSelection must be used within a BookingSelectionProvider");
  }
  return ctx;
}
