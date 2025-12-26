-- ============================================
-- AI 할일 관리 서비스 - Supabase 데이터베이스 스키마
-- ============================================

-- 1. users 테이블 생성
-- auth.users와 1:1 관계로 사용자 추가 정보를 저장한다
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. todos 테이블 생성
-- 각 사용자별 할일 관리 테이블
CREATE TABLE IF NOT EXISTS public.todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  create_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  due_date TIMESTAMP WITH TIME ZONE,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  category TEXT NOT NULL DEFAULT '개인' CHECK (category IN ('업무', '개인', '학습')),
  completed BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 인덱스 생성 (성능 최적화)
-- users 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- todos 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_todos_user_id ON public.todos(user_id);
CREATE INDEX IF NOT EXISTS idx_todos_due_date ON public.todos(due_date);
CREATE INDEX IF NOT EXISTS idx_todos_priority ON public.todos(priority);
CREATE INDEX IF NOT EXISTS idx_todos_category ON public.todos(category);
CREATE INDEX IF NOT EXISTS idx_todos_completed ON public.todos(completed);
CREATE INDEX IF NOT EXISTS idx_todos_create_date ON public.todos(create_date DESC);

-- 복합 인덱스 (자주 사용되는 쿼리 패턴)
CREATE INDEX IF NOT EXISTS idx_todos_user_completed ON public.todos(user_id, completed);
CREATE INDEX IF NOT EXISTS idx_todos_user_priority ON public.todos(user_id, priority);

-- 4. 트리거 함수 생성 (updated_at 자동 업데이트)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- users 테이블 트리거
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- todos 테이블 트리거
CREATE TRIGGER update_todos_updated_at 
  BEFORE UPDATE ON public.todos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 5. Row Level Security (RLS) 활성화
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

-- 6. RLS 정책 생성

-- users 테이블 정책
-- 본인의 프로필만 조회 가능
CREATE POLICY "사용자는 자신의 프로필만 조회할 수 있다"
  ON public.users
  FOR SELECT
  USING (auth.uid() = id);

-- 본인의 프로필만 생성 가능
CREATE POLICY "사용자는 자신의 프로필만 생성할 수 있다"
  ON public.users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 본인의 프로필만 수정 가능
CREATE POLICY "사용자는 자신의 프로필만 수정할 수 있다"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 본인의 프로필만 삭제 가능
CREATE POLICY "사용자는 자신의 프로필만 삭제할 수 있다"
  ON public.users
  FOR DELETE
  USING (auth.uid() = id);

-- todos 테이블 정책
-- 본인의 할일만 조회 가능
CREATE POLICY "사용자는 자신의 할일만 조회할 수 있다"
  ON public.todos
  FOR SELECT
  USING (auth.uid() = user_id);

-- 본인의 할일만 생성 가능
CREATE POLICY "사용자는 자신의 할일만 생성할 수 있다"
  ON public.todos
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 본인의 할일만 수정 가능
CREATE POLICY "사용자는 자신의 할일만 수정할 수 있다"
  ON public.todos
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 본인의 할일만 삭제 가능
CREATE POLICY "사용자는 자신의 할일만 삭제할 수 있다"
  ON public.todos
  FOR DELETE
  USING (auth.uid() = user_id);

-- 7. 사용자 자동 생성 트리거 함수
-- 새로운 사용자가 인증되면 users 테이블에 자동으로 레코드 생성
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- auth.users 테이블에 트리거 연결
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 8. 유용한 뷰 생성 (선택사항)

-- 진행중인 할일 뷰
CREATE OR REPLACE VIEW public.active_todos AS
SELECT 
  t.*,
  CASE 
    WHEN t.due_date IS NOT NULL AND t.due_date < NOW() THEN '지연'
    ELSE '진행중'
  END AS status
FROM public.todos t
WHERE t.completed = false;

-- 완료된 할일 뷰
CREATE OR REPLACE VIEW public.completed_todos AS
SELECT 
  t.*,
  '완료' AS status
FROM public.todos t
WHERE t.completed = true;

-- 9. 샘플 데이터 함수 (개발/테스트용)
CREATE OR REPLACE FUNCTION public.create_sample_todos(p_user_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO public.todos (user_id, title, description, priority, category, due_date)
  VALUES 
    (p_user_id, '프로젝트 기획서 작성', '신규 프로젝트의 기획서를 작성한다', 'high', '업무', NOW() + INTERVAL '3 days'),
    (p_user_id, 'TypeScript 공부', 'TypeScript 공식 문서 읽기', 'medium', '학습', NOW() + INTERVAL '7 days'),
    (p_user_id, '운동하기', '주 3회 헬스장 가기', 'low', '개인', NOW() + INTERVAL '1 day');
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 스키마 생성 완료
-- ============================================

-- 확인 쿼리 (선택사항)
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public';
-- SELECT * FROM public.users LIMIT 5;
-- SELECT * FROM public.todos LIMIT 5;

