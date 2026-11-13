# 05 — Arquitetura e implantação

> Papel: **Especialista web** · Decisões **propostas**; viram ADRs em `docs/adr/` depois da aprovação.

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
 │  └─ Tarefas agendadas (retenção, snapshots)          │
 └──────────────┬────────────────────────┬──────────────┘
                ▼                        ▼
         PostgreSQL 16+          Armazenamento de imagens
                                  (volume local ou S3-compatível)
```

## 2. Decisões propostas

| # | Decisão | Por quê | Alternativas consideradas |
| --- | --- | --- | --- |
| D1 | **Aplicação única Next.js (App Router) + TypeScript** | SSR para a agenda pública (rápida no 4G, prévia de link e SEO) e área administrativa no mesmo código; uma só linguagem; grande ecossistema; roda em contêiner | **Astro + API separada** (JS público menor, mas dois projetos) · **SvelteKit** (mais leve, comunidade menor) · **Laravel/Django** (maduros, mas outra linguagem para a interface interativa) |
| D2 | **PostgreSQL + Drizzle ORM + migrações versionadas** | Restrições `UNIQUE` garantem a deduplicação; consultas agregadas para o dashboard; portável entre provedores | SQLite (simples, mas complica concorrência e hospedagem gerenciada) · Prisma (mais pesado no runtime) |
| D3 | **Status temporal derivado** das datas | Evita status desatualizado por esquecimento | Status manual (pedido original): risco de erro humano |
| D4 | **Identificador de dispositivo próprio** (cookie `HttpOnly` + HMAC no banco) | Dedup sem cadastro e sem terceiros; minimização | Fingerprinting (contraria a minimização) · login de visitante (atrito, dados pessoais) · `localStorage` (sumiria nos navegadores internos) |
| D5 | **Autenticação administrativa própria**: e-mail + senha (Argon2id), sessões no banco, sem cadastro aberto, TOTP opcional (obrigatório para Administrador numa fase seguinte) | Sem depender de Google ou Microsoft ainda não confirmados; poucos usuários; controle total | **Better Auth / Auth.js** como biblioteca (avaliar na implementação para não reinventar a criptografia) · **Login por link mágico** (exige provedor de e-mail) · **OIDC / Google Workspace / Microsoft Entra** (pendente de confirmação) · **Passkeys** (bom futuro) |
| D6 | **Sem analytics de terceiros**; métricas no próprio banco | LGPD e controle das definições | Plausible/Umami auto-hospedado (opção futura só para tráfego agregado) |
| D7 | **Gráficos com tabela equivalente** (biblioteca leve, ex.: Recharts ou ECharts, a escolher na issue) | Acessibilidade | Só imagem (inacessível) |
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

**Decisões pendentes de registrar:** orçamento mensal, responsável pela manutenção e pelos backups, região dos dados, domínio, SLA esperado e quem responde por incidentes.

## 4. Ambientes e configuração

- `desenvolvimento` (Docker Compose local) · `homologação` (pendente) · `produção` (pendente).
- Configuração **somente por variáveis de ambiente**; `.env.example` versionado **sem valores reais**; `.env*` está no `.gitignore` (verificado em 2026-11-13).
- Segredos necessários: `DATABASE_URL`, `ID_PEPPER`, `SESSION_SECRET`, (opcional) `TURNSTILE_SECRET`, credenciais de armazenamento.

## 5. Estrutura de código proposta

```
src/
  app/                  rotas Next.js (público e /admin)
  dominio/              regras puras: status do evento, métricas, token de check-in, ics
  dados/                esquema Drizzle, repositórios, migrações
  servicos/             casos de uso (registrar interesse, avaliar, publicar evento…)
  infra/                limite de requisições, armazenamento, autenticação, logs
  ui/                   componentes acessíveis compartilhados
tests/
  unit/  integracao/  e2e/  a11y/
```

As regras de negócio ficam em `dominio/`, sem framework, o que facilita o TDD.
