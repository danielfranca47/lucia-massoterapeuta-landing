export const WHATSAPP_NUMBER = "351966897721";

export interface BookingSelection {
  serviceName: string;
  dateStr: string;
  slot: string;
  name: string;
  phone: string;
  note: string;
}

// A mensagem é sempre montada em português (rótulos e saudação fixos),
// mesmo com a UI em inglês — só o nome do serviço e a data respeitam `lang`
// (já resolvidos pelo chamador). Preserva o comportamento do original, que
// nunca traduzia esse texto.
export function buildBookingMessage(selection: BookingSelection): string {
  const { serviceName, dateStr, slot, name, phone, note } = selection;
  const lines = [
    "Olá Lúcia! Gostaria de reservar:",
    `Serviço: ${serviceName}`,
    `Data: ${dateStr}`,
    `Hora: ${slot}`,
    `Nome: ${name}`,
    `Telefone: ${phone}`,
  ];
  if (note) {
    lines.push(`Nota: ${note}`);
  }
  return lines.join("\n");
}

export function buildWhatsAppUrl(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
