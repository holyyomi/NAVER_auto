# 네이버 마케팅 운영 센터

내부 마케팅 리서치와 운영 업무를 빠르게 시작하는 Next.js 기반 작업 도구입니다.
홈 화면은 작업 런처로 구성되어 있고, 현재는 3개의 MVP 기능을 중심으로 리뷰할 수 있습니다.

## 현재 상태

작동 중
- 키워드 트렌드
- 검색 결과 모음
- 쇼핑 인사이트
- 최근 저장 / 결과 다시 불러오기
- 준비 중 기능 안내 페이지

승인 또는 실제 자격 증명 확인 필요
- NAVER DataLab 검색 트렌드 실데이터
- NAVER 쇼핑 인사이트 실데이터

참고
- 검색 결과 모음은 현재 실제 검색 API 경로를 사용합니다.
- 트렌드와 쇼핑 기능은 실서비스 경로만 허용하며, 자격 증명 또는 권한이 준비되지 않으면 짧은 한국어 오류 메시지를 보여줍니다.

## 로컬 실행

1. 의존성 설치

```bash
npm install
```

2. 환경 변수 설정

`.env.local`을 만들고 아래 값을 넣습니다.

```bash
NAVER_API_MODE=real
NAVER_CLIENT_ID=your_naver_client_id
NAVER_CLIENT_SECRET=your_naver_client_secret
NEXT_PUBLIC_APP_NAME=네이버 마케팅 운영 센터
```

3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:3000`을 엽니다.

## 배포용 환경 변수

Vercel에 필요한 값
- `NAVER_API_MODE`
- `NAVER_CLIENT_ID`
- `NAVER_CLIENT_SECRET`

선택 값
- `NAVER_API_TIMEOUT_MS`
- `NAVER_API_RETRY_COUNT`
- `NEXT_PUBLIC_APP_NAME`

환경 변수 노출 기준
- `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET`, `NAVER_API_MODE`, `NAVER_API_TIMEOUT_MS`, `NAVER_API_RETRY_COUNT`는 서버 전용입니다.
- `NEXT_PUBLIC_APP_NAME`만 클라이언트에 노출됩니다.

## 빌드와 검증

```bash
npm run lint
npm run build
```

로컬 Windows 샌드박스에서는 `next build`가 마지막 단계에서 `spawn EPERM`으로 실패할 수 있습니다.
이 경우 권한이 허용된 환경에서 다시 실행하면 정상 빌드되는지 확인해야 합니다.

## API 경로

- `POST /api/search`
- `POST /api/trend`
- `POST /api/shopping-insights`

모든 서버 경로는 입력 검증을 거친 뒤 NAVER 응답을 정규화해 UI에 전달합니다.

## Vercel 미리보기 전 확인할 것

1. NAVER 앱에 실제 사용 가능한 `CLIENT_ID`, `CLIENT_SECRET`이 발급되어 있어야 합니다.
2. Trend / Shopping 관련 NAVER 권한과 승인 상태를 확인해야 합니다.
3. Vercel 프로젝트에 환경 변수를 등록해야 합니다.
4. 배포 후 `/features/keyword-trends`, `/features/search-results-hub`, `/features/shopping-insights`를 직접 확인해야 합니다.

자세한 작업 흐름은 [README_WORKFLOW.md](./README_WORKFLOW.md)에 정리했습니다.
