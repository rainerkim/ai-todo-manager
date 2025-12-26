/**
 * 할 일 목록을 표시하는 컴포넌트
 * 여러 TodoCard를 렌더링하고 빈 상태를 처리한다
 */

import { Todo } from '@/types/todo';
import { TodoCard } from './TodoCard';
import { CheckCircle2 } from 'lucide-react';

interface TodoListProps {
  todos: Todo[];
  onToggleComplete: (id: string) => void;
  onEdit: (todo: Todo) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
}

export const TodoList = ({ 
  todos, 
  onToggleComplete, 
  onEdit, 
  onDelete,
  isLoading = false 
}: TodoListProps) => {
  /**
   * 로딩 상태 표시
   */
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-40 bg-muted animate-pulse rounded-lg"
          />
        ))}
      </div>
    );
  }

  /**
   * 빈 상태 표시
   */
  if (todos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="rounded-full bg-primary/10 p-6 mb-4">
          <CheckCircle2 className="w-16 h-16 text-primary" />
        </div>
        <h3 className="text-xl font-semibold mb-2">
          할 일이 없습니다
        </h3>
        <p className="text-muted-foreground max-w-md">
          새로운 할 일을 추가하거나 AI를 활용하여 자연어로 할 일을 생성해보세요.
        </p>
      </div>
    );
  }

  /**
   * 완료된 할 일과 진행 중인 할 일을 분리한다
   */
  const incompleteTodos = todos.filter(todo => !todo.completed);
  const completedTodos = todos.filter(todo => todo.completed);

  return (
    <div className="space-y-6">
      {/* 진행 중인 할 일 */}
      {incompleteTodos.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              진행 중 ({incompleteTodos.length})
            </h2>
          </div>
          <div className="space-y-4">
            {incompleteTodos.map((todo) => (
              <TodoCard
                key={todo.id}
                todo={todo}
                onToggleComplete={onToggleComplete}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      )}

      {/* 완료된 할 일 */}
      {completedTodos.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-muted-foreground">
              완료됨 ({completedTodos.length})
            </h2>
          </div>
          <div className="space-y-4">
            {completedTodos.map((todo) => (
              <TodoCard
                key={todo.id}
                todo={todo}
                onToggleComplete={onToggleComplete}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

