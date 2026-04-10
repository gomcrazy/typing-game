# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Artifacts

### typing-game (artifacts/typing-game)
- **Path**: `/`
- **Kind**: react-vite web app
- **Description**: 웹 기반 타자 연습 게임 (무료/프리미엄 구조)
- **Main files**:
  - `src/App.tsx` — 게임 전체 로직 (React 컴포넌트)
  - `src/game.css` — 게임 전용 CSS 스타일
  - `src/index.css` — 기본 리셋 CSS
- **Features**:
  - 60초 제한 타자 연습 게임
  - 난이도 선택 (Easy / Normal / Hard)
  - 최고 점수 localStorage 저장
  - 광고 배너 (무료 사용자 전용)
  - Stripe Payment Link 결제 연동 구조 (placeholder)
  - 프리미엄 기능: 광고 제거, Hard 난이도, 상세 통계(WPM/CPM/정확도), 커스텀 단어 업로드

### api-server (artifacts/api-server)
- **Path**: `/api`, `/game`
- **Kind**: API server (Express)
- **Description**: REST API 서버 + 타자 게임 정적 파일 서빙 (순수 HTML/CSS/JS 버전)
- **Main files**:
  - `src/app.ts` — Express 앱 설정 (정적 파일 서빙 포함)
  - `public/index.html` — 순수 HTML 타자 게임
  - `public/style.css` — 순수 CSS 스타일
  - `public/script.js` — 순수 JS 게임 로직

## Stripe 연동 방법

1. Stripe 대시보드에서 Payment Link 생성
2. `artifacts/typing-game/src/App.tsx`의 `STRIPE_PAYMENT_LINK` 변수를 실제 URL로 교체
3. 결제 성공 후 `?payment=success` 파라미터로 리다이렉트되면 자동으로 프리미엄 활성화

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
