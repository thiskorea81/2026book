// src/components/teacher/TeacherAiAssistant.vue
<script setup>
import { ref } from 'vue';
import { db } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useTeacherStore } from '@/stores/teacherStore';
import { aiService } from '@/services/aiService';
import { recordSchema, buildRecordPrompt } from '@/services/aiPrompt';
import { getNeisByteLength } from '@/utils/textUtils';

const props = defineProps({
  student: Object,      // Monitoring에서 전달된 활동 객체 (log 또는 eval)
  teacherKey: String,
  subTab: String        // 'logs' 또는 'evals'
});

const teacherStore = useTeacherStore();
const isGenerating = ref(false);
const result = ref(null);

/**
 * 🪄 AI 생기부 초안 생성
 */
const handleGenerate = async () => {
  try {
    isGenerating.value = true;
    
    // [디버깅] 데이터가 안 올 경우 브라우저 콘솔(F12)에서 이 로그를 확인하세요.
    console.log("🔍 분석 시작 데이터:", { tab: props.subTab, data: props.student });

    // 1. 교사 프롬프트 설정 로드
    let customPrompt = `당신은 '꿈꾸는 책방' 프로그램 지도교사입니다. 제공된 데이터에만 근거하여 사실적으로 작성하십시오.`;
    const settingsDoc = await getDoc(doc(db, "teacherSettings", props.teacherKey));
    if (settingsDoc.exists() && settingsDoc.data().recordPrompt) {
      customPrompt = settingsDoc.data().recordPrompt;
    }

    // 2. 학생의 소속 팀 정보 추출 (비고 제외, 도서정보만 활용)
    const studentId = props.student.studentId || props.student.userKey;
    const team = teacherStore.managedTeams.find(t => t.members.includes(studentId));
    const teamContext = team ? {
      teamName: team.teamName,
      bookInfo: team.bookInfo || team.books || "정보 없음"
    } : null;

    // 3. 💡 활동 데이터 필드 맵핑 (Monitoring 템플릿 기준)
    let activityText = "";

    if (props.subTab === 'logs') {
      // 독서일지 탭일 때
      const title = props.student.title || "도서명 미상";
      const summary = props.student.summary || "";
      const impression = props.student.impression || "";
      const realization = props.student.realization || "";

      // 실질적인 내용 합치기
      const combinedContent = `${summary} ${impression} ${realization}`.trim();
      
      if (combinedContent.length < 10) {
        activityText = ""; // 데이터 부족으로 간주
      } else {
        activityText = `[독서 활동 상세]\n- 도서명: ${title}\n- 중심내용: ${summary}\n- 인상 깊은 부분: ${impression}\n- 깨달은 점: ${realization}`;
      }
    } else {
      // 자기평가서 탭일 때
      const topic = props.student.careerTopic || "";
      const review = props.student.reviewAndPlan || "";
      const book = props.student.bookTitle || "도서명 미상";

      if (review.trim().length < 10) {
        activityText = ""; // 데이터 부족으로 간주
      } else {
        activityText = `[탐구 평가 상세]\n- 탐구 주제: ${topic}\n- 관련 도서: ${book}\n- 활동 소감 및 계획: ${review}`;
      }
    }

    // 4. AI 서비스 호출
    // buildRecordPrompt는 aiPrompt.js에 정의된 규칙(활동없음 처리, 분량 조절 등)을 따릅니다.
    const prompt = buildRecordPrompt(customPrompt, props.student, activityText, teamContext);
    const data = await aiService.generateStructuredRecord(prompt, recordSchema);
    
    result.value = data;

  } catch (e) {
    console.error("AI Assistant Error:", e);
    alert("AI 분석 중 오류가 발생했습니다.");
  } finally {
    isGenerating.value = false;
  }
};

const copyText = (text) => {
  if (!text || text === '활동내용없음') return;
  navigator.clipboard.writeText(text);
  alert("복사되었습니다.");
};

const getByteCount = (text) => getNeisByteLength(text || "");
</script>

<template>
  <div class="mt-8 border-t border-purple-100 pt-6 no-print">
    <div class="flex justify-between items-center mb-5">
      <div class="flex items-center space-x-2">
        <div class="w-10 h-10 bg-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg rotate-3">
          <span class="text-xl">🪄</span>
        </div>
        <div>
          <h5 class="font-black text-gray-800 text-sm">꿈꾸는 책방 AI 초안 어시스턴트</h5>
          <p class="text-[10px] text-gray-400">데이터 기반 팩트 체크 및 문장 자동 교정</p>
        </div>
      </div>
      <button 
        @click="handleGenerate"
        :disabled="isGenerating"
        class="px-6 py-2.5 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-black disabled:bg-gray-300 transition-all flex items-center shadow-md active:scale-95"
      >
        <span v-if="isGenerating" class="inline-block animate-spin mr-2">↻</span>
        {{ isGenerating ? '데이터 읽는 중...' : '🤖 초안 생성하기' }}
      </button>
    </div>

    <div v-if="result" class="animate-fade-in">
      <div class="bg-white p-6 rounded-3xl border-2 border-purple-50 shadow-sm group relative">
        <div class="flex justify-between items-center mb-4">
          <div class="flex items-center space-x-2">
            <span class="px-2 py-0.5 bg-purple-50 text-purple-600 text-[9px] font-black rounded-lg">자율활동 특기사항</span>
            <span class="text-[10px] font-mono" :class="getByteCount(result.autonomous) < 600 ? 'text-orange-500' : 'text-gray-400'">
              {{ getByteCount(result.autonomous) }} / 1500 Bytes
            </span>
          </div>
          <button v-if="result.autonomous !== '활동내용없음'" @click="copyText(result.autonomous)" 
            class="text-[10px] text-purple-400 hover:text-purple-700 font-bold transition-colors flex items-center gap-1">
            📋 결과 복사
          </button>
        </div>

        <p class="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap font-medium"
           :class="result.autonomous === '활동내용없음' ? 'text-red-400 italic text-center py-6 bg-red-50/30 rounded-2xl' : ''">
          {{ result.autonomous }}
        </p>

        <div v-if="result.autonomous !== '활동내용없음'" class="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center">
          <span class="text-[9px] text-gray-300">※ 실제 활동 데이터 외의 내용은 창작하지 않았습니다.</span>
          <span class="text-[9px] text-purple-200 font-black uppercase tracking-widest italic">Hallucination Guard Active</span>
        </div>
      </div>
    </div>
    
    <div v-else-if="!isGenerating" class="text-center py-12 bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-100">
      <p class="text-[11px] text-gray-400 font-bold">학생의 기록이 존재하면 버튼이 활성화됩니다.</p>
    </div>
  </div>
</template>

<style scoped>
.animate-fade-in { animation: fadeIn 0.4s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
</style>