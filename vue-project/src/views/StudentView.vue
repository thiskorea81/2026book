<template>
  <div class="min-h-screen bg-gray-50 font-sans">
    <nav class="bg-white shadow-sm border-b px-6 py-4 flex justify-between items-center sticky top-0 z-10">
      <h1 class="text-xl font-bold text-green-600 flex items-center">
        <span class="mr-2">🌱</span> 상당고 학년특색프로그램
      </h1>
      <div class="space-x-4">
        <button @click="router.push('/change-password')" class="text-sm font-medium text-gray-500 hover:text-green-600">비밀번호 변경</button>
        <button @click="handleLogout" class="text-sm font-medium text-gray-500 hover:text-red-500">로그아웃</button>
      </div>
    </nav>

    <div v-if="isUserLoading" class="flex flex-col justify-center items-center h-[70vh] text-green-600 font-bold space-y-4">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      <p>학생 정보를 불러오는 중입니다...</p>
    </div>

    <main v-else class="max-w-4xl mx-auto p-6 mt-4 pb-20">
      <div class="mb-8">
        <h2 class="text-2xl font-black text-gray-800">
          반가워요, <span class="text-green-600">{{ userStore.currentUser.name }}</span>!
        </h2>
        <p class="text-sm text-gray-500">학번: {{ userStore.currentUser.userKey }}</p>
      </div>

      <div class="flex bg-white rounded-2xl shadow-sm overflow-hidden mb-8 border border-gray-200 p-1">
        <button v-for="tab in filteredTabs" :key="tab.id" @click="activeTab = tab.id"
          class="flex-1 py-3 text-sm font-bold text-center transition-all rounded-xl"
          :class="activeTab === tab.id ? 'bg-green-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'">
          {{ tab.label }}
        </button>
      </div>

      <div class="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 relative min-h-[500px]">
        <div v-if="userStore.isLoading || activityStore.isLoading" class="absolute inset-0 bg-white/60 flex items-center justify-center z-10 rounded-3xl">
          <p class="text-green-600 font-bold">데이터 로딩 중...</p>
        </div>

        <MyInfo v-if="activeTab === 'myinfo'" />
        <ProgramApplyForm v-else-if="activeTab === 'program' && userStore.menuSettings.program" />
        <BookApplyForm v-else-if="activeTab === 'book' && userStore.menuSettings.book" />
        <ReadingLogForm v-else-if="activeTab === 'log' && userStore.menuSettings.log" />
        <ReadingLogList v-else-if="activeTab === 'history' && userStore.menuSettings.history" />
        <SelfEvalForm v-else-if="activeTab === 'eval' && userStore.menuSettings.eval" />
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/userStore';
import { useActivityStore } from '@/stores/activityStore';
import { auth, db } from '@/firebase';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

import MyInfo from '@/components/student/MyInfo.vue';
import ProgramApplyForm from '@/components/student/ProgramApplyForm.vue';
import BookApplyForm from '@/components/student/BookApplyForm.vue';
import ReadingLogForm from '@/components/student/ReadingLogForm.vue';
import ReadingLogList from '@/components/student/ReadingLogList.vue';
import SelfEvalForm from '@/components/student/SelfEvalForm.vue';

const router = useRouter();
const userStore = useUserStore();
const activityStore = useActivityStore();
const isUserLoading = ref(true);
const activeTab = ref('myinfo');

const allTabs = [
  { id: 'myinfo', label: '👤 내 정보' },
  { id: 'program', label: '🚀 신청' },
  { id: 'book', label: '📚 도서' },
  { id: 'log', label: '📝 작성' },
  { id: 'history', label: '📖 기록' },
  { id: 'eval', label: '✅ 평가' }
];

const filteredTabs = computed(() => {
  return allTabs.filter(tab => {
    if (tab.id === 'myinfo') return true;
    return userStore.menuSettings[tab.id] === true;
  });
});

watch(activeTab, (newTab) => {
  if (newTab === 'history') activityStore.fetchLogs();
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
    } else {
      router.push('/login');
    }
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