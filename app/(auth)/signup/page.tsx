/**
 * 회원가입 페이지
 * 이메일/비밀번호 기반 신규 회원가입 기능을 제공한다
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
import { Checkbox } from '@/components/ui/checkbox';
import { Sparkles, Mail, Lock, User, ArrowRight, CheckCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function SignupPage() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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
          setIsCheckingAuth(false);
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
   * 입력 필드 변경 핸들러
   */
  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // 입력 시 에러 메시지 초기화
    if (error) setError(null);
  };

  /**
   * 이메일 유효성 검사
   */
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  /**
   * 비밀번호 유효성 검사
   */
  const validatePassword = () => {
    if (formData.password.length < 8) {
      return '비밀번호는 최소 8자 이상이어야 합니다.';
    }
    if (formData.password !== formData.confirmPassword) {
      return '비밀번호가 일치하지 않습니다.';
    }
    return null;
  };

  /**
   * 회원가입 폼 제출 핸들러
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // 이메일 유효성 검사
    if (!validateEmail(formData.email)) {
      setError('올바른 이메일 형식을 입력해주세요.');
      return;
    }

    // 비밀번호 유효성 검사
    const passwordError = validatePassword();
    if (passwordError) {
      setError(passwordError);
      return;
    }

    // 약관 동의 확인
    if (!agreedToTerms) {
      setError('이용약관에 동의해주세요.');
      return;
    }

    setIsLoading(true);

    try {
      // Supabase 회원가입
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            display_name: formData.name,
          },
        },
      });

      if (signUpError) {
        // Supabase 에러를 사용자 친화적인 메시지로 변환
        if (signUpError.message.includes('already registered')) {
          setError('이미 가입된 이메일입니다. 로그인을 시도해주세요.');
        } else if (signUpError.message.includes('Invalid email')) {
          setError('유효하지 않은 이메일 주소입니다.');
        } else if (signUpError.message.includes('Password')) {
          setError('비밀번호 조건을 확인해주세요. (최소 8자 이상)');
        } else if (signUpError.message.includes('confirmation email') || signUpError.message.includes('Email')) {
          // 이메일 발송 오류 - 개발 환경에서는 회원가입은 성공했을 수 있음
          console.warn('이메일 발송 오류:', signUpError);
          setError('회원가입은 완료되었으나 인증 메일 발송에 실패했습니다. Supabase 이메일 설정을 확인해주세요.');
        } else {
          setError('회원가입에 실패했습니다. 잠시 후 다시 시도해주세요.');
        }
        console.error('회원가입 오류:', signUpError);
        setIsLoading(false); // 로딩 상태 해제
        return;
      }

      // 회원가입 성공
      if (data.user) {
        // 이메일 확인이 필요한 경우
        if (data.user.identities && data.user.identities.length === 0) {
          setSuccess(true);
        } else {
          // 이메일 확인이 필요없는 경우 (자동 로그인)
          // onAuthStateChange가 자동으로 리디렉션 처리
          setSuccess(true);
        }
      }
      
    } catch (err) {
      setError('회원가입 중 오류가 발생했습니다. 다시 시도해주세요.');
      console.error('회원가입 오류:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 인증 상태 확인 중 로딩 표시
  if (isCheckingAuth) {
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
            지금 가입하고 AI와 함께 생산성을 높이세요
          </p>
        </div>

        {/* 회원가입 카드 */}
        <Card className="shadow-xl border-2">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">회원가입</CardTitle>
            <CardDescription>
              계정을 생성하여 AI Todo Manager를 시작하세요
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

              {/* 성공 메시지 (이메일 확인 필요) */}
              {success && (
                <Alert className="border-green-500 bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-100">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-semibold">회원가입이 완료되었습니다! 🎉</p>
                      <p className="text-sm">
                        {formData.email}로 인증 메일을 발송했습니다.
                        <br />
                        이메일을 확인하고 인증을 완료해주세요.
                      </p>
                      <Link
                        href="/login"
                        className="inline-block mt-2 text-sm font-medium text-primary hover:underline"
                      >
                        로그인 페이지로 이동 →
                      </Link>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* 이름 입력 */}
              <div className="space-y-2">
                <Label htmlFor="name">이름</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="홍길동"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className="pl-10"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* 이메일 입력 */}
              <div className="space-y-2">
                <Label htmlFor="email">이메일</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className="pl-10"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* 비밀번호 입력 */}
              <div className="space-y-2">
                <Label htmlFor="password">비밀번호</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    className="pl-10"
                    required
                    disabled={isLoading}
                    minLength={8}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  최소 8자 이상
                </p>
              </div>

              {/* 비밀번호 확인 */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">비밀번호 확인</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => handleChange('confirmPassword', e.target.value)}
                    className="pl-10"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* 약관 동의 */}
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="terms"
                  checked={agreedToTerms}
                  onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                  disabled={isLoading}
                />
                <label
                  htmlFor="terms"
                  className="text-sm text-muted-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  <Link href="/terms" className="text-primary hover:underline">
                    이용약관
                  </Link>
                  {' '}및{' '}
                  <Link href="/privacy" className="text-primary hover:underline">
                    개인정보처리방침
                  </Link>
                  에 동의합니다
                </label>
              </div>

              {/* 회원가입 버튼 */}
              <Button
                type="submit"
                className="w-full"
                disabled={
                  isLoading || 
                  success ||
                  !formData.name || 
                  !formData.email || 
                  !formData.password || 
                  !formData.confirmPassword ||
                  !agreedToTerms
                }
              >
                {isLoading ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    회원가입 중...
                  </>
                ) : success ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    회원가입 완료
                  </>
                ) : (
                  <>
                    회원가입
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

              {/* 로그인 링크 */}
              <div className="text-center text-sm">
                <span className="text-muted-foreground">
                  이미 계정이 있으신가요?{' '}
                </span>
                <Link
                  href="/login"
                  className="text-primary font-semibold hover:underline"
                >
                  로그인하기
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

