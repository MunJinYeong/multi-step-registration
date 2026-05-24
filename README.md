# 다단계 수강 신청 폼

## 프로젝트 개요

온라인 교육 플랫폼의 강의 수강 신청 흐름을 구현한 React 기반 다단계 폼입니다.

사용자는 강의를 선택하고, 개인 또는 단체 신청 정보를 입력한 뒤, 확인 화면에서 전체 내용을 검토하고 제출할 수 있습니다. 각 단계의 입력값은 이전 단계로 돌아가도 유지되며, 작성 중 새로고침 시 `localStorage`에 저장된 draft를 복구합니다.

주요 구현 범위는 다음과 같습니다.

- 카테고리별 강의 목록 조회 및 강의 선택
- 개인 신청 / 단체 신청 조건부 입력 폼
- 스텝별 유효성 검증 및 필드별 에러 표시
- 참가자 명단 동적 생성 및 이메일 중복 검증
- 확인 화면, 수정 이동, 약관 동의, 제출 완료 화면
- mock API 기반 제출 성공 / 실패 처리
- draft 임시 저장, 이탈 경고, 브라우저 뒤로가기 단계 이동
- 모바일 / 태블릿 / 데스크톱 반응형 레이아웃

## 기술 스택

- React: UI 컴포넌트 구성
- TypeScript: 도메인 타입, API 타입, form draft 타입 정의
- Vite: 개발 서버 및 build 환경
- react-hook-form: 통합 form state 관리, blur 기반 검증 흐름
- zod: 스텝별 schema, 제출 payload schema, 저장 draft schema 검증
- @hookform/resolvers: react-hook-form과 zod 연결
- ESLint: 정적 검사

React는 스텝별 화면을 컴포넌트 단위로 분리하기 쉽고, 조건부 필드와 입력 상태 변화가 많은 폼 UI를 선언적으로 구성하기 적합하다고 판단해 선택했습니다. 또한 과제에서 React 사용을 권장하고 있어 요구사항과 평가 맥락에 잘 맞는 선택이라고 보았습니다.

`react-hook-form`은 여러 step이 하나의 신청 draft를 공유해야 하는 요구사항에 적합하다고 판단했습니다. `zod`는 UI와 검증 규칙을 분리하고, 개인 신청과 단체 신청을 타입 수준에서 구분하기 위해 사용했습니다.

## 실행 방법

```bash
npm install
npm run dev
```

개발 서버 실행 후 브라우저에서 안내되는 로컬 주소로 접속합니다.

검증 명령은 다음과 같습니다.

```bash
npm run check
```

`npm run check`는 lint와 production build를 순서대로 실행합니다.

## 프로젝트 구조 설명

```text
src/
  api/
    mockApi.ts
  components/
    EmptyState.tsx
    Field.tsx
    LoadingState.tsx
    StepIndicator.tsx
  features/
    enrollment/
      EnrollmentPage.tsx
      schemas.ts
      storage.ts
      types.ts
      utils.ts
      steps/
        ApplicantStep.tsx
        CompleteStep.tsx
        CourseStep.tsx
        EnrollmentSummary.tsx
        ReviewStep.tsx
  App.tsx
  main.tsx
  styles.css
```

- `src/api/mockApi.ts`: 강의 목록 조회와 수강 신청 제출을 흉내내는 mock API입니다.
- `src/features/enrollment/types.ts`: 강의, 신청자, 개인/단체 신청, API 응답/에러 타입을 정의합니다.
- `src/features/enrollment/schemas.ts`: 스텝별 validation schema와 최종 제출 schema를 정의합니다.
- `src/features/enrollment/storage.ts`: `localStorage` 기반 draft 저장, 복구, 삭제를 담당합니다.
- `src/features/enrollment/utils.ts`: 정원 계산, 날짜/금액 포맷, 단체 draft 조정, 제출 payload 정규화를 담당합니다.
- `src/features/enrollment/EnrollmentPage.tsx`: 전체 step 흐름, form provider, 제출, 에러 처리, history 제어를 담당합니다.
- `src/features/enrollment/steps/*`: 각 step의 화면 컴포넌트입니다.
- `src/components/Field.tsx`: label, hint, error를 포함한 재사용 입력 필드입니다.

## 요구사항 해석 및 가정

- 강의 데이터와 신청 제출은 실제 서버 대신 mock API로 구현했습니다.
- `GET /api/courses?category={category}`는 `getCourses(category?)` 함수로 대응했습니다.
- `POST /api/enrollments`는 `submitEnrollment(payload)` 함수로 대응했습니다.
- 단체 신청의 `담당자 연락처`는 전화번호로 해석하고 한국 전화번호 형식 검증을 적용했습니다.
- 단체 신청 인원수는 2명 이상 10명 이하이며, 선택한 강의의 잔여 정원을 초과할 수 없도록 처리했습니다.
- 참가자 이메일은 참가자 명단 내부에서 중복될 수 없도록 검증했습니다.
- 마감된 강의는 선택할 수 없고, 잔여 정원이 1~3명인 강의는 마감 임박 상태로 표시합니다.
- 제출 성공 후에는 저장된 draft를 삭제합니다.
- 작성 중 브라우저 새로고침/닫기에는 기본 이탈 경고를 표시합니다.
- 브라우저 뒤로가기는 가능한 경우 앱 내부 이전 step으로 이동하도록 처리했습니다.

## 설계 결정과 이유

### 폼 상태 관리

전체 신청 데이터를 하나의 `react-hook-form` 인스턴스에서 관리합니다. 각 step이 독립적인 `useState`를 갖는 방식은 이전 step으로 돌아갈 때 데이터 유지와 최종 제출 payload 정규화가 복잡해질 수 있어 피했습니다.

`FormProvider`를 사용해 하위 step 컴포넌트가 같은 form context를 공유하도록 했습니다. 이 방식으로 강의 선택, 신청자 정보, 단체 정보, 약관 동의가 하나의 draft로 유지됩니다.

### 유효성 검증 전략

검증은 세 단계로 나누었습니다.

- 1단계 이동 시: `courseStepSchema`로 강의 선택과 신청 유형을 검증합니다.
- 2단계 이동 시: 현재 신청 유형에 필요한 신청자/단체 필드만 검증합니다.
- 최종 제출 시: `enrollmentSubmissionSchema`로 전체 payload를 다시 검증합니다.

개별 필드는 `react-hook-form`의 `mode: "onBlur"`를 사용해 blur 시점에 검증합니다. step 이동 시에는 해당 step에 필요한 필드만 검증하고, 제출 시에는 최종 payload 기준으로 한 번 더 검증해 클라이언트와 서버 사이의 경계를 분리했습니다.

서버 측 검증은 mock API의 에러 응답으로 표현했습니다. `INVALID_INPUT`의 `details`가 제공되는 경우 가능한 field path에 `setError`로 매핑해 사용자가 수정해야 할 위치를 확인할 수 있도록 했습니다.

### 조건부 필드 데이터 처리

신청 유형은 `"personal"`과 `"group"`으로 구분합니다. 단체 신청을 선택하면 기본 단체 draft를 생성하고, 개인 신청으로 전환할 때 이미 입력된 단체 정보가 있다면 삭제 확인 대화상자를 표시합니다.

개인 신청으로 전환이 확정되면 `group` 데이터를 `undefined`로 초기화하고 관련 에러를 제거합니다. 이는 제출 payload에 사용되지 않는 조건부 데이터가 남아 혼동을 만드는 상황을 줄이기 위한 결정입니다.

단체 신청 인원수가 바뀌면 참가자 배열을 인원수와 같은 길이로 조정합니다. 인원수를 줄일 때 제거될 참가자 정보가 입력되어 있으면 확인 대화상자를 표시해 데이터 손실을 방지합니다.

### 제출 및 에러 처리

제출 전 약관 동의를 필수로 검증합니다. 제출 중에는 버튼을 비활성화해 중복 제출을 방지합니다.

mock API는 다음 에러를 반환할 수 있습니다.

- `COURSE_FULL`: 잔여 정원 부족
- `DUPLICATE_ENROLLMENT`: 이미 신청된 강의
- `INVALID_INPUT`: 서버 측 입력값 오류

제출 실패 시 입력값은 유지되며, 사용자는 같은 화면에서 수정 후 재시도할 수 있습니다.

### 임시 저장 및 이탈 방지

작성 중인 draft는 `localStorage`에 저장합니다. 저장 데이터에는 version, 현재 step, form draft가 포함됩니다. 복구 시 저장용 schema로 구조를 검증하고, 유효하지 않은 데이터는 삭제합니다.

`localStorage` 접근이 불가능한 환경에서는 앱이 깨지지 않도록 저장 기능만 조용히 비활성화합니다.

작성 중인 데이터가 있고 제출 완료 상태가 아닐 때는 `beforeunload` 이벤트로 브라우저 기본 이탈 경고를 표시합니다.

## 미구현 / 제약사항

- 실제 HTTP 서버나 MSW는 사용하지 않고 함수 기반 mock API로 구현했습니다.
- 자동화 테스트는 추가하지 않았습니다. 현재 검증은 `npm run check`와 수동 QA를 기준으로 합니다.
- `beforeunload` 경고 문구는 브라우저 정책상 커스텀 문구가 아니라 브라우저 기본 문구로 표시됩니다.
- 브라우저 뒤로가기는 step 이동을 우선 처리하지만, URL query 기반 라우팅은 구현하지 않았습니다.
- 결제, 인증/인가, 실제 신청 내역 저장은 과제 범위에서 제외했습니다.

## AI 활용 범위

요구사항 분석, 구현 계획 정리, 코드 구조 설계, React/TypeScript 구현, README 초안 작성 과정에서 AI 도구를 보조적으로 활용했습니다.

과제 요구사항과 단계별 구현 계획을 Markdown 문서로 정리하고, 이를 기준으로 기능 단위 구현과 검증을 진행했습니다.

최종 코드는 요구사항을 기준으로 직접 검토하며 수정했고, `npm run check`와 브라우저 수동 확인을 통해 동작을 검증했습니다.
