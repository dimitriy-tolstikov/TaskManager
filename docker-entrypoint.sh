#!/bin/sh
set -e

# Migrations are applied on container start so app and DB never drift apart.
DATABASE_URL="$DATABASE_URL" npx prisma migrate deploy
exec node server.js
