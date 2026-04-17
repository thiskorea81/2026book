import { GoogleGenAI } from "@google/genai";
import { zodToJsonSchema } from "zod-to-json-schema";

export const aiService = {
  async generateStructuredRecord(prompt, schema) {
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim().replace(/['"]/g, "");
      const ai = new GoogleGenAI({ apiKey });

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        generationConfig: {
          responseMimeType: "application/json",
          responseJsonSchema: zodToJsonSchema(schema),
        },
      });

      // 💡 1. AI 응답 텍스트 가져오기
      let rawText = typeof response.text === 'function' ? response.text() : response.text;

      // 💡 2. JSON 세척 로직 (설명글이나 마크다운 제거)
      // { 로 시작해서 } 로 끝나는 부분만 찾아냅니다.
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("AI 응답에서 유효한 JSON 형식을 찾을 수 없습니다.");
      }
      
      const cleanedJson = jsonMatch[0];
      const parsedData = JSON.parse(cleanedJson);
      
      return schema.parse(parsedData);
      
    } catch (error) {
      console.error("❌ AI 서비스 에러:", error);
      // 에러가 나면 원본 텍스트가 뭐였는지 콘솔에 찍어봅니다 (디버깅용)
      throw error;
    }
  }
};