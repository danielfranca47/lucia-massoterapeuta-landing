"use client";

import { useRef, type FormEvent } from "react";
import { useLang } from "@/i18n/LangProvider";

interface Props {
  onSubmit: (values: { name: string; phone: string; note: string }) => void;
}

// Os placeholders ficam sempre em português no original (nunca têm par
// data-pt/data-en) — preservado de propósito, não é lacuna desta migração.
const PLACEHOLDERS = {
  name: "Nome",
  phone: "Telefone / WhatsApp",
  note: "Alguma preferência ou observação (opcional)",
};

export default function BookingForm({ onSubmit }: Props) {
  const { t } = useLang();
  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const noteRef = useRef<HTMLTextAreaElement>(null);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSubmit({
      name: nameRef.current?.value ?? "",
      phone: phoneRef.current?.value ?? "",
      note: noteRef.current?.value ?? "",
    });
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit}>
      <input type="text" placeholder={PLACEHOLDERS.name} ref={nameRef} required />
      <input type="tel" placeholder={PLACEHOLDERS.phone} ref={phoneRef} required />
      <textarea placeholder={PLACEHOLDERS.note} ref={noteRef} />
      <button type="submit" className="btn signal confirm-btn">
        {t.booking.formSubmit}
      </button>
    </form>
  );
}
