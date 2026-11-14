# Imagem Docker, backup e restauração (B-24)

> Revisão 2 · 2026-11-14 · Issue [#24](https://github.com/Marquin25/agenda-digital-shopping/issues/24). **Uso local.** Nada aqui publica a aplicação: o app responde só em `127.0.0.1` e o banco não é publicado.

## O que existe

| Arquivo | Para quê |
| --- | --- |
| `Dockerfile` | Imagem em estágios: `deps` (dependências), `build` (Next.js com saída *standalone*), `tools` (migrações, contas da equipe e retenção com `tsx`) e `runner` (servidor enxuto, usuário não root, `HEALTHCHECK` em `/api/saude`) |
| `.dockerignore` | Impede que `.env*`, `.git`, `storage/`, `backups/` e builds locais entrem na imagem |
| `docker-compose.prod.yml` | PostgreSQL 17 (sem porta publicada), `migrate` (roda uma vez) e `app` em `127.0.0.1:${APP_PORT:-3100}` |
| `.env.docker.example` | Modelo do `.env.docker` (ignorado pelo git) com a senha do banco e o `DEVICE_ID_PEPPER` |
| `scripts/docker/backup.sh` e `restore.sh` | Backup do banco (`pg_dump`, formato *custom*) e dos banners, com `SHA256SUMS`; restauração conferida pelos *checksums* |

O `docker-compose.yml` antigo continua sendo só o banco de **desenvolvimento**; a porta dele agora fica presa a `127.0.0.1`.

## Subir

```bash
cp .env.docker.example .env.docker   # preencha POSTGRES_PASSWORD e DEVICE_ID_PEPPER
docker compose --env-file .env.docker -f docker-compose.prod.yml up -d --build --wait
```

Abra `http://localhost:3100`. A primeira conta da equipe é criada com a senha digitada no terminal (nunca em arquivo ou argumento):

```bash
docker compose --env-file .env.docker -f docker-compose.prod.yml run --rm -it migrate \
  npx tsx scripts/create-admin.ts --name "Seu nome" --email voce@example.com --role administrator
```

A retenção diária roda do mesmo jeito: `run --rm migrate npx tsx scripts/retention.ts`.

## Backup e restauração

```bash
scripts/docker/backup.sh                       # cria backups/AAAAMMDD-HHMMSS/
scripts/docker/restore.sh backups/AAAAMMDD-HHMMSS --yes
```

- O backup contém **todos** os dados do banco, inclusive as contas da equipe (só os *hashes* das senhas) e os identificadores pseudonimizados dentro do prazo de retenção. Guarde-o como dado sensível; a pasta `backups/` é ignorada pelo git.
- A restauração substitui o banco e os banners; o que foi gravado depois do backup se perde. Ela confere os *checksums* antes de mexer em qualquer coisa e para o app durante a troca.
- Restaurar um backup antigo traz de volta dados que a retenção já tinha apagado: rode a retenção logo depois.

## Status da verificação

| Item | Situação |
| --- | --- |
| Saída *standalone* (`NEXT_OUTPUT=standalone`) | Testada sem Docker em 2026-11-14: build, migração, `/api/saude` 200, agenda 200, CSP e HSTS presentes; `sharp`, `argon2` e `pglite` copiados para a saída |
| `docker compose config` dos dois arquivos | Válido; o app só em `127.0.0.1` e o banco sem porta publicada |
| Build das imagens | Testado em 2026-11-14 (Docker 29.5.2, macOS arm64): `app` com 455 MB, `migrate` com 1,57 GB |
| Subida da pilha | `up -d --wait`: banco e app *healthy*, `migrate` sai com 0; app em `127.0.0.1:3100`, banco sem porta no host; processo do app como `node` (uid 1000); nenhum segredo do `.env.docker` nos logs |
| Páginas e cabeçalhos | `/api/saude`, agenda, `/painel`, privacidade e login respondem 200; CSP com *nonce*, HSTS, `X-Frame-Options`, `nosniff`, COOP |
| Conta da equipe e login | `create-admin` pela entrada padrão; login no navegador leva à troca de senha obrigatória |
| Backup e restauração | Backup → mudanças (conta nova, banner trocado) → restauração: banco e banners voltam exatamente ao backup e o app volta *healthy*. Restauração recusada sem `--yes` e com *checksum* adulterado, sem tocar no banco. Arquivos do backup só legíveis pelo dono (`umask 077`) |
