# Estrutura do front-end (Next.js + TypeScript)

Este documento detalha o resultado da migração do site de um único arquivo
HTML (`legacy/lucia-massoterapeuta.html`) para Next.js 16 (App Router) +
TypeScript — decisões de arquitetura e o motor de agendamento, que são
grandes/específicos demais para caber no `CLAUDE.md`. Ver `CLAUDE.md` para a
visão geral do projeto e convenções gerais de edição.

---

## Por que Next.js (e não só um bundler tipo Vite)

O motivo declarado é uma futura sincronização da seção de agendamento com o
Google Agenda: ler disponibilidade de uma agenda pública pode ser feito
direto no navegador, mas **escrever eventos exige credencial que não pode
viver no cliente**. Next.js permite adicionar rotas de API
(`src/app/api/.../route.ts`) no mesmo projeto para guardar essa credencial e
expor só o necessário ao front-end, sem precisar hospedar um backend
separado. Essa integração **ainda não existe** — é só a razão da escolha de
stack, registrada aqui para não se perder de vista.

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

`src/data/services.ts` — `SERVICES: Record<ServiceKey, Service>`, o
equivalente direto do objeto `SERVICES` do `<script>` original: nome PT/EN,
preço (número, usado no total do resumo), local PT/EN, `days` (array de
`Date#getDay()`) e `slots` (strings `"HH:MM"`).

**Isto é um dado separado do conteúdo de `Services.tsx`** (a seção de
marketing com os 3 cards). No HTML original já era assim: o card de
`Services` mostra preço/local como texto solto no HTML, independente do
`SERVICES` do JS. Um exemplo real dessa separação, preservado
intencionalmente: o card do casal mostra **"85 €/pessoa"** (texto de
marketing, vem do dicionário i18n em `services.cards.couple.price`), mas o
total calculado no resumo do widget mostra **"170 €"** (vem de
`SERVICES.couple.price`, usado de fato no cálculo). Não é bug desta
migração — já era assim no original.

### Cálculo de disponibilidade

`src/lib/calendar.ts`:

- `isTaken(serviceKey, dayNum, slot)` — hash determinístico
  (`serviceKey.charCodeAt(0)*31 + dayNum*7 + Number(slot)`) módulo 5; não é
  aleatório de verdade, é só para a demonstração parecer viva com alguns
  horários "ocupados".
- `getMonthGrid(year, month, service, serviceKey, today)` — gera a grade do
  mês (grade começa na segunda-feira, mesmo offset `(firstDay.getDay()+6)%7`
  do original), calculando por dia se está no passado (`isPast`, comparado
  com `DEMO_TODAY`) e sua disponibilidade (`"none" | "available" | "full"`).
- `DEMO_TODAY = new Date(2026, 6, 31)` — o "hoje" fixo do protótipo. Fica
  desatualizado a partir do dia seguinte a essa data; é intencional (ver
  `CLAUDE.md`, "Do protótipo à produção"), não generalizar sem pedido
  explícito.
- `formatSummaryDate(day, monthLabel, year)` — formata a data do resumo
  (`"12 ago 2026"`, 3 letras minúsculas do mês). **Diferente** do formato
  usado na mensagem do WhatsApp, que usa o nome do mês por extenso em
  maiúsculas (`"12 AGOSTO 2026"`) — replica a diferença que já existia entre
  `updateSummary()` e `submitBooking()` no original.

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
| `BookingWidget.tsx` | Reducer, mensagem de feedback, monta o layout (`.booking-panel` com `.booking-left`/`.booking-right`) |
| `ServiceSelect.tsx` | Lista dos 3 serviços clicáveis |
| `CalendarPanel.tsx` | Cabeçalho do mês + navegação + grade de dias (sem o wrapper `.booking-right`, que fica no widget) |
| `SlotsGrid.tsx` | Horários do dia selecionado |
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
