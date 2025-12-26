/**
 * 인증 페이지 레이아웃
 * 로그인/회원가입 페이지를 위한 깔끔한 레이아웃을 제공한다
 */

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      {children}
    </div>
  );
}

