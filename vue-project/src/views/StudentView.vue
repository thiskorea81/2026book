<template>
  <div class="min-h-screen bg-gray-50 font-sans">
    <nav class="bg-white shadow-sm border-b px-4 sm:px-6 py-4 flex justify-between items-center sticky top-0 z-20">
      <h1 class="text-lg sm:text-xl font-bold text-green-600 flex items-center truncate mr-2">
        <span class="mr-2">🌱</span> <span class="hidden xs:inline">상당고</span> 학년특색
      </h1>
      <div class="flex items-center space-x-2 sm:space-x-4 shrink-0">
        <button @click="router.push('/change-password')" class="text-[11px] sm:text-sm font-medium text-gray-500 hover:text-green-600">비밀번호 변경</button>
        <button @click="handleLogout" class="text-[11px] sm:text-sm font-medium text-gray-500 hover:text-red-500">로그아웃</button>
      </div>
    </nav>

    <div v-if="isUserLoading" class="flex flex-col justify-center items-center h-[70vh] text-green-600 font-bold space-y-4">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      <p>데이터 로딩 중...</p>
    </div>

    <main v-else class="max-w-4xl mx-auto p-4 sm:p-6 mt-2 sm:mt-4 pb-20">
      <div class="mb-6 sm:mb-8 px-2">
        <h2 class="text-xl sm:text-2xl font-black text-gray-800">
          반가워요, <span class="text-green-600">{{ userStore.currentUser.name }}</span>님!
        </h2>
        <p class="text-[11px] sm:text-sm text-gray-500">학번: {{ userStore.currentUser.userKey }}</p>
      </div>

      <div class="flex bg-white rounded-2xl shadow-sm border border-gray-200 p-1 mb-6 sm:mb-8 overflow-x-auto scrollbar-hide flex-nowrap">
        <button 
          v-for="tab in filteredTabs" 
          :key="tab.id" 
          @click="activeTab = tab.id"
          class="flex-none px-4 py-3 text-[13px] sm:text-sm font-bold text-center transition-all rounded-xl whitespace-nowrap shrink-0"
          :class="activeTab === tab.id ? 'bg-green-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'"
        >
          {{ tab.label }}
        </button>
      </div>

      <div class="bg-white rounded-[2rem] sm:rounded-[3rem] shadow-xl border border-gray-100 p-5 sm:p-8 relative min-h-[450px]">
        <div v-if="userStore.isLoading || activityStore.isLoading || qaStore.isLoading" 
          class="absolute inset-0 bg-white/60 flex items-center justify-center z-10 rounded-[2rem] sm:rounded-[3rem]">
          <div class="flex flex-col items-center space-y-2">
            <div class="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
            <p class="text-green-600 text-xs font-bold">로딩 중...</p>
          </div>
        </div>

        <ProgramApplyForm v-if="activeTab === 'program' && userStore.menuSettings.program" />
        <BookApplyForm v-else-if="activeTab === 'book' && userStore.menuSettings.book" />
        <ReadingLogForm v-else-if="activeTab === 'log' && userStore.menuSettings.log" />
        <ReadingLogList v-else-if="activeTab === 'history' && userStore.menuSettings.history" />
        <SelfEvalForm v-else-if="activeTab === 'eval' && userStore.menuSettings.eval" />
        <QAView v-else-if="activeTab === 'qa' && userStore.menuSettings.qa" />
        <MyInfo v-else-if="activeTab === 'myinfo'" />
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/userStore';
import { useActivityStore } from '@/stores/activityStore';
import { useQaStore } from '@/stores/qaStore';
import { auth, db } from '@/firebase';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

// 컴포넌트 생략...
import MyInfo from '@/components/student/MyInfo.vue';
import ProgramApplyForm from '@/components/student/ProgramApplyForm.vue';
import BookApplyForm from '@/components/student/BookApplyForm.vue';
import ReadingLogForm from '@/components/student/ReadingLogForm.vue';
import ReadingLogList from '@/components/student/ReadingLogList.vue';
import SelfEvalForm from '@/components/student/SelfEvalForm.vue';
import QAView from '@/components/student/QAView.vue';

const router = useRouter();
const userStore = useUserStore();
const activityStore = useActivityStore();
const qaStore = useQaStore();

const isUserLoading = ref(true);
const activeTab = ref('myinfo'); // 💡 기본값을 'program'으로 설정 (주석 내용과 일치시킴)

const allTabs = [
  { id: 'program', label: '🚀 프로그램 신청' },
  { id: 'book', label: '📚 도서 신청' },
  { id: 'log', label: '📝 새 일지 작성' }, 
  { id: 'eval', label: '✅ 자기평가서 제출' },
  { id: 'history', label: '📜 나의 활동 기록' }, 
  { id: 'qa', label: '❓ 질문하기' },
  { id: 'myinfo', label: '👤 내 정보' },        
];

const filteredTabs = computed(() => {
  return allTabs.filter(tab => tab.id === 'myinfo' || userStore.menuSettings[tab.id]);
});

/**
 * 💡 최적화: QAView 내부에 실시간 리스너가 있으므로, 
 * 여기서 qaStore.fetchMyQuestions()를 호출할 필요가 없습니다. 
 * (호출하면 데이터를 불필요하게 두 번 가져오게 됩니다.)
 */
watch(activeTab, (newTab) => {
  if (newTab === 'history') activityStore.fetchLogs();
  // if (newTab === 'qa') qaStore.fetchMyQuestions(); // 👈 삭제 권장
});

onMounted(() => {
  const unsubscribe = auth.onAuthStateChanged(async (user) => {
    if (user) {
      const userId = user.email.split('@')[0];
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        userStore.currentUser = userDoc.data();
        await userStore.fetchMySummary();
      }
      isUserLoading.value = false;
    } else { router.push('/login'); }
  });
  return () => unsubscribe();
});

const handleLogout = async () => {
  if (confirm('로그아웃 하시겠습니까?')) {
    await signOut(auth);
    router.push('/login');
  }
};
</script>