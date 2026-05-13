# laundry-delivery-web

배달 스태프용 웹 앱입니다. 배달 차량을 선택해 런(Run)을 시작하고, 출고 스캔과 인도 처리까지의 흐름을 처리합니다.

## 기술 스택

- React 19 + Vite + TypeScript
- TanStack Query — 서버 상태
- Zustand — 세션/런 영속 상태
- 백엔드 `laundry-api`의 `/delivery/*` API 사용

---

## 처음 시작하기 (초보자용)

### 1. 사전 준비

- **Node.js**: 이 프로젝트는 `24.14.0`을 사용합니다 (`.node-version` 파일 기준). 더 낮은 메이저 버전은 동작을 보장하지 않습니다.
- **백엔드(`laundry-api`)가 켜져 있어야 합니다.** 이 앱은 백엔드 없이는 로그인부터 막힙니다.

Windows에서 nvm4w로 Node를 잡아두셨다면 PowerShell에서 다음 한 줄을 먼저 실행하세요:

```powershell
$env:PATH='C:\nvm4w\nodejs;' + $env:PATH
```

설치된 Node 버전 확인:

```powershell
node -v   # v24.x 가 나와야 합니다
```

### 2. 의존성 설치

프로젝트 폴더로 들어가서 설치합니다.

```powershell
cd laundry-delivery-web
npm install
```

처음 한 번만 하면 됩니다. (`node_modules` 폴더가 생깁니다.)

### 3. 환경 변수 설정

샘플 파일을 복사해 `.env`를 만듭니다.

```powershell
copy .env.example .env
```

기본값:

```
VITE_API_BASE_URL=http://localhost:3000
```

> 참고: 실제로는 `vite.config.ts`의 프록시 설정 덕분에 `/api`로 시작하는 요청이 자동으로 `http://localhost:3000`으로 전달됩니다. 백엔드를 다른 포트나 호스트에서 띄울 때만 이 값을 바꾸면 됩니다.

### 4. 백엔드 띄우기

다른 터미널을 하나 더 열어서 `laundry-api`를 먼저 실행해 둡니다.

```powershell
cd ..\laundry-api
npm install        # 처음 한 번만
npm run start:dev
```

`http://localhost:3000`이 떠 있어야 합니다.

### 5. 개발 서버 실행

다시 `laundry-delivery-web` 폴더의 터미널에서:

```powershell
npm run dev
```

콘솔에 출력되는 주소(기본 `http://localhost:5176`)를 브라우저로 엽니다.

### 6. 로그인해서 확인

로그인 화면에서 Staff ID에 `delivery-staff-1`을 입력하고 **시작하기**를 누르면 차량 선택 화면이 나옵니다. 차량을 고르면 배달 목록 화면으로 진입합니다.

> 백엔드 시드(`laundry-api/prisma/seed.ts`)에 등록된 스태프 ID여야 로그인이 됩니다.

---

## 자주 쓰는 명령어

| 명령어 | 용도 |
|---|---|
| `npm run dev` | 개발 서버 실행 (HMR 포함) |
| `npm run build` | 타입 체크 + 프로덕션 빌드 |
| `npm run typecheck` | 타입만 빠르게 확인 |
| `npm run preview` | 빌드 결과물 미리보기 |
| `npm test` | 테스트 전체 1회 실행 |
| `npm run test:watch` | 테스트 watch 모드 |
| `npm run generate:api` | 백엔드 OpenAPI 스키마 → 타입 재생성 (백엔드 실행 중이어야 함) |

---

## 폴더 구조 한눈에

```
laundry-delivery-web/
├─ src/
│  ├─ App.tsx             # 화면 단계(step) 라우팅
│  ├─ api.ts              # fetch 래퍼 + ApiError
│  ├─ store.ts            # Zustand (세션/런, persist)
│  ├─ types.ts            # API 응답 타입
│  ├─ utils.ts            # 라벨/상태 유틸
│  ├─ components/         # 화면 단위 컴포넌트
│  └─ __tests__/          # 테스트
├─ docs/testing.md        # 테스트 정책 (AI 통제용)
├─ .env.example
└─ vite.config.ts         # /api → :3000 프록시
```

---

## 문제 해결

**`npm install`이 실패해요**
→ Node 버전을 확인하세요 (`node -v`). 24.x 미만이면 nvm으로 24.14.0을 설치하세요.

**로그인 시 "요청에 실패했어요"가 떠요**
→ 백엔드(`laundry-api`)가 떠 있는지, 3000 포트가 점유되어 있는지 확인하세요. PowerShell에서:

```powershell
curl http://localhost:3000/health
```

**`/api` 호출이 404로 떨어져요**
→ `vite.config.ts`의 프록시 설정과 백엔드 라우트가 어긋났을 수 있습니다. 백엔드 컨트롤러를 우선 확인하세요.

**테스트가 환경 차이로 깨질 때**
→ [docs/testing.md](docs/testing.md)에 테스트 인프라(jsdom URL, MSW, fixtures) 규칙이 정리되어 있습니다.

---

## 더 읽을거리

- [docs/testing.md](docs/testing.md) — 어떤 테스트를 두고 어떤 테스트는 두지 **않는지**, AI 에이전트가 따라야 할 규칙.
- 백엔드 도메인 문서: `../laundry-api/docs/delivery/README.md`
