/**
 * AI 할 일 파싱 API
 * 자연어 입력을 구조화된 할 일 데이터로 변환한다
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // 요청 본문 파싱
    const { input } = await request.json();

    if (!input || typeof input !== 'string' || input.trim().length === 0) {
      return NextResponse.json(
        { error: '입력 텍스트가 필요합니다.' },
        { status: 400 }
      );
    }

    // 환경 변수 확인
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      console.error('GOOGLE_GENERATIVE_AI_API_KEY가 설정되지 않았습니다.');
      return NextResponse.json(
        { error: '서비스 설정이 완료되지 않았습니다.' },
        { status: 500 }
      );
    }

    // 현재 날짜와 시간 정보
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    // Google Generative AI 초기화
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // 날짜 계산 헬퍼
    const getNextWeekday = (targetDay: number): string => {
      const result = new Date(now);
      const currentDay = result.getDay();
      const daysUntilTarget = (targetDay - currentDay + 7) % 7 || 7;
      result.setDate(result.getDate() + daysUntilTarget);
      return result.toISOString().split('T')[0];
    };

    const dayOfWeek = now.getDay(); // 0: 일요일, 1: 월요일, ..., 6: 토요일
    
    // 프롬프트 생성
    const prompt = `
당신은 할 일 관리 전문가입니다. 사용자가 입력한 자연어를 분석하여 구조화된 할 일 데이터로 변환해주세요.

**현재 시각**: ${now.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}
**오늘 날짜**: ${today}
**현재 요일**: ${['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'][dayOfWeek]}

**사용자 입력**: "${input}"

**변환 규칙**:

1. **제목 (title)**: 핵심 작업만 간결하게 추출 (필수)

2. **설명 (description)**: 추가 정보나 맥락이 있으면 포함, 없으면 null

3. **마감일 (due_date)**: 
   날짜 표현 규칙:
   - "오늘" → ${today}
   - "내일" → ${new Date(now.getTime() + 24*60*60*1000).toISOString().split('T')[0]}
   - "모레" → ${new Date(now.getTime() + 2*24*60*60*1000).toISOString().split('T')[0]}
   - "이번주 금요일" → 가장 가까운 금요일 (${getNextWeekday(5)})
   - "다음주 월요일" → 다음 주의 월요일 (${getNextWeekday(1)})
   - 구체적인 날짜(예: "12월 30일") → 해당 년도의 정확한 날짜로 변환
   - 날짜 정보가 없으면 null
   
   시간 표현 규칙 (due_date에 시간 포함):
   - "아침" → 09:00 (예: "내일 아침" → "${new Date(now.getTime() + 24*60*60*1000).toISOString().split('T')[0]} 09:00")
   - "점심" → 12:00
   - "오후" → 14:00
   - "저녁" → 18:00
   - "밤" → 21:00
   - 구체적인 시간(예: "3시", "오후 3시") → 정확한 시간으로 변환
   - 시간 정보가 없으면 날짜만 반환

4. **우선순위 (priority)**:
   키워드 기반 분류:
   - "high" (높음): "급하게", "중요한", "빨리", "꼭", "반드시", "긴급", "시급"이 포함된 경우
   - "low" (낮음): "여유롭게", "천천히", "언젠가", "나중에", "여유"가 포함된 경우
   - "medium" (보통): "보통", "적당히" 또는 우선순위 키워드가 없는 경우
   기본값: "medium"

5. **카테고리 (category)**:
   키워드 기반 분류:
   - "업무": "회의", "보고서", "프로젝트", "업무", "미팅", "발표", "문서", "이메일"
   - "개인": "쇼핑", "친구", "가족", "개인", "약속", "전화", "연락"
   - "건강": "운동", "병원", "건강", "요가", "헬스", "산책", "검진"
   - "학습": "공부", "책", "강의", "학습", "강좌", "교육", "스터디"
   
   키워드가 여러 카테고리에 해당하면 가장 적합한 것을 선택하고,
   해당하는 키워드가 없으면 "개인"으로 분류

**출력 형식**: 반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트는 절대 포함하지 마세요.

{
  "title": "문자열 (필수)",
  "description": "문자열 또는 null",
  "due_date": "YYYY-MM-DD 또는 YYYY-MM-DD HH:MM 형식의 문자열 또는 null",
  "priority": "high | medium | low",
  "category": "업무 | 개인 | 건강 | 학습"
}

**예시 1**:
입력: "내일 아침까지 급하게 팀 회의 보고서 작성"
출력:
{
  "title": "팀 회의 보고서 작성",
  "description": "급하게 작성 필요",
  "due_date": "${new Date(now.getTime() + 24*60*60*1000).toISOString().split('T')[0]} 09:00",
  "priority": "high",
  "category": "업무"
}

**예시 2**:
입력: "이번주 금요일 저녁에 친구랑 저녁 약속"
출력:
{
  "title": "친구와 저녁 약속",
  "description": null,
  "due_date": "${getNextWeekday(5)} 18:00",
  "priority": "medium",
  "category": "개인"
}

**예시 3**:
입력: "언젠가 여유롭게 파이썬 책 읽기"
출력:
{
  "title": "파이썬 책 읽기",
  "description": "여유 있을 때 진행",
  "due_date": null,
  "priority": "low",
  "category": "학습"
}

이제 위 사용자 입력을 분석하여 JSON 형식으로만 응답해주세요.
`;

    // Gemini API 호출
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // JSON 파싱
    let parsedData;
    try {
      // 텍스트에서 JSON 부분만 추출 (코드 블록이 있을 경우 처리)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('JSON 형식을 찾을 수 없습니다.');
      }
      parsedData = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('JSON 파싱 오류:', parseError);
      console.error('원본 텍스트:', text);
      return NextResponse.json(
        { error: 'AI 응답을 처리하는 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 데이터 검증 및 기본값 설정
    const todoData = {
      title: parsedData.title || input.substring(0, 50),
      description: parsedData.description || null,
      due_date: parsedData.due_date || null,
      priority: ['high', 'medium', 'low'].includes(parsedData.priority) 
        ? parsedData.priority 
        : 'medium',
      category: ['업무', '개인', '학습', '건강'].includes(parsedData.category)
        ? parsedData.category
        : '개인',
    };

    return NextResponse.json({ data: todoData });
  } catch (error) {
    console.error('AI 파싱 오류:', error);

    // 에러 타입별 처리
    if (error instanceof Error) {
      if (error.message.includes('API key') || error.message.includes('API_KEY')) {
        return NextResponse.json(
          { error: 'AI 서비스 인증 오류가 발생했습니다. API 키를 확인해주세요.' },
          { status: 500 }
        );
      }
      if (error.message.includes('quota') || error.message.includes('limit')) {
        return NextResponse.json(
          { error: 'AI 서비스 사용량이 초과되었습니다. 잠시 후 다시 시도해주세요.' },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      { error: 'AI 분석 중 오류가 발생했습니다. 다시 시도해주세요.' },
      { status: 500 }
    );
  }
}
