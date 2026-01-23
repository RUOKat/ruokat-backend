import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from "@nestjs/common"
import { PrismaClient } from "@prisma/client"
import { Pool } from "pg"
import { PrismaPg } from "@prisma/adapter-pg"

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name)
  private readonly pool: Pool

  constructor() {
    const connectionString = process.env.DATABASE_URL
    const poolSize = Number(process.env.DB_POOL_SIZE ?? 10)

    const pool = new Pool({
      connectionString,
      max: poolSize,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 2_000,
      ssl: process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: true }
        : false,
    })

    super({
      adapter: new PrismaPg(pool),
      log:
        process.env.NODE_ENV === "development"
          ? ["query", "warn", "error"]
          : ["error"],
    })

    this.pool = pool
  }

  async onModuleInit() {
    this.logger.log('========== PostgreSQL 연결 초기화 시작 ==========')

    // 연결 문자열 파싱 (비밀번호 마스킹)
    const connectionString = process.env.DATABASE_URL || ''
    const maskedUrl = this.maskConnectionString(connectionString)
    this.logger.log(`DATABASE_URL: ${maskedUrl || 'NOT SET'}`)
    this.logger.log(`DB_POOL_SIZE: ${process.env.DB_POOL_SIZE ?? '10 (기본값)'}`)

    if (!connectionString) {
      this.logger.error('❌ DATABASE_URL 환경변수가 설정되지 않았습니다')
      throw new Error('DATABASE_URL is not defined')
    }

    try {
      // Prisma 연결
      await this.$connect()
      this.logger.log('✅ Prisma 클라이언트 연결 성공')

      // 연결 테스트 쿼리
      await this.testConnection()

      this.logger.log('========== PostgreSQL 연결 초기화 완료 ==========')
    } catch (error) {
      this.logger.error(`❌ PostgreSQL 연결 실패: ${error}`)
      throw error
    }
  }

  private async testConnection() {
    try {
      // 간단한 쿼리로 연결 테스트
      const result = await this.$queryRaw<[{ version: string }]>`SELECT version()`
      const version = result[0]?.version || 'Unknown'
      const shortVersion = version.split(',')[0] // PostgreSQL 버전만 추출
      this.logger.log(`✅ 데이터베이스 연결 테스트 성공`)
      this.logger.log(`   DB 버전: ${shortVersion}`)

      // 테이블 개수 확인
      const tables = await this.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `
      const tableCount = Number(tables[0]?.count || 0)
      this.logger.log(`   테이블 수: ${tableCount}개`)

    } catch (error) {
      this.logger.error(`❌ 데이터베이스 연결 테스트 실패: ${error}`)
      throw error
    }
  }

  private maskConnectionString(url: string): string {
    if (!url) return ''
    try {
      // postgresql://user:password@host:port/database 형식 파싱
      const match = url.match(/^(postgresql:\/\/)([^:]+):([^@]+)@(.+)$/)
      if (match) {
        return `${match[1]}${match[2]}:****@${match[4]}`
      }
      return url.replace(/:([^:@]+)@/, ':****@')
    } catch {
      return '****'
    }
  }

  async onModuleDestroy() {
    this.logger.log('PostgreSQL 연결 종료 중...')
    await this.pool.end()
    this.logger.log('✅ PostgreSQL 연결 종료 완료')
  }
}
