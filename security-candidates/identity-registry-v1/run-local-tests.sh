#!/bin/sh
# LOCAL SYNTHETIC TEST ONLY — never pass production database settings.
# EduOS · © 2026 NAFAS FOR ARTIFICIAL INTELLIGENCE · CN-6573712.
set -eu
source_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
work=$(mktemp -d /tmp/eduos-identity-test.XXXXXX)
mkdir "$work/db" "$work/socket" "$work/run"
chmod 755 "$work"
chown postgres:postgres "$work/db" "$work/socket"
pgbin=$(pg_config --bindir)
cleanup() { runuser -u postgres -- "$pgbin/pg_ctl" -D "$work/db" -m immediate stop >/dev/null 2>&1 || true; }
trap cleanup EXIT INT TERM
runuser -u postgres -- "$pgbin/initdb" -D "$work/db" --auth=trust --no-locale >/dev/null
runuser -u postgres -- "$pgbin/pg_ctl" -D "$work/db" -l "$work/db/server.log" -o "-k $work/socket -p 55491 -c listen_addresses=''" start >/dev/null
for name in identity.ts identity.test.ts registry.ts registry.sql local-bootstrap.sql registry.integration.ts; do
  cp "$source_dir/$name" "$work/run/$name"
done
cd "$work/run"
bun add pg typescript @types/pg @types/bun >/dev/null 2>&1
export EDUOS_IDENTITY_LOCAL_ONLY=1 PGHOST="$work/socket" PGPORT=55491 PGUSER=postgres PGDATABASE=postgres PGSSLMODE=disable
echo 'LOCAL_ONLY: unix socket, no TCP listener, generated fictional records, synthetic auth stub'
echo 'COMMAND: bun registry.integration.ts'
bun registry.integration.ts
echo 'COMMAND: bun test identity.test.ts'
bun test identity.test.ts
echo 'COMMAND: bunx tsc --noEmit --strict --target es2022 --module preserve --moduleResolution bundler --types bun --skipLibCheck identity.ts registry.ts registry.integration.ts'
bunx tsc --noEmit --strict --target es2022 --module preserve --moduleResolution bundler --types bun --skipLibCheck identity.ts registry.ts registry.integration.ts
echo 'TYPECHECK_OK'
