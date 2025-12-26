import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Shadows_Into_Light } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const shadowsIntoLight = Shadows_Into_Light({
  weight: "400",
  variable: "--font-shadows-into-light",
  subsets: ["latin"],
});

/**
 * 애플리케이션 메타데이터
 * SEO, Open Graph, Twitter Card 최적화 포함
 */
export const metadata: Metadata = {
  // 기본 메타데이터
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  ),
  title: {
    default: "AI 할 일 관리 서비스",
    template: "%s | AI 할 일 관리",
  },
  description: "AI 가 도와주는 똑똑한 할 일 관리 서비스",
  keywords: [
    "할일관리",
    "todo",
    "AI",
    "생산성",
    "업무관리",
    "스케줄",
    "할일",
    "투두리스트",
  ],
  authors: [{ name: "AI Todo Manager Team" }],
  creator: "AI Todo Manager",
  
  // Open Graph (Facebook, LinkedIn 등)
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: process.env.NEXT_PUBLIC_APP_URL || "https://ai-todo-manager.vercel.app",
    title: "AI 할 일 관리 서비스",
    description: "AI 가 도와주는 똑똑한 할 일 관리 서비스",
    siteName: "AI 할 일 관리",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "AI 할 일 관리 서비스",
      },
    ],
  },
  
  // Twitter Card
  twitter: {
    card: "summary_large_image",
    title: "AI 할 일 관리 서비스",
    description: "AI 가 도와주는 똑똑한 할 일 관리 서비스",
    images: ["/twitter-image.png"],
    creator: "@ai_todo_manager",
  },
  
  // PWA 관련
  manifest: "/manifest.json",
  
  // 검색 엔진 크롤링
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  
  // 기타
  category: "productivity",
};

/**
 * 뷰포트 및 테마 설정
 * Next.js 15+에서는 viewport와 themeColor를 별도 export로 분리
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${shadowsIntoLight.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
