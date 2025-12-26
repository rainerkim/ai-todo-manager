/**
 * 개별 할 일을 표시하는 카드 컴포넌트
 * 할 일의 제목, 설명, 우선순위, 카테고리, 마감일 등을 표시하고
 * 완료/수정/삭제 기능을 제공한다
 */

import { Todo } from '@/types/todo';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface TodoCardProps {
  todo: Todo;
  onToggleComplete: (id: string) => void;
  onEdit: (todo: Todo) => void;
  onDelete: (id: string) => void;
}

export const TodoCard = ({ todo, onToggleComplete, onEdit, onDelete }: TodoCardProps) => {
  /**
   * 우선순위에 따른 색상을 반환한다
   */
  const getPriorityColor = (priority: Todo['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-[var(--priority-high)] text-white';
      case 'medium':
        return 'bg-[var(--priority-medium)] text-white';
      case 'low':
        return 'bg-[var(--priority-low)] text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  /**
   * 카테고리에 따른 색상을 반환한다
   */
  const getCategoryColor = (category: Todo['category']) => {
    switch (category) {
      case '업무':
        return 'border-[var(--category-work)]';
      case '개인':
        return 'border-[var(--category-personal)]';
      case '학습':
        return 'border-[var(--category-study)]';
      default:
        return 'border-gray-300';
    }
  };

  /**
   * 우선순위 텍스트를 반환한다
   */
  const getPriorityText = (priority: Todo['priority']) => {
    switch (priority) {
      case 'high':
        return '높음';
      case 'medium':
        return '중간';
      case 'low':
        return '낮음';
    }
  };

  /**
   * 마감일이 지났는지 확인한다
   */
  const isOverdue = () => {
    if (!todo.due_date || todo.completed) return false;
    return new Date(todo.due_date) < new Date();
  };

  /**
   * 마감일 표시 텍스트를 반환한다
   */
  const getDueDateText = () => {
    if (!todo.due_date) return null;
    
    const dueDate = new Date(todo.due_date);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return `${Math.abs(diffDays)}일 지연`;
    } else if (diffDays === 0) {
      return '오늘 마감';
    } else if (diffDays === 1) {
      return '내일 마감';
    } else {
      return format(dueDate, 'M월 d일', { locale: ko });
    }
  };

  return (
    <Card 
      className={`
        ${getCategoryColor(todo.category)} border-l-4 
        ${todo.completed ? 'opacity-60' : ''}
        ${isOverdue() ? 'bg-red-50 dark:bg-red-950/20' : ''}
        transition-all hover:shadow-md
      `}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <Checkbox
            checked={todo.completed}
            onCheckedChange={() => onToggleComplete(todo.id)}
            className="mt-1"
          />
          <div className="flex-1 space-y-2">
            <h3 
              className={`
                text-lg font-semibold 
                ${todo.completed ? 'line-through text-muted-foreground' : ''}
              `}
            >
              {todo.title}
            </h3>
            <div className="flex flex-wrap gap-2">
              <Badge className={getPriorityColor(todo.priority)}>
                {getPriorityText(todo.priority)}
              </Badge>
              <Badge variant="outline">{todo.category}</Badge>
              {isOverdue() && (
                <Badge className="bg-[var(--status-delayed)] text-white">
                  지연
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      {todo.description && (
        <CardContent className="pb-3">
          <p 
            className={`
              text-sm text-muted-foreground 
              ${todo.completed ? 'line-through' : ''}
            `}
          >
            {todo.description}
          </p>
        </CardContent>
      )}

      <CardFooter className="flex items-center justify-between pt-3 border-t">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {todo.due_date && (
            <>
              <Calendar className="w-4 h-4" />
              <span className={isOverdue() && !todo.completed ? 'text-red-600 dark:text-red-400 font-semibold' : ''}>
                {getDueDateText()}
              </span>
            </>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(todo)}
            disabled={todo.completed}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(todo.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

