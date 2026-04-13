if (process.env.NODE_ENV !== 'production') {
  try { require('dotenv/config') } catch(e) {}
}
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
})