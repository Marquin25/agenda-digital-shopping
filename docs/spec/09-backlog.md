# 09 — Backlog ordenado

> Papel: **PO** · Este arquivo é a **fonte local** do backlog. Depois da aprovação do plano, cada item vira uma issue no GitHub (via `gh` ou `/to-tickets`) e o arquivo passa a apontar para os números das issues.
>
> Tamanho: **P** ≈ até 1 dia · **M** ≈ 2–3 dias. Prioridade: **P1** fecha o ciclo · **P2** completa o MVP · **P3** condicionado ou bloqueado.
> Todas as issues herdam a **Definição de pronto** (`08-testes-e-dod.md` §4), que já inclui acessibilidade, segurança e testes.

## Rótulos propostos

`epico:*` (um por épico) · `tipo:feature` · `tipo:spike` · `tipo:infra` · `bug` · `prioridade:p1|p2|p3` · `bloqueado:decisao` · os 5 rótulos de triagem (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`).

## Board (GitHub Projects) — colunas

`Backlog` → `Pronto para fazer` → `Em andamento` → `Em revisão` → `Concluído` (+ campo **Bloqueado**).

---

## E0 — Fundação

### #01 Esqueleto da aplicação executável · P1 · M · `tipo:infra`
Next.js + TypeScript, ESLint/Prettier, Vitest, Playwright + axe, Docker Compose com PostgreSQL, `.env.example` sem valores reais, CI (lint, typecheck, testes, build, gitleaks) e endpoint `/api/saude`.
- [ ] `docker compose up` + `npm run dev` sobem a aplicação; `/api/saude` responde 200.
- [ ] `npm test` e `npm run test:e2e` rodam (1 teste de exemplo cada) e o axe roda na página inicial.
- [ ] O CI roda no PR; não há segredos no repositório.

### #02 Esquema inicial do banco e sementes · P1 · M · depende de #01
Tabelas de `04-dados-e-integracoes.md` (exceto as de check-in), migrações e sementes de categorias, recursos e eventos de exemplo.
- [ ] Migração aplica e reverte num banco limpo.
- [ ] As restrições `UNIQUE` de interesse e avaliação existem e têm teste de integração.
- [ ] A semente cria 4 categorias, 5 recursos e eventos nos três status temporais.

### #03 Regra de status temporal do evento · P1 · P · depende de #01 · TDD
- [ ] A função pura devolve Rascunho, Cancelado, Agendado, Em andamento ou Encerrado conforme `04-…` §Status, com testes de fronteira (início e fim exatos, fuso).

## E1 — Descobrir (agenda pública)

### #04 Agenda pública: lista de próximos eventos · P1 · M · depende de #02, #03
- [ ] `/` lista eventos publicados e não encerrados, agrupados por dia, em ordem cronológica, gerados no servidor.
- [ ] O card mostra imagem com alt, categoria em texto, título (link), data e hora, local, recursos e status.
- [ ] Estados: vazio, sem eventos futuros e erro, conforme `02-…` §3.1.
- [ ] Rascunhos e cancelados não aparecem (cancelados: decidir se aparecem com faixa; proposta: sim até a data).
- [ ] Axe sem violações; funciona em 320 px.

### #05 Busca e filtros com estado na URL · P1 · M · depende de #04
- [ ] Busca por texto em título e descrição, sem diferenciar maiúsculas nem acentos.
- [ ] Filtros de categoria (múltipla), data (hoje, fim de semana, intervalo) e acessibilidade (múltipla, regra **E**).
- [ ] Os filtros ficam na URL (link compartilhável; botão voltar funciona).
- [ ] A quantidade de resultados é anunciada por `aria-live`; "Limpar filtros" funciona; operação completa por teclado.

### #06 Página de detalhes + compartilhamento · P1 · M · depende de #04
- [ ] `/eventos/[slug]` mostra todos os campos de RF04; 404 acessível para slug inexistente.
- [ ] `schema.org/Event` em JSON-LD válido e Open Graph (`og:title`, `og:image`, `og:image:alt`, `og:locale=pt_BR`).
- [ ] Botão de compartilhar usa a API nativa quando existe; senão, "Copiar link" com confirmação anunciada.
- [ ] Variações por status (agendado, em andamento, encerrado, cancelado).

### #07 Spike: navegadores internos do Instagram e do portal Wi-Fi · P1 · P · `tipo:spike` · depende de #06
- [ ] Relatório em `docs/research/` sobre persistência de cookie, download do `.ics`, link do Google Calendar e botão de compartilhar no navegador interno do Instagram (iOS e Android) e no navegador do portal cativo (se houver acesso), com recomendações.

## E2 — Participar

### #08 Identificador de dispositivo e exclusão da equipe · P1 · P · depende de #02 · TDD
- [ ] Cookie `HttpOnly; Secure; SameSite=Lax` de 180 dias, criado só na primeira ação que precisa dele; no banco fica só o HMAC.
- [ ] Requisições com sessão administrativa ficam marcadas e não geram métricas.
- [ ] Nenhum log contém o ID puro.

### #09 "Tenho interesse" · P1 · M · depende de #06, #08
- [ ] Botão com `aria-pressed` alterna o interesse; repetir não duplica (teste).
- [ ] Funciona sem JavaScript (formulário POST) e com JavaScript (otimista, com reversão se der erro).
- [ ] Limite por ID e por IP com resposta 429 amigável; mensagem anunciada.
- [ ] O rótulo e o texto de ajuda não sugerem presença ou reserva.

### #10 Adicionar à agenda (.ics + Google Calendar) · P1 · P · depende de #06 · TDD
- [ ] O `.ics` cumpre a RFC 5545: UID estável, DTSTAMP, DTSTART/DTEND em UTC, SEQUENCE muda a cada edição, escaping e quebra de linhas longas (testes com acentos, vírgula, ponto e vírgula e quebra de linha).
- [ ] Link do Google Calendar com título, datas, local e descrição; marcado como opção secundária.
- [ ] Alternativa "copiar link do evento" quando o download falhar (conforme o resultado de #07).

## E3 — Administração básica

### #11 Login administrativo e sessões · P1 · M · depende de #02
- [ ] Login por e-mail e senha (Argon2id); erro genérico; bloqueio progressivo; sessão no banco com expiração ociosa e absoluta; logout.
- [ ] Usuário inicial criado por comando de linha (`npm run admin:criar`), com senha informada em tempo de execução, nunca versionada.
- [ ] Troca de senha obrigatória no 1º acesso.
- [ ] Testes de integração para login, bloqueio, expiração e CSRF.

### #12 Papéis e autorização · P1 · P · depende de #11 · TDD
- [ ] A matriz de `01-produto.md` §6 é aplicada no servidor, com teste para cada ação × papel.
- [ ] O menu mostra só o que o papel pode fazer.

### #13 Gestão de usuários (Administrador) · P2 · P · depende de #12
- [ ] Criar usuário com senha temporária, mudar papel, desativar e redefinir senha; tudo vai para a auditoria.
- [ ] O Administrador não consegue desativar o próprio usuário se for o último administrador ativo.

### #14 CRUD de eventos (sem banner) · P1 · M · depende de #12, #03
- [ ] Criar, editar, salvar rascunho, publicar e cancelar, com as validações de `02-…` §3.6.
- [ ] Excluir só rascunhos; tudo vai para a auditoria; a edição incrementa `versao_ics`.
- [ ] Lista com filtros por status e categoria; pré-visualização do card.
- [ ] Um evento publicado aparece na agenda (E2E: Editor publica → visitante vê).

### #15 Upload de banner com texto alternativo · P2 · M · depende de #14
- [ ] Aceita JPEG, PNG e WebP ≤ 5 MB com verificação do tipo real; reprocessa (remove EXIF) e gera tamanhos responsivos.
- [ ] Texto alternativo obrigatório quando há banner.
- [ ] Armazenamento atrás de uma interface (disco local agora; S3 depois).

## E4 — Avaliar

### #16 Avaliação pós-evento · P1 · M · depende de #08, #14
- [ ] Disponível de `fim` até `fim + período` (configurável por evento; padrão global); fora disso mostra mensagem com a data.
- [ ] Nota de 1 a 5 obrigatória (rádios rotulados), tags opcionais, comentário ≤ 280 com contador e aviso de dados pessoais.
- [ ] Uma por ID e por evento; honeypot, tempo mínimo e limites; Turnstile pode ser ligado por configuração (desligado).
- [ ] Grava `com_checkin`; mensagem de sucesso anunciada.

### #17 Eventos encerrados recentes · P2 · P · depende de #16
- [ ] `/eventos/encerrados` lista os eventos com o período de avaliação aberto e o botão "Avaliar".

### #18 Avaliações na administração · P2 · P · depende de #16, #12
- [ ] Lista por evento com nota, tags, comentário e selo "com check-in" ou "sem check-in"; ocultar e reexibir (auditado).

### #19 Mural de sugestões · P2 · M · depende de #08, #12
- [ ] Envio público (≤ 500 caracteres, categoria opcional, antispam, 3 por dia por ID).
- [ ] A administração lista e muda o status (nova, lida, arquivada); **nada é exibido publicamente**.

## E5 — Melhorar (métricas e dashboard)

### #20 Registro de acessos e visualizações · P1 · M · depende de #08 · TDD
- [ ] Deduplicação diária por ID; origem pelo `utm_source` (wifi, instagram, outro, direto); robôs e equipe excluídos.
- [ ] Testes para as fórmulas de `03-metricas.md` §3.

### #21 Dashboard com indicadores e gráficos · P1 · M · depende de #20, #09, #16
- [ ] Cartões: acessos, eventos ativos, interessados, avaliações, CSAT (n e média), com filtros de período, categoria e evento.
- [ ] Gráficos de interesse × check-in (check-in aparece como "—" até E6), satisfação por categoria e origem, cada um com tabela equivalente.
- [ ] Aviso "amostra pequena" com n < 10; texto "Como calculamos".
- [ ] Analista vê; nenhum papel edita a partir do dashboard.

### #22 Snapshots de interesse no início e no fim do evento · P2 · P · depende de #09
- [ ] Tarefa agendada grava o snapshot; o dashboard usa o snapshot para eventos encerrados.

## E6 — Check-in (condicionado: `bloqueado:decisao` até P-PROD-1)

### #23 ADR do check-in por QR rotativo · P3 · P · `tipo:spike`
- [ ] ADR com o desenho de `03-metricas.md` §6, riscos residuais e alternativas; aprovação explícita do responsável.

### #24 Token rotativo (domínio) · P3 · P · depende de #23 · TDD
- [ ] Gerar e validar o token (janela atual e anterior); testes de fronteira e de tempo simulado.

### #25 Modo telão e registro de check-in · P3 · M · depende de #24, #12
- [ ] Telão para Editor ou Administrador, atualizado a cada 60 s, em tela cheia e com alto contraste.
- [ ] O check-in valida o token e a janela do evento; é idempotente (a segunda leitura responde "já registrado").
- [ ] Plano B: QR estático marcado como `metodo=estatico`.
- [ ] O dashboard passa a mostrar check-ins, conversão e CSAT verificado.

## E7 — Privacidade e operação

### #26 Página Privacidade + apagar dados do dispositivo · P1 · P · depende de #08
- [ ] Texto provisório em linguagem simples, marcado como "pendente de validação do shopping".
- [ ] "Apagar meus dados" remove os registros do `id_hash` e o cookie; confirmação na própria página.

### #27 Retenção e agregação automáticas · P2 · M · depende de #20, #16
- [ ] Tarefa diária aplica os prazos de `04-…` §Retenção; testes de integração com datas simuladas.

### #28 Endurecimento de segurança · P2 · P · depende de #11
- [ ] Cabeçalhos (CSP, HSTS em produção etc.), limites revisados, gitleaks e `npm audit` no CI; checklist ASVS nível 1 documentado.

## E8 — Implantação (bloqueado: P-INF-1, P-INF-2, P-LGPD-*)

### #29 Imagem de produção e guia de implantação · P2 · M · depende de #01
- [ ] Dockerfile multi-stage; `docker compose` de produção (app + Postgres + proxy com TLS); backup e restauração documentados e testados localmente.

### #30 Publicar a homologação · P3 · P · `bloqueado:decisao`
- [ ] **Só com autorização explícita**: ambiente escolhido, domínio e variáveis configurados fora do repositório.

---

## Ordem sugerida (fatias verticais)

1. **Fatia 1, "ver a agenda":** #01 → #02 → #03 → #04 → #06
2. **Fatia 2, "publicar evento":** #11 → #12 → #14 (E2E: publicar → aparece)
3. **Fatia 3, "participar":** #08 → #09 → #10 → #07 → #26
4. **Fatia 4, "avaliar":** #16 → #17 → #18 → #19
5. **Fatia 5, "melhorar":** #20 → #21 → #22 → #05 → #15 → #13
6. **Fatia 6, "operar":** #27 → #28 → #29
7. **Condicionadas:** E6 (depois da aprovação do check-in) · #30 (depois da decisão de hospedagem)
