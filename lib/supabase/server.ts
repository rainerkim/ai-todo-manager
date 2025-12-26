/**
 * 서버 컴포넌트용 Supabase 클라이언트
 * Next.js 서버 환경(Server Components, Server Actions, Route Handlers)에서 사용한다
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * 서버 컴포넌트에서 사용할 Supabase 클라이언트를 생성한다
 * @returns Supabase 클라이언트 인스턴스
 */
export const createClient = async () => {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll 메서드는 Server Component에서 호출될 수 있으며
            // 이 경우 쿠키 설정이 실패할 수 있다 (읽기 전용)
            // 이는 정상적인 동작이므로 무시한다
          }
        },
      },
    }
  );
};

