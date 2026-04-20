// src/components/student/SelfEvalForm.vue
<template>
  <div class="space-y-6">
    <div class="flex justify-between items-end border-b pb-4">
      <div class="flex items-center space-x-2">
        <h2 class="text-xl font-black text-gray-800 tracking-tight">자기평가서 작성</h2>
        <span v-if="userStore.mySummary.hasEval" class="bg-blue-600 text-white text-[10px] px-2.5 py-0.5 rounded-full font-black shadow-sm">
          제출 완료
        </span>
      </div>
      <div class="text-right">
        <span v-if="saveStatus" class="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-100">
          {{ saveStatus }}
        </span>
      </div>
    </div>

    <div v-if="userStore.mySummary.hasEval" class="bg-blue-50 border-2 border-blue-100 p-5 rounded-3xl flex items-center justify-between animate-fade-in shadow-sm">
      <div class="flex items-center space-x-4">
        <div class="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-2xl shadow-sm">📝</div>
        <div>
          <p class="text-sm font-black text-blue-900">평가서 제출이 완료되었습니다.</p>
          <p class="text-[11px] text-blue-600 font-bold opacity-80">작성하신 내용은 지도 선생님의 생기부 초안 작성에 반영됩니다.</p>
        </div>
      </div>
    </div>

    <div v-if="isInitialLoading" class="py-20 text-center text-gray-400 font-bold animate-pulse">
      데이터를 불러오는 중입니다...
    </div>

    <form v-else @submit.prevent="handleSubmit" class="space-y-6">
      <div class="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
        <div>
          <label class="block text-[11px] font-black text-gray-400 mb-1">학번</label>
          <input :value="userStore.currentUser.userKey" disabled class="w-full p-2 bg-white border border-gray-100 rounded-xl text-gray-500 font-bold text-sm">
        </div>
        <div>
          <label class="block text-[11px] font-black text-gray-400 mb-1">이름</label>
          <input :value="userStore.currentUser.name" disabled class="w-full p-2 bg-white border border-gray-100 rounded-xl text-gray-500 font-bold text-sm">
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="md:col-span-2">
          <label class="block text-sm font-black text-gray-700 mb-1.5">읽은 책 제목</label>
          <input v-model="form.bookTitle" type="text" :disabled="userStore.mySummary.hasEval" required 
            class="w-full p-3 border-2 border-gray-100 rounded-2xl focus:border-green-500 outline-none transition-all disabled:bg-gray-50 font-medium">
        </div>
        <div>
          <label class="block text-sm font-black text-gray-700 mb-1.5">진로 탐구 주제</label>
          <input v-model="form.careerTopic" type="text" :disabled="userStore.mySummary.hasEval" required 
            class="w-full p-3 border-2 border-gray-100 rounded-2xl focus:border-green-500 outline-none transition-all disabled:bg-gray-50">
        </div>
        <div>
          <label class="block text-sm font-black text-gray-700 mb-1.5">진로 희망(직업)</label>
          <input v-model="form.careerGoal" type="text" :disabled="userStore.mySummary.hasEval" required 
            class="w-full p-3 border-2 border-gray-100 rounded-2xl focus:border-green-500 outline-none transition-all disabled:bg-gray-50">
        </div>
        <div>
          <label class="block text-sm font-black text-gray-700 mb-1.5">진학 희망(학과)</label>
          <input v-model="form.majorGoal" type="text" :disabled="userStore.mySummary.hasEval" required 
            class="w-full p-3 border-2 border-gray-100 rounded-2xl focus:border-green-500 outline-none transition-all disabled:bg-gray-50">
        </div>
        <div class="md:col-span-2">
          <label class="block text-sm font-black text-gray-700 mb-1.5">진로 탐구활동 관련 분야 및 교과</label>
          <input v-model="form.subjectField" type="text" :disabled="userStore.mySummary.hasEval" placeholder="예: 생명과학, 의학" required 
            class="w-full p-3 border-2 border-gray-100 rounded-2xl focus:border-green-500 outline-none transition-all disabled:bg-gray-50">
        </div>
      </div>

      <div class="space-y-6 border-t pt-6">
        <div>
          <label class="block text-sm font-black text-gray-700 mb-1.5">모둠 내 자신의 역할</label>
          <input v-model="form.roleInTeam" type="text" :disabled="userStore.mySummary.hasEval" placeholder="예: 자료 조사, 실험 설계 등" required 
            class="w-full p-3 border-2 border-gray-100 rounded-2xl focus:border-green-500 outline-none transition-all disabled:bg-gray-50">
        </div>
        <div>
          <label class="block text-sm font-black text-gray-700 mb-1.5">주제 선정 동기</label>
          <textarea v-model="form.motivation" rows="3" :disabled="userStore.mySummary.hasEval" required 
            class="w-full p-4 border-2 border-gray-100 rounded-2xl outline-none focus:border-green-500 transition-all disabled:bg-gray-50 resize-none"></textarea>
        </div>
        <div>
          <label class="block text-sm font-black text-gray-700 mb-1.5">활동 소감 및 후속 탐구 계획</label>
          <textarea v-model="form.reviewAndPlan" rows="6" :disabled="userStore.mySummary.hasEval" required 
            class="w-full p-4 border-2 border-gray-100 rounded-2xl outline-none focus:border-green-500 transition-all disabled:bg-gray-50 resize-none"></textarea>
        </div>
      </div>

      <div class="flex gap-4 pt-4">
        <button v-if="!userStore.mySummary.hasEval" type="button" @click="manualSave" 
          class="flex-1 py-4 bg-white border-2 border-gray-200 text-gray-600 font-black rounded-2xl hover:bg-gray-50 transition-all active:scale-95">
          💾 임시저장
        </button>

        <button v-if="userStore.mySummary.hasEval" type="button" @click="handleCancel"
          class="w-full py-4 bg-red-50 text-red-600 border-2 border-red-200 font-black rounded-2xl hover:bg-red-100 shadow-sm transition-all active:scale-95">
          🚫 제출 취소하고 수정하기
        </button>
        
        <button v-else type="submit" :disabled="activityStore.isLoading"
          class="flex-[2] py-4 bg-green-600 text-white font-black rounded-2xl hover:bg-green-700 shadow-xl shadow-green-100 transition-all disabled:opacity-50 active:scale-95">
          {{ activityStore.isLoading ? '제출 중...' : '자기평가서 최종 제출' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { reactive, onMounted, onUnmounted, ref } from 'vue';
import { useUserStore } from '@/stores/userStore';
import { useActivityStore } from '@/stores/activityStore';

const userStore = useUserStore();
const activityStore = useActivityStore();
const saveStatus = ref('');
const isInitialLoading = ref(true);
let autoSaveTimer = null;

const form = reactive({
  bookTitle: '', careerTopic: '', careerGoal: '', majorGoal: '',
  subjectField: '', roleInTeam: '', motivation: '', reviewAndPlan: ''
});

onMounted(async () => {
  isInitialLoading.value = true;
  
  if (!userStore.currentUser.userKey) {
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // 🚀 데이터 로드 우선순위: 제출본(최종) > 임시저장본
  if (userStore.mySummary.hasEval) {
    const latest = await activityStore.fetchLatestSubmission('selfEvaluations');
    if (latest) {
      Object.assign(form, latest);
      saveStatus.value = '최종 제출본 열람 중';
    }
  } else {
    const draft = await activityStore.fetchDraft('eval');
    if (draft) {
      Object.assign(form, draft);
      saveStatus.value = '임시 저장본 로드 완료';
    }
  }

  isInitialLoading.value = false;

  // 제출 전일 때만 자동 저장 타이머 작동
  if (!userStore.mySummary.hasEval) {
    autoSaveTimer = setInterval(() => {
      const hasContent = Object.values(form).some(v => v && v.trim() !== '');
      if (hasContent && !activityStore.isLoading) {
        activityStore.saveDraft('eval', { ...form });
        const now = new Date();
        saveStatus.value = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')} 자동 저장됨`;
      }
    }, 30000);
  }
});

onUnmounted(() => { if (autoSaveTimer) clearInterval(autoSaveTimer); });

const manualSave = async () => {
  await activityStore.saveDraft('eval', { ...form });
  alert('현재 내용이 임시 저장되었습니다.');
};

const handleCancel = async () => {
  const success = await activityStore.cancelEvaluation();
  if (success) {
    saveStatus.value = '제출 취소됨 (수정 가능)';
  }
};

const handleSubmit = async () => {
  if (!confirm('최종 제출하시겠습니까? 제출 후에는 수정이 제한됩니다.')) return;
  const success = await activityStore.submitForm('자기평가서', { ...form });
  if (success) {
    if (autoSaveTimer) clearInterval(autoSaveTimer);
    saveStatus.value = '최종 제출 완료';
    alert('성공적으로 제출되었습니다.');
  }
};
</script>