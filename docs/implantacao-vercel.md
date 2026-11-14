# Implantação na Vercel (preparação)

> Revisão 3 · 2026-11-14 · **Situação:** preview de avaliação autorizado pelo PO em 2026-11-14 ([#84](https://github.com/Marquin25/agenda-digital-shopping/issues/84)), **ainda não vinculado** (nenhum projeto Vercel existe). **Produção continua bloqueada:** a homologação ([#25](https://github.com/Marquin25/agenda-digital-shopping/issues/25)) depende das decisões **P-INF-1** (hospedagem), **P-INF-2** (domínio), **P-ORC-1** (orçamento) e **P-LGPD-\*** (privacidade), registradas em [`spec/07-mvp-e-riscos.md`](spec/07-mvp-e-riscos.md) §4 e [`spec/06-qualidade.md`](spec/06-qualidade.md) §3. Na comparação de hospedagem ([`spec/05-arquitetura.md`](spec/05-arquitetura.md) §3), a Vercel é a **opção D**: o plano Hobby é para uso não comercial, e os dados podem ficar fora do Brasil (P-LGPD-5, P-ORC-1).
>
> Nenhuma conta, plano pago, domínio ou contrato é criado pelo agente: os passos que exigem login são feitos pelo PO.

## Preview para avaliação no celular (B-84)

O objetivo é uma URL **protegida por login**, com **dados fictícios**, para avaliar a aplicação no celular. Não é a homologação nem a produção.

### Passos (feitos pelo PO, na conta Vercel dele)

1. **Antes de importar**, faça o merge do PR da #84: ele traz o `vercel.json` com `git.deploymentEnabled: { "main": false }`, que impede commits na `main` de gerarem deploy (ou seja, **nenhuma produção** é publicada automaticamente). Branches e PRs continuam gerando previews.
2. **Importar o repositório:** em vercel.com → *Add New* → *Project* → importar `Marquin25/agenda-digital-shopping` (instala o app oficial da Vercel no GitHub). Framework: Next.js, detectado sozinho; não mude os comandos de build. A documentação da Vercel descreve o `deploymentEnabled` para deploys disparados por commits; se o import ainda criar um deploy de produção, apague-o em *Deployments → ⋯ → Delete*. Sem `DATABASE_URL` em *Production*, esse deploy só mostraria erro. Em *Settings → Git*, mantenha *Production Branch* = `main`.
3. **Proteção:** em *Settings → Deployment Protection*, deixe **Vercel Authentication** ligada com **Standard Protection** (disponível em todos os planos; protege tudo menos domínios de produção). Para abrir o preview no celular, entre na sua conta Vercel no navegador do celular. A proteção por senha não existe no plano Hobby.
4. **Banco do preview:** *Storage → Marketplace → Neon* (Postgres), conectado **só ao ambiente Preview**. A Vercel injeta a URL como variável; confira que o nome usado é `DATABASE_URL` (se vier com outro nome, crie `DATABASE_URL` com o mesmo valor, marcada como *Sensitive*, só em Preview). Use um banco exclusivo do preview.
5. **Migração, dados fictícios e conta de avaliação: automáticos.** No preview, o build roda `npm run vercel-build`, que antes do `next build` aplica as migrações, cria os eventos de demonstração (fictícios) e, se `PREVIEW_ADMIN_EMAIL` e `PREVIEW_ADMIN_PASSWORD` existirem em Preview, a conta de avaliação (Administrador, troca de senha obrigatória no primeiro acesso). Ninguém precisa copiar a URL do banco. Fora do preview (`VERCEL_ENV` diferente de `preview`) o script não toca no banco. A integração Neon cria um branch de banco por branch do Git e o reaproveita nos deploys seguintes dessa branch: o que for testado continua lá. Esqueceu a senha temporária ou bloqueou a conta? Troque `PREVIEW_ADMIN_PASSWORD` e faça um novo deploy: enquanto a conta nunca tiver sido usada (ainda com a senha temporária), o build troca a senha temporária e desbloqueia; depois que a pessoa definiu a própria senha, o build não mexe mais nela. O log do build mostra só contagens, o resultado da conta e o e-mail mascarado (ex.: `a********@example.com`), nunca URL, e-mail completo ou senha (`scripts/vercel-preview-setup.ts`).
6. **Variáveis** (tabela abaixo) e **Redeploy** do PR que você quer avaliar (*Deployments → ⋯ → Redeploy*). Cada PR passa a ter um link de preview no próprio PR.
7. **Banners:** veja [Banners no preview](#banners-no-preview); sem armazenamento persistente, use os eventos de demonstração (que não têm banner) e não envie imagens.

### Variáveis por ambiente

| Variável | Preview (avaliação) | Production |
| --- | --- | --- |
| `DATABASE_URL` | **Obrigatória.** URL do banco Neon **do preview** (*Sensitive*) | Não cadastrar até a #25 |
| `DEVICE_ID_PEPPER` | **Obrigatória** (a Vercel roda em modo produção). 32+ caracteres aleatórios: `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"` (*Sensitive*) | Não cadastrar até a #25; depois, valor **diferente** do preview |
| `PREVIEW_ADMIN_EMAIL` | E-mail da conta de avaliação, por exemplo `avaliacao@example.com` | **Nunca** cadastrar |
| `PREVIEW_ADMIN_PASSWORD` | Senha **temporária** da conta de avaliação, com 12+ caracteres e fora da lista de senhas vazadas; tipo **Segredo** (*Sensitive*). É trocada no primeiro acesso | **Nunca** cadastrar |
| `PUBLIC_BASE_URL` | Deixe **vazia**: o preview usa a URL da própria branch (`VERCEL_BRANCH_URL`, fornecida pela Vercel). Só preencha para fixar outra URL | URL final do domínio (P-INF-2) |
| `STORAGE_DRIVER` e `S3_*` | Só se houver um bucket S3-compatível (veja abaixo) | Definido na #25 |
| `CRON_SECRET` | Não precisa (a retenção não é necessária num preview curto); vazia deixa a rota desligada | 32+ caracteres, na #25 |
| `TRUSTED_PROXY_HOPS` | Vazia (vale 1) | Vazia (vale 1) |
| `UPLOAD_DIR`, `ALLOW_EPHEMERAL_PEPPER`, `ALLOW_INSECURE_LOCALHOST_COOKIES` | **Não cadastrar** (só para uso local) | **Não cadastrar** |

`VERCEL_ENV` e `VERCEL_BRANCH_URL` são variáveis de sistema da Vercel: não cadastre. Se a opção *Automatically expose System Environment Variables* estiver desligada em *Settings → Environment Variables*, ligue-a.

### Banners no preview

As funções da Vercel não têm disco persistente, então `STORAGE_DRIVER=local` não serve. Opções:

| Opção | O que exige | Situação |
| --- | --- | --- |
| **A. Vercel Blob** (mesma conta Vercel) | Criar um *Blob store* na conta e um **adaptador novo** no código (o Blob não é compatível com S3) | Recomendado para o preview; **depende de aprovação** para acrescentar a integração |
| **B. Bucket S3-compatível** (AWS S3, Cloudflare R2) | Conta no provedor, bucket e chave só desse bucket; `STORAGE_DRIVER=s3` + `S3_*` (o adaptador já existe, [#58](https://github.com/Marquin25/agenda-digital-shopping/issues/58)) | Depende de conta nova |
| **C. Sem banners** | Nada | Os eventos de demonstração aparecem com a capa ilustrada da categoria; enviar banner no preview **não** funciona de forma confiável |

### Verificação no celular

Registre na #84: URL, commit, aparelho e navegador, e o resultado de cada passo do [roteiro de verificação rápida](#roteiro-de-verificação-rápida-smoke-test) (pule o passo 5 se não houver armazenamento de banners).

## Como deve funcionar

- **Integração oficial GitHub ↔ Vercel**, sem GitHub Actions para o deploy e **sem secrets no GitHub**. A validação continua no workflow `CI` (`.github/workflows/ci.yml`).
- **Preview** para cada push em branch e em pull request.
- **Produção** só a partir da branch `main`, ou seja, depois do merge aprovado de um PR (Settings → Git → *Production Branch* = `main`).
- A Vercel detecta Next.js sozinha. O `vercel.json` só desliga os deploys automáticos da `main` (B-84); para publicar produção na #25, essa regra terá de ser revista. A pasta `.vercel/`, criada pelo `vercel link` com os IDs do projeto, está no `.gitignore`.

## O que precisa existir antes de um preview funcionar

| Item | Para quê | Situação |
| --- | --- | --- |
| **PostgreSQL gerenciado** (ex.: Neon, Supabase ou um do Vercel Marketplace) | Banco da aplicação. O PGlite grava em disco local, e na Vercel esse disco é efêmero | **Pendente** (provedor, região e custo) |
| **Armazenamento de imagens** (S3-compatível: AWS S3, Cloudflare R2 ou MinIO) | Banners. O disco local (`UPLOAD_DIR`) **não persiste** na Vercel | **Pendente** (serviço, bucket e conta ainda não foram escolhidos). O adaptador já existe: `STORAGE_DRIVER=s3` (`src/infrastructure/storage/s3-file-storage.ts`, [#58](https://github.com/Marquin25/agenda-digital-shopping/issues/58)) |
| **Domínio** | `PUBLIC_BASE_URL` final, links e QR de divulgação impressos, Open Graph | **Pendente** (P-INF-2) |
| **Agendador da retenção** | Rodar todo dia a retenção de 30 dias (veja [Agendador da retenção](#agendador-da-retenção)) | **Pendente** (depende da hospedagem) |

Sem banco, o build passa, mas as páginas respondem com erro.

## Variáveis de ambiente (cadastrar em Vercel → Settings → Environment Variables)

Nunca versionar os valores. Use valores **diferentes** para Preview e Production. A lista completa, com os campos vazios, está em [`.env.example`](../.env.example).

| Variável | Ambientes | Valor |
| --- | --- | --- |
| `DATABASE_URL` | Preview, Production | URL `postgres://…` do banco gerenciado (marcar como *Sensitive*). Use um banco separado para Preview |
| `DEVICE_ID_PEPPER` | Preview, Production | Segredo aleatório com 32 caracteres ou mais: `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`. **Obrigatório** em produção, senão a aplicação não sobe. Trocar o valor zera a deduplicação de visitantes |
| `PUBLIC_BASE_URL` | Production e Preview, cada um com a sua URL | URL pública **final** do ambiente, sem barra no fim, por exemplo `https://agenda.exemplo-do-shopping.com.br`. Sem ela, links e QR usam `http://localhost:3000`. Veja [`PUBLIC_BASE_URL`](#public_base_url) |
| `CRON_SECRET` | Production (e Preview, se a retenção rodar lá) | Segredo aleatório com 32 caracteres ou mais, gerado como o `DEVICE_ID_PEPPER` (marcar como *Sensitive*). Liga a rota `GET /api/cron/retention`. **Sem ele, a rota responde 404** e a retenção não roda por HTTP. Um valor preenchido com menos de 32 caracteres faz a aplicação recusar a subida (a mensagem cita só o nome da variável). Para desligar a rota, deixe a variável vazia ou não a cadastre |
| `TRUSTED_PROXY_HOPS` | — | Deixe vazio (vale `1`). É o número de proxies que acrescentam o IP ao `X-Forwarded-For`; a Vercel é um só. Mude apenas se houver outro proxy na frente (ex.: CDN própria) e depois de conferir o cabeçalho real |
| `UPLOAD_DIR` | — | Não serve na Vercel (disco efêmero); use o armazenamento S3 abaixo |

### Armazenamento S3 ([#58](https://github.com/Marquin25/agenda-digital-shopping/issues/58))

Os banners ficam sob o prefixo `banners/` do bucket. A retenção diária apaga ali os arquivos que nenhum evento usa há mais de 24 h, então não guarde outros arquivos nesse prefixo.

| Variável | Valor |
| --- | --- |
| `STORAGE_DRIVER` | `local` (padrão, disco em `UPLOAD_DIR`) ou `s3`. Na Vercel, use `s3` |
| `S3_ENDPOINT` | Endpoint do serviço compatível com S3 (necessário para R2 ou MinIO) |
| `S3_REGION` | Região do bucket. A escolha depende de P-LGPD-5 (dados fora do Brasil) |
| `S3_BUCKET` | Nome do bucket, um por ambiente |
| `S3_ACCESS_KEY_ID` | Chave de acesso com permissão só nesse bucket (marcar como *Sensitive*) |
| `S3_SECRET_ACCESS_KEY` | Segredo da chave de acesso (marcar como *Sensitive*) |
| `S3_FORCE_PATH_STYLE` | `true` para serviços que exigem endereçamento por caminho (ex.: MinIO); senão, deixe vazio |

Com `STORAGE_DRIVER=s3` e `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID` ou `S3_SECRET_ACCESS_KEY` faltando, a aplicação não sobe: a mensagem lista os nomes das variáveis, sem imprimir valores.

### `PUBLIC_BASE_URL`

Essa variável vira parte de tudo o que sai do sistema: o link curto `/r/{código}` e o QR Code de cada canal de divulgação, os links de compartilhamento e as prévias de link (Open Graph) no Instagram e no WhatsApp. Por isso:

- **Precisa ser a URL final do ambiente.** Um QR impresso com a URL errada (ou com `localhost`) não pode ser corrigido depois; só reimpresso.
- **Cada ambiente tem o seu valor.** A homologação usa a URL da homologação, e a produção, o domínio definitivo (P-INF-2). Assim, um QR de teste nunca leva o visitante para o ambiente errado.
- **QR definitivos só depois do domínio.** Enquanto o domínio não existir, gere QR apenas para teste.
- **Confira antes de divulgar:** abra a área de divulgação, gere um link e confirme que ele começa pela URL do ambiente; depois leia o QR com um celular.

## Banco: migração e primeira conta

A aplicação só migra o PGlite automaticamente. No PostgreSQL, rode estes comandos no seu Terminal, apontando para o banco do ambiente, sem gravar a URL em arquivo versionado:

```sh
DATABASE_URL='<url-do-banco-do-ambiente>' npm run db:migrate
DATABASE_URL='<url-do-banco-do-ambiente>' npm run admin:create -- --name "Seu nome" --email voce@example.com --role administrator
```

A senha da conta é pedida no terminal (sem aparecer na tela) e precisa ser trocada no primeiro acesso. Para o smoke test, crie também uma conta `--role editor` e outra `--role analyst`.

`npm run db:seed` cria **dados de demonstração** e é só para uso local; não rode no banco de produção.

## Agendador da retenção

A retenção agrega e apaga os identificadores de dispositivo com mais de 30 dias e as sessões expiradas, mantendo os totais do painel (prazo proposto, pendente de P-LGPD-3). Ela pode rodar mais de uma vez por dia sem problema. Há duas formas de acioná-la:

- **Por HTTP:** `GET /api/cron/retention` com o cabeçalho `Authorization: Bearer <CRON_SECRET>` ([rota](../src/app/api/cron/retention/route.ts)). Sem `CRON_SECRET` configurado, a rota responde **404**; com o cabeçalho errado, **401**.
- **Pelo terminal:** `npm run retention:run`, numa máquina com acesso ao banco do ambiente.

### Opções de agendador

| Opção | Como funciona | Observações |
| --- | --- | --- |
| **Vercel Cron** | A Vercel chama a rota no horário configurado e envia o `CRON_SECRET` como Bearer token | Exige declarar o agendamento num arquivo de configuração do projeto. Esse arquivo **não existe** e só deve ser criado dentro da #25, depois da decisão de hospedagem. Confira os limites de frequência do plano escolhido (P-ORC-1) |
| **Agendador externo** (serviço de cron HTTP do provedor escolhido) | Faz o `GET` na rota com o cabeçalho `Authorization` | O `CRON_SECRET` fica guardado no cofre do próprio serviço, nunca no repositório nem nos secrets do GitHub |
| **Cron de servidor** | `npm run retention:run` todo dia | Só serve se a hospedagem tiver um servidor com cron (opções que não sejam serverless) |

**Frequência sugerida:** uma vez por dia, de madrugada no horário de São Paulo (por exemplo, 3h; em agendadores que usam UTC, isso é 6h UTC).

### Como verificar o resultado

1. Chame a rota sem cabeçalho: a resposta deve ser **401** (ou **404**, se o `CRON_SECRET` não estiver configurado no ambiente).
2. Chame com o segredo, sem gravá-lo em arquivo nem no histórico do shell compartilhado:
   ```sh
   curl -s -H "Authorization: Bearer <valor-gerado-localmente>" https://<url-do-ambiente>/api/cron/retention
   ```
   A resposta é um JSON com os totais processados: `pageViewRows`, `engagementRows`, `expiredSessions` e `auditEntries`. Zeros são normais quando não há nada com mais de 30 dias.
3. No painel do agendador (ou nos logs de funções da Vercel), confira que a chamada diária responde **200**.
4. Depois de uma execução que processou linhas, os totais do painel de métricas devem continuar iguais.

## Roteiro de verificação rápida (smoke test)

Rode depois de cada publicação na homologação, com dados fictícios. Registre o resultado na #25 (URL, ambiente, commit implantado e o resultado de cada passo).

1. **Saúde:** `GET /api/saude` responde `{"status":"ok"}` com o PostgreSQL do ambiente. Uma resposta `503` com `{"status":"unavailable"}` indica que o banco não conecta.
2. **Evento com banner:** entre como Administrador em `/admin`, crie um evento com banner e texto alternativo e publique-o.
3. **Página pública:** abra a agenda (`/`) e a página do evento no celular; o banner aparece.
4. **Origem no painel:** em Divulgação, gere um link para um canal; acesse `/r/{código}` (pelo link ou lendo o QR) e confira que o link começa pela `PUBLIC_BASE_URL` do ambiente e que o acesso aparece com a origem certa no painel.
5. **Persistência:** publique uma nova versão (novo deploy) e confirme que evento, banner e métricas continuam lá.
6. **Papéis:** com o Editor, confirme que ele gerencia eventos, mas não usuários nem o catálogo; com o Analista, confirme que ele só vê o painel e não consegue editar eventos.

A CI roda os testes de integração com PGlite. Por isso este roteiro, contra o PostgreSQL real do ambiente, é necessário para validar a implantação.

## Checklist de aceite da homologação

- [ ] A CI da `main` termina com sucesso no commit publicado.
- [ ] `/api/saude` responde `ok` com o banco real do ambiente.
- [ ] A equipe entra na área administrativa e um papel sem permissão não consegue editar eventos.
- [ ] A equipe cria, publica e consulta um evento com banner e texto alternativo.
- [ ] A troca de banner mantém a imagem correta mesmo quando a limpeza da imagem antiga falha ([#57](https://github.com/Marquin25/agenda-digital-shopping/issues/57)).
- [ ] A agenda mostra o evento; busca, filtros, detalhes, compartilhamento e calendário funcionam no celular.
- [ ] Um link e QR de divulgação usam a URL pública correta e registram sua origem no painel.
- [ ] Evento, banner e indicadores persistem depois de novo deploy.
- [ ] A retenção é executada pelo agendador e tem resultado verificável.
- [ ] Os controles de requisição e a leitura do IP foram validados no provedor escolhido ([#23](https://github.com/Marquin25/agenda-digital-shopping/issues/23)).
- [ ] Safari iOS, Chrome Android e navegador interno do Instagram tiveram os fluxos críticos registrados; o portal Wi-Fi foi testado quando disponível ([#7](https://github.com/Marquin25/agenda-digital-shopping/issues/7)).
- [ ] A página de privacidade usa o texto aprovado para o ambiente e não afirma conformidade que ainda não foi validada (P-LGPD-4).

## Riscos e decisões que não devem ficar implícitos

| Risco ou pendência | Efeito | Tratamento proposto |
| --- | --- | --- |
| Publicar com PGlite ou banners em disco efêmero na Vercel | Perda ou inconsistência de dados após deploy ou troca de instância | Usar PostgreSQL e armazenamento persistente ([#58](https://github.com/Marquin25/agenda-digital-shopping/issues/58)) antes do smoke test |
| Falha na limpeza de banners depois de atualizar o evento | O banco pode apontar para uma imagem já removida | Corrigir o fluxo de troca e testar falhas de armazenamento antes de usar um serviço remoto ([#57](https://github.com/Marquin25/agenda-digital-shopping/issues/57)) |
| `PUBLIC_BASE_URL` incorreto | QR, links de divulgação e prévias apontam para `localhost` ou para o ambiente errado | Conferir a URL final e testar um QR real |
| Limitador por instância e IP assumindo um proxy específico | Proteção desigual quando houver mais de uma instância | Validar cabeçalhos no provedor e adotar armazenamento compartilhado se necessário ([#23](https://github.com/Marquin25/agenda-digital-shopping/issues/23)) |
| Só Chromium automatizado | Problemas em Safari ou navegadores internos passam despercebidos | Adicionar WebKit ao E2E ([#59](https://github.com/Marquin25/agenda-digital-shopping/issues/59)) e cumprir a [#7](https://github.com/Marquin25/agenda-digital-shopping/issues/7) |
| Fase 1 descrita como pronta sem URL pública | Expectativa de entrega maior do que a evidência disponível | Manter no README a distinção entre local, homologação e uso público ([#61](https://github.com/Marquin25/agenda-digital-shopping/issues/61)) |
| Iniciar avaliações ou recomendações antes de ter dados e operação | Aumenta o escopo sem validar o fluxo principal | Publicar e validar a homologação primeiro; depois escolher uma fatia vertical do [backlog](spec/09-backlog.md) |

## Passos que dependem do responsável

1. Decidir se a Vercel será usada (P-INF-1), em qual plano (P-ORC-1), qual domínio (P-INF-2) e como ficam as pendências de privacidade (P-LGPD-\*).
2. Fazer login e vincular o projeto. O vínculo pelo CLI **não** publica nada:
   ```sh
   npx vercel login
   npx vercel link          # dentro da pasta do repositório; crie um projeto novo
   ```
3. No painel da Vercel, em Settings → Git, conectar o repositório `Marquin25/agenda-digital-shopping` e conferir que *Production Branch* é `main`.
4. Manter ligada a *Deployment Protection* (Vercel Authentication) dos previews. O texto de privacidade ainda está pendente de validação.
5. Cadastrar as variáveis acima quando o banco e o armazenamento existirem.
6. Configurar o agendador da retenção e verificar a primeira execução.
7. O próximo push na branch do PR gera o preview. A produção só sai depois do merge na `main`.
8. Rodar o smoke test e registrar o resultado na #25.

## Limitações conhecidas neste ambiente

- **Limitador de requisições em memória:** cada instância serverless tem o próprio contador, então os limites ficam mais frouxos. Antes de uso real com várias instâncias, trocar por um armazenamento compartilhado, o que depende das decisões P-LGPD ([#25](https://github.com/Marquin25/agenda-digital-shopping/issues/25); veja o checklist de segurança).
- **IP do cliente:** o código lê o valor de `X-Forwarded-For` que fica `TRUSTED_PROXY_HOPS` posições antes do fim (padrão: o último). Validar o comportamento na Vercel antes de confiar no limite por IP.
- **Checklist de segurança:** a autoavaliação ASVS nível 1 e as pendências ficam em [`docs/seguranca/asvs-nivel-1.md`](seguranca/asvs-nivel-1.md).
- **Região:** escolher a região das funções e do banco perto de São Paulo (ex.: `gru1`) depende da decisão de residência dos dados (P-LGPD-5).
