# 09 — Backlog ordenado por fase

> Papel: **PO** · Revisão 4 · 2026-11-13 · **Fonte local** do backlog. Cada item é uma issue em `Marquin25/agenda-digital-shopping` **com o mesmo número**: B-01 = #1 … B-50 = #50 e, depois, B-57 = #57 … B-62 = #62 (os números #51–#56 são pull requests). As issues e o [quadro do projeto](https://github.com/users/Marquin25/projects/1) são a fonte do status.
>
> Revisão 4: inclui as tarefas B-57 a B-62, derivadas do relatório de melhorias de 2026-11-13 (análise externa do commit `5a29c0e`), e eleva B-25 para P0. As decisões foram confirmadas pelo PO na mesma data.
>
> Origem: **[C]** confirmado · **[PDF]** · **[R]** recomendação · **[P]** pendente (não implementar).
> Tamanho: **P** ≈ até 1 dia · **M** ≈ 2–3 dias. Todos os itens herdam a Definição de pronto (`08-testes-e-dod.md` §4), que inclui acessibilidade, segurança, privacidade e testes.
> A numeração `B-xx` coincide com o número da issue no GitHub.

## Rótulos propostos

`fase:1|2|3` · `epico:*` · `tipo:feature|spike|infra` · `bug` · `prioridade:p0|p1|p2|p3` · `origem:confirmado|pdf|recomendacao` · `bloqueado:decisao` · `bloqueado:terceiros` · triagem: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`.

## Board (GitHub Projects) — colunas e campos

Quadro: [Conecta Shopping](https://github.com/users/Marquin25/projects/1). Status: `A fazer` → `Em andamento` → `Bloqueado` → `Feito`. Campos: **Fase**, **Épico**, **Prioridade** (P0–P3; P0 = bloqueia a primeira entrega), **Bloqueio** (aguarda decisão / aguarda terceiros). A automação de "item fechado" ainda não move o Status sozinha: ajustar manualmente.

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

### Status da implementação (2026-11-13, branch `main`)

O status vale para a `main` depois do merge do PR #69, verificado com `npm test` (168 testes de unidade e integração), `npm run test:e2e` (14 cenários com axe em Chromium e em WebKit), `typecheck`, `lint`, `build` e o CI do GitHub Actions. **Núcleo da Fase 1 pronto para uso local; homologação e validação em dispositivos reais pendentes.** Nada foi publicado.

| Item | Status | Observações |
| --- | --- | --- |
| B-01 | Feito | CI no GitHub Actions: lint, tipos, testes, build, E2E, `npm audit` (produção) e gitleaks |
| B-02 | Feito | Migrações com script de volta em `drizzle/rollback/` (`npm run db:rollback -- --yes`), testadas num banco limpo; restrições `UNIQUE` testadas; semente com eventos em todos os status |
| B-03 | Feito | |
| B-04, B-05, B-06 | Feito | Publicação aparece na hora (página dinâmica, sem cache) |
| B-07 | **Não feito** | Precisa de aparelhos reais com Instagram e o portal Wi-Fi |
| B-08 | Feito | |
| B-09 | Feito | Sem TOTP (previsto como opcional) |
| B-10, B-11, B-12, B-13 | Feito | |
| B-14 | Feito | Tipo real verificado, EXIF removido, WebP em 1200 e 600 px com `srcset` e alt obrigatório |
| B-15, B-16 | Feito | |
| B-17 | Feito | |
| B-18 | Feito | Visualizações (únicas e brutas), origem, leituras de link/QR, compartilhamentos e cliques em "adicionar à agenda" (`.ics` e Google) |
| B-19 | Feito | Cartões de indicadores, gráfico diário de acessos (com tabela equivalente), barras por canal e tabela de eventos com status |
| B-20 | **Bloqueado** | P-FASE-1; nada foi implementado |
| B-21 | Feito | Texto marcado como pendente de validação do shopping |
| B-22 | Feito | `npm run retention:run` ou `/api/cron/retention` (com `CRON_SECRET`): agrega e apaga identificadores com mais de 30 dias, sessões vencidas e auditoria com mais de 365 dias. **Falta agendar** quando a hospedagem for definida |
| B-23 | Feito | Cabeçalhos num módulo testado (com `Cross-Origin-Opener-Policy` e HSTS em produção), CSP com *nonce*, `npm audit`/gitleaks na CI, `TRUSTED_PROXY_HOPS` para a leitura do IP, limite por IP na contagem de links promocionais e checklist ASVS nível 1 em `docs/seguranca/asvs-nivel-1.md`. Continuam em aberto, registrados no checklist: limitador compartilhado (depende de P-LGPD e da hospedagem) e conferência do `X-Forwarded-For` na hospedagem (#25) |
| B-24 | Parcial | `Dockerfile` em estágios (saída *standalone*, usuário não root, `HEALTHCHECK`), `docker-compose.prod.yml` (app só em `127.0.0.1`, banco sem porta publicada), backup e restauração em `scripts/docker/`; guia em `docs/docker.md`. A saída *standalone* foi testada sem Docker; falta testar a imagem, a pilha e o backup/restauração com o Docker funcionando |
| B-25 | **Bloqueado** (P0) | P-INF-1, P-INF-2, P-ORC-1, P-LGPD-*. Pré-requisitos técnicos locais: B-57, B-58, B-62 |
| B-57 | Feito | PR #67: troca de banner grava o evento antes de apagar o antigo; retenção remove banners órfãos com mais de 24 h |
| B-58 | Feito | PR #70: `STORAGE_DRIVER=local\|s3` (padrão `local`); a configuração é validada na subida do servidor. Nenhum bucket ou credencial criado |
| B-59 | Feito | PR #69: Chromium e WebKit, cada um com banco e porta próprios. Corrigido o cookie `Secure` em `http://localhost` só para o E2E (`ALLOW_INSECURE_LOCALHOST_COOKIES`, nunca em ambiente publicado) |
| B-60 | Feito | PR #66: consulta própria para `/salvos`, sem o limite da agenda; o servidor não recebe a lista de salvos |
| B-61, B-62 | Feito | PRs #64 e #65 |
| B-68 | A fazer | `CRON_SECRET` vazio impede a aplicação de subir (agravado pela validação na subida de B-58) |
| B-77 | Feito | Modo escuro com morcegos: botão da lua no cabeçalho público e na barra do admin (`aria-pressed`); revoada de morcegos em SVG/CSS numa camada `aria-hidden` sem `pointer-events`, desligada com `prefers-reduced-motion`; escolha só no `localStorage`, aplicada antes da pintura; paleta escura conferida para WCAG AA |
| B-45 | Feito | `/painel` com destaques em rotação pausável (WCAG 2.2.2), sem links e sem piscar; parâmetros por tela na URL (`tela`, `intervalo`, `limite` e os filtros da agenda); QR gerado no servidor com `utm_source=painel` e `utm_campaign` = tela; a própria tela não conta como visitante. Guia em `docs/painel.md`. O equipamento (P-INT-2) segue pendente: falta testar no player real |
| B-82 | Feito | Senhas da equipe conferidas contra 46.794 senhas vazadas públicas de 12+ caracteres (SecLists, MIT), embarcadas; script para regerar em `scripts/security/` |
| Extra | Feito | **Salvos**: eventos guardados só no aparelho (localStorage), sem cadastro. **Visual novo** (terracota/creme) baseado nas telas de referência da equipe |
| B-76 | Feito | Gato preto com lua no rodapé público: a 13ª ativação (clique ou teclado) comemora a sexta-feira 13 numa região `aria-live`; contagem só em memória, nada salvo nem enviado |


### E-FUND

**[B-01](https://github.com/Marquin25/agenda-digital-shopping/issues/1) Esqueleto executável** · P1 · M · `tipo:infra` · [R]
Next.js + TypeScript, lint/format, Vitest, Playwright + axe, Docker Compose com PostgreSQL, `.env.example` sem valores, CI (lint, typecheck, testes, build, gitleaks), `/api/saude`.
- [ ] `docker compose up` + `npm run dev` sobem a app; `/api/saude` responde 200.
- [ ] Testes de exemplo (unidade, E2E, axe) rodam localmente e no CI.
- [ ] Nenhum segredo no repositório.

**[B-02](https://github.com/Marquin25/agenda-digital-shopping/issues/2) Esquema da Fase 1 e sementes** · P1 · M · depende de B-01 · [R]
Tabelas do núcleo (`04-dados-e-integracoes.md` §Núcleo), migrações e sementes (categorias, recursos, espaços de exemplo, eventos de exemplo).
- [ ] Migração aplica e reverte num banco limpo; as restrições `UNIQUE` têm teste.
- [ ] A semente cobre todos os status temporais.

**[B-03](https://github.com/Marquin25/agenda-digital-shopping/issues/3) Regra de status temporal + encerramento** · P1 · P · depende de B-01 · TDD · [C][PDF][R]
- [ ] A função pura cobre Rascunho, Cancelado, Agendado, Em andamento e Encerrado, incluindo `fim_real`; testes de fronteira e fuso.

### E-PUB

**[B-77](https://github.com/Marquin25/agenda-digital-shopping/issues/77) Modo escuro com morcegos** · P3 · P/M · pedido do PO (2026-11-13)
- [ ] Controle acessível de tema claro/escuro no cabeçalho público e administrativo; ao ativar o escuro, morcegos atravessam a tela numa camada decorativa (`aria-hidden`, `pointer-events: none`) e o tema fica aplicado em toda a aplicação.
- [ ] Sem animação com `prefers-reduced-motion`; escolha só no navegador (`localStorage`), sem servidor; contraste WCAG AA no tema escuro.

**[B-04](https://github.com/Marquin25/agenda-digital-shopping/issues/4) Agenda pública (lista por dia)** · P1 · M · depende de B-02, B-03 · [C][PDF]
- [ ] `/` gerada no servidor lista eventos publicados e não encerrados, agrupados por dia; cards conforme RF01.
- [ ] Estados vazio, sem eventos e erro; publicação refletida em ≤ 60 s.
- [ ] Axe sem violações; funciona em 320 px.

**[B-05](https://github.com/Marquin25/agenda-digital-shopping/issues/5) Busca e filtros na URL** · P1 · M · depende de B-04 · [C][PDF]
- [ ] Texto (sem diferenciar maiúsculas nem acentos), categoria, data e acessibilidade; estado na URL; resultado anunciado por `aria-live`; operação por teclado.

**[B-06](https://github.com/Marquin25/agenda-digital-shopping/issues/6) Detalhes, compartilhamento e Open Graph** · P1 · M · depende de B-04 · [C][PDF]
- [ ] RF05 completo; 404 acessível; JSON-LD `schema.org/Event`; Open Graph com `og:image:alt`.
- [ ] Compartilhar (nativo ou copiar link), com confirmação anunciada.
- [ ] Variações por status e por modo de vagas (sem limite, ordem de chegada).

**[B-07](https://github.com/Marquin25/agenda-digital-shopping/issues/7) Spike: navegadores internos (Instagram, portal Wi-Fi)** · P1 · P · `tipo:spike` · depende de B-06 · [R]
- [ ] Relatório em `docs/research/` sobre cookies, `.ics`, compartilhamento e redirecionamento `/r/` nesses navegadores.

**[B-08](https://github.com/Marquin25/agenda-digital-shopping/issues/8) Adicionar à agenda (.ics + Google)** · P2 · P · depende de B-06 · TDD · [R]
- [ ] `.ics` conforme a RFC 5545 (UID estável, DTSTAMP, UTC, SEQUENCE, escaping, quebra de linhas); link do Google como secundário; alternativa "copiar link".

**[B-76](https://github.com/Marquin25/agenda-digital-shopping/issues/76) Easter egg: gato preto na agenda pública** · P3 · P · pedido do PO (2026-11-13)
- [ ] Botão decorativo (gato preto e lua) no rodapé público; cada ativação por clique ou teclado conta uma vez; na 13ª, animação breve e mensagem da sexta-feira 13 anunciada por `aria-live`, sem diálogo.
- [ ] Contagem só em memória: nada em cookie, `localStorage`, banco ou servidor; animação desligada com `prefers-reduced-motion`.

### E-ADM

**[B-09](https://github.com/Marquin25/agenda-digital-shopping/issues/9) Login administrativo e sessões** · P1 · M · depende de B-02 · [R] · provedor [P]
- [ ] E-mail + senha (Argon2id), erro genérico, bloqueio progressivo, sessão no banco, logout; usuário inicial por comando (senha informada na execução, nunca versionada); troca de senha no 1º acesso; autenticação atrás de uma interface trocável.

**[B-10](https://github.com/Marquin25/agenda-digital-shopping/issues/10) Papéis e autorização** · P1 · P · depende de B-09 · TDD · [C]
- [ ] Matriz de `01-produto.md` §7 aplicada no servidor, com teste para cada ação × papel.

**[B-11](https://github.com/Marquin25/agenda-digital-shopping/issues/11) Gestão de usuários** · P2 · P · depende de B-10 · [R]
- [ ] Criar, mudar papel, desativar e redefinir senha; auditoria; nunca desativar o último administrador.

**[B-12](https://github.com/Marquin25/agenda-digital-shopping/issues/12) Cadastro de espaços** · P1 · P · depende de B-10 · [PDF]
- [ ] CRUD de espaços (nome, piso, referência, área, capacidade, estrutura); o evento escolhe o espaço.

**[B-13](https://github.com/Marquin25/agenda-digital-shopping/issues/13) CRUD de eventos** · P1 · M · depende de B-10, B-12, B-03 · [C][PDF]
- [ ] Criar, editar, rascunho, publicar, cancelar e **encerrar**; modo de vagas (`reserva` desativado com aviso "pendente de aprovação"); validações; auditoria; `versao_ics`.
- [ ] E2E: Editor publica → o evento aparece na agenda.

**[B-14](https://github.com/Marquin25/agenda-digital-shopping/issues/14) Upload de banner** · P2 · M · depende de B-13 · [R]
- [ ] JPEG, PNG ou WebP ≤ 5 MB, tipo real verificado, EXIF removido, tamanhos responsivos, alt obrigatório, armazenamento atrás de uma interface.

### E-DIV

**[B-15](https://github.com/Marquin25/agenda-digital-shopping/issues/15) Links de divulgação com origem** · P1 · M · depende de B-13 · [PDF]
- [ ] O Editor cria links (agenda, evento ou filtro) por canal; `/r/{codigo}` grava a origem e redireciona; um link desativado leva à agenda.
- [ ] Parâmetros `utm_*` diretos também são reconhecidos.

**[B-16](https://github.com/Marquin25/agenda-digital-shopping/issues/16) Gerador de QR Code de divulgação** · P1 · P · depende de B-15 · [PDF]
- [ ] QR em PNG e SVG para cada link, com legenda e URL curta legível; gerado no servidor, sem serviço externo; nome "QR de divulgação" (não confundir com o check-in).

### E-MED

**[B-17](https://github.com/Marquin25/agenda-digital-shopping/issues/17) Identificador de dispositivo e exclusão da equipe** · P1 · P · depende de B-02 · TDD · [R]
- [ ] Cookie seguro criado sob demanda; no banco só o HMAC; sessões administrativas não geram métricas; nenhum log com o ID puro.

**[B-18](https://github.com/Marquin25/agenda-digital-shopping/issues/18) Registro de visualizações, origem e engajamento** · P1 · M · depende de B-17, B-15 · TDD · [C][PDF]
- [ ] Visualizações únicas e brutas por dia, origem por canal e link, compartilhamentos e cliques de agenda; robôs e prévias excluídos; fórmulas de `03-metricas.md` §3 testadas.

**[B-19](https://github.com/Marquin25/agenda-digital-shopping/issues/19) Painel básico (Fase 1)** · P1 · M · depende de B-18 · [C][PDF] · (interessados só se B-20 for liberado)
- [ ] Acessos, visualizações por evento, origem por canal e por QR, com filtro de período; selos medido/estimado; tabela equivalente a cada gráfico; aviso de amostra pequena.

### E-PART

**[B-20](https://github.com/Marquin25/agenda-digital-shopping/issues/20) "Tenho interesse"** · P1 · M · depende de B-06, B-17 · [C] · `bloqueado:decisao` — fase [P: P-FASE-1, rec. Fase 1]
- [ ] Toggle com `aria-pressed`, idempotente, funciona com e sem JavaScript, com limites; o texto deixa claro que **não reserva vaga**; aparece no painel básico como "interessados (estimado)".

### E-PRIV

**[B-21](https://github.com/Marquin25/agenda-digital-shopping/issues/21) Página Privacidade + apagar dados do dispositivo** · P1 · P · depende de B-17 · [R]
- [ ] Texto provisório marcado "pendente de validação do shopping"; apagar remove os registros do `id_hash` e o cookie.

**[B-22](https://github.com/Marquin25/agenda-digital-shopping/issues/22) Retenção e agregação (Fase 1)** · P2 · M · depende de B-18 · [R]
- [ ] Tarefa diária agrega e apaga conforme `04-…` §Retenção; testes com datas simuladas.

**[B-23](https://github.com/Marquin25/agenda-digital-shopping/issues/23) Endurecimento de segurança** · P2 · P · depende de B-09 · [R]
- [ ] CSP, HSTS (produção), cabeçalhos, limites revisados, `npm audit` e gitleaks no CI; checklist ASVS nível 1.

**[B-24](https://github.com/Marquin25/agenda-digital-shopping/issues/24) Imagem de produção e guia de implantação** · P2 · M · depende de B-01 · [R]
- [ ] Dockerfile multi-stage, Compose de produção, backup e restauração testados localmente. **Sem publicar.**

**[B-25](https://github.com/Marquin25/agenda-digital-shopping/issues/25) Publicar a homologação** · **P0** (era P3) · P · `bloqueado:decisao` (P-INF-1, P-INF-2, P-ORC-1, P-LGPD-*)
- [ ] Só com autorização explícita. É o passo que torna a solução acessível fora da máquina de desenvolvimento; continua bloqueado até as decisões. Ao publicar, registrar na issue a URL, o ambiente, o commit implantado e o resultado do smoke test (B-62).

### Entrega da homologação (relatório de melhorias, 2026-11-13)

Decisões do PO (2026-11-13): a publicação continua bloqueada e tudo fica local; nenhum agente cria contas, credenciais ou deploy; o armazenamento persistente é um adaptador compatível com S3, sem escolher fornecedor; "Tenho interesse" (B-20) continua bloqueado até depois da homologação; #7 (celular real) e #23 (limitador compartilhado) seguem como estão.

**[B-57](https://github.com/Marquin25/agenda-digital-shopping/issues/57) Troca de banner consistente quando o armazenamento falha** · **P0** · P · `bug` · [R] · confirmado na leitura do código
- [x] Gravar o evento primeiro; apagar o banner antigo em melhor esforço (falha gera log e nunca desfaz a imagem nova).
- [x] Falha ao gravar uma variante antes de salvar o evento: apagar as variantes já escritas e mostrar erro; o evento mantém o banner anterior. Erro de regra ao salvar: apagar as variantes novas.
- [x] A retenção remove banners órfãos (não referenciados) mais antigos que uma margem de segurança (proposta: 24 h); a porta `FileStorage` ganha `list()`.
- [x] Orquestração na camada `application`, testada com `FileStorage` falso que falha sob demanda.

**[B-58](https://github.com/Marquin25/agenda-digital-shopping/issues/58) Armazenamento de banners compatível com S3** · **P0** · M · `tipo:infra` · depende de B-57 · [R]
- [x] `S3FileStorage` (save, read, delete, list) com endpoint configurável (S3, R2, MinIO); `STORAGE_DRIVER=local|s3` (padrão `local`) e variáveis `S3_*` vazias no `.env.example`.
- [x] Falta de variável com `STORAGE_DRIVER=s3` falha na inicialização sem imprimir valores; nomes de arquivo continuam validados.
- [x] Teste de contrato da porta contra o adaptador local e o S3 com cliente falso; nenhum acesso à rede na CI. Fora do escopo: contas, buckets, credenciais, deploy.

**[B-59](https://github.com/Marquin25/agenda-digital-shopping/issues/59) WebKit (Safari) na suíte E2E** · **P0** · P · `tipo:infra` · relacionada a B-07 · [R]
- [x] Projeto `mobile-webkit` no Playwright e na CI, com banco e uploads limpos por projeto; toda a suíte passa nos dois navegadores; `skip` só para limitação real do navegador automatizado, com motivo.
- [x] Não substitui o teste manual em aparelhos reais e no navegador interno do Instagram (B-07).

**[B-60](https://github.com/Marquin25/agenda-digital-shopping/issues/60) Salvos mostra eventos além dos 200 primeiros** · P2 · P · `bug` · [R] · confirmado na leitura do código
- [x] `/salvos` usa uma consulta enxuta própria, sem o limite de 200 da agenda; o servidor nunca recebe a lista de salvos; teste com 201 eventos futuros.

**[B-61](https://github.com/Marquin25/agenda-digital-shopping/issues/61) Quadro de status no topo do README** · P1 · P · `documentation` · [R]
- [x] O que funciona, o que depende de infraestrutura, URL de homologação ("ainda não existe"), como entrar com dados de demonstração e próxima fatia; frase de status: "Núcleo da Fase 1 pronto para uso local; homologação e validação em dispositivos reais pendentes."

**[B-68](https://github.com/Marquin25/agenda-digital-shopping/issues/68) `CRON_SECRET` vazio derruba a leitura da configuração** · P1 · P · `bug` · [R] · confirmado na leitura do código
- [ ] `CRON_SECRET` vazio ou só com espaços vale como ausente (rota de retenção desligada); valor curto continua recusado sem imprimir o valor; testes para ausente, vazio, curto e válido; revisar `DEVICE_ID_PEPPER` e as variáveis de armazenamento com a mesma regra.

**[B-62](https://github.com/Marquin25/agenda-digital-shopping/issues/62) Guia de implantação: CRON_SECRET, agendador, smoke test e checklist** · P1 · P · `documentation` · relacionada a B-25 · [R]
- [x] `CRON_SECRET` e agendador da retenção, `PUBLIC_BASE_URL` por ambiente, variáveis S3 (após B-58), roteiro de smoke test, checklist de aceite da homologação e tabela de riscos. Só documentação: nenhum arquivo de configuração de deploy.

---

# Fase 2 — Inteligência e indicadores

**Status (2026-11-13):** B-37 feito (PR #55); B-39 feito (PR #56). Os demais itens da Fase 2 estão a fazer ou bloqueados.

### E-PART (continuação)

**[B-26](https://github.com/Marquin25/agenda-digital-shopping/issues/26) Avaliação pós-evento** · P1 · M · depende de B-13, B-17 · regras [C] · fase [P: rec. início da Fase 2]
- [ ] Período `fim → fim + N dias` configurável; nota de 1 a 5 (rádios), tags, comentário ≤ 280 com aviso; uma por ID; honeypot, tempo mínimo e limites; `com_checkin`; aviso "não comprova participação".

**[B-27](https://github.com/Marquin25/agenda-digital-shopping/issues/27) Encerrados recentes para avaliar** · P2 · P · depende de B-26 · [R]

**[B-28](https://github.com/Marquin25/agenda-digital-shopping/issues/28) Moderação de avaliações** · P2 · P · depende de B-26 · [C]
- [ ] Lista restrita, sem `id_hash`; ocultar e reexibir com auditoria.

**[B-29](https://github.com/Marquin25/agenda-digital-shopping/issues/29) Mural de sugestões** · P2 · M · depende de B-17, B-10 · [C] · fase [P: rec. Fase 2]
- [ ] Envio público (≤ 500, categoria opcional, antispam); só a administração vê; status nova, lida ou arquivada.

**[B-30](https://github.com/Marquin25/agenda-digital-shopping/issues/30) ADR do check-in por QR rotativo** · P2 · P · `tipo:spike` · `bloqueado:decisao` (P-PROD-1)
- [ ] ADR com o desenho de `03-metricas.md` §7 e aprovação explícita.

**[B-31](https://github.com/Marquin25/agenda-digital-shopping/issues/31) Token rotativo + modo telão + check-in** · P2 · M · depende de B-30 · TDD · [P]
- [ ] Token (janela atual e anterior), telão de 60 s, validação da janela do evento, idempotência, QR estático de reserva técnica; o painel passa a mostrar check-ins, conversão e CSAT verificado.

**[B-32](https://github.com/Marquin25/agenda-digital-shopping/issues/32) Spike de reservas sem dados pessoais** · P2 · P · `tipo:spike` · `bloqueado:decisao` (P-RES-*)
- [ ] Documento comparando as alternativas B e D (piloto) com as respostas às perguntas de `03-metricas.md` §6.2. **Não implementa reserva.**

### E-MED (continuação)

**[B-33](https://github.com/Marquin25/agenda-digital-shopping/issues/33) Snapshots e relatório automático pós-evento** · P1 · M · depende de B-18, B-20 · [PDF]
- [ ] Snapshot de interessados no início e no fim; relatório agregado gerado no encerramento e atualizado até o fim do período de avaliação; selos medido/estimado/indisponível; n e "Como calculamos".

**[B-34](https://github.com/Marquin25/agenda-digital-shopping/issues/34) Painel completo de indicadores** · P1 · M · depende de B-33, B-26 · [PDF]
- [ ] Interessados, compartilhamentos, avaliações, CSAT (e check-ins quando houver), filtros por período, categoria, espaço e evento; indicadores de fontes não integradas aparecem como "indisponível".

**[B-35](https://github.com/Marquin25/agenda-digital-shopping/issues/35) Comparação entre eventos e períodos** · P1 · M · depende de B-33 · [PDF]
- [ ] Comparar 2–5 eventos ou dois períodos; normalização por hora; marcação de datas especiais; avisos de amostra.

**[B-36](https://github.com/Marquin25/agenda-digital-shopping/issues/36) Exportar agregados (CSV)** · P3 · P · depende de B-34 · [R]
- [ ] Sem nenhum dado individual.

### E-ADM / E-INT

**[B-37](https://github.com/Marquin25/agenda-digital-shopping/issues/37) Segmentos e estabelecimentos participantes** · P1 · P · depende de B-10 · [PDF]
- [x] CRUD de segmentos e lojas (dado empresarial, sem contatos de pessoas); vínculo loja ↔ evento; o relatório mostra as lojas participantes.

**[B-38](https://github.com/Marquin25/agenda-digital-shopping/issues/38) Cadastro de planejamento (briefing)** · P1 · M · depende de B-12, B-37 · [C][PDF] · permissões [P]
- [ ] Objetivo, público desejado (faixas e perfis fixos), segmentos, lojas, faixa de orçamento, período e espaços; validações; ajuda explicando que o público é uma descrição de alvo.

**[B-39](https://github.com/Marquin25/agenda-digital-shopping/issues/39) Catálogo de modelos de experiência** · P1 · M · depende de B-37, B-12 · [R] · conteúdo [P]
- [x] CRUD com pesos de objetivo e público, segmentos, faixa de custo, estrutura, duração e indicadores sugeridos; data de atualização visível; semente com modelos de exemplo marcados "rascunho para revisão".
  - Provisório até P-INT-IA-1 e P-INT-IA-3: só o Administrador mantém o catálogo; a lista de públicos fica em `src/domain/intelligence/experience-catalog.ts`.

**[B-40](https://github.com/Marquin25/agenda-digital-shopping/issues/40) Motor de recomendações por regras (domínio)** · P1 · M · depende de B-39 · TDD · [C][PDF]
- [ ] Filtros eliminatórios explicados, pontuação ponderada configurável, justificativa e premissas por item, nível de confiança, ajuste histórico só acima do limiar; resultados determinísticos (mesmas entradas e regras → mesma saída).

**[B-41](https://github.com/Marquin25/agenda-digital-shopping/issues/41) Tela de recomendações e rastreabilidade** · P1 · M · depende de B-38, B-40 · [PDF][R]
- [ ] Gerar recomendações a partir do planejamento; mostrar ideias, por que foram sugeridas, premissas, lojas possíveis, estrutura, faixa de custo informada, indicadores e confiança; aviso "não são garantias"; registrar a execução (entradas, versão das regras, pesos); criar evento a partir da ideia escolhida (ligado ao planejamento).

**[B-42](https://github.com/Marquin25/agenda-digital-shopping/issues/42) Oportunidades descritivas** · P2 · M · depende de B-33 · [PDF]
- [ ] Dias e horários de maior procura, categorias com baixo engajamento, melhores eventos por categoria e época; n mínimo; sem análise automática de texto livre.

**[B-43](https://github.com/Marquin25/agenda-digital-shopping/issues/43) Registro de decisão e lições aprendidas** · P3 · P · depende de B-41, B-33 · [R]

---

# Fase 3 — Integrações e evolução (`bloqueado:terceiros` até as decisões P-INT-*)

**[B-44](https://github.com/Marquin25/agenda-digital-shopping/issues/44) Integração com o portal Wi-Fi** · `bloqueado:terceiros` (P-INT-1) · [PDF]
- [ ] Levantamento técnico com a Ponto Fibra → proposta → aprovação → adaptador isolado. Fallback: link simples da Fase 1.

**[B-45](https://github.com/Marquin25/agenda-digital-shopping/issues/45) Modo painel digital** · P2 · M · [PDF] · equipamento [P: P-INT-2]
- [ ] Página `/painel` com destaques em rotação acessível (pausável, sem piscar), sem interação; parâmetros por tela; origem `painel` nos QR exibidos.

**[B-46](https://github.com/Marquin25/agenda-digital-shopping/issues/46) Importação de fluxo agregado** · `bloqueado:terceiros` (P-INT-3) · [PDF]

**[B-47](https://github.com/Marquin25/agenda-digital-shopping/issues/47) Importação de vendas agregadas** · `bloqueado:terceiros` (P-INT-4, P-LGPD-8) · [PDF]
- [ ] Só agregados; acesso restrito; o relatório indica "correlação, não causalidade".

**[B-48](https://github.com/Marquin25/agenda-digital-shopping/issues/48) Aprimoramento analítico das recomendações** · `bloqueado:decisao` (P-INT-IA-5) · [PDF]

---

# Sem fase — dependem de aprovação

**[B-49](https://github.com/Marquin25/agenda-digital-shopping/issues/49) Reserva de vagas** · `bloqueado:decisao` (P-RES-*, P-LGPD-6) · ver B-32
**[B-50](https://github.com/Marquin25/agenda-digital-shopping/issues/50) Cupom / pagamento** · fora do MVP [C]; só com justificativa e aprovação

---

## Ordem sugerida (fatias verticais)

**Primeira entrega (prioridade, relatório de 2026-11-13)**
0. *Homologação:* ~~B-57 → B-58 → B-62 → B-59 → B-61 → B-60~~ (feitos) → B-68 → **B-25** (bloqueada até as decisões) → B-07 (aparelhos reais); depois decidir B-20.

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
