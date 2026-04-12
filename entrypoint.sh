#!/bin/sh

echo "Waiting for environment to be ready..."

echo "Deploying Prisma Migrations against Production Database..."
# This command bypasses local network blocks because the Docker container runs on your production environment (AWS/Vercel/Cloud VMs)
npx prisma migrate deploy

if [ $? -eq 0 ]; then
  echo "Prisma migrations deployed successfully!"
else
  echo "Prisma migrations failed!"
  exit 1
fi

echo "Starting Next.js..."
exec node server.js
