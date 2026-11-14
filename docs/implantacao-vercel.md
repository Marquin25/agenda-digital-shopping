# Implantação na Vercel (preparação)

> Revisão 1 · 2026-11-13 · **Situação:** preparado, **não vinculado**. Nenhum projeto Vercel foi criado e nada foi publicado. A escolha da hospedagem ainda está pendente (P-INF-1, `docs/spec/05-arquitetura.md` §3). Na comparação, a Vercel é a **opção D**: o plano Hobby é para uso não comercial, e os dados podem ficar fora do Brasil (P-LGPD-5, P-ORC-1).

## Como deve funcionar

- **Integração oficial GitHub ↔ Vercel**, sem GitHub Actions para o deploy e **sem secrets no GitHub**. A validação continua no workflow `CI` (`.github/workflows/ci.yml`).
- **Preview** para cada push em branch e em pull request.
- **Produção** só a partir da branch `main`, ou seja, depois do merge aprovado de um PR (Settings → Git → *Production Branch* = `main`).
- A Vercel detecta Next.js sozinha, então não há `vercel.json`. A pasta `.vercel/`, criada pelo `vercel link` com os IDs do projeto, está no `.gitignore`.

## O que precisa existir antes de um preview funcionar

| Item | Para quê | Situação |
| --- | --- | --- |
| **PostgreSQL gerenciado** (ex.: Neon, Supabase ou um do Vercel Marketplace) | Banco da aplicação. O PGlite grava em disco local, e na Vercel esse disco é efêmero | **Pendente** (provedor, região e custo) |
| **Armazenamento de imagens** (S3-compatível: AWS S3, Cloudflare R2 ou MinIO) | Banners. O disco local (`UPLOAD_DIR`) **não persiste** na Vercel | **Pendente** (fornecedor, bucket e credenciais). O adaptador já existe: `STORAGE_DRIVER=s3` (`src/infrastructure/storage/s3-file-storage.ts`, B-58) |
| **Domínio** | `PUBLIC_BASE_URL` final, links e QR de divulgação impressos, Open Graph | **Pendente** (P-INF-2) |

Sem banco, o build passa, mas as páginas respondem com erro.

## Variáveis de ambiente (cadastrar em Vercel → Settings → Environment Variables)

Nunca versionar os valores. Use valores **diferentes** para Preview e Production.

| Variável | Ambientes | Valor |
| --- | --- | --- |
| `DATABASE_URL` | Preview, Production | URL `postgres://…` do banco gerenciado (marcar como *Sensitive*). Use um banco separado para Preview |
| `DEVICE_ID_PEPPER` | Preview, Production | Segredo aleatório com 32 caracteres ou mais: `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`. **Obrigatório** em produção, senão a aplicação não sobe. Trocar o valor zera a deduplicação de visitantes |
| `PUBLIC_BASE_URL` | Production (e Preview, se quiser) | URL pública sem barra no fim, por exemplo `https://agenda.exemplo-do-shopping.com.br`. Sem ela, links e QR usam `http://localhost:3000` |
| `STORAGE_DRIVER` | Preview, Production | `s3` (o disco local não persiste na Vercel) |
| `S3_REGION`, `S3_BUCKET` | Preview, Production | Região e bucket do armazenamento. Use um bucket separado para Preview |
| `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` | Preview, Production | Chave com acesso só a esse bucket (marcar como *Sensitive*). Sem elas, a aplicação não sobe |
| `S3_ENDPOINT`, `S3_FORCE_PATH_STYLE` | Se necessário | Endpoint do R2/MinIO; `true` para endereçamento por caminho (MinIO) |
| `UPLOAD_DIR` | — | Não serve na Vercel; use `STORAGE_DRIVER=s3` |

## Banco: migração e primeira conta

A aplicação só migra o PGlite automaticamente. No PostgreSQL, rode estes comandos no seu Terminal, apontando para o banco do ambiente, sem gravar a URL em arquivo versionado:

```sh
DATABASE_URL='postgres://…' npm run db:migrate
DATABASE_URL='postgres://…' npm run admin:create -- --name "Seu nome" --email voce@example.com --role administrator
```

## Passos que dependem do responsável

1. Decidir se a Vercel será usada (P-INF-1) e em qual plano (P-ORC-1).
2. Fazer login e vincular o projeto. O vínculo pelo CLI **não** publica nada:
   ```sh
   npx vercel login
   npx vercel link          # dentro da pasta do repositório; crie um projeto novo
   ```
3. No painel da Vercel, em Settings → Git, conectar o repositório `Marquin25/agenda-digital-shopping` e conferir que *Production Branch* é `main`.
4. Manter ligada a *Deployment Protection* (Vercel Authentication) dos previews. O texto de privacidade ainda está pendente de validação.
5. Cadastrar as variáveis acima quando o banco existir.
6. O próximo push na branch do PR gera o preview. A produção só sai depois do merge na `main`.

## Limitações conhecidas neste ambiente

- **Limitador de requisições em memória:** cada instância serverless tem o próprio contador, então os limites ficam mais frouxos. Antes de uso real, trocar por um armazenamento compartilhado.
- **IP do cliente:** o código lê o último valor de `X-Forwarded-For`. Validar o comportamento na Vercel antes de confiar no limite por IP.
- **Região:** escolher a região das funções e do banco perto de São Paulo (ex.: `gru1`) depende da decisão de residência dos dados (P-LGPD-5).
