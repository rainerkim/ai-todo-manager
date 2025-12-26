/**
 * 클라이언트 컴포넌트용 Supabase 클라이언트
 * 브라우저 환경에서 사용한다
 */

import { createBrowserClient } from '@supabase/ssr';

/**
 * 클라이언트 컴포넌트에서 사용할 Supabase 클라이언트를 생성한다
 * 싱글톤 패턴으로 구현하여 하나의 인스턴스만 생성한다
 * @returns Supabase 클라이언트 인스턴스
 */
export const createClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
};

