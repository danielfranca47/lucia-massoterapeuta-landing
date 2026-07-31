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

### Commits Fase 1

| # | Commit | O que foi implementado |
|---|---|---|
| 1 | `2901a0c` | scaffold Next.js+TS, tokens/resets em globals.css, fontes via next/font, legacy/, .gitignore mesclado |

### Relatório da Fase 1 — o que mudou na prática

**Antes:** o projeto não tinha build, TypeScript nem estrutura de pastas —
só o `.html` único.
**Agora:** existe um projeto Next.js + TypeScript funcional (`npm run dev`),
com as cores/variáveis (`--ink`, `--ember`, `--gold` etc.) e as 3 fontes
(Fraunces, Manrope, Space Mono) portadas e validadas visualmente contra o
arquivo original, que passou a viver em `legacy/` como referência.
**Para validar:** Cenário 1, abaixo.

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

### Commits Fase 2

| # | Commit | O que foi implementado |
|---|---|---|
| 1 | `cc8df81` | imagens extraídas, dicionários PT/EN + LangProvider, 8 componentes estáticos, CSS portado |

### Relatório da Fase 2 — o que mudou na prática

**Antes:** todo o texto do site vivia como pares `data-pt`/`data-en` dentro do
HTML, trocados via `setLang()` mexendo em `innerHTML`; as imagens eram
base64 embutido no próprio arquivo.
**Agora:** o texto vive em dois dicionários TypeScript tipados (erro de
compilação se faltar uma tradução), trocados via Context/`useLang()`; as
imagens são arquivos reais em `public/images/`. Todas as seções estáticas
(Nav, Hero, Intro, Services, Ritual, Locations, Social, Footer) estão
portadas — falta só o widget de agendamento (`#reservar`, Fase 3/4).

Decisão registrada durante a fase: os botões "Reservar" dos 3 cards de
serviço, que no original chamavam `selectService(key)` pré-selecionando o
serviço no calendário, por enquanto só rolam até `#reservar` (ainda vazio).
A pré-seleção real será ligada na Fase 3, quando o `BookingWidget` existir.

**Para validar:** Cenário 2, abaixo.

### Fase 3 — Agendamento parte A: dados + seleção de serviço + calendário

| Área | O que muda |
|---|---|
| `src/data/services.ts`, `src/lib/calendar.ts` | criados |
| `src/components/Booking/{BookingWidget,ServiceSelect,CalendarPanel}.tsx` | criados |
| `src/app/globals.css` | CSS de `.booking-panel`, `.service-select`, `.cal-*` |
| `src/components/Services.tsx` | botões "Reservar" passam a pré-selecionar o serviço no widget (ligação combinada na Fase 2), não só rolar até `#reservar` |

### Commits Fase 3

| # | Commit | O que foi implementado |
|---|---|---|
| 1 | `91126ee` | SERVICES tipado, motor do calendário, BookingWidget/ServiceSelect/CalendarPanel, pré-seleção via BookingSelectionContext, CSS do painel de agendamento |

### Relatório da Fase 3 — o que mudou na prática

**Antes:** `#reservar` era uma seção vazia (placeholder da Fase 2).
**Agora:** a seção de agendamento tem o painel completo de seleção — os 3
serviços, o calendário do mês com dias disponíveis/lotados/passados
(mesma lógica pseudo-aleatória determinística do original), navegação entre
meses, e um resumo que já mostra serviço/local/total assim que um serviço é
escolhido (data e hora continuam "—" até a Fase 4 trazer a seleção de
horário). Os botões "Reservar" dos cards de `Services` agora pré-selecionam
o serviço certo no widget, em vez de só rolar até a âncora.

**Quirk do original preservado de propósito:** o preço mostrado no card do
casal dentro do seletor ("85 €/pessoa") é só texto de marketing e é
diferente do total calculado no resumo ("170 €", o valor real usado pela
lógica de agendamento) — essa inconsistência já existia no HTML original
entre a seção de Services e o objeto `SERVICES` do JavaScript; a migração
manteve o mesmo comportamento, não é bug novo.

**Para validar:** Cenário 3, abaixo.

### Fase 4 — Agendamento parte B: horários, resumo, formulário, WhatsApp

| Área | O que muda |
|---|---|
| `src/components/Booking/{SlotsGrid,SummaryBox,BookingForm}.tsx` | criados |
| `src/lib/whatsapp.ts` | criado |
| `src/app/globals.css` | CSS de `.slots-grid`, `.slot`, `.contact-form`, `.booking-msg` |

### Commits Fase 4

| # | Commit | O que foi implementado |
|---|---|---|
| 1 | `9b5a250` | SlotsGrid/SummaryBox/BookingForm, lib/whatsapp.ts, fluxo de envio no BookingWidget, CSS restante do agendamento |

### Relatório da Fase 4 — o que mudou na prática

**Antes:** o agendamento parava na seleção de dia — sem horários, formulário
ou envio.
**Agora:** o fluxo está completo: escolher um dia mostra os horários
(ocupados riscados), escolher um horário atualiza o resumo, preencher
nome/telefone e confirmar monta a mensagem e abre o WhatsApp numa aba nova
com o texto pré-preenchido. Erro de seleção incompleta aparece em laranja;
sucesso ("A abrir o WhatsApp...") aparece em verde-sinal.

**Comportamentos do original preservados fielmente** (todos verificados
ponta a ponta via Chrome DevTools MCP, não são regressões desta migração):
- A mensagem do WhatsApp é sempre montada com rótulos e saudação em
  português ("Olá Lúcia! Gostaria de reservar:", "Serviço:", "Data:" etc.) —
  só o nome do serviço e o mês da data respeitam o idioma da UI, exatamente
  como no `submitBooking()` original.
- O preço do casal no seletor ("85 €/pessoa") continua diferente do total
  calculado no resumo ("170 €") — mesma inconsistência do HTML original.
- Trocar de mês depois de já ter escolhido um dia esconde os horários mas
  **não** traz a dica de volta (fica um vazio até o próximo dia ser
  clicado) — replica o comportamento real do `changeMonth()` original, que
  nunca reexibia o hint.
- Os placeholders do formulário ("Nome", "Telefone / WhatsApp", "Alguma
  preferência...") ficam sempre em português, sem tradução — o original
  nunca os envolveu no padrão `data-pt`/`data-en`.

**Para validar:** Cenário 4, abaixo.

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
- [x] `npm run dev` sobe sem erro
- [x] Cor de fundo e fontes conferem lado a lado com `legacy/lucia-massoterapeuta.html`
- **Validado em:** 31/07/2026 — `npm run dev` sem erros/warnings no console,
  `tsc --noEmit` e `npm run lint` limpos, comparação visual via Chrome
  DevTools MCP (fundo `--ink`, serifada Fraunces com itálico correto,
  eyebrow em Space Mono com o mesmo traço/cor) confere com o original

### Cenário 2 — Fase 2: paridade visual das seções estáticas
- [x] Todas as seções estáticas renderizam com paridade visual do `legacy/`
- [x] Toggle PT/EN funciona em todas elas
- [x] Responsivo em desktop e ≤980px
- **Validado em:** 31/07/2026 — comparação via Chrome DevTools MCP (screenshots
  hero/intro/services/ritual/locations/social/footer vs. `legacy/`), toggle
  EN conferido na íntegra, viewport 390px conferido (navlinks somem,
  services-grid vira 1 coluna), `tsc --noEmit` e `npm run lint` limpos
  (só os avisos esperados de `<img>` vs. `next/image`, decisão já registrada),
  console do navegador sem erros de hidratação

### Cenário 3 — Fase 3: calendário e seleção de serviço
- [x] Nos 3 serviços × 2 idiomas: selecionar serviço destaca o card
- [x] Calendário mostra dias disponíveis/lotados/passados corretamente
- [x] Navegação de mês funciona
- [x] Resumo mostra serviço/local corretamente
- **Validado em:** 31/07/2026 — testado via Chrome DevTools MCP: clique no
  botão "Reservar" do card "Amazon Relax Premium — Casal" pré-selecionou o
  serviço e rolou até `#reservar`; resumo mostrou "Amazon Relax Premium —
  Casal" / "Rooftop privado, Olhão" / total "170 €" (vs. "85 €/pessoa" no
  seletor, quirk esperado); calendário de agosto/2026 mostrou só
  sex/sáb/dom disponíveis (dias do serviço) com mistura de dias cheios;
  clique num dia disponível selecionou e formatou a data como "7 ago 2026";
  navegação `›` avançou corretamente para "SETEMBRO 2026"; `tsc --noEmit`
  e `npm run lint` limpos, console sem erros

### Cenário 4 — Fase 4: fluxo completo de reserva
- [x] Nos 3 serviços × 2 idiomas: dia → horários → escolher horário → resumo completo
- [x] Confirmar abre `wa.me` com link/mensagem corretos e traduzidos
- [x] Erro de seleção incompleta aparece corretamente nos dois idiomas
- **Validado em:** 31/07/2026 — testado via Chrome DevTools MCP, fluxo
  completo com Premium Massage: selecionar dia 12 → horários aparecem →
  escolher 15:00 → resumo mostra "12 ago 2026" / "15:00" → preencher
  nome/telefone → confirmar abriu uma aba nova em
  `api.whatsapp.com/send/?phone=351900000000&text=...` com a mensagem
  exata esperada (rótulos em PT, "Data: 12 AGOSTO 2026" em maiúsculas sem
  abreviar, igual ao original); testado também o erro de seleção
  incompleta (preenchendo só nome/telefone, sem serviço/dia/hora) e o
  "gap" de troca de mês após selecionar um dia — ambos batendo com o
  comportamento original; `tsc --noEmit` e `npm run lint` limpos, console
  sem erros

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
