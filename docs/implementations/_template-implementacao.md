# [TEMPLATE] Número de WhatsApp Real no Agendamento

> Este arquivo é um exemplo concreto (fictício, ilustrativo) de como uma
> implementação preenchida deve ficar. Use-o como referência de formato. Para
> o processo completo, ver `_guia-documentar-implementacao.md`.

---

**Status:** Todos os cenários validados (31/07/2026)

---

## Motivação

O número de WhatsApp usado no handoff da reserva (`WHATSAPP_NUMBER` no
`<script>` final) ainda é o placeholder de demonstração `351900000000`. A
Lúcia confirmou o número real de atendimento e pediu para trocar antes de
divulgar a página.

---

## Problemas Identificados (estado anterior)

1. **Número placeholder ativo:** `lucia-massoterapeuta.html`, dentro de
   `submitBooking()`, `const WHATSAPP_NUMBER = '351900000000';` — qualquer
   reserva confirmada hoje abriria um número que não existe de verdade.

---

## Abordagem

Trocar apenas a constante `WHATSAPP_NUMBER` pelo número real, em formato
internacional sem `+` nem espaços (mesmo padrão já usado). Nenhuma outra
mudança de lógica é necessária — o restante do fluxo (seleção de serviço,
calendário, formulário, montagem da mensagem) já está correto.

---

## Plano de Implementação

### Fase 1 — Trocar a constante

**Objetivo:** todas as reservas confirmadas abrirem o WhatsApp real da Lúcia.

| Área | O que muda |
|---|---|
| `lucia-massoterapeuta.html` (`submitBooking()`) | `WHATSAPP_NUMBER` passa do placeholder para o número real fornecido pela Lúcia |

### Commits Fase 1

| # | Commit | O que foi implementado |
|---|---|---|
| 1 | `a1b2c3d` | troca WHATSAPP_NUMBER placeholder pelo número real de atendimento |

### Relatório da Fase 1 — o que mudou na prática

**Antes:** confirmar uma reserva abria o WhatsApp de um número fictício de
demonstração.
**Agora:** confirmar uma reserva abre o WhatsApp real da Lúcia, com a
mensagem pré-preenchida (serviço, data, hora, nome, telefone, nota).
**Para validar:** Cenário 1, abaixo.

---

## Checks de Validação

### Cenário 1 — Reserva abre o número correto nos 3 serviços
- [x] Abrir `lucia-massoterapeuta.html` no navegador
- [x] Para cada um dos 3 serviços (Premium, Sunset, Casal): escolher dia,
      hora, preencher nome/telefone e clicar em "Confirmar reserva via
      WhatsApp"
- [x] Confirmar que o link `wa.me/...` gerado usa o número real, em PT e EN
- **Validado em:** 31/07/2026 — conferido nos 3 serviços, PT e EN

---

## Ajustes Possíveis Pós-Implementação

- Avaliar, com a Lúcia, se a disponibilidade do calendário deve continuar
  simulada (`isTaken`, pseudo-aleatória) ou ligar a uma agenda real (Google
  Calendar, Calendly, etc.) — ver "Do protótipo à produção" no `CLAUDE.md`.
