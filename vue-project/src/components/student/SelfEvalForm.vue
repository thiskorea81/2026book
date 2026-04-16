<template>
  <div class="space-y-6">
    <div class="flex justify-between items-end border-b pb-2">
      <div class="flex items-center space-x-2">
        <h2 class="text-xl font-bold text-gray-800">자기평가서 작성</h2>
        <span v-if="userStore.mySummary.hasEval" class="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-full font-bold border border-blue-200">
          제출됨
        </span>
      </div>
      <div class="text-right">
        <span v-if="saveStatus" class="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-100">
          {{ saveStatus }}
        </span>
      </div>
    </div>

    <div v-if="isInitialLoading" class="py-20 text-center text-gray-400 font-bold animate-pulse">
      데이터를 불러오는 중입니다...
    </div>

    <form v-else @submit.prevent="handleSubmit" class="space-y-5">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-semibold mb-1">학번</label>
          <input :value="userStore.currentUser.userKey" disabled class="w-full p-2 bg-gray-100 border rounded text-gray-500">
        </div>
        <div>
          <label class="block text-sm font-semibold mb-1">이름</label>
          <input :value="userStore.currentUser.name" disabled class="w-full p-2 bg-gray-100 border rounded text-gray-500">
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="md:col-span-2">
          <label class="block text-sm font-semibold mb-1">책 제목</label>
          <input v-model="form.bookTitle" type="text" :disabled="userStore.mySummary.hasEval" required class="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 outline-none disabled:bg-gray-50">
        </div>
        <div>
          <label class="block text-sm font-semibold mb-1">진로 탐구 주제</label>
          <input v-model="form.careerTopic" type="text" :disabled="userStore.mySummary.hasEval" required class="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 outline-none disabled:bg-gray-50">
        </div>
        <div>
          <label class="block text-sm font-semibold mb-1">진로 희망(직업)</label>
          <input v-model="form.careerGoal" type="text" :disabled="userStore.mySummary.hasEval" required class="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 outline-none disabled:bg-gray-50">
        </div>
        <div>
          <label class="block text-sm font-semibold mb-1">진학 희망(학과)</label>
          <input v-model="form.majorGoal" type="text" :disabled="userStore.mySummary.hasEval" required class="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 outline-none disabled:bg-gray-50">
        </div>
        <div class="md:col-span-2">
          <label class="block text-sm font-semibold mb-1">진로 탐구활동 관련 분야 및 교과</label>
          <input v-model="form.subjectField" type="text" :disabled="userStore.mySummary.hasEval" placeholder="예: 생명과학, 의학" required class="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 outline-none disabled:bg-gray-50">
        </div>
      </div>

      <div class="space-y-4 border-t pt-4">
        <div>
          <label class="block text-sm font-semibold mb-1">모둠 내 자신의 역할</label>
          <input v-model="form.roleInTeam" type="text" :disabled="userStore.mySummary.hasEval" placeholder="예: 자료 조사, 실험 설계 등" required class="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 outline-none disabled:bg-gray-50">
        </div>
        <div>
          <label class="block text-sm font-semibold mb-1">주제 선정 동기</label>
          <textarea v-model="form.motivation" rows="3" :disabled="userStore.mySummary.hasEval" required class="w-full p-2 border rounded outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-50"></textarea>
        </div>
        <div>
          <label class="block text-sm font-semibold mb-1">활동 소감 및 후속 탐구 계획</label>
          <textarea v-model="form.reviewAndPlan" rows="6" :disabled="userStore.mySummary.hasEval" required class="w-full p-2 border rounded outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-50"></textarea>
        </div>
      </div>

      <div class="flex gap-3 pt-2">
        <button v-if="!userStore.mySummary.hasEval" type="button" @click="manualSave" 
          class="flex-1 py-3 bg-white border-2 border-gray-200 text-gray-600 font-bold rounded-lg hover:bg-gray-50 transition-all">
          💾 임시저장
        </button>

        <button v-if="userStore.mySummary.hasEval" type="button" @click="handleCancel"
          class="w-full py-4 bg-red-50 text-red-600 border-2 border-red-200 font-bold rounded-xl hover:bg-red-100 shadow-sm transition-all">
          🚫 제출 취소하고 수정하기
        </button>
        
        <button v-else type="submit" :disabled="activityStore.isLoading"
          class="flex-[2] py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-md transition-all disabled:opacity-50">
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

  // 데이터 로드: 임시저장 -> 제출본 순서
  const draft = await activityStore.fetchDraft('eval');
  if (draft) {
    Object.assign(form, draft);
    saveStatus.value = '임시 저장본 로드';
  } else {
    const latest = await activityStore.fetchLatestSubmission('selfEvaluations');
    if (latest) {
      Object.assign(form, latest);
      saveStatus.value = '제출된 내용 로드';
    }
  }

  isInitialLoading.value = false;

  // 💡 제출되지 않았을 때만 자동 저장 실행
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
    // 취소 성공 시 자동 저장 타이머 다시 시작할지 여부 결정 가능
    saveStatus.value = '제출 취소됨 (수정 가능)';
  }
};

const handleSubmit = async () => {
  if (!confirm('최종 제출하시겠습니까? 제출 후에는 수정이 차단되며 취소 후 다시 수정할 수 있습니다.')) return;
  await activityStore.submitForm('자기평가서', { ...form });
};
</script>