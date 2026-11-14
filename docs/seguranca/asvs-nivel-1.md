# Checklist de segurança: OWASP ASVS nível 1

> Revisão 1 · 2026-11-13 · Issue [#23](https://github.com/Marquin25/agenda-digital-shopping/issues/23) (B-23).
>
> Este documento é uma **autoavaliação da equipe** contra os capítulos do OWASP ASVS 4.0.3, nível 1. **Não é uma auditoria nem uma certificação.** Cada linha aponta onde a evidência está no código ou nos testes. Os itens "Pendente" e "Parcial" precisam de uma decisão ou da hospedagem definida.

**Legenda:** ✅ Atende · 🟡 Parcial · ⏳ Pendente (depende de decisão ou hospedagem) · — Não se aplica.

## V1 Arquitetura

| Item | Status | Evidência |
| --- | --- | --- |
| Camadas separadas: regras no domínio, casos de uso na aplicação, banco e web na infraestrutura | ✅ | `docs/spec/05-arquitetura.md`, `src/domain`, `src/application`, `src/infrastructure` |
| Dados pessoais mapeados, com finalidade e retenção | ✅ | `docs/spec/06-qualidade.md` §4 (tabela de dados) |
| Base legal dos dados pessoais (IP, `id_hash`, cookie funcional) | ⏳ | Decisões P-LGPD-1 a P-LGPD-3 em aberto. Não afirmamos conformidade com a LGPD. |

## V2 Autenticação

| Item | Status | Evidência |
| --- | --- | --- |
| Senhas guardadas com Argon2id, parâmetros OWASP | ✅ | `src/infrastructure/auth/password.ts` |
| Mínimo de 12 caracteres, máximo de 256, sem regras de composição | ✅ | `validateNewPassword` |
| Recusa de senhas vazadas ou comuns | 🟡 | Hoje há só uma lista curta de senhas comuns. Falta uma lista de senhas vazadas (ex.: as 10 mil mais comuns), embarcada, sem chamada externa. |
| Mensagem genérica no login e tempo constante para e-mail inexistente | ✅ | `login` em `src/application/auth/admin-auth.ts` (hash fictício) |
| Bloqueio por conta (5 falhas → 15 min) e limite por IP (20 tentativas / 15 min) | ✅ | `MAX_FAILED_LOGINS`, `src/app/admin/entrar/actions.ts` |
| Troca de senha obrigatória no primeiro acesso e exige a senha atual | ✅ | `mustChangePassword`, `changeOwnPassword`; E2E "first sign-in forces a password change" |
| Recuperação de senha por e-mail | — | Não existe: o Administrador redefine a senha temporária. |

## V3 Sessões

| Item | Status | Evidência |
| --- | --- | --- |
| Token aleatório de 256 bits; o banco guarda só o SHA-256 | ✅ | `admin_sessions.id`, `login` |
| Cookie `HttpOnly`, `Secure` em produção e `SameSite=Lax` | ✅ | `setAdminSessionCookie`; `shouldUseSecureCookies` |
| Expiração por inatividade (8 h) e absoluta (7 dias) | ✅ | `SESSION_IDLE_MS`, `SESSION_ABSOLUTE_MS` |
| Sair, trocar a senha, desativar ou redefinir a conta encerra as sessões | ✅ | `logout`, `changeOwnPassword`, `updateAdminUser`, `resetAdminPassword` |

## V4 Controle de acesso

| Item | Status | Evidência |
| --- | --- | --- |
| Permissão checada no servidor em cada página e ação do admin | ✅ | `requireAdmin(permission)` em `src/app/admin/(panel)/**`; matriz em `src/domain/auth/permissions.ts` (testada) |
| Analista só lê | ✅ | `tests/unit/permissions.test.ts`; E2E "analyst can read the dashboard but cannot manage events" |
| Proteção contra CSRF | ✅ | Server Actions do Next.js comparam `Origin` e `Host`; cookie `SameSite=Lax`; rotas de API públicas só gravam métricas anônimas |
| Rascunhos não aparecem ao público | ✅ | `isPublicEventId`, testes de agenda |

## V5 Validação, sanitização e codificação

| Item | Status | Evidência |
| --- | --- | --- |
| Toda entrada validada no servidor com esquemas (zod) | ✅ | `*InputSchema` em `src/application/**` |
| Saída codificada pelo React; o único `dangerouslySetInnerHTML` é o JSON-LD do evento, com `<` escapado | ✅ | `src/app/(public)/eventos/[slug]/page.tsx` |
| Consultas ao banco parametrizadas (Drizzle) | ✅ | `src/infrastructure/db` |
| Redirecionamentos só para destinos internos | ✅ | `/r/[code]` resolve o destino a partir do cadastro, nunca da URL |

## V7 Erros e registros

| Item | Status | Evidência |
| --- | --- | --- |
| Erros de produção sem pilha nem detalhes internos | ✅ | Comportamento padrão do Next.js em produção (mensagem genérica com um código de referência) |
| Trilha de auditoria das ações da equipe | ✅ | `audit_log`, `recordAudit` |
| Registros sem senhas, tokens nem IP | ✅ | Configuração cita o nome da variável, nunca o valor (`tests/unit/config.test.ts`); arquivos de banner registrados só pelo nome |
| Retenção dos registros da hospedagem (proposta: 7 dias) | ⏳ | Depende da hospedagem (#25) |

## V8 Proteção de dados

| Item | Status | Evidência |
| --- | --- | --- |
| Identificador do aparelho pseudonimizado com HMAC e segredo do servidor | ✅ | `src/infrastructure/security/device-id.ts` |
| IP só em memória, para limite de requisições | ✅ | `src/infrastructure/web/request.ts`, `RateLimiter` |
| Retenção e agregação automáticas | ✅ | `applyRetention`, `/api/cron/retention` |
| Visitante apaga os dados do próprio aparelho | ✅ | E2E "visitor can delete this device's data" |
| Respostas do admin sem cache compartilhado | ✅ | páginas dinâmicas autenticadas |

## V9 Comunicação

| Item | Status | Evidência |
| --- | --- | --- |
| HTTPS obrigatório com HSTS em produção | ✅ | `src/infrastructure/web/security-headers.ts`; E2E "pages are served with the security headers" |
| TLS configurado na hospedagem | ⏳ | Depende da hospedagem (#25) |

## V10 Código malicioso e dependências

| Item | Status | Evidência |
| --- | --- | --- |
| `npm audit --omit=dev --audit-level=high` na CI | ✅ | `.github/workflows/ci.yml` |
| Varredura de segredos (gitleaks) na CI | ✅ | `.github/workflows/ci.yml` |
| Versões travadas (`package-lock.json`) | ✅ | repositório |

## V11 Regras de negócio

| Item | Status | Evidência |
| --- | --- | --- |
| Limites por IP e por aparelho nas métricas anônimas | ✅ | `openVisitorMetric` (600/min por IP, 60/min por aparelho, 120 aparelhos novos/min por IP) |
| Limite por IP na contagem dos links promocionais | ✅ | `/r/[code]`: acima de 120/min por IP, redireciona mas não conta |
| Robôs e equipe não contam nas métricas | ✅ | `isLikelyBot`, `isStaffRequest`; E2E "staff browsing is not counted" |
| Limites valem para várias instâncias | ⏳ | O limitador é em memória, por instância. Um limitador compartilhado guardaria o IP (ou um hash dele) fora da memória, o que muda a tabela de dados pessoais e depende das decisões P-LGPD e da hospedagem (#25). Enquanto houver uma instância só, o limite vale por inteiro. |

## V12 Arquivos

| Item | Status | Evidência |
| --- | --- | --- |
| Upload limitado a 5 MB e a imagens; reprocessado em WebP | ✅ | `src/infrastructure/storage/banner-image.ts` |
| Nome do arquivo gerado pelo servidor; entrega só por rota que valida o nome | ✅ | `src/app/media/[file]/route.ts` |
| Arquivos órfãos removidos | ✅ | retenção (B-57) |

## V13 API

| Item | Status | Evidência |
| --- | --- | --- |
| Rota agendada protegida por segredo de 32+ caracteres; desligada sem ele | ✅ | `/api/cron/retention`; E2E "retention job runs only with the cron secret" |
| Rotas de métricas aceitam só o formato esperado e respondem igual quando ignoram | ✅ | `src/app/api/metrics/**` |

## V14 Configuração

| Item | Status | Evidência |
| --- | --- | --- |
| CSP com *nonce* e `strict-dynamic`, `frame-ancestors 'none'`, `object-src 'none'` | ✅ | `src/proxy.ts`, `content-security-policy.ts` |
| `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options`, `Cross-Origin-Opener-Policy`; sem `X-Powered-By` | ✅ | `security-headers.ts`; teste unitário e E2E |
| Segredos só em variáveis de ambiente; aplicação recusa iniciar com configuração inválida | ✅ | `src/infrastructure/config.ts`, `src/instrumentation.ts` |
| IP lido conforme o número de proxies confiáveis (`TRUSTED_PROXY_HOPS`) | 🟡 | Configurável e testado (`tests/unit/client-ip.test.ts`); falta conferir o cabeçalho real na hospedagem escolhida (#25) |

## Pendências em aberto

1. **Lista de senhas vazadas** (V2): embarcar uma lista maior. É trabalho pequeno e não depende de decisão.
2. **Limitador compartilhado** (V11): só quando houver mais de uma instância; depende de P-LGPD e da hospedagem.
3. **Hospedagem** (V7, V9, V14): TLS, retenção de registros e conferência do `X-Forwarded-For` (#25).
