/**
 * 로그인 페이지
 * 이메일/비밀번호 기반 로그인 기능을 제공한다
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Sparkles, Mail, Lock, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(true); // 초기 로딩 상태
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 인증 상태 확인 및 관리
   */
  useEffect(() => {
    let isMounted = true;
    
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!isMounted) return;
        
        if (session) {
          router.replace('/');
          return;
        }
      } catch (err) {
        console.error('인증 상태 확인 오류:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    checkAuth();

    // 인증 상태 변경 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      
      if (event === 'SIGNED_IN' && session) {
        router.replace('/');
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  /**
   * 이메일 유효성 검사
   */
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  /**
   * 로그인 폼 제출 핸들러
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 이메일 유효성 검사
    if (!validateEmail(email)) {
      setError('올바른 이메일 형식을 입력해주세요.');
      return;
    }

    // 비밀번호 공백 검사
    if (!password.trim()) {
      setError('비밀번호를 입력해주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Supabase 로그인
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (signInError) {
        // Supabase 에러를 사용자 친화적인 메시지로 변환
        if (signInError.message.includes('Invalid login credentials')) {
          setError('이메일 또는 비밀번호가 올바르지 않습니다.');
        } else if (signInError.message.includes('Email not confirmed')) {
          setError('이메일 인증이 완료되지 않았습니다. 이메일을 확인해주세요.');
        } else if (signInError.message.includes('Invalid email')) {
          setError('유효하지 않은 이메일 주소입니다.');
        } else {
          setError('로그인에 실패했습니다. 잠시 후 다시 시도해주세요.');
        }
        console.error('로그인 오류:', signInError);
        setIsSubmitting(false); // 로딩 상태 해제
        return;
      }

      // 로그인 성공 - onAuthStateChange가 자동으로 리디렉션 처리
      // isSubmitting은 onAuthStateChange에서 리디렉션될 때까지 유지
      
    } catch (err) {
      setError('로그인 중 오류가 발생했습니다. 다시 시도해주세요.');
      console.error('로그인 오류:', err);
      setIsSubmitting(false);
    }
  };

  // 인증 상태 확인 중 로딩 표시
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="text-center space-y-4">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <div className="w-full max-w-md">
        {/* 로고 및 서비스 소개 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
            AI Todo Manager
          </h1>
          <p className="text-muted-foreground">
            AI가 도와주는 스마트한 할 일 관리
          </p>
        </div>

        {/* 로그인 카드 */}
        <Card className="shadow-xl border-2">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">로그인</CardTitle>
            <CardDescription>
              이메일과 비밀번호를 입력하여 로그인하세요
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {/* 오류 메시지 */}
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* 이메일 입력 */}
              <div className="space-y-2">
                <Label htmlFor="email">이메일</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* 비밀번호 입력 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">비밀번호</Label>
                  <Link
                    href="/forgot-password"
                    className="text-sm text-primary hover:underline"
                  >
                    비밀번호 찾기
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* 로그인 버튼 */}
              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting || !email || !password}
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    로그인 중...
                  </>
                ) : (
                  <>
                    로그인
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              {/* 구분선 */}
              <div className="relative w-full">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    또는
                  </span>
                </div>
              </div>

              {/* 회원가입 링크 */}
              <div className="text-center text-sm">
                <span className="text-muted-foreground">
                  아직 계정이 없으신가요?{' '}
                </span>
                <Link
                  href="/signup"
                  className="text-primary font-semibold hover:underline"
                >
                  회원가입하기
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>

        {/* 푸터 정보 */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>© 2025 AI Todo Manager. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}

