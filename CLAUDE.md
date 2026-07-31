# Lúcia Massoterapeuta — Landing Page

## O que é este projeto

Landing page de vendas para **Lúcia**, massoterapeuta (massagem com
inspiração/sabedoria amazônica), atendendo em **Faro e Olhão** (Portugal).
Um único arquivo, **bilíngue PT/EN via toggle no próprio JS** (não são
arquivos separados por idioma):

| Arquivo | Conteúdo |
|---|---|
| `lucia-massoterapeuta.html` | Página completa — hero, serviços, ritual, locais, **agendamento com automação**, social, footer |

Não há build, framework ou `package.json`. O arquivo é **autocontido**: HTML
+ CSS (`<style>` no `<head>`) + JS (no fim do `<body>`). Para visualizar,
basta abrir o `.html` direto no navegador.

## Identidade visual

Paleta escura/quente: `--ink` (quase preto), `--ember` (laranja queimado),
`--amazon` (verde profundo), `--gold`, `--parchment` (creme, cor de texto
principal sobre fundo escuro), `--signal` (verde-limão, cor de destaque/CTA).
Fontes: `Fraunces` (display, serifada) + `Manrope` (corpo) + `Space Mono`
(eyebrows/labels em caixa alta, monoespaçada).

## Estrutura da página

`nav` (logo + menu + toggle PT/EN) → `hero` → `intro` → `servicos` →
`ritual` → `locais` → **`booking` (`#reservar`)** → `social` (Instagram +
depoimento) → `footer`.

## Internacionalização (PT/EN)

**Não existem dois arquivos.** Cada elemento de texto traduzível tem
`class="i18n"` + `data-pt="..."` + `data-en="..."`, e o texto visível
inicial (dentro da tag) é o PT. A função `setLang(lang)` (no `<script>`
final) troca o `innerHTML` de todo `.i18n` para o idioma escolhido, re-renderiza
o calendário e o resumo da reserva, e atualiza `document.documentElement.lang`.
O botão de idioma fica em `.lang-toggle` no nav.

**Ao adicionar texto novo:** sempre usar `class="i18n"` com os dois atributos
`data-pt`/`data-en` preenchidos — nunca hardcodar texto sem tradução, mesmo
que pareça um detalhe pequeno (labels de formulário, mensagens de erro,
nomes de meses/dias já existem centralizados em `MONTH_NAMES`/`DOW` no JS).

## Motor de agendamento (protótipo)

A seção `#reservar` é uma **simulação de calendário/disponibilidade no
front-end**, sem back-end real:

- `SERVICES` (objeto no `<script>`) define os 3 serviços: `premium` (Faro,
  85€), `sunset` (Olhão, 35€), `couple` (Olhão, 170€/casal) — cada um com
  `days` (dias da semana atendidos) e `slots` (horários possíveis).
- `isTaken(serviceKey, dayNum, slot)` marca vagas como ocupadas de forma
  **pseudo-aleatória, mas determinística** (mesmo serviço+dia+hora sempre dá
  o mesmo resultado) — não é uma agenda real, é só para a demonstração
  parecer viva.
- Fluxo: `selectService()` → `renderCalendar()` (pinta dias disponíveis em
  verde conforme `SERVICES[x].days`) → `selectDay()` (mostra horários) →
  usuário escolhe horário e preenche nome/telefone/nota → `submitBooking()`
  monta uma mensagem de texto com os dados e abre
  `https://wa.me/<WHATSAPP_NUMBER>?text=<mensagem>` — a confirmação real
  acontece por WhatsApp, não há gravação de reserva em nenhum servidor.
- `currentDate` começa fixo em agosto/2026 e o "hoje" do calendário está
  hardcoded (`new Date(2026,6,31)`, 31/07/2026) para a demonstração fazer
  sentido — **isso é intencional no protótipo**, não um bug.

O footer já rotula a página como `"Página de demonstração — protótipo"` —
manter esse aviso enquanto o agendamento não estiver ligado a uma agenda
real.

## Do protótipo à produção

Antes de divulgar a página para clientes reais, pelo menos isto precisa ser
resolvido (registrar cada um como uma implementação em
`docs/implementations/` quando for endereçado):

1. **`WHATSAPP_NUMBER` real** — hoje é o placeholder `'351900000000'` em
   `submitBooking()`.
2. **Disponibilidade real** — hoje é simulada (`isTaken`); decidir se
   continua simulada, se vira uma lista de horários bloqueados mantida à mão,
   ou se liga a uma agenda de verdade (Google Calendar, Calendly, etc.).
3. **Remover o aviso de protótipo** do footer quando a página estiver pronta
   para publicar.
4. **Fotos reais** — conferir se há placeholders de imagem pendentes de
   substituição ao evoluir a página.

## Contato / dados de negócio

- Instagram: `@lucia_massoterapeuta_faro.pt` →
  `https://www.instagram.com/lucia_massoterapeuta_faro.pt/reels/`
- WhatsApp: **placeholder** `351900000000` (ver "Do protótipo à produção")
- Locais: gabinete privado em Faro; terraço/rooftop privado em Olhão
- Conformidade citada no footer: normas da DGS, formação certificada DGERT
  (não alterar sem confirmação — é uma claim regulatória)

## Convenções ao editar

- **Nunca hardcodar texto visível sem par `data-pt`/`data-en`** (ver seção
  de i18n acima).
- Ao adicionar/alterar um serviço no agendamento, mexer em `SERVICES` (nome
  PT/EN, preço, local PT/EN, dias, horários) — não em texto solto na seção
  `servicos`, que é conteúdo estático separado da lógica de agendamento.
- Ao adicionar uma seção nova que deva entrar no menu: adicionar `id` na
  `<section>`, adicionar o link em `.navlinks` (nav) e no footer
  (`.footer-grid`), e conferir `scroll-behavior`/offset do nav fixo.
- Manter o breakpoint responsivo único já usado no arquivo.
- Não introduzir dependências externas (frameworks JS, build tools) — o
  objetivo é manter o arquivo simples, portável e fácil de colar num
  publicador (WordPress/similar) no futuro.
- Links de WhatsApp usam texto pré-preenchido via `?text=` com
  `encodeURIComponent` — ao alterar a mensagem montada em `submitBooking()`,
  manter o encoding correto.

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
   → abrir o .html no navegador (ou Chrome DevTools MCP) e conferir,
     testando PT e EN e, se aplicável, os 3 serviços do agendamento
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
- **Todo texto novo tem par `data-pt`/`data-en`.**
- **Cada fase tem exatamente 1 commit**, hash registrado no .md.

### Arquivos de referência

| Arquivo | Propósito |
|---|---|
| [`docs/implementations/_guia-documentar-implementacao.md`](docs/implementations/_guia-documentar-implementacao.md) | Processo completo passo a passo |
| [`docs/implementations/_template-implementacao.md`](docs/implementations/_template-implementacao.md) | Template concreto preenchido |
| [`docs/implementations/_processo-graduacao-implementacao.md`](docs/implementations/_processo-graduacao-implementacao.md) | Como graduar |

## Git

Este projeto tem repositório no GitHub: `danielfranca47/lucia-massoterapeuta-landing` (público).

**A cada alteração no projeto (qualquer mudança nos arquivos), fazer commit
com resumo claro das alterações E push imediatamente para o `origin` — sem
precisar perguntar antes.** Isso é diferente do padrão "perguntar antes de
dar push" de outros projetos: aqui o usuário já autorizou push automático em
toda atualização. Não deixar trabalho concluído sem commit+push. Só pausar e
perguntar antes de um push se a ação for destrutiva (force-push, reescrita de
histórico) — isso nunca deve ser feito sem confirmação explícita.
