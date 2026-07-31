# Processo de Graduação: Implementação → Arquitetura

Quando um arquivo de `docs/implementations/` está **completo e validado**, o
conteúdo relevante deve ser "graduado" para `docs/architecture/` (ou para o
`CLAUDE.md`, se for uma convenção que afeta a página como um todo).

---

## Quando executar este processo

1. O arquivo tem `**Status:** Todos os cenários validados`
2. Todos os checks obrigatórios estão `[x]`
3. Não há fases abertas sem commit associado

---

## Passo 1 — Identificar o que foi afetado

| A implementação afetou... | Onde documentar |
|---|---|
| Convenção que vale pra página inteira (ex.: novo padrão de seção, nova regra de i18n) | `CLAUDE.md`, seção "Convenções ao editar" |
| Comportamento específico de uma seção nova/complexa (ex.: como o motor do calendário funciona) | `docs/architecture/<slug>.md` |
| Dado de contato/negócio que mudou (WhatsApp, Instagram, preços, locais) | `CLAUDE.md`, seção "Contato / dados de negócio" |

---

## Passo 2 — Ler o que já existe

Ler o `CLAUDE.md` na íntegra (é curto) e qualquer doc já existente em
`docs/architecture/` antes de decidir onde a informação deve entrar.

---

## Passo 3 — Atualizar

- Reescrever apenas a seção afetada — sem "antes era X, agora é Y" no texto.
- Se a mudança introduz um padrão novo que deve se repetir (ex.: como
  adicionar um serviço novo ao agendamento), isso vai para "Convenções ao
  editar" do `CLAUDE.md`, não para um doc separado.
- Se for uma seção grande e específica (como o motor de disponibilidade do
  calendário), criar `docs/architecture/<slug>.md`.

---

## Passo 4 — Deletar o arquivo de implementação

```bash
git rm docs/implementations/<nome-do-arquivo>.md
```

**O que NÃO precisa migrar:** histórico de fases, notas de validação com
data (ficam nos commits).

**O que SIM precisa migrar:** convenções novas, dados de contato/negócio
atualizados, comportamento de seções não-óbvias.

---

## Passo 5 — Commit único

```
docs: gradua <slug-da-feature> → atualiza CLAUDE.md/docs/architecture

- CLAUDE.md: <o que foi atualizado>
- remove docs/implementations/<arquivo>.md (todos os checks validados)
```

Lembrar: **este projeto faz push automático a cada atualização** (ver
`CLAUDE.md`, seção "Git") — a graduação também é seguida de push, sem
precisar perguntar.

---

## Manutenção deste processo

Se o processo mudar, atualizar este arquivo para refletir o padrão atual.
