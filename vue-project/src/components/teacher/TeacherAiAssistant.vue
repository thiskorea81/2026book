// src/components/teacher/TeacherAiAssistant.vue
<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { db } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useTeacherStore } from '@/stores/teacherStore';
import { aiService } from '@/services/aiService';
import { recordSchema, buildRecordPrompt } from '@/services/aiPrompt';
import { getNeisByteLength } from '@/utils/textUtils';
import TeacherActivityDetailView from './TeacherActivityDetailView.vue';

const props = defineProps({
  student: Object,      // 현재 선택된 학생 정보
  teacherKey: String    // 교사 고유 번호
});

const emit = defineEmits(['apply-draft']);
const teacherStore = useTeacherStore();

const isGenerating = ref(false);
const result = ref(null);
const hasApiKey = ref(false); // 💡 API 키 설정 여부 상태

/**
 * 💡 1. 교사의 API 키 설정 여부를 확인하는 함수
 */
const checkApiKeyStatus = async () => {
  if (!props.teacherKey) return;
  try {
    const settingsSnap = await getDoc(doc(db, "teacherSettings", String(props.teacherKey)));
    hasApiKey.value = settingsSnap.exists() && !!settingsSnap.data().geminiApiKey;
  } catch (e) {
    console.error("키 상태 확인 에러:", e);
    hasApiKey.value = false;
  }
};

onMounted(checkApiKeyStatus);
watch(() => props.teacherKey, checkApiKeyStatus); // 교사가 바뀌면 다시 체크

// 학생 변경 시 이전 결과 초기화
watch(() => props.student?.userKey, () => {
  result.value = null;
}, { immediate: true });

/**
 * 💡 2. 모든 활동 데이터 통합 로드
 */
const combinedData = computed(() => {
  const sId = props.student?.studentId || props.student?.userKey;
  if (!sId) return null;

  const userInfo = teacherStore.homeroomStudents.find(u => u.userKey === sId) || props.student;
  const teamInfo = teacherStore.allTeams?.find(t => t.members?.includes(sId));
  const logs = teacherStore.studentLogs.filter(l => l.studentId === sId);
  const evals = teacherStore.studentEvals.filter(e => e.studentId === sId);

  return { userInfo, teamInfo, logs, evals };
});

/**
 * 💡 3. 활동 목록 가공
 */
const activitySummaryList = computed(() => {
  if (!combinedData.value) return [];
  const { logs, evals, teamInfo } = combinedData.value;
  const list = [];

  if (teamInfo) {
    list.push({ 
      category: '팀 정보', 
      label: teamInfo.teamName, 
      content: `[분야] ${teamInfo.careerField}\n[선정 도서] ${teamInfo.bookInfo}` 
    });
  }

  logs.forEach(log => {
    const detail = [`[도서] ${log.title} (${log.author})`, `[요약] ${log.summary}`, `[깨달음] ${log.realization}`].join('\n');
    list.push({ category: '독서일지', label: log.title, content: detail });
  });

  evals.forEach(ev => {
    const detail = [`[탐구 주제] ${ev.careerTopic}`, `[관련 도서] ${ev.bookTitle}`, `[소감] ${ev.reviewAndPlan}`].join('\n');
    list.push({ category: '자기평가서', label: ev.careerTopic, content: detail });
  });

  return list;
});

/**
 * 🪄 AI 종합 초안 생성 (개인 키 사용)
 */
const handleGenerate = async () => {
  if (activitySummaryList.value.length === 0) return alert('분석할 데이터가 없습니다.');

  try {
    isGenerating.value = true;
    
    const settingsSnap = await getDoc(doc(db, "teacherSettings", String(props.teacherKey)));
    const { geminiApiKey, recordPrompt: customPrompt } = settingsSnap.data();

    const basePrompt = customPrompt || `당신은 '꿈꾸는 책방' 지도교사입니다.`;
    const fullActivityText = activitySummaryList.value.map(item => `[${item.category}]\n${item.content}`).join('\n\n');

    // 🚀 Gemini 3 Flash Preview 호출
    const prompt = buildRecordPrompt(basePrompt, combinedData.value.userInfo, fullActivityText);
    const data = await aiService.generateStructuredRecord(prompt, recordSchema, geminiApiKey);
    
    result.value = data;

  } catch (e) {
    alert(e.message);
  } finally {
    isGenerating.value = false;
  }
};

const handleApply = () => { if (result.value) emit('apply-draft', result.value); };
const getByteCount = (text) => getNeisByteLength(text || "");
</script>

<template>
  <div class="mt-10 border-t-2 border-purple-100 pt-8 no-print">
    
    <TeacherActivityDetailView 
      :activity-list="activitySummaryList" 
      :student-name="props.student?.name"
    />

    <template v-if="hasApiKey">
      <div v-if="activitySummaryList.length > 0" class="flex justify-between items-center mb-8 bg-gray-900 p-5 rounded-3xl shadow-xl">
        <div class="text-white">
          <h5 class="font-black text-sm">🤖 Gemini 3 Flash 종합 분석</h5>
          <p class="text-[10px] opacity-60">등록된 개인 API 키를 사용하여 초안을 생성합니다.</p>
        </div>
        <button @click="handleGenerate" :disabled="isGenerating" 
          class="px-8 py-3 bg-purple-500 text-white rounded-2xl text-xs font-black hover:bg-purple-600 transition-all active:scale-95 disabled:bg-gray-700">
          {{ isGenerating ? 'AI 분석 중...' : '종합 초안 생성' }}
        </button>
      </div>

      <div v-if="result" class="animate-fade-in pb-10">
        <div class="bg-white p-8 rounded-[40px] border-4 border-purple-50 shadow-2xl relative">
          <div class="flex justify-between items-center mb-5">
            <span class="px-3 py-1 bg-purple-600 text-white text-[10px] font-black rounded-full shadow-lg">AI DRAFT</span>
            <button @click="handleApply" class="text-[11px] font-black text-purple-600 hover:underline underline-offset-4">
              ✨ 작성 칸에 적용하기
            </button>
          </div>
          <p class="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap font-medium">
            {{ result.autonomous }}
          </p>
        </div>
      </div>
    </template>

    <div v-else class="mb-8 p-6 bg-gray-50 rounded-3xl border border-dashed border-gray-200 text-center">
      <p class="text-xs text-gray-400 font-bold">
        설정 메뉴에서 <span class="text-purple-500">Gemini API 키</span>를 등록하시면 AI 초안 생성 기능을 사용할 수 있습니다.
      </p>
    </div>
  </div>
</template>

<style scoped>
.animate-fade-in { animation: fadeIn 0.4s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
</style>