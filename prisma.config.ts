/// <reference types="node" />
import { defineConfig } from 'prisma/config'

// dotenv는 .env 파일이 있을 때만 로드
try {
  require('dotenv/config')
} catch (e) {
  // .env 파일이 없어도 무시
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env.DATABASE_URL || 'postgresql://dummy:dummy@localhost:5432/dummy',
  },
})
