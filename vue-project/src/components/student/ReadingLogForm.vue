<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center border-b pb-2">
      <h2 class="text-xl font-bold text-gray-800">독서일지 작성</h2>
      <span v-if="saveStatus" class="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full border border-blue-100">
        {{ saveStatus }}
      </span>
    </div>

    <div class="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg text-sm text-blue-800 space-y-1">
      <h4 class="font-bold mb-2">💡 독서일지 작성 가이드</h4>
      <ul class="list-disc pl-5">
        <li>매시간 읽은 날짜와 쪽수를 씁니다.</li>
        <li>수업 50분 중 40분은 독서, 10분은 독서 일지를 작성합니다.</li>
        <li>책의 내용과 관련 있는 경험이나 최근 시사 쟁점을 떠올려 보세요.</li>
        <li>매시간 꾸준히 쓰는 것이 중요합니다!</li>
      </ul>
    </div>

    <div v-if="isInitialLoading" class="py-20 text-center text-gray-400 font-bold animate-pulse">
      도서 정보를 불러오는 중입니다...
    </div>

    <form v-else @submit.prevent="submitForm" class="space-y-4">
      <div class="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
        <div>
          <label class="block text-xs text-gray-500 mb-1">학번</label>
          <input type="text" :value="userStore.currentUser.userKey" disabled class="w-full p-2 bg-gray-200 rounded border text-gray-500">
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">이름</label>
          <input type="text" :value="userStore.currentUser.name" disabled class="w-full p-2 bg-gray-200 rounded border text-gray-500">
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-semibold mb-1">책 제목</label>
          <input v-model="form.title" type="text" required class="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 outline-none">
        </div>
        <div>
          <label class="block text-sm font-semibold mb-1">글쓴이</label>
          <input v-model="form.author" type="text" required class="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 outline-none">
        </div>
      </div>

      <div>
        <label class="block text-sm font-semibold mb-1">읽은 날짜</label>
        <input v-model="form.date" type="date" required class="p-2 border rounded focus:ring-2 focus:ring-green-500 outline-none">
      </div>

      <div>
        <label class="block text-sm font-semibold mb-1">책의 중심 내용 및 줄거리</label>
        <textarea v-model="form.summary" rows="3" required class="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 outline-none"></textarea>
      </div>

      <div>
        <label class="block text-sm font-semibold mb-1">가장 인상 깊거나 흥미로운 부분</label>
        <textarea v-model="form.impression" rows="3" required class="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 outline-none"></textarea>
      </div>

      <div>
        <label class="block text-sm font-semibold mb-1">새롭게 깨달은 점</label>
        <textarea v-model="form.realization" rows="3" required class="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 outline-none"></textarea>
      </div>

      <div>
        <label class="block text-sm font-semibold mb-1">책 내용을 잘 이해하기 위해 사용한 독서 방법과 효과</label>
        <textarea v-model="form.method" rows="3" required class="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 outline-none"></textarea>
      </div>

      <div class="flex gap-3">
        <button type="button" @click="manualSave" 
          class="flex-1 py-3 bg-white border-2 border-gray-200 text-gray-600 font-bold rounded-lg hover:bg-gray-50">
          💾 임시저장
        </button>
        <button type="submit" :disabled="activityStore.isLoading"
          class="flex-[2] py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 shadow-md transition-colors disabled:opacity-50">
          {{ activityStore.isLoading ? '제출 중...' : '독서일지 제출하기' }}
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
  title: '', author: '', date: '',
  summary: '', impression: '', realization: '', method: ''
});

onMounted(async () => {
  isInitialLoading.value = true;
  
  // 1. 오늘 날짜 세팅
  const today = new Date().toISOString().split('T')[0];
  form.date = today;

  // 2. 임시 저장(Draft) 데이터 확인
  const draft = await activityStore.fetchDraft('log');
  if (draft) {
    Object.assign(form, draft);
    saveStatus.value = '임시 저장본 로드 완료';
  } else {
    // 3. 임시 저장이 없으면 가장 최근 제출한 일지의 제목/저자 로드
    const latest = await activityStore.fetchLatestSubmission('readingLogs');
    if (latest) {
      form.title = latest.title;
      form.author = latest.author;
      saveStatus.value = '최근 도서 정보 로드';
    }
  }

  isInitialLoading.value = false;

  // 💡 30초 자동 저장 타이머 시작
  autoSaveTimer = setInterval(() => {
    // 제목이나 줄거리 중 하나라도 입력되었을 때만 실행
    if ((form.title || form.summary) && !activityStore.isLoading) {
      activityStore.saveDraft('log', { ...form });
      const now = new Date();
      saveStatus.value = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')} 자동 저장됨`;
    }
  }, 30000);
});

onUnmounted(() => {
  if (autoSaveTimer) clearInterval(autoSaveTimer);
});

const manualSave = async () => {
  await activityStore.saveDraft('log', { ...form });
  alert('현재 내용이 임시 저장되었습니다.');
};

const submitForm = async () => {
  if (!confirm('독서일지를 제출하시겠습니까?')) return;
  const success = await activityStore.submitForm('독서일지', { ...form });
  if (success) {
    // 성공 시 서술형 내용만 초기화 (날짜, 제목, 저자는 유지하여 다음 시간 작성 편의 제공)
    form.summary = ''; form.impression = ''; form.realization = ''; form.method = '';
    saveStatus.value = '제출 완료';
  }
};
</script>