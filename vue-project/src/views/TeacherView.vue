<template>
  <div class="min-h-screen bg-gray-50 font-sans">
    <nav class="bg-white shadow-sm border-b px-6 py-4 flex justify-between items-center sticky top-0 z-10">
      <h1 class="text-xl font-bold text-blue-600 flex items-center">
        <span class="mr-2">👨‍🏫</span> 교사 전용 관리 시스템
      </h1>
      <div class="flex items-center space-x-4">
        <span class="text-sm font-bold text-gray-600">{{ userStore.currentUser.name }} 선생님</span>
        <button @click="handleLogout" class="text-xs text-red-500 font-medium">로그아웃</button>
      </div>
    </nav>

    <main class="max-w-6xl mx-auto p-6 space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <p class="text-xs text-gray-400 font-bold uppercase">담당 팀 수</p>
          <p class="text-3xl font-black text-blue-600">{{ teacherStore.managedTeams.length }}팀</p>
        </div>
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <p class="text-xs text-gray-400 font-bold uppercase">새로운 질문</p>
          <p class="text-3xl font-black text-orange-500">{{ newQuestionsCount }}건</p>
        </div>
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <p class="text-xs text-gray-400 font-bold uppercase">일지 제출 현황</p>
          <p class="text-3xl font-black text-green-600">{{ teacherStore.studentLogs.length }}건</p>
        </div>
      </div>

      <div class="flex bg-white rounded-xl shadow-sm p-1 border border-gray-200">
        <button v-for="tab in tabs" :key="tab.id" @click="activeTab = tab.id"
          class="flex-1 py-3 text-sm font-bold rounded-lg transition-all"
          :class="activeTab === tab.id ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'">
          {{ tab.label }}
        </button>
      </div>

      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 min-h-[500px] relative">
        <div v-if="teacherStore.isLoading" class="absolute inset-0 bg-white/60 flex items-center justify-center z-10 rounded-2xl">
          <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>

        <div v-if="activeTab === 'teams'" class="space-y-4">
          <h3 class="text-lg font-bold text-gray-800 mb-4">우리 반/팀 리스트</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div v-for="team in teacherStore.managedTeams" :key="team.teamId" class="p-4 border rounded-xl hover:border-blue-300 transition-colors">
              <div class="flex justify-between items-start">
                <div>
                  <span class="text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded">{{ team.careerField || '분야 미지정' }}</span>
                  <h4 class="font-bold text-gray-800 mt-1">{{ team.teamName }}</h4>
                </div>
                <span class="text-xs text-gray-400 font-mono">{{ team.teamId }}</span>
              </div>
              <div class="mt-3 flex flex-wrap gap-1">
                <span v-for="m in team.members" :key="m" class="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">{{ m }}</span>
              </div>
            </div>
          </div>
        </div>

        <TeacherQA v-else-if="activeTab === 'qa'" />
        <TeacherMonitoring v-else-if="activeTab === 'monitor'" />
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/userStore';
import { useTeacherStore } from '@/stores/teacherStore';
import { auth } from '@/firebase';
import { signOut } from 'firebase/auth';

import TeacherQA from '@/components/teacher/TeacherQA.vue';
import TeacherMonitoring from '@/components/teacher/TeacherMonitoring.vue';

const router = useRouter();
const userStore = useUserStore();
const teacherStore = useTeacherStore();

const activeTab = ref('teams');
const tabs = [
  { id: 'teams', label: '📋 담당 팀 현황' },
  { id: 'monitor', label: '📖 학생 활동 점검' },
  { id: 'qa', label: '💬 질문 답변' }
];

const newQuestionsCount = computed(() => {
  return teacherStore.qaMessages.filter(q => q.status === '대기 중').length;
});

onMounted(async () => {
  // 💡 수정: 유저 정보가 아직 로드되지 않은 상태라면 잠시 대기
  if (!userStore.currentUser.userKey) {
    // 만약 로그인은 했는데 스토어가 비어있다면 강제로 재로드 시도하거나 
    // 로딩이 완료될 때까지 기다리는 처리가 필요할 수 있으나 
    // LoginView에서 성공적으로 넘겨줬다면 바로 데이터 로드를 시작합니다.
  }

  // 💡 핵심: 확실히 '학생'인 경우에만 튕겨냅니다. (T로 시작하거나 교사 role이면 통과)
  const role = userStore.currentUser.role;
  const id = userStore.currentUser.userKey || "";

  if (role === '학생' && !id.startsWith('T')) {
    router.push('/student');
    return;
  }
  
  // 교사 데이터 로드 시작
  await teacherStore.fetchAllManagedData();
});

const handleLogout = async () => {
  if (confirm('로그아웃 하시겠습니까?')) {
    await signOut(auth);
    userStore.currentUser = {}; // 스토어 비우기
    router.push('/login');
  }
};
</script>