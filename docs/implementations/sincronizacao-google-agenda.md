# Sincronização com Google Agenda — disponibilidade real no agendamento

**Status:** Em andamento

---

## Motivação

O widget de reserva (`Booking/BookingWidget.tsx`) hoje simula
disponibilidade: `isTaken()` em `src/lib/calendar.ts` é um hash
pseudo-aleatório determinístico, e `DEMO_TODAY` é uma data fixa
(31/07/2026) — não existe nenhuma conexão com uma agenda real (ver
CLAUDE.md, "Do protótipo à produção", item 2). O Daniel pediu para
sincronizar com a agenda do Google Calendar da Lúcia, de forma que os
horários exibidos no calendário/slots sejam realmente livres. A reserva em
si continua sendo finalizada por WhatsApp — não há escrita automática de
evento na agenda nesta rodada (ver "Fora de escopo").

---

## Problemas Identificados (estado anterior)

1. **Disponibilidade simulada:** `src/lib/calendar.ts`, `isTaken()` —
   `(serviceKey.charCodeAt(0)*31 + dayNum*7 + Number(slot))%5 === 0`, não
   reflete nenhum compromisso real da Lúcia.
2. **"Hoje" congelado:** `DEMO_TODAY = new Date(2026, 6, 31)` — deixa de
   fazer sentido a partir do momento em que a disponibilidade passa a ser
   real; precisa virar a data atual de verdade.
3. **Horários fixos, sem duração real:** `SERVICES` (`src/data/services.ts`)
   define `slots: string[]` fixos por serviço, sem duração de sessão nem
   folga entre atendimentos — não dá pra cruzar corretamente com eventos
   reais de uma agenda (um evento pode ocupar um intervalo que não bate
   exatamente com nenhum slot fixo).

---

## Decisões confirmadas (com o Daniel, 31/07/2026)

- Só leitura (`freebusy`), sem criar evento automaticamente na agenda.
- Duração real por serviço: **Premium 60min, Sunset 30min, Casal 60min.**
- Folga obrigatória de **30min** antes/depois de cada sessão.
- Horários passam a ser **gerados dinamicamente** dentro do expediente de
  cada serviço (não mais lista fixa) — expediente inferido a partir dos
  horários atuais e confirmado:
  - Premium (Faro): 10:00–20:00
  - Sunset (Olhão): 19:30–20:30
  - Casal (Olhão): 18:00–20:00
- Se a API do Google falhar: mostrar erro e bloquear seleção de horário —
  nunca mostrar disponibilidade inventada.

---

## Abordagem

Rota de API server-side no Next.js (`src/app/api/availability/route.ts`)
autentica com uma Service Account do Google e consulta
`calendar.freebusy.query` — a credencial nunca chega ao navegador. O
front-end busca `{ busy: [...] }` para o mês visível e gera dinamicamente,
no cliente, os horários de início válidos: dentro do expediente, não
passado, e sem sobrepor `[busy.start − 30min, busy.end + 30min]`.

```
Browser (BookingWidget)
   → fetch /api/availability?serviceKey=premium&year=2026&month=7
Next.js API route (server, credencial nunca exposta)
   → Google Calendar API: calendar.freebusy.query()
   → devolve só { busy: [{start,end}, ...] } — sem título/detalhe de eventos
Browser
   → gera dinamicamente os horários de início válidos do serviço/dia
     cruzando expediente + duração + folga de 30min com os intervalos busy
```

**Consequência de UX:** `SlotsGrid` deixa de mostrar uma lista fixa com
itens "cinza/ocupado" — passa a mostrar só os horários realmente
disponíveis, já calculados.

---

## Plano de Implementação

### Fase 1 — Credenciais + rota de API (leitura pura, sem tocar na UI)

**Objetivo:** ter uma rota server-side que devolve os intervalos ocupados
reais da agenda da Lúcia, sem nenhum impacto no site atual.

| Área | O que muda |
|---|---|
| `package.json` | Adiciona dependência `googleapis` |
| `src/app/api/availability/route.ts` (novo) | `GET`, query params `serviceKey`, `year`, `month`; autentica via Service Account, chama `calendar.freebusy.query` (escopo `calendar.freebusy`), devolve `{ busy: [{start, end}] }`; erro → HTTP 500 + `{ error }` |
| `.env.example` (novo, comitado) | Documenta `GOOGLE_CALENDAR_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` (placeholders) |
| `.env.local` (não comitado) | Valores reais para dev local |

**Passo externo (manual, fora do editor):**
1. Criar um projeto no [Google Cloud Console](https://console.cloud.google.com/).
2. Ativar a **Google Calendar API** nesse projeto.
3. Criar uma **Service Account**, gerar uma chave JSON.
4. Na [Google Agenda](https://calendar.google.com/) da Lúcia: Configurações
   → agenda dela → "Compartilhar com pessoas específicas" → adicionar o
   e-mail da Service Account com permissão **"Ver apenas informações de
   disponibilidade (ocupado/livre)"** (a mais restrita — não dá acesso a
   título/detalhe dos eventos).
5. Anotar: o **ID da agenda** (normalmente o próprio e-mail do Google da
   Lúcia, em Configurações → "Integrar agenda"), o **e-mail da Service
   Account** e a **chave privada** da chave JSON gerada.
6. Preencher essas 3 variáveis em `.env.local` (copiar de `.env.example`) e,
   quando o site for pro Vercel, também em Project Settings → Environment
   Variables.

### Commits Fase 1

| # | Commit | O que foi implementado |
|---|---|---|
| 1 | (a registrar no push) | dependência `googleapis` + override de `gaxios` (corrige 4 vulnerabilidades altas herdadas), rota `GET /api/availability` (freebusy, sem escrever na agenda) e `.env.example` |

### Relatório da Fase 1 — o que mudou na prática

**Antes:** não existia nenhuma rota de servidor no projeto; disponibilidade
era só simulação local no navegador.
**Agora:** existe uma rota `/api/availability?year=AAAA&month=M` (mês
0-indexado) que, com as credenciais reais configuradas, consulta a agenda
real da Lúcia no Google Calendar e devolve só os intervalos ocupados —
nada na UI foi alterado ainda, então o site continua funcionando
exatamente como antes.
**Para validar:** Cenário 1, abaixo — depende das credenciais reais
(passo externo acima) estarem configuradas; sem elas, a rota responde
`500` com uma mensagem clara em vez de travar.

### Fase 2 — Modelo de dados: duração + expediente por serviço

**Objetivo:** `SERVICES` sabe duração e expediente reais, prontos para
cruzar com dados de uma agenda.

| Área | O que muda |
|---|---|
| `src/data/services.ts` | `Service` troca `slots: string[]` por `durationMinutes: number` + `workWindow: { start: string; end: string }` |
| `src/lib/availability.ts` (novo) | `generateSlotsForDay(service, date, busy, now)` — função pura; constantes `BUFFER_MINUTES = 30` e `SLOT_GRANULARITY_MINUTES = 30` |

### Fase 3 — Wiring completo no widget

**Objetivo:** o widget de reserva mostra disponibilidade real de verdade,
nos 3 serviços, em PT e EN.

| Área | O que muda |
|---|---|
| `Booking/BookingWidget.tsx` | `useEffect` busca `/api/availability` ao mudar serviço/mês; estado loading/error/ready + `busy`; `INITIAL_MONTH` vira o mês atual real |
| `Booking/CalendarPanel.tsx` | Disponibilidade do dia via `generateSlotsForDay(...).length > 0` |
| `Booking/SlotsGrid.tsx` | Renderiza os horários vindos de `generateSlotsForDay`, não mais `service.slots` + `isTaken` |
| `src/lib/calendar.ts` | `DEMO_TODAY` → `new Date()` real; `isTaken` removido; `getMonthGrid` recebe `busy` |
| `src/i18n/dictionaries/pt.ts` / `en.ts` | Chaves novas em `booking`: texto de carregando e texto de erro (sugerindo WhatsApp como alternativa) |

### Fase 4 — Validação end-to-end + graduação

- Configurar as env vars reais no Vercel.
- Testar os 3 serviços em PT e EN, desktop e mobile, incluindo o caminho de
  erro.
- Atualizar `CLAUDE.md` (item 2 do checklist) e
  `docs/architecture/estrutura-frontend.md` ("Motor de agendamento").
- Seguir `_processo-graduacao-implementacao.md`.

---

## Checks de Validação

### Cenário 1 — Rota de API devolve dados reais (Fase 1)
- [ ] Com env vars reais configuradas, chamar `/api/availability?serviceKey=premium&year=2026&month=7`
- [ ] Confirmar que os intervalos `busy` batem com eventos reais na agenda da Lúcia
- [ ] Confirmar que sem credencial/agenda compartilhada a rota devolve erro claro (HTTP 500 + `{ error }`), não trava

### Cenário 2 — Slots dinâmicos corretos (Fase 2/3)
- [ ] Criar um evento de teste na agenda da Lúcia num horário dentro do expediente do Premium
- [ ] Confirmar no calendário do site que o dia aparece "full" só se não sobrar nenhum horário válido, e "available" caso contrário
- [ ] Confirmar que os horários oferecidos respeitam duração + 30min de folga (nenhum horário oferecido cai dentro de `[evento.start − 30min, evento.end + 30min]`)

### Cenário 3 — Fluxo completo nos 3 serviços, PT e EN (Fase 3/4)
- [ ] Para Premium, Sunset e Casal: escolher dia, escolher horário, preencher formulário, confirmar via WhatsApp — mensagem final correta
- [ ] Repetir com idioma EN
- [ ] Testar em mobile (responsivo)

### Cenário 4 — Fallback de erro (Fase 3/4)
- [ ] Simular falha da API (ex.: credencial errada) e confirmar que aparece a mensagem de erro, com seleção de horário bloqueada — nunca disponibilidade falsa

---

## Ajustes Possíveis Pós-Implementação

- Criar evento automaticamente na agenda da Lúcia quando o cliente confirma
  via WhatsApp (exigiria escopo OAuth de escrita, `calendar.events`) — até
  lá, ela precisa adicionar o compromisso manualmente para que ele passe a
  bloquear disponibilidade futura.
- Reavaliar a granularidade de 30min na geração de slots, se no futuro não
  bater com a realidade do atendimento.
