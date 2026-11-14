#!/usr/bin/env bash
# Backs up the docker-compose.prod.yml stack (B-24): the PostgreSQL database (pg_dump, custom format)
# and the uploaded banners. Usage: scripts/docker/backup.sh [output-directory]
# The backup holds the same data as the database, including staff accounts (password hashes):
# keep it private and out of version control (backups/ is ignored by git).
set -euo pipefail

compose=(docker compose --env-file .env.docker -f docker-compose.prod.yml)
target="${1:-backups/$(date +%Y%m%d-%H%M%S)}"
mkdir -p "$target"
chmod 700 "$target"

"${compose[@]}" exec -T db pg_dump -U conecta -d conecta --format=custom --no-owner >"$target/database.dump"
"${compose[@]}" exec -T app tar -C /app/storage/uploads -cf - . >"$target/uploads.tar"
(cd "$target" && shasum -a 256 database.dump uploads.tar >SHA256SUMS)

echo "Backup written to $target"
