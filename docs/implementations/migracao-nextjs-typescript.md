# Migração: HTML único → Next.js + TypeScript

**Status:** Em andamento

---

## Motivação

O site da Lúcia hoje é um único arquivo autocontido (`lucia-massoterapeuta.html`,
906 linhas, 771KB — a maior parte do peso são **5 imagens embutidas em
base64** dentro de `<img src="data:image/jpeg;base64,...">`). O usuário quer
evoluir para TypeScript, organizado em pastas "para saber o que é o que".

Motivação de fundo: uma futura automação vai sincronizar a seção de
agendamento com o Google Agenda. Isso exige uma API que guarde credenciais
(leitura pode ser pública, mas **escrita de eventos exige segredo que não
pode viver no navegador**) — por isso a escolha de stack foi **Next.js +
TypeScript**, que permite hospedar rotas de API no mesmo projeto no futuro,
sem precisar de um backend hospedado à parte. Essa integração com o Google
Agenda **não entra nesta rodada** — o escopo aprovado é só restruturar o
front-end atual para Next.js/TS, preservando 1:1 o visual e o comportamento
(incluindo o agendamento simulado, que continua simulado).

---

## Problemas Identificados (estado anterior)

1. **Sem TypeScript/estrutura de pastas:** tudo num único `.html` — HTML,
   CSS (`<style>`) e JS (`<script>`) misturados, sem tipos, sem separação
   por responsabilidade.
2. **Sem caminho claro para a futura sincronização com o Google Agenda:** um
   arquivo estático não tem onde hospedar lógica de servidor/API com
   credenciais.

---

## Descobertas relevantes (verificadas na análise/plano)

- **Único breakpoint responsivo: `max-width: 980px`** (linha 404).
- **5 `<img>` com base64 inline** (linhas 438, 456, 484, 503, 522) — hero,
  intro, e os 3 cards de serviço. Precisam virar arquivos reais em
  `public/images/` durante a migração.
- `alt` dessas imagens está só em PT (não segue o padrão `data-pt`/`data-en`)
  — lacuna pré-existente, portar como está, não é escopo consertar.
- Toolchain confirmada: Node v22.13.1, npm v10.9.2, Next.js atual = 16.x.

---

## Decisões de stack

| Decisão | Escolha | Por quê |
|---|---|---|
| Gerenciador de pacotes | npm | único instalado |
| Next.js | v16, **App Router** | padrão atual, sem razão pra ir de Pages Router |
| `create-next-app` | `--ts --eslint --no-tailwind --app --src-dir --import-alias "@/*" --use-npm` | ver estilo abaixo |
| Estilo | **CSS global única** (`src/app/globals.css`), portando o `<style>` original quase verbatim | stylesheet original já é coeso/global (`.btn`, `.wrap`, `.i18n`, variáveis `--ink` etc. reusadas entre seções); CSS Modules ou Tailwind exigiriam reescrever/reauditar tudo — risco alto de drift visual sem ganho nesta rodada |
| Fontes | `next/font/google` (Fraunces, Manrope, Space Mono) como CSS vars, substituindo o `<link>` do Google Fonts | mesmo arquivo de fonte, comportamento equivalente; checar visualmente no QA |
| TS strictness / ESLint | defaults do `create-next-app` (`strict: true`, `eslint-config-next`) | projeto pequeno, não vale a fricção extra |
| Imagens | `<img>` simples apontando pra `public/images/`, **não** `next/image` nesta rodada | `next/image` muda comportamento de carregamento — fora do escopo "preservar comportamento 1:1" |
| `AGENTS.md` (gerado pelo scaffold) | **deletar** | já existe `CLAUDE.md` + processo próprio; um segundo arquivo de instruções geraria ambiguidade |
| Arquivo velho | `git mv lucia-massoterapeuta.html legacy/lucia-massoterapeuta.html` | preserva histórico; vira referência visual "verdade" pro QA |
| Onde o Next.js entra | raiz do repo, ao lado de `CLAUDE.md`/`docs/` | projeto pequeno, não é monorepo |

---

## Estrutura de pastas

```
src/
  app/
    layout.tsx           # Server Component: metadata, next/font, <LangProvider>
    page.tsx              # Server Component: compõe as seções na ordem do <body> original
    globals.css            # tokens :root + stylesheet portado, 1 breakpoint (980px)

  components/
    Nav.tsx  Hero.tsx  Intro.tsx  Services.tsx  Ritual.tsx  Locations.tsx  Social.tsx  Footer.tsx
    Booking/
      BookingWidget.tsx    # orquestrador com useReducer
      ServiceSelect.tsx
      CalendarPanel.tsx
      SlotsGrid.tsx
      SummaryBox.tsx
      BookingForm.tsx

  i18n/
    LangProvider.tsx      # "use client": Context + useLang() → { lang, setLang, t }
    dictionaries/pt.ts    # objeto tipado, um bloco por seção
    dictionaries/en.ts    # import type { Dictionary } from './pt' — TS obriga o mesmo formato

  data/
    services.ts            # Service / ServiceKey / Services (tipos) + SERVICES (bilíngue, como hoje)

  lib/
    calendar.ts             # isTaken, getMonthGrid, DEMO_TODAY — puro, sem React
    whatsapp.ts              # WHATSAPP_NUMBER (placeholder mantido), buildBookingMessage, buildWhatsAppUrl
```

**i18n:** dicionário tipado (`t.hero.title`), não função `t('chave')` — `en.ts`
tipado como `Dictionary` (derivado de `pt.ts`), TS acusa erro se faltar
chave em EN. Strings com HTML embutido usam `dangerouslySetInnerHTML` em
campo com sufixo `Html`. `SERVICES` continua fora do dicionário genérico,
em `data/services.ts` (já é assim no original).

**Client/Server components:** `layout.tsx`/`page.tsx` ficam Server
Component; todas as seções são `"use client"` (quase tudo tem texto
traduzível). Verificado: sem `Math.random()`/`new Date()` sem argumento na
lógica do agendamento — zero risco de mismatch de hidratação.

**Estado do agendamento via `useReducer`** — trocar serviço ou mês precisa
resetar dia/hora selecionados juntos.

---

## Plano de Implementação

### Fase 1 — Scaffold + tokens/fontes + arquivo legado + esqueleto

**Objetivo:** projeto Next.js+TS rodando, com tokens visuais e fontes
corretos, arquivo original preservado como referência.

| Área | O que muda |
|---|---|
| Scaffold | Next.js 16+TS criado em pasta temporária e mesclado na raiz do repo |
| `.gitignore` | merge manual (preserva entradas OS-junk existentes + acrescenta padrões Next.js) |
| `AGENTS.md` | deletado |
| `legacy/lucia-massoterapeuta.html` | `git mv` do arquivo original |
| `src/app/globals.css` | tokens `:root` + resets base portados |
| `src/app/layout.tsx` | `next/font/google` (Fraunces/Manrope/Space Mono) |
| `src/app/page.tsx` | placeholder mínimo pra validar cores/fontes |

### Fase 2 — Seções estáticas + i18n tipado

**Objetivo:** todas as seções não-interativas renderizando com paridade
visual e bilíngues.

| Área | O que muda |
|---|---|
| `public/images/*.jpg` | 5 imagens extraídas do base64 |
| `src/i18n/` | dicionários PT/EN + `LangProvider` |
| `src/components/{Nav,Hero,Intro,Services,Ritual,Locations,Social,Footer}.tsx` | construídos |
| `src/app/globals.css` | CSS dessas seções + media query |

`#reservar` fica como placeholder vazio nesta fase.

### Fase 3 — Agendamento parte A: dados + seleção de serviço + calendário

| Área | O que muda |
|---|---|
| `src/data/services.ts`, `src/lib/calendar.ts` | criados |
| `src/components/Booking/{BookingWidget,ServiceSelect,CalendarPanel}.tsx` | criados |
| `src/app/globals.css` | CSS de `.booking-panel`, `.service-select`, `.cal-*` |

### Fase 4 — Agendamento parte B: horários, resumo, formulário, WhatsApp

| Área | O que muda |
|---|---|
| `src/components/Booking/{SlotsGrid,SummaryBox,BookingForm}.tsx` | criados |
| `src/lib/whatsapp.ts` | criado |
| `src/app/globals.css` | CSS de `.slots-grid`, `.slot`, `.contact-form`, `.booking-msg` |

### Fase 5 — QA final + graduação

QA lado a lado com `legacy/`, 2 idiomas, 3 serviços, desktop + ≤980px.
Reescrever `CLAUDE.md`, criar `docs/architecture/estrutura-frontend.md`,
ajuste final do `.gitignore`, remover este arquivo de implementação.

---

## Riscos e dependências

1. Drift visual no port manual do CSS — mitigado copiando valores/seletores
   quase verbatim.
2. `DEMO_TODAY` (`2026-07-31`) hardcoded fica desatualizado a partir de
   amanhã — comportamento intencional do protótipo, portar sem generalizar.
3. `next/font` self-hosted vs. `<link>` do Google Fonts — mesmo arquivo de
   fonte; checar visualmente no QA da Fase 5 (peso itálico do Fraunces).

---

## Checks de Validação

### Cenário 1 — Fase 1: esqueleto sobe corretamente
- [ ] `npm run dev` sobe sem erro
- [ ] Cor de fundo e fontes conferem lado a lado com `legacy/lucia-massoterapeuta.html`

### Cenário 2 — Fase 2: paridade visual das seções estáticas
- [ ] Todas as seções estáticas renderizam com paridade visual do `legacy/`
- [ ] Toggle PT/EN funciona em todas elas
- [ ] Responsivo em desktop e ≤980px

### Cenário 3 — Fase 3: calendário e seleção de serviço
- [ ] Nos 3 serviços × 2 idiomas: selecionar serviço destaca o card
- [ ] Calendário mostra dias disponíveis/lotados/passados corretamente
- [ ] Navegação de mês funciona
- [ ] Resumo mostra serviço/local corretamente

### Cenário 4 — Fase 4: fluxo completo de reserva
- [ ] Nos 3 serviços × 2 idiomas: dia → horários → escolher horário → resumo completo
- [ ] Confirmar abre `wa.me` com link/mensagem corretos e traduzidos
- [ ] Erro de seleção incompleta aparece corretamente nos dois idiomas

### Cenário 5 — Fase 5: QA final
- [ ] Todos os cenários acima revalidados de uma vez
- [ ] Console do navegador limpo (sem warning de hidratação, sem 404)
- [ ] `CLAUDE.md` lido de ponta a ponta faz sentido pra alguém sem contexto prévio

---

## Ajustes Possíveis Pós-Implementação

- Sincronização real com Google Agenda (API + credenciais server-side) —
  explicitamente fora de escopo desta migração.
- `next/image` para otimização de carregamento de imagens.
- CSS Modules / Tailwind, se algum dia fizer sentido revisitar o styling.
