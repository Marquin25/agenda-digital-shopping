# 09 — Backlog ordenado por fase

> Papel: **PO** · Revisão 3 · 2026-11-13 · **Fonte local** do backlog. Depois da aprovação do plano **e** da confirmação do acesso ao GitHub, cada item vira uma issue em `Marquin25/agenda-digital-shopping`, e este arquivo passa a apontar para os números. **Nenhuma issue ou board foi criado.**
>
> Origem: **[C]** confirmado · **[PDF]** · **[R]** recomendação · **[P]** pendente (não implementar).
> Tamanho: **P** ≈ até 1 dia · **M** ≈ 2–3 dias. Todos os itens herdam a Definição de pronto (`08-testes-e-dod.md` §4), que inclui acessibilidade, segurança, privacidade e testes.
> A numeração é **local** (`B-xx`); os números do GitHub serão outros.

## Rótulos propostos

`fase:1|2|3` · `epico:*` · `tipo:feature|spike|infra` · `bug` · `prioridade:p1|p2|p3` · `origem:confirmado|pdf|recomendacao` · `bloqueado:decisao` · `bloqueado:terceiros` · triagem: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`.

## Board (GitHub Projects) — colunas e campos

Colunas: `Backlog` → `Pronto para fazer` → `Em andamento` → `Em revisão` → `Concluído`. Campos: **Fase**, **Épico**, **Prioridade**, **Bloqueado (sim/não)**.

## Épicos

| Épico | Pilar | Fases |
| --- | --- | :-: |
| **E-FUND** Fundação técnica | — | 1 |
| **E-PUB** Experiência pública | Visitante | 1–2 |
| **E-ADM** Gestão administrativa | Gestão | 1–2 |
| **E-DIV** Divulgação e pontos de contato | Visitante/Gestão | 1, 3 |
| **E-MED** Mensuração e relatórios | Resultados | 1–2 |
| **E-PART** Participação e avaliação | Visitante/Resultados | 1–2 |
| **E-INT** Inteligência estratégica | Inteligência | 2–3 |
| **E-PRIV** Privacidade, segurança e operação | Transversal | 1–2 |
| **E-INTEG** Integrações externas | Integrações | 3 |
| **E-RES** Reservas | — | **[P]** sem fase |

---

# Fase 1 — Plataforma essencial

### Status da implementação (2026-11-13, branch `feat/phase-1-platform`)

O status vale para o código local, verificado com `npm test` (67 testes de unidade e integração), `npm run test:e2e` (10 cenários com axe), `typecheck`, `lint` e `build`. **Nada foi publicado.**

| Item | Status | Observações |
| --- | --- | --- |
| B-01 | Parcial | Falta o **CI** (GitHub Actions com gitleaks); enviar um workflow pode exigir o escopo `workflow` no `gh` |
| B-02 | Parcial | Migração e sementes funcionam; a migração **não tem reversão** (o Drizzle gera só a ida) |
| B-03 | Feito | |
| B-04, B-05, B-06 | Feito | Publicação aparece na hora (página dinâmica, sem cache) |
| B-07 | **Não feito** | Precisa de aparelhos reais com Instagram e o portal Wi-Fi |
| B-08 | Feito | |
| B-09 | Feito | Sem TOTP (previsto como opcional) |
| B-10, B-11, B-12, B-13 | Feito | |
| B-14 | Parcial | Tipo real verificado, EXIF removido, WebP 1200×675 com alt obrigatório; **falta gerar tamanhos responsivos** |
| B-15, B-16 | Feito | |
| B-17 | Feito | |
| B-18 | Parcial | Visualizações (únicas e brutas), origem e leituras de link/QR estão prontas; **compartilhamentos e cliques em "adicionar à agenda" ainda não são registrados** |
| B-19 | Feito | Sem gráficos: só tabelas (atende ao requisito de equivalente textual) |
| B-20 | **Bloqueado** | P-FASE-1; nada foi implementado |
| B-21 | Feito | Texto marcado como pendente de validação do shopping |
| B-22 | **Não feito** | Tarefa de retenção e agregação |
| B-23 | Parcial | CSP sem *nonce* (usa `'unsafe-inline'` em scripts); limitador de requisições em memória (não serve para várias instâncias); o IP é o **último** valor de `X-Forwarded-For`, o que pressupõe **exatamente um** proxy confiável na frente (revisar quando a hospedagem for definida); falta `npm audit`/gitleaks no CI |
| B-24 | **Não feito** | Dockerfile e guia de implantação |
| B-25 | **Bloqueado** | P-INF-1, P-INF-2, P-ORC-1, P-LGPD-* |


### E-FUND

**B-01 Esqueleto executável** · P1 · M · `tipo:infra` · [R]
Next.js + TypeScript, lint/format, Vitest, Playwright + axe, Docker Compose com PostgreSQL, `.env.example` sem valores, CI (lint, typecheck, testes, build, gitleaks), `/api/saude`.
- [ ] `docker compose up` + `npm run dev` sobem a app; `/api/saude` responde 200.
- [ ] Testes de exemplo (unidade, E2E, axe) rodam localmente e no CI.
- [ ] Nenhum segredo no repositório.

**B-02 Esquema da Fase 1 e sementes** · P1 · M · depende de B-01 · [R]
Tabelas do núcleo (`04-dados-e-integracoes.md` §Núcleo), migrações e sementes (categorias, recursos, espaços de exemplo, eventos de exemplo).
- [ ] Migração aplica e reverte num banco limpo; as restrições `UNIQUE` têm teste.
- [ ] A semente cobre todos os status temporais.

**B-03 Regra de status temporal + encerramento** · P1 · P · depende de B-01 · TDD · [C][PDF][R]
- [ ] A função pura cobre Rascunho, Cancelado, Agendado, Em andamento e Encerrado, incluindo `fim_real`; testes de fronteira e fuso.

### E-PUB

**B-04 Agenda pública (lista por dia)** · P1 · M · depende de B-02, B-03 · [C][PDF]
- [ ] `/` gerada no servidor lista eventos publicados e não encerrados, agrupados por dia; cards conforme RF01.
- [ ] Estados vazio, sem eventos e erro; publicação refletida em ≤ 60 s.
- [ ] Axe sem violações; funciona em 320 px.

**B-05 Busca e filtros na URL** · P1 · M · depende de B-04 · [C][PDF]
- [ ] Texto (sem diferenciar maiúsculas nem acentos), categoria, data e acessibilidade; estado na URL; resultado anunciado por `aria-live`; operação por teclado.

**B-06 Detalhes, compartilhamento e Open Graph** · P1 · M · depende de B-04 · [C][PDF]
- [ ] RF05 completo; 404 acessível; JSON-LD `schema.org/Event`; Open Graph com `og:image:alt`.
- [ ] Compartilhar (nativo ou copiar link), com confirmação anunciada.
- [ ] Variações por status e por modo de vagas (sem limite, ordem de chegada).

**B-07 Spike: navegadores internos (Instagram, portal Wi-Fi)** · P1 · P · `tipo:spike` · depende de B-06 · [R]
- [ ] Relatório em `docs/research/` sobre cookies, `.ics`, compartilhamento e redirecionamento `/r/` nesses navegadores.

**B-08 Adicionar à agenda (.ics + Google)** · P2 · P · depende de B-06 · TDD · [R]
- [ ] `.ics` conforme a RFC 5545 (UID estável, DTSTAMP, UTC, SEQUENCE, escaping, quebra de linhas); link do Google como secundário; alternativa "copiar link".

### E-ADM

**B-09 Login administrativo e sessões** · P1 · M · depende de B-02 · [R] · provedor [P]
- [ ] E-mail + senha (Argon2id), erro genérico, bloqueio progressivo, sessão no banco, logout; usuário inicial por comando (senha informada na execução, nunca versionada); troca de senha no 1º acesso; autenticação atrás de uma interface trocável.

**B-10 Papéis e autorização** · P1 · P · depende de B-09 · TDD · [C]
- [ ] Matriz de `01-produto.md` §7 aplicada no servidor, com teste para cada ação × papel.

**B-11 Gestão de usuários** · P2 · P · depende de B-10 · [R]
- [ ] Criar, mudar papel, desativar e redefinir senha; auditoria; nunca desativar o último administrador.

**B-12 Cadastro de espaços** · P1 · P · depende de B-10 · [PDF]
- [ ] CRUD de espaços (nome, piso, referência, área, capacidade, estrutura); o evento escolhe o espaço.

**B-13 CRUD de eventos** · P1 · M · depende de B-10, B-12, B-03 · [C][PDF]
- [ ] Criar, editar, rascunho, publicar, cancelar e **encerrar**; modo de vagas (`reserva` desativado com aviso "pendente de aprovação"); validações; auditoria; `versao_ics`.
- [ ] E2E: Editor publica → o evento aparece na agenda.

**B-14 Upload de banner** · P2 · M · depende de B-13 · [R]
- [ ] JPEG, PNG ou WebP ≤ 5 MB, tipo real verificado, EXIF removido, tamanhos responsivos, alt obrigatório, armazenamento atrás de uma interface.

### E-DIV

**B-15 Links de divulgação com origem** · P1 · M · depende de B-13 · [PDF]
- [ ] O Editor cria links (agenda, evento ou filtro) por canal; `/r/{codigo}` grava a origem e redireciona; um link desativado leva à agenda.
- [ ] Parâmetros `utm_*` diretos também são reconhecidos.

**B-16 Gerador de QR Code de divulgação** · P1 · P · depende de B-15 · [PDF]
- [ ] QR em PNG e SVG para cada link, com legenda e URL curta legível; gerado no servidor, sem serviço externo; nome "QR de divulgação" (não confundir com o check-in).

### E-MED

**B-17 Identificador de dispositivo e exclusão da equipe** · P1 · P · depende de B-02 · TDD · [R]
- [ ] Cookie seguro criado sob demanda; no banco só o HMAC; sessões administrativas não geram métricas; nenhum log com o ID puro.

**B-18 Registro de visualizações, origem e engajamento** · P1 · M · depende de B-17, B-15 · TDD · [C][PDF]
- [ ] Visualizações únicas e brutas por dia, origem por canal e link, compartilhamentos e cliques de agenda; robôs e prévias excluídos; fórmulas de `03-metricas.md` §3 testadas.

**B-19 Painel básico (Fase 1)** · P1 · M · depende de B-18 · [C][PDF] · (interessados só se B-20 for liberado)
- [ ] Acessos, visualizações por evento, origem por canal e por QR, com filtro de período; selos medido/estimado; tabela equivalente a cada gráfico; aviso de amostra pequena.

### E-PART

**B-20 "Tenho interesse"** · P1 · M · depende de B-06, B-17 · [C] · `bloqueado:decisao` — fase [P: P-FASE-1, rec. Fase 1]
- [ ] Toggle com `aria-pressed`, idempotente, funciona com e sem JavaScript, com limites; o texto deixa claro que **não reserva vaga**; aparece no painel básico como "interessados (estimado)".

### E-PRIV

**B-21 Página Privacidade + apagar dados do dispositivo** · P1 · P · depende de B-17 · [R]
- [ ] Texto provisório marcado "pendente de validação do shopping"; apagar remove os registros do `id_hash` e o cookie.

**B-22 Retenção e agregação (Fase 1)** · P2 · M · depende de B-18 · [R]
- [ ] Tarefa diária agrega e apaga conforme `04-…` §Retenção; testes com datas simuladas.

**B-23 Endurecimento de segurança** · P2 · P · depende de B-09 · [R]
- [ ] CSP, HSTS (produção), cabeçalhos, limites revisados, `npm audit` e gitleaks no CI; checklist ASVS nível 1.

**B-24 Imagem de produção e guia de implantação** · P2 · M · depende de B-01 · [R]
- [ ] Dockerfile multi-stage, Compose de produção, backup e restauração testados localmente. **Sem publicar.**

**B-25 Publicar a homologação** · P3 · P · `bloqueado:decisao` (P-INF-1, P-INF-2, P-ORC-1, P-LGPD-*)
- [ ] Só com autorização explícita.

---

# Fase 2 — Inteligência e indicadores

### E-PART (continuação)

**B-26 Avaliação pós-evento** · P1 · M · depende de B-13, B-17 · regras [C] · fase [P: rec. início da Fase 2]
- [ ] Período `fim → fim + N dias` configurável; nota de 1 a 5 (rádios), tags, comentário ≤ 280 com aviso; uma por ID; honeypot, tempo mínimo e limites; `com_checkin`; aviso "não comprova participação".

**B-27 Encerrados recentes para avaliar** · P2 · P · depende de B-26 · [R]

**B-28 Moderação de avaliações** · P2 · P · depende de B-26 · [C]
- [ ] Lista restrita, sem `id_hash`; ocultar e reexibir com auditoria.

**B-29 Mural de sugestões** · P2 · M · depende de B-17, B-10 · [C] · fase [P: rec. Fase 2]
- [ ] Envio público (≤ 500, categoria opcional, antispam); só a administração vê; status nova, lida ou arquivada.

**B-30 ADR do check-in por QR rotativo** · P2 · P · `tipo:spike` · `bloqueado:decisao` (P-PROD-1)
- [ ] ADR com o desenho de `03-metricas.md` §7 e aprovação explícita.

**B-31 Token rotativo + modo telão + check-in** · P2 · M · depende de B-30 · TDD · [P]
- [ ] Token (janela atual e anterior), telão de 60 s, validação da janela do evento, idempotência, QR estático de reserva técnica; o painel passa a mostrar check-ins, conversão e CSAT verificado.

**B-32 Spike de reservas sem dados pessoais** · P2 · P · `tipo:spike` · `bloqueado:decisao` (P-RES-*)
- [ ] Documento comparando as alternativas B e D (piloto) com as respostas às perguntas de `03-metricas.md` §6.2. **Não implementa reserva.**

### E-MED (continuação)

**B-33 Snapshots e relatório automático pós-evento** · P1 · M · depende de B-18, B-20 · [PDF]
- [ ] Snapshot de interessados no início e no fim; relatório agregado gerado no encerramento e atualizado até o fim do período de avaliação; selos medido/estimado/indisponível; n e "Como calculamos".

**B-34 Painel completo de indicadores** · P1 · M · depende de B-33, B-26 · [PDF]
- [ ] Interessados, compartilhamentos, avaliações, CSAT (e check-ins quando houver), filtros por período, categoria, espaço e evento; indicadores de fontes não integradas aparecem como "indisponível".

**B-35 Comparação entre eventos e períodos** · P1 · M · depende de B-33 · [PDF]
- [ ] Comparar 2–5 eventos ou dois períodos; normalização por hora; marcação de datas especiais; avisos de amostra.

**B-36 Exportar agregados (CSV)** · P3 · P · depende de B-34 · [R]
- [ ] Sem nenhum dado individual.

### E-ADM / E-INT

**B-37 Segmentos e estabelecimentos participantes** · P1 · P · depende de B-10 · [PDF]
- [ ] CRUD de segmentos e lojas (dado empresarial, sem contatos de pessoas); vínculo loja ↔ evento; o relatório mostra as lojas participantes.

**B-38 Cadastro de planejamento (briefing)** · P1 · M · depende de B-12, B-37 · [C][PDF] · permissões [P]
- [ ] Objetivo, público desejado (faixas e perfis fixos), segmentos, lojas, faixa de orçamento, período e espaços; validações; ajuda explicando que o público é uma descrição de alvo.

**B-39 Catálogo de modelos de experiência** · P1 · M · depende de B-37, B-12 · [R] · conteúdo [P]
- [ ] CRUD com pesos de objetivo e público, segmentos, faixa de custo, estrutura, duração e indicadores sugeridos; data de atualização visível; semente com modelos de exemplo marcados "rascunho para revisão".

**B-40 Motor de recomendações por regras (domínio)** · P1 · M · depende de B-39 · TDD · [C][PDF]
- [ ] Filtros eliminatórios explicados, pontuação ponderada configurável, justificativa e premissas por item, nível de confiança, ajuste histórico só acima do limiar; resultados determinísticos (mesmas entradas e regras → mesma saída).

**B-41 Tela de recomendações e rastreabilidade** · P1 · M · depende de B-38, B-40 · [PDF][R]
- [ ] Gerar recomendações a partir do planejamento; mostrar ideias, por que foram sugeridas, premissas, lojas possíveis, estrutura, faixa de custo informada, indicadores e confiança; aviso "não são garantias"; registrar a execução (entradas, versão das regras, pesos); criar evento a partir da ideia escolhida (ligado ao planejamento).

**B-42 Oportunidades descritivas** · P2 · M · depende de B-33 · [PDF]
- [ ] Dias e horários de maior procura, categorias com baixo engajamento, melhores eventos por categoria e época; n mínimo; sem análise automática de texto livre.

**B-43 Registro de decisão e lições aprendidas** · P3 · P · depende de B-41, B-33 · [R]

---

# Fase 3 — Integrações e evolução (`bloqueado:terceiros` até as decisões P-INT-*)

**B-44 Integração com o portal Wi-Fi** · `bloqueado:terceiros` (P-INT-1) · [PDF]
- [ ] Levantamento técnico com a Ponto Fibra → proposta → aprovação → adaptador isolado. Fallback: link simples da Fase 1.

**B-45 Modo painel digital** · P2 · M · [PDF] · equipamento [P: P-INT-2]
- [ ] Página `/painel` com destaques em rotação acessível (pausável, sem piscar), sem interação; parâmetros por tela; origem `painel` nos QR exibidos.

**B-46 Importação de fluxo agregado** · `bloqueado:terceiros` (P-INT-3) · [PDF]

**B-47 Importação de vendas agregadas** · `bloqueado:terceiros` (P-INT-4, P-LGPD-8) · [PDF]
- [ ] Só agregados; acesso restrito; o relatório indica "correlação, não causalidade".

**B-48 Aprimoramento analítico das recomendações** · `bloqueado:decisao` (P-INT-IA-5) · [PDF]

---

# Sem fase — dependem de aprovação

**B-49 Reserva de vagas** · `bloqueado:decisao` (P-RES-*, P-LGPD-6) · ver B-32
**B-50 Cupom / pagamento** · fora do MVP [C]; só com justificativa e aprovação

---

## Ordem sugerida (fatias verticais)

**Fase 1**
1. *Ver a agenda:* B-01 → B-02 → B-03 → B-04 → B-06
2. *Publicar evento:* B-09 → B-10 → B-12 → B-13
3. *Divulgar e medir:* B-17 → B-15 → B-16 → B-18 → B-19 → B-07
4. *Participar:* B-20 → B-08 → B-21 → B-05
5. *Operar:* B-11 → B-14 → B-22 → B-23 → B-24

**Fase 2**
6. *Avaliar:* B-26 → B-27 → B-28 → B-29
7. *Indicadores:* B-33 → B-34 → B-35
8. *Inteligência:* B-37 → B-38 → B-39 → B-40 → B-41 → B-42
9. *Condicionados:* B-30 → B-31 (check-in) · B-32 (spike de reservas)

**Fase 3:** conforme as respostas de viabilidade (B-45 é o único que não depende de terceiros para começar).
