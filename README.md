# Ruokat Backend

Ruokat 백엔드 프로젝트입니다. NestJS, Prisma, PostgreSQL, 그리고 AWS Cognito를 사용하여 개발되었습니다.

## 주요 기능

- **사용자 인증**: AWS Cognito를 사용한 회원가입 및 로그인 기능을 제공합니다.
- **사용자 관리**: 사용자 정보 조회 및 수정을 지원합니다.
- **반려동물 프로필**: 반려동물의 프로필, 의료 기록 등을 관리합니다.
- **푸시 알림**: Expo를 통해 사용자에게 푸시 알림을 보냅니다.

## 기술 스택

- **프레임워크**: [NestJS](https://nestjs.com/)
- **ORM**: [Prisma](https://www.prisma.io/)
- **데이터베이스**: [PostgreSQL](https://www.postgresql.org/)
- **인증**: [AWS Cognito](https://aws.amazon.com/cognito/)
- **클라우드 서비스**: AWS (S3, DynamoDB)
- **푸시 알림**: [Expo](https://expo.dev/)
- **언어**: [TypeScript](https://www.typescriptlang.org/)
- **배포**: [Docker](https://www.docker.com/)

## 시작하기

### 사전 준비

- [Node.js](https://nodejs.org/) (버전 22 이상)
- [PostgreSQL](https://www.postgresql.org/download/)
- [Docker](https://www.docker.com/products/docker-desktop/) (선택 사항)

### 1. 환경 변수 설정

프로젝트 루트 디렉토리에 `.env` 파일을 생성하고, `.env.example` 파일의 내용을 복사하여 자신의 환경에 맞게 수정합니다.

```bash
cp .env.example .env
```

### 2. 의존성 설치

```bash
npm install
```

### 3. Prisma generate

Prisma를 사용하여 데이터베이스 객체를 만듭니다.

```bash
npx prisma generate
```

### 4. 애플리케이션 실행

개발 모드로 애플리케이션을 실행합니다. 파일이 변경될 때마다 자동으로 재시작됩니다.

```bash
npm run start:dev
```

## API 문서

애플리케이션이 실행되면, Swagger UI를 통해 API 문서를 확인할 수 있습니다.

- **Swagger UI**: `http://localhost:3000/swagger` (포트는 `env` 설정에 따라 다를 수 있습니다)

## 주요 `npm` 스크립트

- `npm run build`: 프로덕션용으로 애플리케이션을 빌드합니다.
- `npm run format`: Prettier를 사용하여 코드를 포맷팅합니다.
- `npm run start`: 빌드된 애플리케이션을 실행합니다.
- `npm run start:prod`: 프로덕션 모드로 애플리케이션을 실행합니다.
- `npm run lint`: ESLint를 사용하여 코드 문제를 검사하고 수정합니다.
- `npm run prisma:studio`: Prisma Studio를 실행하여 데이터베이스를 GUI로 관리합니다.

## 배포

`Dockerfile`이 프로젝트에 포함되어 있어 Docker를 사용한 배포가 가능합니다.
