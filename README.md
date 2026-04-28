# 2026book (Vue Project)

이 프로젝트는 Vite를 기반으로 설정된 Vue 3 프로젝트입니다. Vue Router를 이용한 라우팅, Pinia를 이용한 상태 관리, Tailwind CSS를 이용한 스타일링을 포함하며, Firebase 및 `@google/genai` (Google Gen AI)와 같은 서비스들과 연동되어 있습니다.

## 주요 기술 스택 (Technologies)

- **Vue 3**: 프론트엔드 프레임워크 (`^3.5.31`)
- **Vite**: 빠르고 가벼운 빌드 툴 (`^8.0.3`)
- **Vue Router**: 싱글 페이지 애플리케이션 라우팅 (`^5.0.4`)
- **Pinia**: 직관적인 Vue 상태 관리 라이브러리 (`^3.0.4`)
- **Tailwind CSS**: 유틸리티 우선 CSS 프레임워크 (`^4.2.2`)
- **Firebase**: 백엔드 서비스 연동 (`^12.12.0`)
- **@google/genai**: Google Generative AI 연동 (`^1.50.1`)
- **Zod & zod-to-json-schema**: 스키마 선언 및 유효성 검사

## 사전 요구 사항 (Prerequisites)

- **Node.js**: 버전 `^20.19.0` 또는 `>=22.12.0` 필수

## 설치 방법 (Installation)

1. 터미널을 열고 프로젝트의 Vue 앱 디렉토리로 이동합니다.
   ```bash
   cd vue-project
   ```

2. 패키지 매니저(npm)를 사용하여 프로젝트 의존성을 설치합니다.
   ```bash
   npm install
   ```

## 환경 변수 설정 (Environment Variables)

프로젝트 루트의 `vue-project` 폴더에 `.env` 파일이 존재할 수 있습니다. Firebase 및 Google Gen AI와 같은 외부 API를 사용하기 위해 필요한 API 키 및 설정 값들을 `.env` 파일에 맞게 구성해야 할 수 있습니다.

## 실행 방법 (Usage)

### 개발 서버 실행 (Development)

개발 중에는 코드를 수정하면 즉시 브라우저에 반영되는(Hot-Reload) 개발 서버를 사용할 수 있습니다.

```bash
npm run dev
```

위 명령어를 실행한 후, 터미널에 표시되는 로컬 주소(보통 `http://localhost:5173`)를 브라우저에서 열어 확인합니다.

### 프로덕션 빌드 (Build for Production)

배포를 위해 프로젝트를 최적화하여 빌드하려면 다음 명령어를 실행합니다.

```bash
npm run build
```

빌드가 완료되면 정적 파일들이 `vue-project/dist` 폴더에 생성됩니다.

### 프로덕션 빌드 미리보기 (Preview)

빌드된 결과물이 로컬에서 정상적으로 작동하는지 확인하려면 다음 명령어를 사용합니다.

```bash
npm run preview
```