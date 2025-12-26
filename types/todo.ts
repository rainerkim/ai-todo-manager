/**
 * Todo 관련 타입 정의
 */

export type Priority = 'high' | 'medium' | 'low';
export type Category = '업무' | '개인' | '학습';

export interface Todo {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  create_date: string;
  due_date: string | null;
  priority: Priority;
  category: Category;
  completed: boolean;
}

export type TodoInput = Omit<Todo, 'id' | 'user_id' | 'create_date'>;

export type TodoUpdate = Partial<TodoInput>;

