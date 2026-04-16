import { z } from "zod";

/**
 * 💡 생기부 구조 정의 (자율활동 전용)
 */
export const recordSchema = z.object({
  autonomous: z.string().describe("자율활동 특기사항 (약 500자, 1500바이트 내외)")
});

/**
 * 🎓 자율활동 초안 생성 프롬프트 빌더
 */
export const buildRecordPrompt = (basePrompt, student, activityText) => {
  return `
    ${basePrompt}

    당신은 학생의 개별적 특성과 활동의 구체적 과정이 드러나도록 기록하는 대한민국 고등학교 교사입니다.
    제공된 데이터를 바탕으로 학교생활기록부 '자율활동'란에 입력할 문장을 작성하세요.

    [학생 정보]
    - 이름: ${student.studentName}
    - 학번: ${student.studentId}
    
    [활동 데이터]
    ${activityText}

    [🌟 작성 규칙]
    1. 분량: 1500바이트(한글 약 500자) 이내로 작성하세요.
    2. 형식: '책 제목 (저자)' 형식을 엄격히 준수하세요.
    3. 문체: '~함', '~임'과 같은 명사형 종결 어미를 사용하며, 구체적인 행동과 성취가 드러나야 합니다.
  `;
};