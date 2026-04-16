<script setup>
import { ref } from 'vue';
import { db } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { aiService } from '@/services/aiService';
import { recordSchema, buildRecordPrompt } from '@/services/aiPrompt';
import { getNeisByteLength } from '@/utils/textUtils';

const props = defineProps({
  student: Object,
  teacherKey: String,
  subTab: String
});

const isGenerating = ref(false);
const result = ref(null);

const handleGenerate = async () => {
  try {
    isGenerating.value = true;
    
    // 1. 프롬프트만 DB에서 가져옵니다 (키는 aiService가 .env에서 처리)
    let customPrompt = `당신은 대한민국 고등학교 담임 교사 비서입니다. 제공된 데이터를 바탕으로 학교생활기록부 '자율활동' 초안을 작성하세요.`;

    const settingsDoc = await getDoc(doc(db, "teacherSettings", props.teacherKey));
    if (settingsDoc.exists() && settingsDoc.data().recordPrompt) {
      customPrompt = settingsDoc.data().recordPrompt;
    }

    // 2. 활동 기록 텍스트화
    const activityText = props.subTab === 'logs' 
      ? `[독서 기록] 도서: ${props.student.title}, 내용: ${props.student.summary}, 깨달은 점: ${props.student.realization}`
      : `[탐구 평가] 주제: ${props.student.careerTopic}, 활동소감: ${props.student.reviewAndPlan}`;

    // 3. AI 생성 요청 (매개변수에서 키를 뺐습니다)
    const prompt = buildRecordPrompt(customPrompt, props.student, activityText);
    const data = await aiService.generateStructuredRecord(prompt, recordSchema);
    
    result.value = data;

  } catch (e) {
    console.error("AI Assistant Error:", e);
    alert("오류 발생: " + e.message);
  } finally {
    isGenerating.value = false;
  }
};

const copyText = (text) => {
  navigator.clipboard.writeText(text);
  alert("복사되었습니다!");
};

const getByteCount = (text) => getNeisByteLength(text);
</script>

<template>
  <div class="mt-8 border-t border-purple-100 pt-6 no-print">
    <div class="flex justify-between items-center mb-5">
      <div class="flex items-center space-x-2">
        <span class="text-2xl animate-bounce">🪄</span>
        <div>
          <h5 class="font-black text-gray-800 text-sm">AI 자율활동 초안 생성기</h5>
          <p class="text-[10px] text-gray-400">시스템 기본 API 키를 사용하여 분석을 시작합니다.</p>
        </div>
      </div>
      <button 
        @click="handleGenerate"
        :disabled="isGenerating"
        class="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-xs font-bold hover:shadow-lg disabled:from-gray-300 transition-all flex items-center"
      >
        <span v-if="isGenerating" class="inline-block animate-spin mr-2">↻</span>
        {{ isGenerating ? 'AI 분석 중...' : '🤖 초안 생성하기' }}
      </button>
    </div>

    <div v-if="result" class="animate-fade-in">
      <div class="bg-white p-6 rounded-2xl border-2 border-purple-100 shadow-sm group">
        <div class="flex justify-between items-center mb-3">
          <div class="flex items-center space-x-2">
            <span class="text-[10px] font-black text-purple-600 uppercase">자율활동 특기사항</span>
            <span class="text-[10px] text-gray-400 font-mono">{{ getByteCount(result.autonomous) }} / 1500 Bytes</span>
          </div>
          <button @click="copyText(result.autonomous)" class="text-[10px] text-gray-400 group-hover:text-purple-500 font-bold transition-colors">
            📋 복사
          </button>
        </div>
        <p class="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap font-medium">
          {{ result.autonomous }}
        </p>
      </div>
    </div>
    
    <div v-else-if="!isGenerating" class="text-center py-12 bg-purple-50/30 rounded-3xl border-2 border-dashed border-purple-100">
      <p class="text-xs text-purple-400 font-bold">학생의 활동 기록을 토대로 마법같은 문구가 생성됩니다.</p>
    </div>
  </div>
</template>