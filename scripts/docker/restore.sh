#!/usr/bin/env bash
# Restores a backup made by scripts/docker/backup.sh into the docker-compose.prod.yml stack (B-24).
# Usage: scripts/docker/restore.sh <backup-directory> --yes
# Replaces the current database and banners: everything written after the backup is lost.
set -euo pipefail

source_dir="${1:?usage: scripts/docker/restore.sh <backup-directory> --yes}"
if [[ "${2:-}" != "--yes" ]]; then
  echo "This replaces the database and banners with the backup in $source_dir. Re-run with --yes." >&2
  exit 1
fi
(cd "$source_dir" && shasum -a 256 -c SHA256SUMS)

compose=(docker compose --env-file .env.docker -f docker-compose.prod.yml)
"${compose[@]}" up -d --wait db
"${compose[@]}" stop app

"${compose[@]}" exec -T db pg_restore -U conecta -d conecta --clean --if-exists --no-owner <"$source_dir/database.dump"
"${compose[@]}" run --rm --no-deps -T --entrypoint sh app \
  -c 'find /app/storage/uploads -mindepth 1 -delete && tar -C /app/storage/uploads -xf -' <"$source_dir/uploads.tar"

"${compose[@]}" up -d --wait app
echo "Restored $source_dir"
