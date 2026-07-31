# Estrutura do front-end (Next.js + TypeScript)

Este documento detalha o resultado da migração do site de um único arquivo
HTML (`legacy/lucia-massoterapeuta.html`) para Next.js 16 (App Router) +
TypeScript — decisões de arquitetura e o motor de agendamento, que são
grandes/específicos demais para caber no `CLAUDE.md`. Ver `CLAUDE.md` para a
visão geral do projeto e convenções gerais de edição.

---

## Por que Next.js (e não só um bundler tipo Vite)

O motivo declarado foi uma futura sincronização da seção de agendamento com
o Google Agenda: ler disponibilidade de uma agenda **privada** exige uma
credencial (Service Account) que não pode viver no navegador. Next.js
permite adicionar rotas de API (`src/app/api/.../route.ts`) no mesmo
projeto para guardar essa credencial e expor só o necessário ao front-end,
sem precisar hospedar um backend separado. Essa integração **já existe** —
ver "Motor de agendamento" abaixo, seção "Sincronização com o Google
Agenda".

---

## Estilo: uma folha CSS global, não CSS Modules/Tailwind

`src/app/globals.css` é essencially o `<style>` do HTML original copiado
quase verbatim (mesmos seletores, mesmos valores), só trocando
`font-family:'Fraunces'` etc. pelas CSS vars do `next/font`
(`--font-fraunces`/`--font-manrope`/`--font-space-mono`, definidas em
`src/app/layout.tsx`). Decisão tomada para minimizar risco de divergência
visual num port 1:1 — o stylesheet original já era coeso e teve reuso de
classes entre seções (`.btn`, `.wrap`, `.eyebrow` etc.), então CSS Modules ou
Tailwind exigiriam reescrever/reauditar tudo sem ganho nesta migração.

---

## i18n: dicionário tipado

`src/i18n/dictionaries/pt.ts` exporta o objeto `pt` e
`export type Dictionary = typeof pt`. `en.ts` importa esse tipo e declara
`const en: Dictionary = {...}` — se faltar uma chave, ou o formato de algum
campo divergir (ex.: `ritual.steps`, que é uma união de dois formatos —
etapas com `paragraph` vs. etapas com `items`, tipada explicitamente como
`RitualStep[]` em `pt.ts`), o TypeScript recusa compilar. `LangProvider.tsx`
expõe `useLang() → { lang, setLang, t }` via Context; como praticamente toda
seção tem texto traduzível, todas as seções são Client Components
(`"use client"`) — não há Server Component com dado real para buscar nesta
página, então o ganho de renderizar no servidor seria marginal frente à
simplicidade de um único modelo de estado de idioma.

**Duas exceções que ficam fora do dicionário, de propósito** (herdadas do
comportamento do site original, que também nunca as traduzia):

1. **Placeholders do formulário de reserva** (`Nome`, `Telefone / WhatsApp`,
   `Alguma preferência ou observação (opcional)`) — hardcoded em
   `Booking/BookingForm.tsx`. No HTML original esses `<input>` nunca tinham
   `data-pt`/`data-en`.
2. **Mensagem enviada ao WhatsApp** — rótulos e saudação
   (`"Olá Lúcia! Gostaria de reservar:"`, `"Serviço:"`, `"Data:"` etc.)
   hardcoded em português em `src/lib/whatsapp.ts`. Só o **nome do serviço**
   e o **mês da data** respeitam o idioma atual (porque já vêm resolvidos
   pelo dicionário/`SERVICES` antes de chegar em `buildBookingMessage()`).
   Isso replica o `submitBooking()` original, que montava a string sempre em
   PT.

---

## Motor de agendamento

### Dados

`src/data/services.ts` — `SERVICES: Record<ServiceKey, Service>`: nome
PT/EN, preço (número, usado no total do resumo), local PT/EN, `days`
(array de `Date#getDay()`), `durationMinutes` (duração real da sessão, em
minutos) e `workWindow` (`{ start, end }`, janela `"HH:MM"` de horários de
início possíveis). Não existe mais uma lista fixa de horários (`slots`) —
os horários oferecidos são gerados dinamicamente, ver "Cálculo de
disponibilidade" abaixo.

**Isto é um dado separado do conteúdo de `Services.tsx`** (a seção de
marketing com os 3 cards). No HTML original já era assim: o card de
`Services` mostra preço/local como texto solto no HTML, independente do
`SERVICES` do JS. Um exemplo real dessa separação, preservado
intencionalmente: o card do casal mostra **"85 €/pessoa"** (texto de
marketing, vem do dicionário i18n em `services.cards.couple.price`), mas o
total calculado no resumo do widget mostra **"170 €"** (vem de
`SERVICES.couple.price`, usado de fato no cálculo). Não é bug desta
migração — já era assim no original.

### Sincronização com o Google Agenda

`src/app/api/availability/route.ts` (rota `GET`, server-side) autentica com
uma Service Account do Google (`google.auth.JWT`, escopo
`calendar.freebusy`) e consulta `calendar.freebusy.query` nas 3 agendas da
Lúcia de uma vez (`GOOGLE_CALENDAR_IDS`, lista separada por vírgula) —
**Air BnB**, **Terraço** e **Gabinete Faro**. A Lúcia é uma pessoa só, então
um compromisso em qualquer uma delas bloqueia as outras também: a rota
junta os `busy` das 3 num array só antes de devolver
`{ busy: [{start, end}] }` ao cliente, sem nunca expor título/detalhe de
eventos nem dizer de qual agenda veio cada intervalo.

Parâmetros: `year`/`month` (0-indexado, convenção de `Date#getMonth()`) — a
disponibilidade ocupada não depende do serviço escolhido, só do mês
visível, então o front-end busca uma vez por mês e reaproveita o resultado
pros 3 serviços.

Erros (credencial inválida, agenda não compartilhada, falha do Google) →
HTTP 500 (credenciais ausentes) ou 502 (falha na consulta), sempre com
`{ error: string }` — nunca um `busy` inventado. O front-end trata qualquer
resposta não-`200` bloqueando a seleção de horário e mostrando
`t.booking.availabilityError` (ver "Estado" abaixo).

Credenciais (`GOOGLE_CALENDAR_IDS`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`,
`GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`) nunca chegam ao navegador — vivem só
em `.env.local` (dev) e nas Environment Variables do Vercel (produção). Ver
`.env.example` pro formato exato. **Atenção ao colar a chave privada no
painel do Vercel:** o valor não deve ter aspas `"` ao redor (diferente do
`.env.local`, onde as aspas são sintaxe do formato `.env`) — colar com
aspas sobrando quebra a autenticação silenciosamente (a rota responde `502`
sem detalhe do motivo).

Setup das credenciais (projeto Google Cloud na conta da Lúcia, Daniel como
colaborador via IAM — sem nunca precisar da senha dela): a Lúcia cria o
projeto e adiciona o Daniel como colaborador; o Daniel ativa a Google
Calendar API, cria uma Service Account e gera uma chave JSON; a Lúcia
compartilha cada uma das 3 agendas com o e-mail da Service Account,
permissão "Ver apenas informações de disponibilidade (ocupado/livre)"; o
Daniel preenche as variáveis com os dados da chave JSON + os IDs das 3
agendas.

### Cálculo de disponibilidade

`src/lib/availability.ts`:

- `generateSlotsForDay(service, date, busy, now)` — função pura que gera os
  horários de início válidos pra um serviço num dia: varre o `workWindow`
  do serviço em passos de `SLOT_GRANULARITY_MINUTES` (30min), e descarta
  qualquer horário cuja janela (duração da sessão + `BUFFER_MINUTES` de
  folga antes/depois, também 30min) sobreponha um intervalo `busy` vindo da
  API. Também descarta horários já passados (comparados com `now`).
- Substituiu o antigo `isTaken()` (hash pseudo-aleatório determinístico do
  protótipo) — não existe mais lista fixa de horários "cinza/ocupado":
  `SlotsGrid` mostra só os horários que `generateSlotsForDay` de fato
  devolve.

`src/lib/calendar.ts`:

- `getMonthGrid(year, month, service, busy, now)` — gera a grade do mês
  (grade começa na segunda-feira, mesmo offset `(firstDay.getDay()+6)%7` do
  original), calculando por dia se está no passado (comparado à meia-noite
  de `now`) e sua disponibilidade (`"none" | "available" | "full"`, via
  `generateSlotsForDay(...).length > 0`). `now` default é `new Date()` —
  "hoje" é a data real do sistema (o antigo `DEMO_TODAY` fixo do protótipo
  foi removido, não existe mais data congelada).
- `formatSummaryDate(day, monthLabel, year)` — inalterado: formata a data
  do resumo (`"12 ago 2026"`, 3 letras minúsculas do mês). **Diferente** do
  formato usado na mensagem do WhatsApp, que usa o nome do mês por extenso
  em maiúsculas (`"12 AGOSTO 2026"`) — replica a diferença que já existia
  entre `updateSummary()` e `submitBooking()` no original.

### Estado (`Booking/BookingWidget.tsx`)

`useReducer` com `BookingState`/`BookingAction`:

```ts
interface BookingState {
  serviceKey: ServiceKey | null;
  currentMonth: Date;
  selectedDay: number | null;
  selectedSlot: string | null;
  slotsVisible: boolean;
  hintVisible: boolean;
  hintMode: "initial" | "chooseDay";
}
```

`slotsVisible`/`hintVisible`/`hintMode` existem para replicar fielmente um
comportamento (provável bug, não corrigido de propósito) do
`<script>` original: `changeMonth()` escondia os horários
(`slotsWrap.style.display='none'`) mas **não** reexibia a dica
(`emptyHint`) — só `selectDay()`/`selectService()` mexiam nela. O resultado
prático: se o usuário já tinha escolhido um dia (dica escondida, horários
visíveis) e depois troca de mês, fica um vazio no painel direito (nem dica,
nem horários) até clicar num dia disponível de novo. O reducer reproduz
essa mesma assimetria explicitamente — `CHANGE_MONTH` não toca em
`hintVisible`/`hintMode`.

O texto inicial da dica (antes de qualquer serviço ser escolhido) também é
uma constante PT hardcoded (`EMPTY_HINT_INITIAL_PT` em `BookingWidget.tsx`),
não uma chave do dicionário — no original esse `<p>` nunca tinha
`data-pt`/`data-en`, só o texto que aparece **depois** de escolher um
serviço (`emptyHintServiceChosen` no dicionário) era trocado dinamicamente
por `selectService()`.

**Disponibilidade buscada da API** vive num `useState<AvailabilityState>`
separado do reducer (é dado de servidor, não uma transição de UI). Um
detalhe não-óbvio: o estado "carregando" **não** é setado sincronamente no
início do `useEffect` que dispara o `fetch` — isso dispararia o lint
`react-hooks/set-state-in-effect` (cascata de renders). Em vez disso,
"carregando" é **derivado**: `AvailabilityState` guarda o `monthKey`
(`"AAAA-M"`) do último fetch que terminou, e o componente compara esse
`monthKey` com o do `state.currentMonth` atual — se forem diferentes, ainda
está carregando. `setAvailability` só é chamado dentro dos callbacks
`.then()`/`.catch()` da promise, nunca fora deles. O fetch é keyado só em
`state.currentMonth` (não em `serviceKey`), porque a disponibilidade não
depende do serviço.

### Pré-seleção a partir dos cards de `Services`

`Booking/BookingSelectionContext.tsx` — Context simples
(`requestedService`/`requestService()`/`clearRequest()`) que desacopla
`Services.tsx` (não é descendente de `BookingWidget`) do estado do widget.
Clicar em "Reservar" num card chama `requestService(key)`, que guarda o
pedido e rola até `#reservar`; `BookingWidget` consome via `useEffect` e
despacha `SELECT_SERVICE`. Equivalente ao `onclick="selectService(key)"`
global do HTML original, adaptado pra um componente React que não tem
acesso direto ao estado de outro.

### Componentes

| Arquivo | Responsabilidade |
|---|---|
| `BookingWidget.tsx` | Reducer, fetch de disponibilidade (`/api/availability`), mensagem de feedback, monta o layout (`.booking-panel` com `.booking-left`/`.booking-right`) |
| `ServiceSelect.tsx` | Lista dos 3 serviços clicáveis |
| `CalendarPanel.tsx` | Cabeçalho do mês + navegação + grade de dias via `getMonthGrid` (sem o wrapper `.booking-right`, que fica no widget) |
| `SlotsGrid.tsx` | Renderiza a lista de horários já calculada (`generateSlotsForDay`, resolvida no widget) pro dia selecionado |
| `SummaryBox.tsx` | Resumo (serviço/local/data/hora/total) |
| `BookingForm.tsx` | Nome/telefone/nota (refs não-controlados, lidos só no submit — igual ao `document.getElementById(...).value` do original) + botão de confirmar |

---

## Imagens

As 5 fotos do site estavam embutidas como `data:image/jpeg;base64,...`
dentro do HTML original (é por isso que o arquivo tinha 771KB apesar de só
906 linhas). Foram extraídas para `public/images/*.jpg` durante a migração
e são referenciadas com `<img src="/images/...">` simples — **não**
`next/image`, decisão deliberada para não mudar comportamento de
carregamento (lazy-loading, dimensões obrigatórias) além do escopo da
migração.
