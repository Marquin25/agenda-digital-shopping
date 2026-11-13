# Etapa 1 — Descoberta e inspeção

> Projeto: **Conecta Shopping** (nome provisório) · Data: 2026-11-13 · Status: perguntas respondidas em 2026-11-13; plano em `docs/spec/`.

## 1. Estado do repositório

| Item | Situação |
| --- | --- |
| Remoto | `origin` → `https://github.com/Marquin25/agenda-digital-shopping.git` (público) |
| Histórico | 2 commits em `main` (`028d50f` Initial commit, `7c6765c` docs: descrever proposta) |
| Conteúdo existente | Apenas `README.md` com a proposta do produto. Nenhum código, stack, CI ou convenção de branch definida. |
| Branch de trabalho | `docs/etapa-1-descoberta` (local; sem push) |
| Instruções de agente | `CLAUDE.md` + `docs/agents/*` criados pelo setup das skills (issue tracker atual: **markdown local** em `.scratch/`) |
| Ferramentas locais | Node 26.8, npm 11.19, Docker 29.5, Python 3.9. **`gh` (GitHub CLI) não instalado** → board e issues no GitHub estão bloqueados. |

### Diferenças entre o README e o pedido atual

O README já publicado menciona itens que o novo pedido não cita, e vice-versa. Isso precisa ser alinhado:

- README cita **preço, vagas e inscrições**, **desistências** e **intenção de participar de eventos futuros** → o pedido atual fala em "Tenho interesse", check-in e avaliação, sem inscrição com vaga.
- README sugere **inscrições, lembretes e relatórios** como etapas posteriores.
- Pedido atual adiciona: filtros de acessibilidade, iCalendar/Google Calendar, dashboard com gráficos, mural de sugestões e estados de evento.

## 2. Skills disponíveis e como serão usadas

| Skill | Quem invoca | Uso no projeto |
| --- | --- | --- |
| `grill-me`, `to-spec`, `to-tickets`, `triage`, `wayfinder` | **Somente o usuário** (bloqueadas para o modelo) | Rodar manualmente nas etapas 1–3 |
| `research` | Modelo | Pesquisa de referências em segundo plano → `docs/research/referencias.md` |
| `domain-modeling` | Modelo | Glossário (`GLOSSARY.md`) e ADRs (`docs/adr/`) |
| `codebase-design`, `prototype` | Modelo | Arquitetura e protótipos descartáveis |
| `tdd`, `diagnosing-bugs`, `code-review` | Modelo | Implementação, depuração e revisão |

## 3. Papéis da equipe de agentes

| Papel | Execução | Contribuição na Etapa 1 |
| --- | --- | --- |
| **Pesquisador** | Agente em segundo plano (skill `research`) | Referências sobre WCAG 2.2/eMAG/LBI, LGPD/ANPD, RFC 5545 e Google Calendar, CSAT/NPS, antiabuso (OWASP, Turnstile, QR rotativo), schema.org/Event e Open Graph |
| **Especialista web** | Papel de trabalho | Inspeção do repo; proposta preliminar de stack e modelo de métricas (seção 5) |
| **Especialista UX/UI** | Papel de trabalho | Esboço das jornadas e do mapa de telas (detalhes na Etapa 2) |
| **QA** | Papel de trabalho | Riscos iniciais: inflação de métricas, spam em ações anônimas, acessibilidade dos filtros, fuso horário em `.ics` |
| **PO** | Papel de trabalho | Backlog preparado localmente; board no GitHub bloqueado até `gh` estar instalado e autenticado |

Os agentes de implementação e QA só serão criados na Etapa 3, quando houver código e decisões aprovadas. Nas etapas 1 e 2 isso evita trabalho duplicado.

## 4. Perguntas em aberto

Respostas do responsável (2026-11-13):

1. **Backlog:** no GitHub (`Marquin25/agenda-digital-shopping`). `gh` ainda não instalado → criação de issues e board pendente.
2. **Vagas e preço:** não definidos. No MVP só divulgação e interesse; o administrador pode informar vagas limitadas como informação, sem dados pessoais. Reserva ou cobrança exigem parar e apresentar as implicações.
3. **Check-in:** propor QR no local; detalhar validação, fraude e duplicidade antes de implementar; interesse ≠ presença.
4. **Avaliação:** aberta após o encerramento, sem exigir check-in; período configurável; antispam; sinalizar que não comprova participação.
5. **Hospedagem:** não definida; comparar opções; não criar contas nem publicar.
6. **Equipe:** Administrador, Editor e Analista (provisório); provedor de login pendente.
7. **Privacidade:** controlador, encarregado e política a confirmar; não declarar conformidade.
8. **Abrangência:** um shopping, com expansão futura; nome provisório "Conecta Shopping"; mural de sugestões só para a administração.

## 5. Recomendações preliminares (hipóteses — validar na Etapa 2)

1. **Separar quatro métricas, cada uma com unidade e deduplicação próprias**
   - *Visualização*: abertura da página de detalhes, deduplicada por identificador anônimo + evento + dia.
   - *Interesse*: alternância ("liga/desliga") por identificador anônimo + evento. **Nunca** conta como presença.
   - *Check-in*: só é válido com código do local (QR com token rotativo exibido no evento) dentro da janela do evento.
   - *Avaliação*: uma por identificador anônimo + evento. Liberada após o check-in ou após o fim do evento (a decidir).
   - Taxa de conversão = check-ins ÷ interesses únicos (indicador, não verdade absoluta).
2. **Identificador anônimo próprio**: valor aleatório gerado no dispositivo, sem login e sem analytics de terceiros no MVP. Dado pseudonimizado ainda pode ser dado pessoal pela LGPD → precisa de política de privacidade e prazo de retenção.
3. **Antiabuso proporcional**: limite de requisições por IP/identificador, honeypot e, só se houver abuso, um desafio que preserve a privacidade.
4. **Stack preliminar**: Next.js + TypeScript + PostgreSQL, com renderização no servidor para a agenda pública (rápida no 4G e indexável) e área administrativa com login por sessão e papéis. A decisão final depende da pergunta sobre hospedagem.
5. **Cupom fora do MVP.**

## 6. Estrutura proposta da documentação

```
CLAUDE.md                      instruções para agentes
GLOSSARY.md                    termos do domínio (evento, interesse, check-in…)
docs/
  plano/00-descoberta.md       este arquivo
  research/referencias.md      pesquisa com fontes e datas
  spec/
    01-produto.md              problema, usuários, proposta de valor, requisitos
    02-jornadas-e-telas.md     jornadas, mapa de telas, wireframes textuais
    03-metricas.md             definições, fórmulas e limitações
    04-dados-e-integracoes.md  modelo de dados, APIs, iCal, Wi-Fi/Instagram
    05-arquitetura.md          decisões, alternativas, implantação
    06-qualidade.md            acessibilidade, segurança, privacidade/LGPD, desempenho
    07-mvp-e-riscos.md         escopo, adiados, priorização, riscos, decisões abertas
    08-testes-e-dod.md         estratégia de testes e definição de pronto
  adr/NNNN-*.md                decisões de arquitetura
  agents/                      configuração das skills
.scratch/conecta-shopping-mvp/ backlog local (spec.md + issues/NN-*.md) até o GitHub ser liberado
```
