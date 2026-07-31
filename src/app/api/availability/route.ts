import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

// Nunca cachear: disponibilidade precisa refletir a agenda em tempo real.
export const dynamic = "force-dynamic";

// Consulta só livre/ocupado (freebusy) da agenda da Lúcia no Google Calendar
// — nunca título/detalhe de eventos. Credenciais da Service Account vivem só
// aqui no servidor (ver docs/implementations/sincronizacao-google-agenda.md).
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const year = Number(searchParams.get("year"));
  const month = Number(searchParams.get("month")); // 0-indexado, mesma convenção de Date#getMonth()

  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 0 || month > 11) {
    return NextResponse.json(
      { error: "Parâmetros 'year'/'month' inválidos." },
      { status: 400 },
    );
  }

  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!calendarId || !clientEmail || !privateKey) {
    return NextResponse.json(
      { error: "Credenciais do Google Agenda não configuradas." },
      { status: 500 },
    );
  }

  // Padding de 1 dia em cada ponta do mês, pra absorver a diferença entre o
  // relógio UTC do servidor e o horário local de Portugal.
  const timeMin = new Date(Date.UTC(year, month, 1) - 24 * 60 * 60 * 1000).toISOString();
  const timeMax = new Date(Date.UTC(year, month + 1, 1) + 24 * 60 * 60 * 1000).toISOString();

  try {
    const auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ["https://www.googleapis.com/auth/calendar.freebusy"],
    });
    const calendar = google.calendar({ version: "v3", auth });

    const response = await calendar.freebusy.query({
      requestBody: { timeMin, timeMax, items: [{ id: calendarId }] },
    });

    const calendarResult = response.data.calendars?.[calendarId];
    if (calendarResult?.errors?.length) {
      console.error("Erro do Google Agenda ao consultar freebusy:", calendarResult.errors);
      return NextResponse.json(
        { error: "Não foi possível consultar a disponibilidade agora." },
        { status: 502 },
      );
    }

    const busy = calendarResult?.busy ?? [];
    return NextResponse.json({ busy }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Erro ao consultar disponibilidade do Google Agenda:", error);
    return NextResponse.json(
      { error: "Não foi possível consultar a disponibilidade agora." },
      { status: 502 },
    );
  }
}
