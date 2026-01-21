# Do not use this Dockerfile in production environments without proper modifications and security measures.
# 1단계: Build 스테이지
FROM node:22-alpine AS builder

WORKDIR /app

# 의존성 설치를 위해 패키지 파일 복사
COPY package*.json ./
COPY prisma ./prisma/

# 의존성 설치 (Prisma 클라이언트 생성 포함)
RUN npm ci
RUN npx prisma generate
RUN npx prisma migrate deploy ##최승우가 테스트용으로 잠시 막음

# 전체 소스 복사 및 빌드
COPY . .
RUN npm run build

# 2단계: Run 스테이지 (최종 실행 이미지)
FROM node:22-alpine

WORKDIR /app

# 실행에 필요한 환경 변수 설정 (기본값)
ENV NODE_ENV=production

# 빌드 스테이지에서 생성된 결과물만 복사
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

# 서비스 포트 노출 (NestJS 기본값 3000)
EXPOSE 3000

# 애플리케이션 실행
CMD ["npm", "run", "start:prod"]
