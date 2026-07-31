# Lúcia Massoterapeuta — Landing Page

## O que é este projeto

Landing page de vendas para **Lúcia**, massoterapeuta (massagem com
inspiração/sabedoria amazônica), atendendo em **Faro e Olhão** (Portugal).
Projeto **Next.js 16 (App Router) + TypeScript**, bilíngue PT/EN via
dicionário tipado (não são arquivos/rotas separados por idioma — uma única
página troca de idioma no cliente).

| Pasta/arquivo | Conteúdo |
|---|---|
| `src/app/` | `layout.tsx` (fontes, providers), `page.tsx` (composição das seções), `globals.css` |
| `src/components/` | Seções da página (`Nav`, `Hero`, `Intro`, `Services`, `Ritual`, `Locations`, `Social`, `Footer`) e `Booking/` (widget de agendamento) |
| `src/i18n/` | Dicionários PT/EN tipados + `LangProvider` |
| `src/data/` | `services.ts` (dados do motor de agendamento), `contact.ts` (links de Instagram/Maps) |
| `src/lib/` | `calendar.ts` (disponibilidade/grade do calendário), `whatsapp.ts` (mensagem/link de reserva) |
| `public/images/` | Fotos do site (extraídas do HTML original, que as tinha embutidas em base64) |
| `legacy/lucia-massoterapeuta.html` | **Versão original**, pré-migração — arquivo único autocontido (HTML+CSS+JS), mantida como referência histórica. Não editar; não é mais a página em uso |

Ver `docs/architecture/estrutura-frontend.md` para o detalhamento do motor
de agendamento (tipos, reducer, particularidades preservadas do original).

Para rodar localmente: `npm install` (uma vez) + `npm run dev`, depois abrir
`http://localhost:3000`. `npm run build` para o build de produção,
`npm run lint` para o ESLint.

## Identidade visual

Paleta escura/quente: `--ink` (quase preto), `--ember` (laranja queimado),
`--amazon` (verde profundo), `--gold`, `--parchment` (creme, cor de texto
principal sobre fundo escuro), `--signal` (verde-limão, cor de destaque/CTA).
Definida em `:root` no `src/app/globals.css`. Fontes carregadas via
`next/font/google` em `src/app/layout.tsx` (expostas como CSS vars
`--font-fraunces`/`--font-manrope`/`--font-space-mono`): `Fraunces` (display,
serifada) + `Manrope` (corpo) + `Space Mono` (eyebrows/labels em caixa alta,
monoespaçada).

## Estrutura da página

`Nav` (logo + menu + toggle PT/EN) → `Hero` → `Thread` (divisor decorativo)
→ `Intro` → `Services` → `Ritual` → `Locations` → **`Booking/BookingWidget`
(`#reservar`)** → `Social` (Instagram + depoimento) → `Footer`, compostos em
`src/app/page.tsx` na mesma ordem do `<body>` do HTML original.

## Internacionalização (PT/EN)

Dicionário tipado, não função de lookup por string: `src/i18n/dictionaries/pt.ts`
exporta o objeto `pt` e o tipo `Dictionary = typeof pt`; `en.ts` importa esse
tipo e o TypeScript **acusa erro de compilação** se faltar uma chave ou o
formato não bater. `src/i18n/LangProvider.tsx` expõe `useLang()` →
`{ lang, setLang, t }`; qualquer componente client chama `const { t } = useLang()`
e usa `t.secao.chave`. Trocar de idioma atualiza `document.documentElement.lang`
via `useEffect`.

Strings com HTML embutido (ex.: `<em>` no título do hero) usam sufixo `Html`
no nome do campo (`titleHtml`) e são renderizadas com `dangerouslySetInnerHTML`
— conteúdo é só editorial, sem risco de injeção.

**Ao adicionar texto novo:** sempre pela dicionário (`pt.ts` **e** `en.ts`,
o TypeScript avisa se esquecer um dos dois) — nunca hardcodar string visível
direto no componente. Duas exceções **intencionais**, herdadas do site
original e preservadas na migração (ver `docs/architecture/estrutura-frontend.md`
para detalhes): os placeholders do formulário de reserva e a mensagem
enviada ao WhatsApp continuam sempre em português, independente do idioma
da UI.

## Motor de agendamento (protótipo)

`Booking/BookingWidget.tsx` é uma **simulação de calendário/disponibilidade
no front-end**, sem back-end real — a mesma lógica do HTML original,
portada para TypeScript:

- `src/data/services.ts` — `SERVICES`: os 3 serviços (`premium` Faro 85€,
  `sunset` Olhão 35€, `couple` Olhão 170€/casal), cada um com `days`
  (dias da semana atendidos) e `slots` (horários possíveis).
- `src/lib/calendar.ts` — `isTaken()` marca vagas como ocupadas de forma
  **pseudo-aleatória, mas determinística** (mesmo serviço+dia+hora sempre dá
  o mesmo resultado, não é uma agenda real); `getMonthGrid()` gera a grade
  do calendário; `DEMO_TODAY` é o "hoje" fixo do protótipo
  (`new Date(2026, 6, 31)`) — **intencional**, não generalizar sem que
  alguém peça.
- Fluxo: `ServiceSelect` (dispatch `SELECT_SERVICE`) → `CalendarPanel`
  (grade via `getMonthGrid`, dispatch `SELECT_DAY`) → `SlotsGrid` (dispatch
  `SELECT_SLOT`) → `BookingForm` → `handleFormSubmit` em `BookingWidget`
  monta a mensagem (`src/lib/whatsapp.ts`) e abre
  `https://wa.me/<WHATSAPP_NUMBER>?text=<mensagem>` — a confirmação real
  acontece por WhatsApp, não há gravação de reserva em nenhum servidor.
- Estado central em `useReducer` (`BookingState`/`BookingAction` em
  `BookingWidget.tsx`) — ao adicionar uma transição nova, tratar como uma
  ação do reducer, não um `useState` solto.
- Os botões "Reservar" dos cards em `Services.tsx` pré-selecionam o serviço
  no widget via `Booking/BookingSelectionContext.tsx` (Context simples,
  registra um pedido de serviço + rola até `#reservar`; `BookingWidget`
  consome e aplica via `useEffect`).

O footer já rotula a página como `"Página de demonstração — protótipo"` —
manter esse aviso enquanto o agendamento não estiver ligado a uma agenda
real.

## Do protótipo à produção

Antes de divulgar a página para clientes reais, pelo menos isto precisa ser
resolvido (registrar cada um como uma implementação em
`docs/implementations/` quando for endereçado):

1. **`WHATSAPP_NUMBER` real** — hoje é o placeholder `'351900000000'` em
   `src/lib/whatsapp.ts`.
2. **Disponibilidade real** — hoje é simulada (`isTaken` em
   `src/lib/calendar.ts`); decidir se continua simulada, se vira uma lista
   de horários bloqueados mantida à mão, ou se liga a uma agenda de verdade
   (Google Calendar, Calendly, etc. — ver nota abaixo sobre API/backend).
3. **Remover o aviso de protótipo** do footer quando a página estiver pronta
   para publicar.
4. **Fotos reais** — as 5 fotos atuais (`public/images/`) vieram do
   protótipo original; confirmar com a Lúcia se são as definitivas.

**Sobre uma futura sincronização com o Google Agenda:** ler disponibilidade
de uma agenda pública pode ser feito direto no cliente (API key restrita),
mas **escrever eventos exige credencial que não pode viver no navegador** —
por isso o projeto já está em Next.js, que permite adicionar rotas de API
(`src/app/api/.../route.ts`) no mesmo repositório quando essa integração for
implementada, sem precisar de um backend hospedado à parte. Ainda não há
nenhuma rota de API neste projeto.

## Contato / dados de negócio

Centralizados em `src/data/contact.ts` (`INSTAGRAM_URL`, `INSTAGRAM_HANDLE`,
`MAPS_FARO_URL`):

- Instagram: `@lucia_massoterapeuta_faro.pt`
- WhatsApp: **placeholder** `351900000000` em `src/lib/whatsapp.ts` (ver
  "Do protótipo à produção")
- Locais: gabinete privado em Faro; terraço/rooftop privado em Olhão
- Conformidade citada no footer: normas da DGS, formação certificada DGERT
  (não alterar sem confirmação — é uma claim regulatória)

## Convenções ao editar

- **Nunca hardcodar texto visível fora do dicionário** (ver "Internacionalização"
  acima), exceto as duas exceções intencionais já documentadas (placeholders
  do formulário e mensagem do WhatsApp, sempre PT).
- Ao adicionar/alterar um serviço no agendamento, mexer em
  `src/data/services.ts` (nome PT/EN, preço, local PT/EN, dias, horários) —
  não em texto solto em `Services.tsx`, que é conteúdo estático/marketing
  independente (já é assim desde o original: o preço mostrado no card de
  `Services` pode não bater com o total calculado no widget, ver
  `docs/architecture/estrutura-frontend.md`).
- Ao adicionar uma seção nova que deva entrar no menu: `id` na `<section>`,
  link em `Nav.tsx` e em `Footer.tsx`, e conferir o `scroll-margin`/offset do
  nav fixo se necessário.
- Manter o breakpoint responsivo único (`max-width: 980px`) já usado em
  `globals.css`.
- Estilo é uma única folha global (`src/app/globals.css`), não CSS Modules
  nem Tailwind — decisão da migração, para minimizar risco de divergência
  visual num port 1:1. Não introduzir um segundo paradigma de estilo sem
  discutir antes.
- Imagens usam `<img>` simples apontando para `public/images/`, não
  `next/image` — decisão da migração (evita mudar comportamento de
  carregamento). Reavaliar só se for pedido explicitamente.
- Links de WhatsApp usam texto pré-preenchido via `encodeURIComponent` em
  `src/lib/whatsapp.ts` — ao alterar a mensagem, manter o encoding correto.

## Workflow de Implementação de Features

Toda mudança não-trivial (nova seção, mudança no motor de agendamento,
correção de bug de layout) segue este ciclo. Os arquivos guia estão em
`docs/implementations/`. Ajustes pequenos e óbvios (typo, cor pontual já
especificada pelo usuário) podem pular direto pro commit.

### Ciclo de vida

```
1. Plan Mode (obrigatório para mudanças não-triviais)
   → ler docs/implementations/_guia-documentar-implementacao.md
   → diagnóstico: já existe? o que muda? precisa de par PT/EN? riscos?
   → aguardar aprovação do usuário

2. Criar arquivo docs/implementations/<slug>.md
   → preencher com template de _template-implementacao.md
   → só criado APÓS aprovação do plano

3. Implementar fase a fase
   → cada fase = 1 commit (+ push automático, ver "Git" abaixo)
   → registrar hash do commit no arquivo .md imediatamente após o commit
   → escrever relatório da fase em linguagem simples + prompt de retomada

4. Validar os checks
   → rodar `npm run dev` (ou Chrome DevTools MCP) e conferir visualmente,
     testando PT e EN e, se aplicável, os 3 serviços do agendamento
   → `npx tsc --noEmit` e `npm run lint` limpos antes de dar como feito
   → marcar [x] com data e observação no arquivo

5. Graduação (só quando TODOS os checks estão [x])
   → seguir docs/implementations/_processo-graduacao-implementacao.md
   → migrar convenção/comportamento relevante pro CLAUDE.md ou docs/architecture/
   → git rm do arquivo de implementação
   → commit único de graduação
```

### Regras críticas

- **Nunca avançar para código sem plano aprovado**, exceto ajustes triviais.
- **Nunca graduar com checks `[ ]` em aberto.**
- **Todo texto novo passa pelo dicionário tipado** (`pt.ts`/`en.ts`).
- **Cada fase tem exatamente 1 commit**, hash registrado no .md.

### Arquivos de referência

| Arquivo | Propósito |
|---|---|
| [`docs/implementations/_guia-documentar-implementacao.md`](docs/implementations/_guia-documentar-implementacao.md) | Processo completo passo a passo |
| [`docs/implementations/_template-implementacao.md`](docs/implementations/_template-implementacao.md) | Template concreto preenchido |
| [`docs/implementations/_processo-graduacao-implementacao.md`](docs/implementations/_processo-graduacao-implementacao.md) | Como graduar |
| [`docs/architecture/estrutura-frontend.md`](docs/architecture/estrutura-frontend.md) | Motor de agendamento e decisões da migração Next.js/TS em detalhe |

## Git

Este projeto tem repositório no GitHub: `danielfranca47/lucia-massoterapeuta-landing` (público).

**A cada alteração no projeto (qualquer mudança nos arquivos), fazer commit
com resumo claro das alterações E push imediatamente para o `origin` — sem
precisar perguntar antes.** Isso é diferente do padrão "perguntar antes de
dar push" de outros projetos: aqui o usuário já autorizou push automático em
toda atualização. Não deixar trabalho concluído sem commit+push. Só pausar e
perguntar antes de um push se a ação for destrutiva (force-push, reescrita de
histórico) — isso nunca deve ser feito sem confirmação explícita.
