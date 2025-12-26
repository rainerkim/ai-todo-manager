# AI 기반 할 일 관리 서비스 PRD

## 1. 제품 개요

### 1.1 제품명
AI Todo Manager (가칭)

### 1.2 목적
- 사용자가 할 일을 효율적으로 관리할 수 있도록 CRUD 기반 할 일 관리 제공
- AI를 활용하여 자연어 입력 → 구조화된 할 일 자동 생성
- 일/주 단위 요약 및 분석을 통해 생산성 인사이트 제공

### 1.3 대상 사용자
- 개인 생산성 관리가 필요한 일반 사용자
- 업무/학습/개인 일정 관리를 한 곳에서 하고 싶은 사용자

---

## 2. 주요 기능 요구사항

### 2.1 사용자 인증 (Supabase Auth)

#### 기능
- 이메일/비밀번호 기반 로그인
- 회원가입
- 로그아웃
- 인증 상태 유지

#### 정책
- Supabase Auth 사용
- 모든 Todo 데이터는 로그인 사용자 기준으로 접근 제한 (RLS 적용)

---

### 2.2 할 일 관리 (CRUD)

#### 기능
- 할 일 생성(Create)
- 할 일 목록 조회(Read)
- 할 일 수정(Update)
- 할 일 삭제(Delete)

#### 할 일 데이터 필드
| 필드명 | 타입 | 설명 |
|------|----|----|
| id | uuid | PK |
| user_id | uuid | users 테이블 FK |
| title | text | 할 일 제목 |
| description | text | 상세 설명 |
| create_date | timestamp | 생성일 |
| due_date | timestamp | 마감일 |
| priority | enum | high / medium / low |
| category | enum | 업무 / 개인 / 학습 |
| completed | boolean | 완료 여부 |

---

### 2.3 검색 / 필터 / 정렬

#### 검색
- 제목(title), 설명(description) 기준 텍스트 검색

#### 필터
- 우선순위: 높음 / 중간 / 낮음
- 카테고리: 업무 / 개인 / 학습
- 진행상태
  - 진행중 (completed = false && due_date >= today)
  - 완료 (completed = true)
  - 지연 (completed = false && due_date < today)

#### 정렬
- 우선순위 순
- 마감일 순
- 생성일 순

---

### 2.4 AI 할 일 생성 기능

#### 기능 설명
- 사용자가 자연어로 입력한 문장을 AI가 분석
- 구조화된 Todo 데이터로 변환하여 자동 생성

#### 입력 예시
내일 오전 10시에 팀회의 준비

#### AI 변환 결과 예시
```json
{
  "title": "팀회의 준비",
  "description": "내일 오전 10시에 있을 팀 회의를 위해 자료 정리하기",
  "create_date": "2025-01-10T09:00",
  "due_date": "2025-01-11T10:00",
  "priority": "high",
  "category": "업무",
  "completed": false
}
처리 흐름
-사용자 자연어 입력
-Gemini API 호출
-JSON Schema 기반 응답 파싱
-검증 후 todos 테이블에 저장

2.5 AI 요약 및 분석 기능
기능
-버튼 클릭 한 번으로 전체 할 일 분석
일일 요약
-오늘 완료한 할 일 목록
-남아있는 할 일 요약
주간 요약
-주간 전체 할 일 수
-완료율 (%)
-카테고리별 비중
-지연된 작업 수

3. 화면 구성 (UI/UX)
3.1 로그인 / 회원가입 화면
-이메일 입력
-비밀번호 입력
-로그인 / 회원가입 버튼

3.2 할 일 관리 메인 화면
구성 요소
-상단: 검색창
-필터 영역: 우선순위 / 카테고리 / 상태
-정렬 옵션
-할 일 목록 (카드 또는 리스트)
-할 일 추가 버튼
-AI 할 일 생성 입력창
-AI 요약/분석 버튼

3.3 향후 확장 화면 (통계/분석)
제공 정보
-주간 활동량 차트
-완료율 그래프
-카테고리별 비율
-지연 작업 추이

4. 기술 스택
Frontend
-Next.js (App Router)
-Tailwind CSS
-shadcn/ui
Backend / Infra
Supabase
-Auth
-Database (PostgreSQL)
-Row Level Security
AI
-Google Gemini API
-AI SDK 활용

5. 데이터 구조 (Supabase)
5.1 users
Supabase Auth 기본 테이블 사용

5.2 todos 테이블
create table todos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  title text not null,
  description text,
  create_date timestamp default now(),
  due_date timestamp,
  priority text check (priority in ('high','medium','low')),
  category text check (category in ('업무','개인','학습')),
  completed boolean default false
);
RLS 정책
-user_id = auth.uid() 인 데이터만 접근 가능

6. 비기능 요구사항
-반응형 UI (모바일/데스크탑)
-API 응답 시간 1초 이내
-AI 요청 실패 시 에러 핸들링 및 사용자 안내
-데이터 정합성 검증 (AI 응답 JSON 검증)

7. 향후 확장 방향
-캘린더 연동
-알림(Notification)
-협업 Todo (공유)
-음성 입력 기반 Todo 생성

8. 성공 지표 (KPI)
-일일 활성 사용자(DAU)
-Todo 생성 대비 완료율
-AI 생성 Todo 사용률
-주간 재방문율


