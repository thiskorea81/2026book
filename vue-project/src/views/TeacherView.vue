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
          <p class="text-xs text-gray-400 font-bold uppercase">활동 점검 건수</p>
          <p class="text-3xl font-black text-green-600">{{ teacherStore.studentLogs.length }}건</p>
        </div>
      </div>

      <div class="flex bg-white rounded-xl shadow-sm p-1 border border-gray-200 overflow-x-auto">
        <button v-for="tab in tabs" :key="tab.id" @click="activeTab = tab.id"
          class="flex-1 min-w-[100px] py-3 text-sm font-bold rounded-lg transition-all whitespace-nowrap"
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
          <div v-if="teacherStore.managedTeams.length === 0" class="text-center py-10 text-gray-400">담당하는 팀 정보가 없습니다.</div>
        </div>

        <TeacherMonitoring v-else-if="activeTab === 'monitor'" />
        <TeacherQA v-else-if="activeTab === 'qa'" />
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
  // 💡 앱 준비(정보 복구)가 끝날 때까지 기다린 후 체크
  if (userStore.isAuthReady) {
    const role = userStore.currentUser.role || "";
    const userId = userStore.currentUser.userKey || "";

    // 교사 권한 리스트
    const teacherRoles = ['교사', '학년부장', '담임', '교감', '교장', '부장교사'];
    const isTeacher = teacherRoles.includes(role) || userId.startsWith('T');

    if (!isTeacher) {
      console.warn("교사 권한이 없어 학생 페이지로 이동합니다.");
      router.push('/student');
      return;
    }
    
    // 교사인 것이 확인되면 데이터 로드
    await teacherStore.fetchAllManagedData();
  }
});

const handleLogout = async () => {
  if (confirm('로그아웃 하시겠습니까?')) {
    await signOut(auth);
    userStore.currentUser = { userKey: '', name: '', role: '학생' };
    router.push('/login');
  }
};
</script>