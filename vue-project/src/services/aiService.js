import { GoogleGenAI } from "@google/genai";
import { zodToJsonSchema } from "zod-to-json-schema";

export const aiService = {
  async generateStructuredRecord(prompt, schema) {
    try {
      // 💡 환경 변수 로드 확인용 로그 (나중에 삭제하세요)
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      console.log("🔑 API Key 로드 시도:", apiKey ? "성공 (값 있음)" : "실패 (값 없음)");

      if (!apiKey) {
        throw new Error(".env 파일의 VITE_GEMINI_API_KEY가 읽히지 않습니다. 서버 재시작을 확인하세요.");
      }

      // 생성자 호출
      const genAI = new GoogleGenAI(apiKey);
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash" // 💡 preview 대신 안정적인 모델명 권장
      });

      const response = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseJsonSchema: zodToJsonSchema(schema),
        },
      });

      const rawText = response.response.text();
      return schema.parse(JSON.parse(rawText));
      
    } catch (error) {
      console.error("❌ AI 서비스 에러 상세:", error);
      throw error;
    }
  }
};