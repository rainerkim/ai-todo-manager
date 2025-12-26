/**
 * 할 일 추가/편집 다이얼로그 컴포넌트
 * 할 일을 생성하거나 수정하는 폼을 제공한다
 */

'use client';

import { useState, useEffect } from 'react';
import { Todo, TodoInput, Priority, Category } from '@/types/todo';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sparkles, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TodoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (todo: TodoInput) => void;
  editTodo?: Todo | null;
  isLoading?: boolean;
}

export const TodoDialog = ({
  open,
  onOpenChange,
  onSubmit,
  editTodo = null,
  isLoading = false,
}: TodoDialogProps) => {
  const [formData, setFormData] = useState<TodoInput>({
    title: '',
    description: null,
    due_date: null,
    priority: 'medium',
    category: '개인',
    completed: false,
  });

  // AI 관련 상태
  const [aiInput, setAiInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  /**
   * 편집 모드일 때 기존 데이터로 폼을 채운다
   */
  useEffect(() => {
    if (editTodo) {
      setFormData({
        title: editTodo.title,
        description: editTodo.description,
        due_date: editTodo.due_date,
        priority: editTodo.priority,
        category: editTodo.category,
        completed: editTodo.completed,
      });
    } else {
      // 새로운 할 일 추가 시 폼 초기화
      setFormData({
        title: '',
        description: null,
        due_date: null,
        priority: 'medium',
        category: '개인',
        completed: false,
      });
    }
  }, [editTodo, open]);

  /**
   * 폼 제출 핸들러
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      return;
    }

    onSubmit(formData);
    onOpenChange(false);
  };

  /**
   * 입력 필드 변경 핸들러
   */
  const handleChange = (
    field: keyof TodoInput,
    value: string | null | Priority | Category | boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  /**
   * 오늘 날짜를 YYYY-MM-DD 형식으로 반환
   */
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  /**
   * datetime-local input을 위한 날짜 포맷 변환
   */
  const formatDateForInput = (date: string | null) => {
    if (!date) return '';
    return new Date(date).toISOString().slice(0, 16);
  };

  /**
   * AI로 자연어 입력 분석
   */
  const handleAiParse = async () => {
    if (!aiInput.trim()) {
      setAiError('할 일을 입력해주세요.');
      return;
    }

    setIsAiLoading(true);
    setAiError(null);

    try {
      const response = await fetch('/api/ai/parse-todo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input: aiInput.trim() }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'AI 분석에 실패했습니다.');
      }

      const { data } = await response.json();

      // 분석 결과를 폼에 자동 채우기
      setFormData((prev) => ({
        ...prev,
        title: data.title || prev.title,
        description: data.description || prev.description,
        due_date: data.due_date || prev.due_date,
        priority: data.priority || prev.priority,
        category: data.category || prev.category,
      }));

      // AI 입력 필드 초기화
      setAiInput('');
    } catch (error) {
      console.error('AI 파싱 오류:', error);
      setAiError(
        error instanceof Error
          ? error.message
          : 'AI 분석 중 오류가 발생했습니다.'
      );
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {editTodo ? '할 일 수정' : '새 할 일 추가'}
            </DialogTitle>
            <DialogDescription>
              {editTodo
                ? '할 일의 정보를 수정하세요.'
                : '새로운 할 일을 추가하세요.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* AI 자연어 입력 (새 할 일 추가 시에만 표시) */}
            {!editTodo && (
              <div className="space-y-2 p-4 border-2 border-dashed border-primary/30 rounded-lg bg-primary/5">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <Label className="text-sm font-semibold text-primary">
                    AI로 빠르게 추가하기
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  "내일 오후 3시까지 중요한 팀 회의 준비" 처럼 자연스럽게 입력하세요
                </p>
                
                {aiError && (
                  <Alert variant="destructive" className="mb-3">
                    <AlertDescription>{aiError}</AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-2">
                  <Input
                    placeholder="예: 다음 주 월요일까지 보고서 작성하기"
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleAiParse();
                      }
                    }}
                    disabled={isAiLoading || isLoading}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    onClick={handleAiParse}
                    disabled={isAiLoading || isLoading || !aiInput.trim()}
                    size="sm"
                    className="gap-2"
                  >
                    {isAiLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        분석 중...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        AI 분석
                      </>
                    )}
                  </Button>
                </div>

                <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs text-muted-foreground">또는 직접 입력</span>
                  <div className="h-px flex-1 bg-border" />
                </div>
              </div>
            )}

            {/* 제목 */}
            <div className="space-y-2">
              <Label htmlFor="title">
                제목 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                placeholder="할 일을 입력하세요"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            {/* 설명 */}
            <div className="space-y-2">
              <Label htmlFor="description">설명</Label>
              <Textarea
                id="description"
                placeholder="상세 설명을 입력하세요 (선택)"
                value={formData.description || ''}
                onChange={(e) =>
                  handleChange('description', e.target.value || null)
                }
                rows={3}
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* 우선순위 */}
              <div className="space-y-2">
                <Label htmlFor="priority">우선순위</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) =>
                    handleChange('priority', value as Priority)
                  }
                  disabled={isLoading}
                >
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">높음</SelectItem>
                    <SelectItem value="medium">중간</SelectItem>
                    <SelectItem value="low">낮음</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 카테고리 */}
              <div className="space-y-2">
                <Label htmlFor="category">카테고리</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    handleChange('category', value as Category)
                  }
                  disabled={isLoading}
                >
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="업무">업무</SelectItem>
                    <SelectItem value="개인">개인</SelectItem>
                    <SelectItem value="학습">학습</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 마감일 */}
            <div className="space-y-2">
              <Label htmlFor="due_date">마감일</Label>
              <Input
                id="due_date"
                type="datetime-local"
                value={formatDateForInput(formData.due_date)}
                onChange={(e) =>
                  handleChange(
                    'due_date',
                    e.target.value ? new Date(e.target.value).toISOString() : null
                  )
                }
                min={getTodayDate()}
                disabled={isLoading}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              취소
            </Button>
            <Button type="submit" disabled={isLoading || !formData.title.trim()}>
              {isLoading ? '저장 중...' : editTodo ? '수정' : '추가'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

