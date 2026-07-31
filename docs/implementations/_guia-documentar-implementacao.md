# Guia: Como Documentar uma Implementação

Este arquivo é um guia de instrução para o Claude. Leia-o antes de criar
qualquer arquivo em `docs/implementations/`.

---

## Quando este guia se aplica

O Daniel pediu uma mudança não-trivial na landing page da Lúcia. Pode ser:

- "Quero adicionar uma seção nova de X"
- "Trocar o número de WhatsApp / preços / serviços"
- "A página está com um bug de layout no mobile"
- "Quero ligar o calendário a um sistema de agendamento real"

Para ajustes pequenos e óbvios (corrigir um texto, trocar uma cor pontual já
apontada exatamente pelo usuário) este guia pode ser pulado — mas ainda vale
registrar o commit com uma mensagem clara.

---

## Passo 0 — Diagnóstico em Plan Mode (obrigatório para mudanças não-triviais)

Antes de editar `lucia-massoterapeuta.html`, entrar em Plan Mode e responder:

### 1. Essa seção/comportamento já existe?

Ler o arquivo (é um único HTML autocontido — `<style>` no `<head>`, `<script>`
no fim do `<body>`) e verificar se algo parecido já existe. Citar o trecho.

### 2. O que precisa ser construído?

- A mudança precisa de par PT/EN? (lembrar: **não são arquivos separados** —
  é um único elemento com `class="i18n"` + `data-pt="..." data-en="..."`)
- Tem impacto no menu de navegação (`id` de seção + link em `.navlinks` e no
  footer)?
- Tem impacto no motor de agendamento (`SERVICES`, `renderCalendar`,
  `selectDay`, `submitBooking`)? Se sim, testar os 3 serviços, não só um.
- É uma mudança que empurra o protótipo pra produção (ex.: número de
  WhatsApp real, integração com agenda real)? Marcar isso explicitamente no
  plano — ver seção "Do protótipo à produção" no `CLAUDE.md`.

### 3. Riscos e dependências

- Pode quebrar o layout responsivo (breakpoint único)?
- Depende de algo que a Lúcia ainda não confirmou (número de WhatsApp real,
  preços definitivos, fotos reais, texto definitivo)?

**Formato do plano no Plan Mode:**

```
## Diagnóstico

### Já existe?
<Sim / Parcialmente / Não> — <explicação com trecho/linha>

### O que precisa ser construído
<Lista das mudanças>

### Riscos e dependências
<Lista de riscos. "Nenhum" é uma resposta válida.>

### Proposta de fases
Fase 1 — <nome> — <objetivo em uma frase>
...
```

**Aguardar aprovação antes de avançar.**

---

## Passo 1 — Nomear e criar o arquivo

**Formato do nome:** `<slug-descritivo>.md`

Exemplos:
- `secao-precos-nova.md`
- `numero-whatsapp-real.md`
- `fix-calendario-mobile.md`

---

## Passo 2 — Estrutura do arquivo a criar

> **Exemplo concreto preenchido:** [`_template-implementacao.md`](_template-implementacao.md)

```markdown
# <Título descritivo da mudança>

**Status:** Em andamento

---

## Motivação

<O que foi pedido e por quê.>

---

## Problemas Identificados (estado anterior)

1. **Nome do problema:** descrição + onde ocorre no arquivo.

---

## Abordagem

<Prosa ou ASCII descrevendo a solução.>

---

## Plano de Implementação

### Fase 1 — <Nome>

**Objetivo:** <uma frase>

| Área | O que muda |
|---|---|
| `lucia-massoterapeuta.html` | Descrição |

---

## Checks de Validação

### Cenário 1 — <Descrição>
- [ ] Abrir o arquivo `.html` no navegador
- [ ] Ação (clicar, redimensionar pra mobile, trocar idioma, etc.)
- [ ] O que confirmar visualmente

---

## Ajustes Possíveis Pós-Implementação

<Fora do escopo desta rodada.>
```

---

## Passo 3 — Ciclo de vida do arquivo

O arquivo **cresce** conforme a implementação avança — nunca reescrever o que
já foi documentado.

### Quando uma fase é implementada

```markdown
### Commits Fase N

| # | Commit | O que foi implementado |
|---|---|---|
| 1 | `<hash>` | Descrição resumida |
```

### Antes de pedir validação

**1. Relatório em linguagem simples:**

```markdown
### Relatório da Fase N — o que mudou na prática

**Antes:** <1-2 frases, sem jargão>
**Agora:** <1-2 frases>
**Para validar:** <Cenários desta fase>
```

**2. Pedir validação + prompt de retomada:**

> "Pode abrir o arquivo no navegador e conferir [o quê]? Se preferir depois,
> cole: Lê `<arquivo>.md`, seção 'Fase N', e me diga o que falta validar."

### Quando um cenário é confirmado

```markdown
- [x] Confirmar: X aparece corretamente em PT e EN
- **Validado em:** 31/07/2026 — conferido no navegador, desktop e mobile
```

### Quando a validação revelar um problema

```markdown
## Fase N+1 — Diagnóstico + Correção (data)

### Problema identificado
<causa raiz>

### Correção
| Área | Mudança |
|---|---|
```

### Quando estiver completo

```markdown
**Status:** Todos os cenários validados (DD/MM/AAAA)
```

Seguir [`_processo-graduacao-implementacao.md`](_processo-graduacao-implementacao.md).

---

## Validação dos checks

Este projeto não tem servidor/build — o arquivo `.html` abre direto no
navegador. Duas formas de validar:

- **Abrir localmente e conferir visualmente** (o Claude pode usar o Chrome
  DevTools MCP, se disponível, pra abrir o arquivo e inspecionar — incluindo
  testar os dois idiomas via o toggle PT/EN e os 3 serviços do agendamento),
  ou
- **Aguardar o usuário** abrir e reportar.

Sempre testar os **3 serviços** do agendamento (Premium Massage, Sunset
Amazon Massage, Amazon Relax Premium — Casal), não só um, já que cada um tem
dias/horários/preços próprios em `SERVICES`.

---

## Regras de escrita

1. Registrar decisões descartadas com o porquê, em uma frase.
2. Causa raiz explícita em correções.
3. Antes/depois de código só quando não-óbvio.
4. Sem histórico acumulado no texto — isso fica nos commits.
5. Checks realistas e executáveis, cobrindo PT e EN quando aplicável.
6. Relatório em linguagem simples por fase, sempre antes de pedir validação.

---

## Nota

O arquivo `.md` só é criado após o plano ser aprovado (ou imediatamente, pra
mudanças triviais). É o contrato vivo entre o usuário e o Claude durante o
desenvolvimento da mudança.
