# 🛍️ Conecta Shopping: Plataforma Inteligente de Eventos e Experiências

> **Tema:** 10. Eventos, entretenimento e experiências (shopping center)
> **Equipe:** 48 - Poliwhirl
> **Integrantes:** Ana Carolina Guedes Santos, Marcus Antônio Rodrigues Monteiro Rios de Pina e Arthur Salomão Negreiros

> **Pitch:** o shopping promove shows, oficinas e experiências, mas o visitante não fica sabendo, e a equipe não sabe o que funcionou. O **Conecta Shopping** reúne a programação num site para celular que abre pelo Instagram, pelo Wi-Fi ou por um QR Code, **sem aplicativo e sem cadastro**. Para a equipe, mostra de onde veio cada acesso, com números honestos que dizem o que é medido, o que é estimado e o que ainda não dá para medir.

Situação: **Fase 1 implementada** e rodando localmente, ainda não publicada (veja [Situação e próximos passos](#situação-e-próximos-passos)).

---

## Equipe

| | |
| --- | --- |
| **Nome do grupo** | Equipe 48 - Poliwhirl |
| **Integrantes** | Ana Carolina Guedes Santos · Marcus Antônio Rodrigues Monteiro Rios de Pina · Arthur Salomão Negreiros |

---

## 1. Contexto e problemática

Shoppings deixaram de ser só lugar de compras: são espaços de convivência, lazer e cultura, com uma programação de eventos que precisa atrair e fidelizar públicos diferentes, como famílias, jovens e pessoas com deficiência.

Hoje essa programação tem três problemas:

1. **Está espalhada.** Os eventos aparecem em posts do Instagram, cartazes e avisos soltos. O visitante não tem um lugar único e acessível para saber o que acontece, quando e onde, nem se o evento oferece intérprete de Libras ou espaço sensorial.
2. **A divulgação não é medida.** A equipe não sabe se o público chegou pelo Instagram, pelo Wi-Fi do shopping ou pelo cartaz da entrada. Sem isso, não dá para saber onde vale a pena investir.
3. **A decisão sobre o próximo evento é intuitiva.** Faltam dados organizados sobre o que atraiu interesse, e é comum confundir indicadores diferentes (visualização não é presença, e interesse não é reserva).

## 2. Justificativa

- **O visitante já está no celular.** Ele chega pelo Instagram, pelo portal do Wi-Fi ou pela câmera apontada para um QR Code. Exigir aplicativo ou cadastro afasta justamente quem só queria consultar a programação. Uma página web leve e sem login remove essa barreira.
- **Acessibilidade é público, não detalhe.** Filtrar por Libras, audiodescrição ou espaço sensorial permite que pessoas com deficiência e famílias neurodivergentes planejem a visita. Isso só acontece se o próprio site for acessível (WCAG 2.2 AA).
- **Medir a origem é barato e muda decisões.** Um link curto e um QR por canal (`/r/{código}`) já dizem qual divulgação trouxe gente, sem ferramenta paga e sem rastrear pessoas.
- **Números precisam ser honestos para serem úteis.** Cada indicador vem marcado como **Medido**, **Estimado** ou **Indisponível**. Uma métrica sem fonte aparece como "—", nunca como zero, o que evita decisões baseadas em números inflados.
- **Privacidade por padrão (LGPD).** O sistema guarda o mínimo: um identificador aleatório do dispositivo, cifrado (HMAC), apagado depois de 30 dias e removível pelo próprio visitante. Não há nome, e-mail, IP gravado nem rastreadores de terceiros.

## 3. Objetivos

### Objetivo geral

Desenvolver uma plataforma web integrada e _mobile-first_ que melhore o planejamento, a divulgação, a participação e a avaliação dos eventos e experiências de um shopping center, transformando dados e referências de mercado em decisões estratégicas.

### Objetivos específicos

| # | Objetivo | Situação |
| --- | --- | --- |
| 1 | Publicar uma **agenda pública** mobile-first com busca, filtros (data, categoria, acessibilidade) e página de detalhes | ✅ Fase 1 |
| 2 | Permitir **salvar na agenda pessoal** (`.ics` e Google Agenda) e **compartilhar** | ✅ Fase 1 |
| 3 | Dar à equipe uma **área administrativa** com login, papéis (Administrador, Editor, Analista), espaços, eventos e banners | ✅ Fase 1 |
| 4 | Criar **links e QR Codes de divulgação** por canal e medir de onde veio cada acesso | ✅ Fase 1 |
| 5 | Mostrar um **painel de métricas** com selo de qualidade em cada número (medido, estimado ou indisponível) | ✅ Fase 1 |
| 6 | Respeitar a **privacidade**: dados mínimos, retenção de 30 dias e botão "apagar meus dados" | ✅ Fase 1 |
| 7 | Coletar **avaliações** e **sugestões** e gerar **relatórios pós-evento** e comparações | Fase 2 |
| 8 | Recomendar experiências a partir de objetivos, público, orçamento e histórico, com **regras transparentes** | Fase 2 |
| 9 | Usar **benchmarking**: comparar cada evento com o histórico do shopping e com referências de mercado | Fase 2 |
| 10 | Oferecer **calendário** semanal/mensal, **favoritos** guardados no aparelho e **check-in** opcional por QR Code | Fase 2 (check-in aguarda decisão) |
| 11 | Integrar portal Wi-Fi, painéis digitais, fluxo de pessoas e vendas, se houver autorização | Fase 3 |

---

## 4. Ferramentas e tecnologias

| Camada | Escolha | Por quê |
| --- | --- | --- |
| Linguagem | **TypeScript** (modo estrito) sobre **Node.js 22+** | Uma só linguagem no front-end e no back-end, com tipos que evitam erros cedo |
| Plataforma web | **Next.js 16** (App Router) e **React 19** | Páginas geradas no servidor: rápidas no 4G, boas para prévias de link e SEO. Front-end e API no mesmo projeto |
| Banco de dados | **PostgreSQL**, ou **PGlite** (PostgreSQL embutido) para rodar sem instalar nada | Restrições `UNIQUE` garantem a deduplicação das métricas. O mesmo SQL roda local e em produção |
| Acesso a dados | **Drizzle ORM**, com migrações versionadas | SQL tipado e leve |
| Validação | **Zod** | Valida toda entrada na borda (formulários e APIs) |
| Segurança | **Argon2id** (senhas), sessões no banco, **CSP com nonce**, cookies `HttpOnly`, limites de requisição | Login próprio, sem depender de terceiros |
| Imagens e QR | **sharp** (banners em WebP, sem metadados) e **qrcode** (QR gerado no servidor) | Nenhum serviço externo |
| Testes | **Vitest** (unidade e integração), **Playwright** e **axe-core** (ponta a ponta e acessibilidade) | Cada regra de negócio e cada fluxo principal tem teste automático |
| Qualidade e CI | **ESLint**, **Prettier**, **GitHub Actions** (lint, tipos, testes, build, E2E, auditoria de dependências, varredura de segredos com gitleaks) | Todo pull request é verificado automaticamente |

### Tecnologia ou prática da roleta

**Benchmarking**, usado em dois momentos: na concepção do produto e como recurso analítico dentro da plataforma.

1. **Análise de mercado:** comparação entre sites e apps de shoppings, plataformas de eventos (ex.: Sympla, Eventbrite) e ferramentas de _analytics_.
2. **Critérios avaliados:** acesso sem cadastro ou app, filtros e busca, calendário, compartilhamento, painel administrativo, relatórios automáticos, recomendação baseada em dados, acessibilidade e desempenho no celular.
3. **Diferencial:** as soluções tradicionais focam só na divulgação da agenda ou na venda de ingressos. O **Conecta Shopping** junta isso ao planejamento estratégico, orientado por objetivos comerciais e pelo histórico interno.
4. **Comparação interna (Fase 2):** nos relatórios administrativos, cada evento será comparado com o histórico do próprio shopping e com _benchmarks_ de referência cadastrados pela gestão. Cada comparação mostra a fonte e a qualidade do dado (medido, estimado ou indisponível).

Na Fase 1 já entram os indicadores que alimentam essa comparação: visualizações, origem por canal, compartilhamentos e adições à agenda.

---

## 5. Arquitetura proposta

Uma única aplicação **Next.js**, organizada em camadas no estilo de uma **arquitetura hexagonal leve**. As regras de negócio ficam isoladas do framework, o que facilita testar e trocar peças (por exemplo, o banco local pelo PostgreSQL gerenciado, ou o disco local por armazenamento em nuvem).

```mermaid
flowchart LR
    V["Visitante<br/>(celular)"] -->|"Instagram, Wi-Fi,<br/>QR Code, link"| R["/r/{código}<br/>link de divulgação"]
    R --> P
    V --> P["Páginas públicas<br/>agenda · detalhes · privacidade"]
    E["Equipe do shopping<br/>(computador)"] --> A["Área /admin<br/>eventos · espaços · divulgação · painel"]

    subgraph App["Aplicação Next.js (TypeScript)"]
        P --> UC
        A --> UC
        B["APIs de métricas<br/>visualização · engajamento"] --> UC
        UC["application/<br/>casos de uso"] --> D["domain/<br/>regras puras"]
        UC --> I["infrastructure/<br/>banco · arquivos · segurança"]
    end

    P -. beacon .-> B
    I --> DB[("PostgreSQL / PGlite")]
    I --> FS[("Imagens<br/>(disco local)")]
```

| Pasta | Responsabilidade | Exemplos |
| --- | --- | --- |
| `src/domain/` | Regras puras, sem framework, testadas primeiro (TDD) | status do evento, fuso de São Paulo, filtros da agenda, origem do acesso, `.ics`, política de retenção |
| `src/application/` | Casos de uso que orquestram as regras e o banco | publicar evento, registrar visualização, painel, retenção diária |
| `src/infrastructure/` | Adaptadores técnicos | Drizzle e PostgreSQL, armazenamento de arquivos, Argon2id, cookies, limites, CSP |
| `src/ui/` | Componentes acessíveis reutilizáveis | cartão de evento, filtros, banner responsivo, cartões de métrica |
| `src/app/` | Rotas (páginas e APIs) | `/`, `/eventos/[slug]`, `/admin/**`, `/r/[código]`, `/api/metrics/*` |

**Princípios aplicados:**
- **SOLID**, com padrões de projeto só onde resolvem um problema concreto: *Adapter* para armazenamento e banco, *Repository* via casos de uso, resultado "indisponível" no lugar de números inventados.
- **Validação na borda** com Zod.
- **Status do evento derivado das datas.** Ninguém precisa lembrar de mudar para "encerrado".

Mais detalhes estão em [`docs/spec/05-arquitetura.md`](docs/spec/05-arquitetura.md).

---

## 6. Telas

As imagens abaixo são **capturas do sistema funcionando** (Fase 1), geradas automaticamente com `npm run screens`. Os wireframes das telas planejadas para a Fase 2 (avaliação, planejamento e relatório pós-evento) estão em [`docs/spec/02-jornadas-e-telas.md`](docs/spec/02-jornadas-e-telas.md) §3. As telas podem mudar ao longo do hackathon.

### Visitante (celular)

| Agenda | Filtros | Detalhes do evento | Privacidade |
| :-: | :-: | :-: | :-: |
| <img src="docs/telas/01-agenda-celular.png" alt="Agenda pública no celular, com eventos agrupados por dia" width="200"> | <img src="docs/telas/02-filtros-celular.png" alt="Filtros por data, categoria e recurso de acessibilidade" width="200"> | <img src="docs/telas/03-detalhes-do-evento-celular.png" alt="Página do evento com data, local, vagas, acessibilidade e botões de agenda e compartilhamento" width="200"> | <img src="docs/telas/04-privacidade-celular.png" alt="Página de privacidade com o botão para apagar os dados do dispositivo" width="200"> |

- **Agenda:** eventos agrupados por dia, com categoria, horário, local e recursos de acessibilidade.
- **Filtros:** busca por texto, "hoje", "fim de semana", datas, categorias e acessibilidade. Ficam na URL, então dá para compartilhar uma busca.
- **Detalhes:** informações completas, "Adicionar à agenda" (`.ics` e Google), "Compartilhar" e recursos de acessibilidade.
- **Privacidade:** explica o que é guardado e tem o botão "Apagar meus dados deste dispositivo".

### Equipe do shopping (computador)

| Login | Painel de métricas |
| :-: | :-: |
| <img src="docs/telas/05-login-equipe.png" alt="Tela de login da equipe" width="420"> | <img src="docs/telas/06-painel-de-metricas.png" alt="Painel com acessos, origem por canal, visualizações por evento e acessos por link e QR" width="420"> |

| Eventos | Cadastro de evento | Links e QR de divulgação |
| :-: | :-: | :-: |
| <img src="docs/telas/07-lista-de-eventos.png" alt="Lista de eventos com status" width="280"> | <img src="docs/telas/08-cadastro-de-evento.png" alt="Formulário de cadastro de evento" width="280"> | <img src="docs/telas/09-links-e-qr-de-divulgacao.png" alt="Criação de links de divulgação com QR Code para baixar" width="280"> |

- **Painel:** acessos, origem por canal, visualizações, compartilhamentos e adições à agenda por evento. Cada número tem um selo (Medido, Estimado ou Indisponível) e há aviso de amostra pequena.
- **Eventos:** rascunho, publicação, cancelamento (com confirmação) e encerramento, com banner e texto alternativo obrigatório.
- **Divulgação:** um link curto e um QR Code (PNG ou SVG) para cada canal: Instagram, Wi-Fi, cartaz, totem.

### Funcionalidades planejadas (próximas fases)

- **Visitante:**
  - calendário com visão semanal e mensal;
  - favoritos e lembretes guardados só no aparelho, sem conta;
  - check-in opcional por QR Code;
  - entrada pelo portal Wi-Fi cativo, se houver integração.
- **Administração:**
  - formulário de planejamento (objetivo comercial, faixa etária, interesses, segmentos, orçamento e período), ligado a um **motor de recomendação** com regras explicáveis: _score_ de aderência, justificativa, lojas sugeridas e indicadores recomendados;
  - relatórios pós-evento automáticos, com comparação por _benchmarking_;
  - evolução temporal e distribuição por segmento no painel.

---

## 7. Privacidade (_Privacy by Design_)

O projeto segue os princípios da LGPD desde o desenho. A conformidade formal depende de validação jurídica do shopping, que ainda não foi feita.

- **Minimização:** só o necessário para operar e gerar métricas. O visitante não informa nome nem e-mail, e o IP não é gravado.
- **Acesso livre:** navegar, filtrar e salvar eventos não exige cadastro.
- **Dados agregados e com prazo:** o identificador do dispositivo é cifrado (HMAC) e apagado depois de 30 dias. Ficam só os totais. O visitante pode apagar os próprios dados na página de privacidade.
- **Sem dados sensíveis:** nada é inferido sobre a pessoa. Os recursos de acessibilidade descrevem o evento, não quem o visita.
- **Arquivos limpos:** os metadados (EXIF) das imagens enviadas pela administração são removidos com `sharp`.

---

## Situação e próximos passos

**Fase 1, pronto e testado:**
- agenda, filtros e detalhes;
- `.ics` e Google Agenda, compartilhamento;
- área administrativa com papéis;
- espaços, eventos e banners responsivos;
- links e QR de divulgação;
- painel de métricas (inclusive compartilhamentos e adições à agenda);
- privacidade e "apagar meus dados";
- retenção automática de 30 dias;
- CSP com nonce.

**Fora do escopo atual, porque aguarda decisão** ([`docs/spec/07-mvp-e-riscos.md`](docs/spec/07-mvp-e-riscos.md) §4):
- "Tenho interesse" (P-FASE-1);
- reservas e check-in;
- avaliações e sugestões (Fase 2);
- integrações (Fase 3);
- hospedagem e domínio.

**Backlog:** cada item é uma issue no GitHub, com o mesmo número do backlog (`B-01` = [#1](https://github.com/Marquin25/agenda-digital-shopping/issues/1)). Veja [`docs/spec/09-backlog.md`](docs/spec/09-backlog.md).

---

## Como rodar localmente

**Requisitos:** [Git](https://git-scm.com) e [Node.js](https://nodejs.org) 22.12 ou mais recente. **Não precisa** de Docker nem de banco instalado: o sistema usa o **PGlite**, que guarda os dados numa pasta local.

```sh
git clone https://github.com/Marquin25/agenda-digital-shopping.git
cd agenda-digital-shopping
npm install
cp .env.example .env.local        # no Windows: copy .env.example .env.local
```

Abra o `.env.local` e defina o banco local:

```
DATABASE_URL=pglite:./storage/pglite
```

O arquivo `.env.local` está no `.gitignore` e **nunca** deve ser versionado. As outras variáveis são opcionais em desenvolvimento.

```sh
npm run db:migrate     # cria as tabelas
npm run db:seed        # categorias, recursos de acessibilidade, um espaço e 4 eventos de exemplo
npm run admin:create -- --name "Seu nome" --email voce@example.com --role administrator
npm run dev
```

Abra <http://localhost:3000>. A área da equipe fica em <http://localhost:3000/admin>; a senha é pedida no terminal e deve ser trocada no primeiro acesso. Para parar o servidor, use `Ctrl + C`.

**Opcional:**
- Use PostgreSQL em vez do PGlite: rode `docker compose up -d` e troque o `DATABASE_URL` por `postgres://conecta:conecta_local_only@localhost:5432/conecta`. Essa senha serve só para uso local.
- Rode a retenção de dados (apaga identificadores com mais de 30 dias e mantém os totais) com `npm run retention:run`.

## Verificações

| Comando | O que faz |
| --- | --- |
| `npm test` | Testes de unidade e de integração (Vitest, com PGlite em memória) |
| `npm run test:e2e` | Compila e roda os testes ponta a ponta com axe (Playwright). Banco descartável e porta 3200 |
| `npm run typecheck` · `npm run lint` · `npm run format:check` | Tipos, ESLint e Prettier |
| `npm run build` | Build de produção |
| `npm run screens` | Regera as capturas de tela em `docs/telas/` |

Antes do primeiro `test:e2e` ou `screens`, instale o navegador com `npx playwright install chromium`. O mesmo conjunto roda no GitHub Actions a cada pull request (`.github/workflows/ci.yml`).

## Documentação

| Documento | Conteúdo |
| --- | --- |
| [`docs/spec/`](docs/spec/README.md) | Especificação completa: produto, jornadas e wireframes, métricas, dados, arquitetura, qualidade, riscos, testes, backlog e inteligência |
| [`GLOSSARY.md`](GLOSSARY.md) | Termos do domínio e seus nomes no código |
| [`docs/research/referencias.md`](docs/research/referencias.md) | Pesquisa: WCAG, LGPD, iCalendar, métricas e antiabuso |
| [`docs/implantacao-vercel.md`](docs/implantacao-vercel.md) | Preparação para publicar na Vercel, quando a hospedagem for decidida |
| [`CLAUDE.md`](CLAUDE.md) | Convenções: documentação e interface em pt-BR, código em inglês, SOLID |
