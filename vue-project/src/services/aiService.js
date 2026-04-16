import { GoogleGenAI } from "@google/genai";
import { zodToJsonSchema } from "zod-to-json-schema";

export const aiService = {
  /**
   * 🤖 구조화된 응답(JSON)을 반환하는 핵심 함수
   * @param {string} dbApiKey - 선생님이 개인 설정한 키 (null 가능)
   * @param {string} prompt - 전송할 프롬프트
   * @param {z.ZodObject} schema - 데이터 구조(Zod)
   */
  async generateStructuredRecord(dbApiKey, prompt, schema) {
    try {
      // 1. 키 결정: DB에 저장된 개인 키가 없으면 .env의 VITE_GEMINI_API_KEY를 사용
      const finalApiKey = dbApiKey || import.meta.env.VITE_GEMINI_API_KEY;

      if (!finalApiKey) {
        throw new Error("설정된 API Key가 없습니다. AI 설정 탭에서 입력하거나 .env 파일을 확인해주세요.");
      }

      // 2. 결정된 키로 클라이언트 및 모델 초기화
      const genAI = new GoogleGenAI(finalApiKey);
      
      // 최신 Gemini 3 Flash 모델 사용
      const model = genAI.getGenerativeModel({ 
        model: "gemini-3-flash-preview" 
      });

      // 3. AI 요청 (구조화된 출력 설정)
      const response = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseJsonSchema: zodToJsonSchema(schema),
        },
      });

      // 4. 결과 파싱 및 Zod 검증
      const rawText = response.response.text();
      const parsedData = JSON.parse(rawText);
      
      return schema.parse(parsedData);
      
    } catch (error) {
      console.error("AI 생기부 생성 실패:", error);
      throw error; // 상위 컴포넌트(Assistant)에서 에러를 잡도록 던짐
    }
  }
};