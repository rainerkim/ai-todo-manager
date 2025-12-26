/**
 * 메인 페이지 (할 일 관리 대시보드)
 * 할 일 목록을 표시하고 CRUD, 검색, 필터, 정렬 기능을 제공한다
 */

'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Toolbar } from '@/components/layout/Toolbar';
import { TodoList, TodoDialog } from '@/components/todos';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Todo, TodoInput, Priority, Category } from '@/types/todo';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface HomePageProps {
  params: Promise<Record<string, string>>;
  searchParams: Promise<Record<string, string | string[]>>;
}

export default function HomePage({}: HomePageProps) {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  
  // 사용자 및 인증 상태
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingTodos, setIsFetchingTodos] = useState(false);
  
  // 상태 관리
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  
  // 검색 및 필터 상태
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriorities, setSelectedPriorities] = useState<Priority[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const [showCompleted, setShowCompleted] = useState(true);
  const [sortBy, setSortBy] = useState<string>('priority');

  /**
   * Supabase에서 할 일 목록 조회
   */
  const fetchTodos = useCallback(async () => {
    if (!user) return;
    
    try {
      setIsFetchingTodos(true);
      
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .eq('user_id', user.id)
        .order('create_date', { ascending: false });

      if (error) {
        console.error('할 일 조회 오류:', error);
        alert('할 일을 불러오는데 실패했습니다. 잠시 후 다시 시도해주세요.');
        return;
      }

      setTodos(data || []);
    } catch (err) {
      console.error('할 일 조회 오류:', err);
      alert('할 일을 불러오는데 실패했습니다.');
    } finally {
      setIsFetchingTodos(false);
    }
  }, [user, supabase]); // supabase는 useState로 안정화됨

  /**
   * 사용자 세션 확인 및 인증 상태 관리
   */
  useEffect(() => {
    let isMounted = true;
    
    const checkUser = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!isMounted) return;
        
        if (error || !session) {
          router.replace('/login');
          return;
        }
        
        setUser(session.user);
        setIsLoading(false);
      } catch (err) {
        console.error('사용자 정보 로드 오류:', err);
        if (isMounted) {
          router.replace('/login');
        }
      }
    };

    checkUser();

    // 인증 상태 변경 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      
      if (session) {
        setUser(session.user);
        setIsLoading(false);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        router.replace('/login');
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  /**
   * 사용자 정보 로드 후 할 일 목록 조회
   */
  useEffect(() => {
    if (user) {
      fetchTodos();
    }
  }, [user, fetchTodos]);

  /**
   * 할 일 완료 토글
   */
  const handleToggleComplete = async (id: string) => {
    try {
      // 낙관적 업데이트
      const targetTodo = todos.find((todo) => todo.id === id);
      if (!targetTodo) return;

      const newCompleted = !targetTodo.completed;
      
      setTodos((prev) =>
        prev.map((todo) =>
          todo.id === id ? { ...todo, completed: newCompleted } : todo
        )
      );

      // Supabase 업데이트
      const { error } = await supabase
        .from('todos')
        .update({ completed: newCompleted })
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) {
        console.error('완료 상태 업데이트 오류:', error);
        // 실패 시 원래 상태로 복구
        setTodos((prev) =>
          prev.map((todo) =>
            todo.id === id ? { ...todo, completed: targetTodo.completed } : todo
          )
        );
        alert('상태 변경에 실패했습니다. 다시 시도해주세요.');
      }
    } catch (err) {
      console.error('완료 상태 업데이트 오류:', err);
      alert('상태 변경 중 오류가 발생했습니다.');
    }
  };

  /**
   * 할 일 수정 모드 열기
   */
  const handleEdit = (todo: Todo) => {
    setEditingTodo(todo);
    setIsDialogOpen(true);
  };

  /**
   * 할 일 삭제
   */
  const handleDelete = async (id: string) => {
    if (!confirm('정말 이 할 일을 삭제하시겠습니까?')) {
      return;
    }

    try {
      // 낙관적 업데이트
      const deletedTodo = todos.find((todo) => todo.id === id);
      setTodos((prev) => prev.filter((todo) => todo.id !== id));

      // Supabase 삭제
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) {
        console.error('할 일 삭제 오류:', error);
        // 실패 시 원래 상태로 복구
        if (deletedTodo) {
          setTodos((prev) => [...prev, deletedTodo]);
        }
        alert('삭제에 실패했습니다. 다시 시도해주세요.');
      }
    } catch (err) {
      console.error('할 일 삭제 오류:', err);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  /**
   * 할 일 추가/수정 제출
   */
  const handleSubmit = async (todoInput: TodoInput) => {
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      if (editingTodo) {
        // 수정
        const { error } = await supabase
          .from('todos')
          .update({
            title: todoInput.title,
            description: todoInput.description,
            priority: todoInput.priority,
            category: todoInput.category,
            due_date: todoInput.due_date,
          })
          .eq('id', editingTodo.id)
          .eq('user_id', user.id);

        if (error) {
          console.error('할 일 수정 오류:', error);
          alert('수정에 실패했습니다. 다시 시도해주세요.');
          return;
        }

        // 성공 시 목록 업데이트
        setTodos((prev) =>
          prev.map((todo) =>
            todo.id === editingTodo.id
              ? { ...todo, ...todoInput }
              : todo
          )
        );
      } else {
        // 추가
        const newTodoData = {
          user_id: user.id,
          title: todoInput.title,
          description: todoInput.description,
          priority: todoInput.priority,
          category: todoInput.category,
          due_date: todoInput.due_date,
          completed: false,
        };

        const { data, error } = await supabase
          .from('todos')
          .insert([newTodoData])
          .select()
          .single();

        if (error) {
          console.error('할 일 생성 오류:', error);
          alert('할 일 추가에 실패했습니다. 다시 시도해주세요.');
          return;
        }

        // 성공 시 목록에 추가
        if (data) {
          setTodos((prev) => [data, ...prev]);
        }
      }
      
      setIsDialogOpen(false);
      setEditingTodo(null);
    } catch (err) {
      console.error('할 일 저장 오류:', err);
      alert('할 일 저장 중 오류가 발생했습니다.');
    }
  };

  /**
   * 다이얼로그 닫기
   */
  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingTodo(null);
    }
  };

  /**
   * 로그아웃 처리
   */
  const handleLogout = async () => {
    try {
      // Supabase 로그아웃 - onAuthStateChange가 자동으로 리디렉션 처리
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('로그아웃 오류:', error);
        alert('로그아웃 중 오류가 발생했습니다. 다시 시도해주세요.');
      }
      // 성공 시 onAuthStateChange에서 자동으로 /login으로 리디렉션
      
    } catch (err) {
      console.error('로그아웃 오류:', err);
      alert('로그아웃 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  /**
   * 필터링 및 정렬된 할 일 목록
   */
  const filteredAndSortedTodos = useMemo(() => {
    let result = [...todos];

    // 검색 필터
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (todo) =>
          todo.title.toLowerCase().includes(query) ||
          todo.description?.toLowerCase().includes(query)
      );
    }

    // 우선순위 필터
    if (selectedPriorities.length > 0) {
      result = result.filter((todo) =>
        selectedPriorities.includes(todo.priority)
      );
    }

    // 카테고리 필터
    if (selectedCategories.length > 0) {
      result = result.filter((todo) =>
        selectedCategories.includes(todo.category)
      );
    }

    // 완료 상태 필터
    if (!showCompleted) {
      result = result.filter((todo) => !todo.completed);
    }

    // 정렬
    result.sort((a, b) => {
      switch (sortBy) {
        case 'priority': {
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        case 'dueDate': {
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        }
        case 'createDate': {
          return new Date(b.create_date).getTime() - new Date(a.create_date).getTime();
        }
        case 'title': {
          return a.title.localeCompare(b.title);
        }
        default:
          return 0;
      }
    });

    return result;
  }, [todos, searchQuery, selectedPriorities, selectedCategories, showCompleted, sortBy]);

  /**
   * 통계 정보
   */
  const stats = useMemo(() => {
    const total = todos.length;
    const completed = todos.filter((t) => t.completed).length;
    const incomplete = total - completed;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, incomplete, completionRate };
  }, [todos]);

  // 로딩 중이거나 사용자 정보가 없으면 로딩 표시
  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 사용자 정보 포맷팅
  const userInfo = {
    name: user.user_metadata?.display_name || user.email?.split('@')[0] || '사용자',
    email: user.email || '',
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* 헤더 */}
      <Header user={userInfo} onLogout={handleLogout} />

      {/* 툴바 */}
      <Toolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedPriorities={selectedPriorities}
        onPriorityChange={setSelectedPriorities}
        selectedCategories={selectedCategories}
        onCategoryChange={setSelectedCategories}
        showCompleted={showCompleted}
        onShowCompletedChange={setShowCompleted}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />

      {/* 메인 컨텐츠 */}
      <main className="flex-1 container px-4 py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* 페이지 제목 */}
          <div>
            <h2 className="text-3xl font-bold tracking-tight font-sans">Todo List</h2>
            <p className="text-muted-foreground mt-2">
              오늘의 할 일을 관리하고 생산성을 높이세요
            </p>
          </div>

          {/* 통계 및 액션 바 */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-lg border bg-card">
            <div className="flex flex-wrap gap-6">
              <div>
                <p className="text-sm text-muted-foreground">전체</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">진행 중</p>
                <p className="text-2xl font-bold text-primary">{stats.incomplete}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">완료</p>
                <p className="text-2xl font-bold text-[var(--status-completed)]">
                  {stats.completed}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">완료율</p>
                <p className="text-2xl font-bold text-accent">{stats.completionRate}%</p>
              </div>
            </div>

            {/* 할 일 추가 버튼 */}
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="gap-2"
              size="lg"
            >
              <Plus className="h-5 w-5" />
              <span>할 일 추가</span>
            </Button>
          </div>

          {/* 할 일 목록 */}
          <div className="space-y-4">
            {isFetchingTodos ? (
              <div className="text-center py-16">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-muted-foreground">할 일을 불러오는 중...</p>
              </div>
            ) : filteredAndSortedTodos.length === 0 && searchQuery ? (
              <div className="text-center py-16">
                <p className="text-lg text-muted-foreground">
                  &quot;{searchQuery}&quot;에 대한 검색 결과가 없습니다.
                </p>
              </div>
            ) : filteredAndSortedTodos.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed rounded-lg">
                <p className="text-lg text-muted-foreground mb-2">
                  아직 할 일이 없습니다.
                </p>
                <p className="text-sm text-muted-foreground">
                  &quot;할 일 추가&quot; 버튼을 눌러 새로운 할 일을 만들어보세요!
                </p>
              </div>
            ) : (
              <TodoList
                todos={filteredAndSortedTodos}
                onToggleComplete={handleToggleComplete}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            )}
          </div>
        </div>
      </main>

      {/* 할 일 추가/수정 다이얼로그 */}
      <TodoDialog
        open={isDialogOpen}
        onOpenChange={handleDialogClose}
        onSubmit={handleSubmit}
        editTodo={editingTodo}
      />
    </div>
  );
}
