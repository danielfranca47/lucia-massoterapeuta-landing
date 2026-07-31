# docs/implementations — Guia

## O que é esta pasta

Documentos de trabalho para mudanças não-triviais na landing page da Lúcia.
Cada arquivo acompanha a mudança do diagnóstico aos checks validados. São
temporários: quando validados, o conteúdo relevante migra para `CLAUDE.md`
ou `docs/architecture/`, e o arquivo é deletado.

---

## Arquivos

### Arquivos com `_` — guias e processos (permanentes)

| Arquivo | Para que serve |
|---|---|
| `_guia-documentar-implementacao.md` | Processo completo: Plan Mode, estrutura, ciclo de vida |
| `_template-implementacao.md` | Exemplo concreto preenchido |
| `_processo-graduacao-implementacao.md` | Como migrar pra `CLAUDE.md`/`docs/architecture/` e deletar |

### Arquivos regulares — implementações ativas

| Arquivo | Status |
|---|---|
| `migracao-nextjs-typescript.md` | Em andamento — Fases 1-2 concluídas, iniciando Fase 3 |

---

## Prompts úteis

### Quero começar uma mudança nova

```
Segue o processo em docs/implementations/_guia-documentar-implementacao.md.
Quero [descrever a mudança].
```

### Quero graduar um arquivo completo

```
O arquivo docs/implementations/<nome>.md está com todos os checks validados.
Segue docs/implementations/_processo-graduacao-implementacao.md.
```
