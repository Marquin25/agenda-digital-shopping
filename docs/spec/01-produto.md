# 01 — Produto, fases e requisitos

> Status: **proposta revisada para aprovação** · revisão 2 · 2026-11-13
> Fontes: `README.md`, respostas do responsável (ver `docs/plano/00-descoberta.md`), proposta em PDF "Plataforma Inteligente de Eventos e Experiências" (referência externa, não versionada), `docs/research/referencias.md`.

## Legenda de origem (usada em toda a especificação)

| Marca | Significado |
| --- | --- |
| **[C]** | **Confirmado** pelo responsável do projeto |
| **[PDF]** | **Proposta baseada no PDF**, ainda não aprovada item a item |
| **[R]** | **Recomendação** da equipe de agentes |
| **[P]** | **Decisão pendente**; não implementar antes de decidir |

## 1. Visão

Plataforma web responsiva e mobile-first que une três pilares [PDF]:

1. **Experiência do visitante:** agenda pública sem aplicativo e sem cadastro para consultar [C].
2. **Gestão administrativa:** cadastro, publicação e acompanhamento de eventos, com perfis e permissões [C].
3. **Inteligência estratégica:** apoiar a escolha de experiências a partir de objetivos comerciais, público-alvo, segmentos, orçamento, período e espaços, com recomendações que **explicam suas premissas e não apresentam estimativas como garantias** [C][PDF].

Ciclo do produto: **Descobrir → Participar → Avaliar → Melhorar** [C]. Lema da proposta: "da programação à inteligência" [PDF].

Nome provisório **Conecta Shopping** [C]. Uma instalação atende **um shopping**, com expansão futura possível [C].

## 2. Problema

- A programação fica espalhada entre canais; o visitante não tem um lugar único e acessível para consultá-la [C][PDF].
- A administração não tem uma visão consolidada de divulgação e resultados; a avaliação depende de tarefas manuais [PDF].
- A escolha de eventos raramente se apoia numa análise estruturada de objetivos, público, orçamento e resultados anteriores [PDF].

## 3. Usuários

| Persona | Necessidade principal |
| --- | --- |
| **Visitante** (celular, via Wi-Fi, Instagram, QR ou link direto) | Descobrir rapidamente eventos de interesse, incluindo recursos de acessibilidade |
| **Responsável com criança** | Filtrar por "Infantil", data e horário |
| **Pessoa com deficiência ou neurodivergente** | Filtrar por Libras, espaço sensorial etc.; navegar sem barreiras |
| **Editor** (marketing/eventos) | Cadastrar, publicar e divulgar eventos |
| **Analista** (gestão/planejamento) | Acompanhar indicadores, comparar eventos e planejar experiências |
| **Administrador** | Gerenciar acessos, configurações e catálogos |

## 4. Fases

O PDF organiza o MVP em três etapas. Aqui elas são chamadas de **Fases** (o termo "Etapa" já é usado para as etapas do processo de trabalho).

| Fase | Conteúdo | Origem |
| --- | --- | --- |
| **Fase 1 — Plataforma essencial** | Agenda pública, busca e filtros, detalhes, gestão administrativa, links diretos e QR Codes de divulgação, métricas básicas de visualização e origem | [C][PDF] |
| **Fase 2 — Inteligência e indicadores** | Painel e relatórios automáticos, comparação entre eventos e períodos, cadastro de objetivos, público-alvo, segmentos e orçamento, motor inicial de recomendações por regras transparentes | [C][PDF] |
| **Fase 3 — Integrações e evolução** | Portal Wi-Fi (integração), dados agregados de fluxo e vendas (se disponíveis e autorizados), painéis digitais, aprimoramento analítico com histórico suficiente | [C][PDF] |

**Qual é o "MVP"?** [P] O PDF chama as três etapas de "escopo proposto para o MVP". **Recomendação [R]:** tratar a **Fase 1** como a primeira versão publicável e as **Fases 1 + 2** como o MVP completo da proposta. A Fase 3 depende de terceiros.

### Itens da proposta anterior: fase recomendada

Nenhum item foi removido. A decisão final de fase é sua.

| Item | Fase recomendada [R] | Status | Justificativa | Depende de |
| --- | --- | --- | --- | --- |
| **Tenho interesse** | **Fase 1** | Registrar interesse foi confirmado [C]; a fase está pendente [P] | É barato, alimenta o indicador "Interesse" do PDF (favoritos) e funciona como "favorito sem cadastro" | ID de dispositivo (Fase 1) |
| **Adicionar à agenda (.ics)** | **Fase 1** | [R] | Atende "lembretes opcionais" do PDF sem coletar contato | Página de detalhes |
| **Avaliação pós-evento** | **Início da Fase 2** (alternativa: fim da Fase 1) | Regras confirmadas [C]; fase pendente [P] | Os relatórios e a comparação da Fase 2 usam a satisfação. Antecipar para a Fase 1 cria histórico mais cedo, mas atrasa a primeira versão | ID de dispositivo; eventos encerrados |
| **Mural de sugestões** (só administração) | **Fase 2** | Visibilidade confirmada [C]; fase pendente [P] | Alimenta "identificação de oportunidades" | ID de dispositivo; área administrativa |
| **Check-in por QR rotativo** | **Fase 2**, depois da aprovação do desenho | [P] | O PDF prevê "check-in opcional por QR Code" como indicador de participação; o desenho antifraude precisa ser aprovado antes | Aprovação do ADR; modo telão |
| **Reserva de vaga** | **Sem fase**: só análise na Fase 2; implementação no máximo na Fase 3 | [P] (não aprovada) | As regras de duplicidade, lotação, cancelamento e liberação sem dados pessoais ainda estão abertas (`03-metricas.md` §6) | Decisão do responsável; possível análise de LGPD |
| **Cupom / pagamento** | **Fora** do MVP | [C] fora, salvo justificativa e aprovação | Exigem outro projeto (gateway, CDC, fiscal) | — |

## 5. Requisitos funcionais

Colunas: **Fase** (1, 2, 3 ou —) e **Origem** (legenda acima).

### 5.1 Experiência do visitante (público, sem login)

| ID | Requisito | Fase | Origem |
| --- | --- | :-: | --- |
| RF01 | Agenda com eventos publicados e não encerrados, em cards (imagem com alt, título, data, horário, local, categoria, tags de acessibilidade, status) | 1 | [C][PDF] |
| RF02 | Busca por texto | 1 | [C] |
| RF03 | Filtros por categoria, data e recursos de acessibilidade, refletidos na URL | 1 | [C][PDF: "tipo de experiência"] |
| RF04 | Visão de calendário (por dia/semana) além da lista | 2 | [PDF] · [R]: lista com agrupamento por dia na Fase 1 |
| RF05 | Página de detalhes: descrição, horário, local/espaço, acessibilidade, informações de entrada, status | 1 | [C][PDF] |
| RF06 | Compartilhamento (API nativa ou copiar link) e URL própria por evento, com prévia Open Graph | 1 | [C][PDF] |
| RF07 | Links diretos para a programação, para um evento ou para uma categoria/filtro, com parâmetros de origem | 1 | [PDF] |
| RF08 | "Tenho interesse" (liga e desliga; uma vez por dispositivo e por evento; **não reserva vaga**) | 1 | [C] · P-FASE-1 decidido em 2026-11-14 |
| RF09 | Adicionar à agenda: `.ics` (principal) e link do Google Calendar (secundário) | 1 | [C] · fase [R] |
| RF10 | Página Privacidade + "Apagar meus dados deste dispositivo" | 1 | [R] |
| RF11 | Avaliação pós-evento aberta (sem exigir check-in), período configurável, nota de 1 a 5, tags, comentário ≤ 280 | 2 | Regras [C] · fase [P] |
| RF12 | Lista de encerrados recentes para avaliar | 2 | [R] |
| RF13 | Envio de sugestões (visível só para a administração) | 2 | [C] · fase [P] |
| RF14 | Check-in por QR rotativo no local | 2 | [P] |
| RF15 | Reserva de vaga em evento com limite | — | [P] |
| RF16 | Modo painel digital (página pública de destaques para telas e totens) | 3 | [PDF] |
| RF17 | Cupom, pagamento, login de visitante, notificações | — | Fora [C] |

### 5.2 Gestão administrativa (login)

| ID | Requisito | Fase | Origem |
| --- | --- | :-: | --- |
| RF20 | Login com e-mail e senha, sessões e logout (provedor final pendente) | 1 | [R] · provedor [P] |
| RF21 | Papéis Administrador, Editor e Analista (§6) | 1 | [C] provisório |
| RF22 | Gestão de usuários pelo Administrador (sem cadastro aberto) | 1 | [R] |
| RF23 | CRUD de eventos: título, descrição, início e fim, **espaço**, categoria, banner com alt, recursos de acessibilidade, informações de entrada, capacidade informativa, configuração de vagas, status de publicação | 1 | [C][PDF] |
| RF24 | Publicar, cancelar e **encerrar antecipadamente** (registra o fim real); status temporal derivado das datas | 1 | [C][PDF] · regra [R] |
| RF25 | Cadastro de **espaços** do shopping (nome, piso, capacidade, estrutura disponível) | 1 | [PDF] |
| RF26 | Cadastro de **estabelecimentos participantes** (lojas) e **segmentos comerciais**; vínculo com eventos | 2 | [PDF] · fase [R] |
| RF27 | Gerador de **links de divulgação e QR Codes** por evento e canal (Instagram, cartaz, totem, Wi-Fi, outro), com download em PNG/SVG | 1 | [PDF] |
| RF28 | Painel básico: visualizações e origem por evento e período | 1 | [C][PDF] |
| RF29 | Auditoria das ações administrativas | 1 | [R] |
| RF30 | Painel completo de indicadores (interesse, avaliações, check-ins, CSAT, origem, compartilhamentos) com marcação **medido / estimado / indisponível** | 2 | [PDF] |
| RF31 | **Relatório automático pós-evento** consolidando os dados disponíveis | 2 | [PDF] |
| RF32 | **Comparação** entre eventos e entre períodos | 2 | [PDF] |
| RF33 | Moderação de avaliações e mural de sugestões | 2 | [C] |
| RF34 | Modo telão do check-in | 2 | [P] |
| RF35 | Exportar dados agregados (CSV) | 2 | [R] |

### 5.3 Inteligência estratégica

| ID | Requisito | Fase | Origem |
| --- | --- | :-: | --- |
| RF40 | **Planejamento** (briefing): objetivo (aumentar vendas, ampliar fluxo, atrair novos públicos, fortalecer a experiência), público desejado (faixa etária, perfil, interesses, **sempre descritivo e agregado**), segmentos comerciais, orçamento (faixa), período, espaços disponíveis | 2 | [C][PDF] |
| RF41 | **Catálogo de modelos de experiência** mantido pela administração: objetivos e públicos atendidos, segmentos, faixa de custo, estrutura necessária, duração, indicadores sugeridos | 2 | [R] (necessário para recomendações por regras) |
| RF42 | **Motor de recomendações por regras transparentes**: filtros eliminatórios + pontuação explicada; mostra ideias, justificativa, premissas, público potencial, lojas possíveis, estrutura, faixa de custo **informada** e indicadores recomendados | 2 | [C][PDF] |
| RF43 | Ajuste das recomendações pelo histórico de desempenho, só quando houver amostra mínima, com nível de confiança visível | 2 | [R] |
| RF44 | **Identificação de oportunidades** descritiva: dias e horários de maior procura, categorias com baixo engajamento, melhores eventos por categoria e época (com n mínimo) | 2 | [PDF] |
| RF45 | Registrar a decisão tomada e ligar planejamento → evento realizado → resultados (aprender com o histórico) | 2 | [R] |
| RF46 | Recomendações com modelos analíticos ou IA | 3 | [PDF] · só com dados suficientes [P] |

### 5.4 Integrações e pontos de contato

| ID | Requisito | Fase | Origem |
| --- | --- | :-: | --- |
| RF50 | Link de divulgação com origem para o portal Wi-Fi (chamada ou link), **se** a Ponto Fibra permitir | 1 (só link) / 3 (integração) | [PDF] · viabilidade [P] |
| RF51 | Redes sociais: links na bio, posts e stories com origem | 1 | [C][PDF] |
| RF52 | QR Codes impressos em cartazes e totens | 1 | [PDF] |
| RF53 | Painéis digitais exibindo destaques (via modo painel/URL) | 3 | [PDF] |
| RF54 | Fluxo de visitantes agregado (sensores ou sistemas existentes) | 3 | [PDF] · fonte [P] |
| RF55 | Vendas agregadas por período ou segmento | 3 | [PDF] · fonte e autorização [P] |

**Regra transversal [C][PDF]:** a aplicação **continua funcionando** quando uma integração está indisponível. Indicadores dependentes aparecem como **indisponíveis**, nunca como zero.

## 6. Requisitos não funcionais

| ID | Categoria | Requisito |
| --- | --- | --- |
| RNF01 | Acessibilidade | WCAG 2.2 AA; alvos ≥ 44 px; teclado, VoiceOver e TalkBack (`06-qualidade.md`) |
| RNF02 | Desempenho | Agenda em 4G: LCP ≤ 2,5 s, INP ≤ 200 ms (p75); JS público ≤ 150 KB gzip; programação "em tempo real" = publicação refletida em ≤ 60 s |
| RNF03 | Compatibilidade | Safari iOS, Chrome Android, navegador interno do Instagram e navegador do portal cativo |
| RNF04 | Privacidade | Sem identificação para consultar; mínimo de dados; indicadores agregados; nenhum dado individual em relatórios; sem analytics de terceiros [C][PDF] |
| RNF05 | Segurança | OWASP ASVS nível 1; Argon2id; cookies seguros; CSP; CSRF; limites; nenhum segredo versionado [C] |
| RNF06 | Resiliência | Integrações isoladas: a falha de uma não derruba a agenda nem o painel [C][PDF] |
| RNF07 | Manutenção | Aplicação única em contêiner; motor de recomendação como módulo isolado que pode evoluir separadamente [PDF][R] |
| RNF08 | Transparência | Todo número indica se é medido, estimado ou indisponível; toda recomendação lista premissas e regras aplicadas [PDF] |
| RNF09 | Idioma | **Interface e documentação em pt-BR** [C]; **código em inglês** (identificadores, tabelas, colunas, rotas de API internas, commits técnicos) [C]; fuso `America/Sao_Paulo` |
| RNF10 | Observabilidade | Logs estruturados sem dados pessoais; endpoint de saúde |
| RNF11 | Qualidade de código | Princípios **SOLID**, padrões de projeto só quando resolvem uma necessidade concreta, boas práticas e convenções do repositório (`05-arquitetura.md` §6) [C] |

## 7. Papéis e permissões (provisório [C]; detalhes da Fase 2 [P])

| Ação | Administrador | Editor | Analista |
| --- | :-: | :-: | :-: |
| Ver painéis e relatórios | ✅ | ✅ | ✅ |
| Criar, editar, publicar, cancelar e encerrar eventos | ✅ | ✅ | — |
| Gerar links e QR de divulgação | ✅ | ✅ | — |
| Cadastrar espaços, estabelecimentos e segmentos | ✅ | ✅ | — |
| Criar planejamentos e gerar recomendações (Fase 2) | ✅ | [P] | ✅ |
| Manter o catálogo de modelos de experiência (Fase 2) | ✅ | [P] | [P] |
| Ler e moderar avaliações e sugestões (Fase 2) | ✅ | ✅ | ler |
| Modo telão (check-in, Fase 2) | ✅ | ✅ | — |
| Usuários, papéis, configurações, auditoria | ✅ | — | — |
