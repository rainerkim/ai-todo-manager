/**
 * Mock 데이터
 * 실제 데이터 연동 전 화면 구성을 위한 샘플 데이터
 */

import { Todo } from '@/types/todo';

export const mockTodos: Todo[] = [
  {
    id: '1',
    user_id: 'user-1',
    title: '프로젝트 기획서 작성',
    description: 'Q1 신규 프로젝트 기획서 초안 작성 및 검토',
    create_date: '2025-01-10T09:00:00Z',
    due_date: '2025-01-15T18:00:00Z',
    priority: 'high',
    category: '업무',
    completed: false,
  },
  {
    id: '2',
    user_id: 'user-1',
    title: '팀 회의 준비',
    description: '주간 팀 회의 안건 정리 및 자료 준비',
    create_date: '2025-01-11T10:00:00Z',
    due_date: '2025-01-12T10:00:00Z',
    priority: 'high',
    category: '업무',
    completed: false,
  },
  {
    id: '3',
    user_id: 'user-1',
    title: 'TypeScript 공부',
    description: '타입스크립트 고급 기능 학습 - Generic, Utility Types',
    create_date: '2025-01-09T14:00:00Z',
    due_date: '2025-01-20T23:59:00Z',
    priority: 'medium',
    category: '학습',
    completed: false,
  },
  {
    id: '4',
    user_id: 'user-1',
    title: '운동하기',
    description: '헬스장 가서 1시간 운동',
    create_date: '2025-01-10T07:00:00Z',
    due_date: '2025-01-11T20:00:00Z',
    priority: 'low',
    category: '개인',
    completed: false,
  },
  {
    id: '5',
    user_id: 'user-1',
    title: '주간 보고서 작성',
    description: '이번 주 업무 진행 상황 정리 및 보고서 제출',
    create_date: '2025-01-08T09:00:00Z',
    due_date: '2025-01-10T17:00:00Z',
    priority: 'medium',
    category: '업무',
    completed: true,
  },
  {
    id: '6',
    user_id: 'user-1',
    title: '책 읽기',
    description: '클린 코드 3장까지 읽기',
    create_date: '2025-01-07T20:00:00Z',
    due_date: null,
    priority: 'low',
    category: '학습',
    completed: true,
  },
];

export const mockUser = {
  id: 'user-1',
  name: '홍길동',
  email: 'hong@example.com',
  avatar: null,
};

