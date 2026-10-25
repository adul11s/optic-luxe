#!/usr/bin/env bash
# One-command local dev setup (no Docker required):
#   bash scripts/dev-setup.sh
# Creates server/.env if missing, installs deps, pushes the Prisma schema and
# seeds demo data into the database named in DATABASE_URL.
set -euo pipefail
cd "$(dirname "$0")"

if [ ! -f server/.env ]; then
  cp server/.env.example server/.env
  # Replace the placeholder JWT secret with a random one — the server refuses
  # to start without JWT_SECRET.
  SECRET=$(node -e "console.log(require('crypto').randomBytes(48).toString('hex'))")
  sed -i '' "s/change-me-in-production/${SECRET}/" server/.env 2>/dev/null \
    || sed -i "s/change-me-in-production/${SECRET}/" server/.env
  echo "Created server/.env with a generated JWT_SECRET. Edit DATABASE_URL if needed."
fi

echo "==> Installing server dependencies"
(cd server && npm install)

echo "==> Installing client dependencies"
(cd client && npm install)

echo "==> Generating Prisma client + pushing schema + seeding demo data"
(cd server && npx prisma generate && npx prisma db push && npm run db:seed)

echo "Done. Start the stack with:  (cd server && npm run dev)  and  (cd client && npm run dev)"
