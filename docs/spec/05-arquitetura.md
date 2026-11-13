# 05 — Arquitetura e implantação

> Papel: **Especialista web** · Revisão 2 · 2026-11-13 · Todas as decisões abaixo são **[R] recomendações** compatíveis com a arquitetura sugerida no PDF (frontend React/Next.js, backend Node.js ou Python/FastAPI, PostgreSQL, Recharts, motor de regras com IA só no futuro). Viram ADRs em `docs/adr/` depois da aprovação.

## 1. Visão geral

```
 Visitante (celular)                 Equipe (desktop)
        │  HTTPS                           │  HTTPS + sessão
        ▼                                  ▼
 ┌──────────────────────────────────────────────────────┐
 │  Aplicação Next.js (TypeScript) — 1 contêiner        │
 │  ├─ Páginas públicas (SSR + cache curto/revalidação) │
 │  ├─ Rotas de escrita públicas (limite + validação)   │
 │  ├─ Área /admin (sessão + papéis)                    │
 │  ├─ Módulo de recomendação (domínio puro, Fase 2)    │
 │  ├─ Adaptadores de integração (Fase 3, isolados)     │
 │  └─ Tarefas agendadas (retenção, snapshots,          │
 │     relatórios pós-evento)                            │
 └──────────────┬────────────────────────┬──────────────┘
                ▼                        ▼
         PostgreSQL 16+          Armazenamento de imagens
                                  (volume local ou S3-compatível)
```

O PDF descreve "frontend + backend com API". Aqui, frontend e API ficam **no mesmo projeto Next.js** (rotas de API e ações de servidor), separados em camadas internas. Se um dia surgir outro consumidor, como um app ou o sistema de painéis, a API pode ser extraída sem reescrever o domínio.

## 2. Decisões propostas

| # | Decisão | Por quê | Alternativas consideradas |
| --- | --- | --- | --- |
| D1 | **Aplicação única Next.js (App Router) + TypeScript** | SSR para a agenda pública (rápida no 4G, prévia de link e SEO) e área administrativa no mesmo código; uma só linguagem; grande ecossistema; roda em contêiner | **Next.js + API Python/FastAPI** (opção do PDF: útil se a equipe preferir Python para análise de dados, mas são dois projetos e duas linguagens) · **Astro + API separada** · **SvelteKit** · **Laravel/Django** |
| D2 | **PostgreSQL + Drizzle ORM + migrações versionadas** | Restrições `UNIQUE` garantem a deduplicação; consultas agregadas para o dashboard; portável entre provedores | SQLite (simples, mas complica concorrência e hospedagem gerenciada) · Prisma (mais pesado no runtime) |
| D3 | **Status temporal derivado** das datas | Evita status desatualizado por esquecimento | Status manual (pedido original): risco de erro humano |
| D4 | **Identificador de dispositivo próprio** (cookie `HttpOnly` + HMAC no banco) | Dedup sem cadastro e sem terceiros; minimização | Fingerprinting (contraria a minimização) · login de visitante (atrito, dados pessoais) · `localStorage` (sumiria nos navegadores internos) |
| D5 | **Autenticação administrativa própria**: e-mail + senha (Argon2id), sessões no banco, sem cadastro aberto, TOTP opcional (obrigatório para Administrador numa fase seguinte) | Sem depender de Google ou Microsoft ainda não confirmados; poucos usuários; controle total | **Better Auth / Auth.js** como biblioteca (avaliar na implementação para não reinventar a criptografia) · **Login por link mágico** (exige provedor de e-mail) · **OIDC / Google Workspace / Microsoft Entra** (pendente de confirmação) · **Passkeys** (bom futuro) |
| D6 | **Sem analytics de terceiros**; métricas no próprio banco | LGPD e controle das definições | Plausible/Umami auto-hospedado (opção futura só para tráfego agregado) |
| D7 | **Gráficos com tabela equivalente**, com Recharts (sugerido no PDF) ou equivalente | Acessibilidade | Só imagem (inacessível) |
| D10 | **Motor de recomendação como módulo de domínio puro** (`src/dominio/recomendacao/`): entradas → filtros → pontuação → justificativa, com regras e pesos versionados em `configuracao` | Transparente, testável por TDD, reproduzível (grava a versão das regras) e substituível por modelos analíticos na Fase 3 sem mudar a interface | Biblioteca de motor de regras genérica (mais complexidade do que o necessário) · IA/LLM desde a Fase 2 (opaco e caro; o PDF recomenda começar com regras) |
| D11 | **Integrações atrás de adaptadores** (`src/infra/integracoes/*`) com estado "indisponível" | A falha de uma integração não derruba a agenda nem o painel; os indicadores aparecem como indisponíveis [C][PDF] | Chamadas diretas espalhadas pelo código |
| D12 | **Links de divulgação próprios** (`/r/{codigo}`) + QR gerado no servidor (biblioteca de QR, sem serviço externo) | Origem medida mesmo quando o canal remove o referrer; QR sem dependência externa | Encurtadores externos (dados de acesso com terceiros) |
| D13 | **Relatórios gerados por tarefa agendada** e guardados como agregados | Painel rápido; histórico estável para comparação e recomendação | Calcular tudo sob demanda |
| D8 | **Implantação em contêiner (Docker)** independente de fornecedor | Funciona na infraestrutura do shopping, num VPS ou em PaaS | Plataforma serverless específica (acoplamento) |
| D9 | **Uma instalação, um shopping**, com `shopping` como configuração (não multi-tenant) | Simplicidade; abrir para vários shoppings depois (instâncias separadas ou coluna `tenant_id`) | Multi-tenant desde já (complexidade sem demanda) |

## 3. Comparação de hospedagem (decisão pendente: P-INF-1)

> ⚠️ **Valores aproximados e indicativos.** Preços e limites de planos mudam; confirmar na página oficial de cada fornecedor na data da decisão. **Nenhuma conta será criada e nada será publicado sem autorização.**

| Opção | Custo indicativo | Prós | Contras e limites | Manutenção |
| --- | --- | --- | --- | --- |
| **A. Infraestrutura do shopping** (servidor ou VM existente + Docker Compose: app + Postgres + proxy com TLS) | Marginal, se já houver servidor | Dados dentro de casa; sem novo contrato | Depende da TI do shopping (backup, atualizações, disponibilidade, acesso externo, TLS) | TI do shopping |
| **B. VPS simples** (ex.: Hetzner, DigitalOcean, Magalu Cloud, Locaweb) + Docker Compose | Dezenas de reais por mês | Barato, previsível, portável; opção com data center no Brasil | Responsável cuida de sistema operacional, backup e segurança | Equipe técnica do projeto |
| **C. PaaS de contêiner + Postgres gerenciado** (ex.: Render, Railway, Fly.io + Neon/Supabase) | De gratuito (limitado) a ~US$ 20–50/mês | Pouca operação; backups gerenciados | Planos gratuitos dormem, pausam ou têm cota; dados possivelmente fora do Brasil (transferência internacional, art. 33 da LGPD: validar) | Baixa |
| **D. Vercel + Postgres gerenciado** | Plano Hobby é **para uso não comercial** (verificar os termos) → plano pago por usuário | Melhor integração com Next.js | Acoplamento; custo por assento; dados fora do Brasil | Baixa |

**Recomendação provisória:** manter a aplicação **portável (D8)** e decidir entre **A** (se a TI do shopping assumir) e **B** (VPS no Brasil). Usar **C** para uma prévia de homologação, se autorizado.

**Decisões pendentes de registrar [P]:** orçamento mensal (P-ORC-1), responsável pela manutenção e pelos backups (P-EQ-1), região dos dados (P-LGPD-5), domínio (P-INF-2), SLA esperado e quem responde por incidentes.

**Autenticação administrativa [P] (P-AUTH-1):** começar com e-mail + senha próprios (não depende de nenhum provedor), atrás de uma interface que permita trocar depois. Alternativas a investigar quando o shopping definir a infraestrutura:

| Alternativa | Requisito | Observação |
| --- | --- | --- |
| E-mail + senha + TOTP (proposta inicial) | Nenhum | Recuperação de senha pelo Administrador (sem e-mail no início) |
| Link mágico por e-mail | Provedor SMTP/transacional | Sem senha para lembrar; depende de e-mail confiável |
| Passkeys (WebAuthn) | Navegadores modernos | Forte contra phishing; pode complementar a senha |
| OIDC com Google Workspace ou Microsoft Entra | Shopping usar esses serviços | **Não presumido**; confirmar antes |
| OIDC com provedor próprio (ex.: Keycloak) | Servidor extra | Só se houver outros sistemas para integrar |

## 4. Ambientes e configuração

- `desenvolvimento` (Docker Compose local) · `homologação` (pendente) · `produção` (pendente).
- Configuração **somente por variáveis de ambiente**; `.env.example` versionado **sem valores reais**; `.env*` está no `.gitignore` (verificado em 2026-11-13).
- Segredos necessários: `DATABASE_URL`, `ID_PEPPER`, `SESSION_SECRET`, (opcional) `TURNSTILE_SECRET`, credenciais de armazenamento.

## 5. Estrutura de código proposta

```
src/
  app/                  Next.js routes (public and /admin); URLs visible to the visitor stay in pt-BR
  domain/               pure rules: event status, metrics, check-in token, ics,
                        recommendation/ (filters, scoring, explanation)
  application/          use cases (RegisterInterest, SubmitRating, PublishEvent…)
  infrastructure/       persistence (Drizzle schema, repositories, migrations), rate limiting,
                        storage, auth, logging, integrations/ (adapters)
  ui/                   shared accessible components
tests/
  unit/  integration/  e2e/  a11y/
```

As regras de negócio ficam em `domain/`, sem framework, o que facilita o TDD.

## 6. Convenções de código [C]

- **Idioma:** todo o código em **inglês**: identificadores, tipos, tabelas e colunas, nomes de arquivos, testes, mensagens de log e rotas internas de API. Em **pt-BR** ficam: textos da interface (centralizados em arquivos de mensagens, prontos para i18n), URLs públicas visíveis (`/eventos/[slug]`, `/privacidade`), documentação e issues. Os nomes de tabelas e campos em português de `04-dados-e-integracoes.md` são **conceituais**; a correspondência para o inglês está no `GLOSSARY.md` (ex.: `evento` → `event`, `interesse` → `interest`, `avaliacao` → `rating`, `espaco` → `venue`, `estabelecimento` → `store`, `planejamento` → `plan`, `modelo_experiencia` → `experience_template`, `link_divulgacao` → `promo_link`).
- **SOLID** (skill `solid-design-principles`):
  - **S**: cada módulo e caso de uso tem uma responsabilidade (ex.: `RatingWindowPolicy` separado de `SubmitRating`);
  - **O**: novos canais, integrações e regras de recomendação entram como novas implementações, sem alterar o motor (`ScoringRule[]`);
  - **L**: adaptadores intercambiáveis (`FileStorage` local/S3, `AuthProvider` própria/OIDC) respeitam o mesmo contrato e os mesmos testes;
  - **I**: interfaces pequenas e específicas (`EventReader`, `EventWriter`, `MetricsRecorder`);
  - **D**: `domain/` e `application/` dependem de abstrações (portas); `infrastructure/` as implementa (arquitetura hexagonal leve).
- **Padrões de projeto só com necessidade concreta** (evitar abstração prematura): *Repository* (persistência), *Adapter* (integrações, armazenamento, autenticação), *Strategy* (regras de pontuação, modos de vagas), *Factory* (adaptador conforme a configuração), *Null Object* ou resultado "unavailable" para integração desligada, *Specification* para filtros eliminatórios do motor.
- **Boas práticas:** TypeScript `strict`; funções puras no domínio; validação nas bordas (Zod); erros tipados (sem `any`); nomes explícitos; sem lógica de negócio em componentes React; testes primeiro no domínio (skill `tdd`); revisão com `code-review` antes de concluir; ESLint + Prettier sem exceções silenciosas.
