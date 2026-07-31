# Sincronização com Google Agenda — disponibilidade real no agendamento

**Status:** Em andamento

---

## Motivação

O widget de reserva (`Booking/BookingWidget.tsx`) hoje simula
disponibilidade: `isTaken()` em `src/lib/calendar.ts` é um hash
pseudo-aleatório determinístico, e `DEMO_TODAY` é uma data fixa
(31/07/2026) — não existe nenhuma conexão com uma agenda real (ver
CLAUDE.md, "Do protótipo à produção", item 2). O Daniel pediu para
sincronizar com a agenda do Google Calendar da Lúcia, de forma que os
horários exibidos no calendário/slots sejam realmente livres. A reserva em
si continua sendo finalizada por WhatsApp — não há escrita automática de
evento na agenda nesta rodada (ver "Fora de escopo").

---

## Problemas Identificados (estado anterior)

1. **Disponibilidade simulada:** `src/lib/calendar.ts`, `isTaken()` —
   `(serviceKey.charCodeAt(0)*31 + dayNum*7 + Number(slot))%5 === 0`, não
   reflete nenhum compromisso real da Lúcia.
2. **"Hoje" congelado:** `DEMO_TODAY = new Date(2026, 6, 31)` — deixa de
   fazer sentido a partir do momento em que a disponibilidade passa a ser
   real; precisa virar a data atual de verdade.
3. **Horários fixos, sem duração real:** `SERVICES` (`src/data/services.ts`)
   define `slots: string[]` fixos por serviço, sem duração de sessão nem
   folga entre atendimentos — não dá pra cruzar corretamente com eventos
   reais de uma agenda (um evento pode ocupar um intervalo que não bate
   exatamente com nenhum slot fixo).

---

## Decisões confirmadas (com o Daniel, 31/07/2026)

- Só leitura (`freebusy`), sem criar evento automaticamente na agenda.
- Duração real por serviço: **Premium 60min, Sunset 30min, Casal 60min.**
- Folga obrigatória de **30min** antes/depois de cada sessão.
- Horários passam a ser **gerados dinamicamente** dentro do expediente de
  cada serviço (não mais lista fixa) — expediente inferido a partir dos
  horários atuais e confirmado:
  - Premium (Faro): 10:00–20:00
  - Sunset (Olhão): 19:30–20:30
  - Casal (Olhão): 18:00–20:00
- Se a API do Google falhar: mostrar erro e bloquear seleção de horário —
  nunca mostrar disponibilidade inventada.
- **A Lúcia mantém 3 agendas separadas** (Air BnB, Terraço, Gabinete Faro —
  ver detalhe abaixo). Como ela é uma pessoa só, um compromisso em
  qualquer uma delas bloqueia a disponibilidade nas outras também — as 3
  são consultadas juntas e tratadas como uma lista única de horários
  ocupados, aplicada igualmente aos 3 serviços (sem mapear "agenda X só
  vale pro serviço Y").

### As 3 agendas da Lúcia

| Agenda | O que registra |
|---|---|
| Air BnB | Marcações recebidas pela plataforma Airbnb — terraço ou deslocação |
| Terraço | Marcações do terraço em Olhão que não vieram do Airbnb |
| Gabinete Faro | Marcações no gabinete privado de Faro |

---

## Abordagem

Rota de API server-side no Next.js (`src/app/api/availability/route.ts`)
autentica com uma Service Account do Google e consulta
`calendar.freebusy.query` — a credencial nunca chega ao navegador. O
front-end busca `{ busy: [...] }` para o mês visível e gera dinamicamente,
no cliente, os horários de início válidos: dentro do expediente, não
passado, e sem sobrepor `[busy.start − 30min, busy.end + 30min]`.

```
Browser (BookingWidget)
   → fetch /api/availability?year=2026&month=7
Next.js API route (server, credencial nunca exposta)
   → Google Calendar API: calendar.freebusy.query() nas 3 agendas de uma vez
   → devolve só { busy: [{start,end}, ...] }, já com as 3 juntas
     — sem título/detalhe de eventos, sem dizer de qual agenda veio cada uma
Browser
   → gera dinamicamente os horários de início válidos do serviço/dia
     cruzando expediente + duração + folga de 30min com os intervalos busy
```

**Consequência de UX:** `SlotsGrid` deixa de mostrar uma lista fixa com
itens "cinza/ocupado" — passa a mostrar só os horários realmente
disponíveis, já calculados.

---

## Plano de Implementação

### Fase 1 — Credenciais + rota de API (leitura pura, sem tocar na UI)

**Objetivo:** ter uma rota server-side que devolve os intervalos ocupados
reais da agenda da Lúcia, sem nenhum impacto no site atual.

| Área | O que muda |
|---|---|
| `package.json` | Adiciona dependência `googleapis` |
| `src/app/api/availability/route.ts` (novo) | `GET`, query params `year`/`month` (a disponibilidade ocupada é a mesma pra qualquer serviço — quem interpreta por duração/expediente é o front-end na Fase 2/3); autentica via Service Account, chama `calendar.freebusy.query` com as 3 agendas (`GOOGLE_CALENDAR_IDS`) numa única requisição (escopo `calendar.freebusy`), junta os `busy` das 3 num só array e devolve `{ busy: [{start, end}] }`; erro → HTTP 500/502 + `{ error }` |
| `.env.example` (novo, comitado) | Documenta `GOOGLE_CALENDAR_IDS` (lista separada por vírgula, uma por agenda), `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` (placeholders) |
| `.env.local` (não comitado) | Valores reais para dev local |

**Passo externo (manual, fora do editor) — roteiro recomendado**

Princípio: o projeto no Google Cloud fica na **conta da Lúcia** (é
infraestrutura do negócio dela), e o Daniel é adicionado como colaborador
via IAM — ele nunca recebe a senha dela, e ela nunca precisa mexer em nada
técnico além de um clique de compartilhamento no fim. A chave secreta
gerada é vista só pelo Daniel.

*Parte A — a Lúcia faz (é dona do projeto):*
1. Entrar em [console.cloud.google.com](https://console.cloud.google.com/)
   com a conta Google que ela já usa pro Google Agenda (aceitar os termos,
   se for a primeira vez).
2. No seletor de projeto (topo da página) → **"Novo projeto"** → nome
   sugerido `lucia-massoterapeuta-agenda` → **Criar**.
3. Menu ☰ → **"IAM e administrador"** → **"IAM"** → **"Conceder acesso"** →
   colar o e-mail Google do Daniel → papel **"Editor"** → **Salvar**.
   (Isso dá acesso só a esse projeto específico, não à conta dela, ao
   Gmail ou à Agenda em si.)

*Parte B — o Daniel faz (agora com acesso ao projeto dela):*
4. Selecionar o projeto que ela criou (seletor de projeto, topo da página).
5. **"APIs e serviços" → "Biblioteca"** → buscar **"Google Calendar API"**
   → **Ativar**.
6. **"APIs e serviços" → "Credenciais" → "Criar credenciais" → "Conta de
   serviço"** → nome sugerido `site-agendamento` → **"Criar e continuar"**
   → pode pular a etapa de papéis de projeto (não precisa) → **Concluído**.
7. Abrir a Service Account recém-criada → aba **"Chaves"** → **"Adicionar
   chave" → "Criar nova chave"** → tipo **JSON** → **Criar** (baixa um
   arquivo `.json` — essa é a chave secreta, guardar com cuidado, não
   compartilhar por e-mail/WhatsApp em texto aberto).
8. Anotar o e-mail da Service Account, visível na tela (formato
   `nome@id-do-projeto.iam.gserviceaccount.com`).

*Parte C — a Lúcia faz de novo (só isso, sem tocar em Cloud Console) —
repetir os passos 9-10 pras 3 agendas dela (Air BnB, Terraço, Gabinete
Faro), uma de cada vez:*
9. Abrir [calendar.google.com](https://calendar.google.com/) → engrenagem
   ⚙ → escolher **uma das 3 agendas** na lista à esquerda →
   **"Configurações e compartilhamento"** → **"Compartilhar com pessoas
   específicas" → "Adicionar pessoas"** → colar o e-mail da Service
   Account (passo 8) → permissão **"Ver apenas informações de
   disponibilidade (ocupado/livre)"** (a mais restrita da lista — não dá
   acesso a título/detalhe dos eventos) → **Enviar**.
10. Na mesma tela de configurações dessa agenda, seção **"Integrar
    agenda"** → copiar o **"ID da agenda"** (pra agendas secundárias
    criadas por ela, costuma ser algo como
    `xxxxx@group.calendar.google.com`, diferente do e-mail Gmail dela) e
    anotar. Repetir os passos 9-10 pras outras 2 agendas, guardando os 3
    IDs, e passar os 3 pro Daniel.

*Parte D — o Daniel finaliza (local + Vercel):*
11. Abrir o `.json` baixado no passo 7: `client_email` vira
    `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `private_key` vira
    `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` (colar com as quebras de linha
    como `\n` literais, numa linha só — igual ao exemplo em
    `.env.example`), e os 3 IDs do passo 10 viram `GOOGLE_CALENDAR_IDS`,
    separados por vírgula, sem espaço.
12. Copiar `.env.example` para `.env.local` (não comitado) e preencher os
    3 valores, pra testar localmente.
13. Quando o site for pro Vercel: as mesmas 3 variáveis em Project
    Settings → Environment Variables.
14. Apagar o `.json` baixado da pasta de Downloads depois de copiar os
    valores — não precisa ficar solto no disco depois de usado.

**Custo:** gratuito — a cota gratuita do Google Calendar API cobre bem
esse volume de uso; normalmente não pede conta de faturamento pra essa
API específica.

### Commits Fase 1

| # | Commit | O que foi implementado |
|---|---|---|
| 1 | `3d1c130` | dependência `googleapis` + override de `gaxios` (corrige 4 vulnerabilidades altas herdadas), rota `GET /api/availability` (freebusy, sem escrever na agenda) e `.env.example` |
| 2 | `8767419` | rota e `.env.example` passam de 1 pra 3 agendas (`GOOGLE_CALENDAR_IDS`) — a Lúcia mantém agendas separadas por canal (Air BnB/Terraço/Gabinete Faro); as 3 são consultadas juntas e tratadas como uma disponibilidade única |

### Relatório da Fase 1 — o que mudou na prática

**Antes:** não existia nenhuma rota de servidor no projeto; disponibilidade
era só simulação local no navegador.
**Agora:** existe uma rota `/api/availability?year=AAAA&month=M` (mês
0-indexado) que, com as credenciais reais configuradas, consulta a agenda
real da Lúcia no Google Calendar e devolve só os intervalos ocupados —
nada na UI foi alterado ainda, então o site continua funcionando
exatamente como antes.
**Para validar:** Cenário 1, abaixo — depende das credenciais reais
(passo externo acima) estarem configuradas; sem elas, a rota responde
`500` com uma mensagem clara em vez de travar.

### Fase 2 — Modelo de dados: duração + expediente por serviço

**Objetivo:** `SERVICES` sabe duração e expediente reais, prontos para
cruzar com dados de uma agenda.

| Área | O que muda |
|---|---|
| `src/data/services.ts` | `Service` ganha `durationMinutes: number` + `workWindow: { start: string; end: string }` (valores reais dos 3 serviços) — `slots` mantido por enquanto (`@deprecated`), a UI ainda o usa até a Fase 3 |
| `src/lib/availability.ts` (novo) | `generateSlotsForDay(service, date, busy, now)` — função pura; constantes `BUFFER_MINUTES = 30` e `SLOT_GRANULARITY_MINUTES = 30` |

### Commits Fase 2

| # | Commit | O que foi implementado |
|---|---|---|
| 1 | `8ee7555` | `durationMinutes`/`workWindow` em `SERVICES`, `generateSlotsForDay` em `src/lib/availability.ts` (ainda não conectada à UI) |

### Relatório da Fase 2 — o que mudou na prática

**Antes:** `SERVICES` só sabia os horários fixos de cada serviço, sem
duração real nem expediente — impossível cruzar corretamente com eventos
de uma agenda.
**Agora:** cada serviço tem duração real e expediente (janela de início),
e existe uma função pura (`generateSlotsForDay`) que já sabe calcular os
horários de início válidos cruzando isso com uma lista de intervalos
ocupados — mas nada na UI foi trocado ainda (`slots`/`isTaken` continuam
sendo o que aparece pro visitante). Zero mudança visível no site.
**Para validar:** nenhum cenário visual ainda — a lógica só entra em uso
na Fase 3. Conferido manualmente que, pro Premium (10:00–20:00, 60min),
um evento de 12:00–13:00 bloqueia até 13:00 e libera de novo só a partir
das 13:30 (60min de sessão + 30min de folga depois do evento).

### Fase 3 — Wiring completo no widget

**Objetivo:** o widget de reserva mostra disponibilidade real de verdade,
nos 3 serviços, em PT e EN.

| Área | O que muda |
|---|---|
| `Booking/BookingWidget.tsx` | `useEffect` busca `/api/availability` ao mudar serviço/mês; estado loading/error/ready + `busy`; `INITIAL_MONTH` vira o mês atual real |
| `Booking/CalendarPanel.tsx` | Disponibilidade do dia via `generateSlotsForDay(...).length > 0` |
| `Booking/SlotsGrid.tsx` | Renderiza os horários vindos de `generateSlotsForDay`, não mais `service.slots` + `isTaken` |
| `src/lib/calendar.ts` | `DEMO_TODAY` → `new Date()` real; `isTaken` removido; `getMonthGrid` recebe `busy` |
| `src/i18n/dictionaries/pt.ts` / `en.ts` | Chaves novas em `booking`: texto de carregando e texto de erro (sugerindo WhatsApp como alternativa) |
| `src/data/services.ts` | Campo `slots` removido (não usado mais — substituído por `durationMinutes`/`workWindow` + geração dinâmica) |

### Commits Fase 3

| # | Commit | O que foi implementado |
|---|---|---|
| 1 | `e350cfb` | Wiring completo: fetch de disponibilidade real no `BookingWidget`, `CalendarPanel`/`SlotsGrid` usando `generateSlotsForDay`, `DEMO_TODAY`/`INITIAL_MONTH` viram data real, `slots`/`isTaken` removidos, textos de loading/erro no dicionário |

### Relatório da Fase 3 — o que mudou na prática

**Antes:** o calendário mostrava disponibilidade simulada (hash
pseudo-aleatório), com "hoje" congelado em 31/07/2026 e uma lista fixa de
horários por serviço.
**Agora:** o widget busca a disponibilidade real das 3 agendas da Lúcia ao
abrir/trocar de mês, e os horários oferecidos são gerados dinamicamente
cruzando expediente + duração + folga de 30min com os compromissos reais
— testado ao vivo (Chrome DevTools MCP) com a agenda real: um evento das
12:00–13:30 (fuso de Portugal) bloqueou corretamente os horários entre
11:00–13:30 do Premium e liberou 14:00 em diante. "Hoje" agora é a data
real do sistema, e o mês inicial do calendário é o mês atual.
**Para validar:** Cenário 2 e 3, abaixo.

### Fase 4 — Validação end-to-end + graduação

- Configurar as env vars reais no Vercel.
- Testar os 3 serviços em PT e EN, desktop e mobile, incluindo o caminho de
  erro.
- Atualizar `CLAUDE.md` (item 2 do checklist) e
  `docs/architecture/estrutura-frontend.md` ("Motor de agendamento").
- Seguir `_processo-graduacao-implementacao.md`.

---

## Checks de Validação

### Cenário 1 — Rota de API devolve dados reais (Fase 1)
- [x] Com env vars reais configuradas (as 3 agendas em `GOOGLE_CALENDAR_IDS`), chamar `/api/availability?year=2026&month=7`
- **Validado em:** 31/07/2026 — rota chamada localmente com credenciais reais, devolveu 4 intervalos `busy` já combinados das agendas reais da Lúcia, sem erro
- [ ] Criar um evento de teste isolado em cada uma das 3 agendas (Air BnB, Terraço, Gabinete Faro) e confirmar que os 3 aparecem juntos em `busy` (o teste acima usou eventos já existentes nas agendas, não um evento controlado por agenda — vale revalidar assim na Fase 4)
- [ ] Confirmar que sem credencial/agenda compartilhada a rota devolve erro claro (HTTP 500/502 + `{ error }`), não trava

### Cenário 2 — Slots dinâmicos corretos (Fase 2/3)
- [x] Confirmar que os horários oferecidos respeitam duração + 30min de folga, usando um evento real já existente na agenda (em vez de criar um novo de propósito)
- **Validado em:** 31/07/2026 — evento real das 12:00–13:30 (hora de Portugal) no Premium (10:00–20:00, 60min) bloqueou corretamente 11:00–13:30 e liberou 14:00 em diante; testado ao vivo via Chrome DevTools MCP
- [x] Confirmar no calendário do site que o dia aparece "available"/"full" corretamente conforme a disponibilidade
- **Validado em:** 31/07/2026 — mês corrente (julho/2026) com todos os dias passados desabilitados; agosto/2026 com dias corretos habilitados por serviço (Sunset/Casal só sexta-sábado-domingo, conforme `days`)

### Cenário 3 — Fluxo completo nos 3 serviços, PT e EN (Fase 3/4)
- [x] Para Premium, Sunset e Casal: escolher dia, escolher horário, preencher formulário, confirmar via WhatsApp — mensagem final correta
- **Validado em:** 31/07/2026 — os 3 serviços testados ao vivo; URL do WhatsApp gerada com número real, serviço, data, hora, nome e telefone corretos; total calculado corretamente (170€ para o Casal, refletindo `SERVICES.couple.price`, não o "85€/pessoa" do card de marketing — comportamento intencional já documentado)
- [x] Repetir com idioma EN
- **Validado em:** 31/07/2026 — toggle EN confere, textos e formatos de data traduzidos corretamente, estado do calendário preservado ao trocar de idioma
- [ ] Testar em mobile (responsivo)

### Cenário 4 — Fallback de erro (Fase 3/4)
- [ ] Simular falha da API (ex.: credencial errada) e confirmar que aparece a mensagem de erro, com seleção de horário bloqueada — nunca disponibilidade falsa

---

## Ajustes Possíveis Pós-Implementação

- Criar evento automaticamente na agenda da Lúcia quando o cliente confirma
  via WhatsApp (exigiria escopo OAuth de escrita, `calendar.events`) — até
  lá, ela precisa adicionar o compromisso manualmente para que ele passe a
  bloquear disponibilidade futura.
- Reavaliar a granularidade de 30min na geração de slots, se no futuro não
  bater com a realidade do atendimento.
