<template>
  <div class="min-h-screen bg-gray-50 font-sans text-gray-900">
    
    <nav class="bg-white shadow-sm border-b px-6 py-4 flex justify-between items-center sticky top-0 z-10">
      <h1 class="text-xl font-bold text-green-600 flex items-center">
        <span class="mr-2">🌱</span> 상당고 학년특색프로그램
      </h1>
      <div class="space-x-4">
        <button @click="router.push('/change-password')" class="text-sm font-medium text-gray-500 hover:text-green-600 transition-colors">
          비밀번호 변경
        </button>
        <button @click="handleLogout" class="text-sm font-medium text-gray-500 hover:text-red-500 transition-colors">
          로그아웃
        </button>
      </div>
    </nav>

    <div v-if="isUserLoading" class="flex flex-col justify-center items-center h-[70vh] text-green-600 font-bold space-y-4">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      <p class="animate-pulse">데이터를 안전하게 불러오는 중...</p>
    </div>

    <main v-else class="max-w-4xl mx-auto p-6 mt-4 pb-20">
      <div class="mb-8">
        <h2 class="text-3xl font-black tracking-tight text-gray-800">
          안녕하세요, <span class="text-green-600">{{ studentStore.currentUser.name }}</span>님!
        </h2>
        <p class="text-gray-500 mt-2 font-medium">상당고등학교 1학년 | 학번: {{ studentStore.currentUser.userKey }}</p>
      </div>

      <div class="flex bg-white rounded-2xl shadow-sm overflow-hidden mb-8 border border-gray-200 p-1">
        <button v-for="tab in tabs" :key="tab.id" @click="activeTab = tab.id"
          class="flex-1 py-3 text-sm font-bold text-center transition-all rounded-xl"
          :class="activeTab === tab.id ? 'bg-green-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'">
          {{ tab.label }}
        </button>
      </div>

      <div class="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 p-8 relative min-h-[500px]">
        <div v-if="studentStore.isLoading" class="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center z-10 rounded-3xl">
          <div class="flex flex-col items-center text-green-600">
            <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600 mb-3"></div>
            <p class="font-bold">로딩 중...</p>
          </div>
        </div>

        <MyInfo v-if="activeTab === 'myinfo'" />
        <ProgramApplyForm v-else-if="activeTab === 'program'" />
        <BookApplyForm v-else-if="activeTab === 'book'" />
        <ReadingLogForm v-else-if="activeTab === 'log'" />
        <ReadingLogList v-else-if="activeTab === 'history'" />
        <SelfEvalForm v-else-if="activeTab === 'eval'" />
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useStudentStore } from '@/stores/studentStore';
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
const studentStore = useStudentStore();
const isUserLoading = ref(true);
const activeTab = ref('myinfo');

const tabs = [
  { id: 'myinfo', label: '👤 내 정보' },
  { id: 'program', label: '🚀 신청' },
  { id: 'book', label: '📚 도서' },
  { id: 'log', label: '📝 작성' },
  { id: 'history', label: '📖 기록' },
  { id: 'eval', label: '✅ 평가' }
];

watch(activeTab, (newTab) => {
  if (newTab === 'myinfo') studentStore.fetchMySummary();
  if (newTab === 'history') studentStore.fetchMyLogs();
});

onMounted(() => {
  const unsubscribe = auth.onAuthStateChanged(async (user) => {
    if (user) {
      try {
        const userId = user.email.split('@')[0];
        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists()) {
          studentStore.currentUser = userDoc.data();
          await studentStore.fetchMySummary();
        }
      } catch (e) {
        console.error("인증 처리 실패:", e);
      } finally {
        isUserLoading.value = false;
      }
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