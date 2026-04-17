// src/services/aiService.js
import { GoogleGenAI } from "@google/genai";
import { zodToJsonSchema } from "zod-to-json-schema";

export const aiService = {
  /**
   * 💡 개별 교사의 API 키를 사용하여 Gemini 3 Flash 모델로 분석을 수행합니다.
   */
  async generateStructuredRecord(prompt, schema, teacherApiKey) {
    try {
      if (!teacherApiKey || teacherApiKey.trim() === "") {
        throw new Error("설정된 AI API 키가 없습니다. 설정 메뉴에서 키를 등록해주세요.");
      }

      const apiKey = teacherApiKey.trim().replace(/['"]/g, "");
      const ai = new GoogleGenAI({ apiKey });

      // 🚀 선생님께서 제시하신 Gemini 3 Flash Preview 모델 사용
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        generationConfig: {
          responseMimeType: "application/json",
          responseJsonSchema: zodToJsonSchema(schema),
        },
      });

      // AI 응답 텍스트 추출
      let rawText = typeof response.text === 'function' ? response.text() : response.text;

      // JSON 세척 로직 (설명글이나 마크다운 기호 제거)
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("AI 응답에서 유효한 데이터를 찾을 수 없습니다.");
      }
      
      const parsedData = JSON.parse(jsonMatch[0]);
      
      // Zod 스키마 검증 후 반환
      return schema.parse(parsedData);
      
    } catch (error) {
      console.error("❌ AI 서비스 에러:", error);
      if (error.message.includes("API_KEY_INVALID")) {
        throw new Error("입력하신 Gemini API 키가 유효하지 않습니다.");
      }
      throw error;
    }
  }
};