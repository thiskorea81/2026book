<template>
  <div class="min-h-screen bg-gray-50 font-sans">
    <nav class="bg-white shadow-sm border-b px-6 py-4 flex justify-between items-center sticky top-0 z-50">
      <div class="flex items-center space-x-2">
        <span class="text-2xl">👨‍🏫</span>
        <h1 class="text-xl font-bold text-blue-600">교사 전용 관리 시스템</h1>
      </div>
      <div class="flex items-center space-x-4">
        <div class="text-right hidden sm:block">
          <p class="text-sm font-bold text-gray-800">{{ userStore.currentUser.name }} 선생님</p>
        </div>
        <button @click="handleLogout" class="px-3 py-1.5 border border-red-100 text-red-500 text-xs font-bold rounded-lg hover:bg-red-50">로그아웃</button>
      </div>
    </nav>

    <main class="max-w-7xl mx-auto p-6 space-y-6">
      <TeacherDashboard 
        v-if="activeTab !== 'ai-settings'"
        :team-count="teacherStore.managedTeams.length"
        :qa-count="newQuestionsCount"
        :activity-count="teacherStore.studentLogs.length + teacherStore.studentEvals.length"
      />

      <div class="flex bg-white rounded-2xl shadow-sm p-1.5 border border-gray-200 overflow-x-auto no-scrollbar">
        <button v-for="tab in tabs" :key="tab.id" @click="activeTab = tab.id"
          class="flex-1 min-w-[120px] py-3 text-sm font-bold rounded-xl transition-all"
          :class="activeTab === tab.id ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'">
          {{ tab.label }}
        </button>
      </div>

      <div class="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 min-h-[600px] relative">
        <div v-if="teacherStore.isLoading" class="absolute inset-0 bg-white/80 flex flex-col items-center justify-center z-10">
          <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
        </div>

        <TeacherTeamList v-if="activeTab === 'teams'" :teams="teacherStore.managedTeams" />
        <TeacherMonitoring v-else-if="activeTab === 'monitor'" />
        <TeacherRecordManager v-else-if="activeTab === 'records'" />
        <TeacherQA v-else-if="activeTab === 'qa'" />
        <TeacherAiSettings 
          v-else-if="activeTab === 'ai-settings'" 
          :settings="aiSettings" 
          @save="saveAiSettings" 
        />
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/userStore';
import { useTeacherStore } from '@/stores/teacherStore';
import { auth, db } from '@/firebase';
import { signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// 컴포넌트 임포트
import TeacherDashboard from '@/components/teacher/TeacherDashboard.vue';
import TeacherTeamList from '@/components/teacher/TeacherTeamList.vue';
import TeacherMonitoring from '@/components/teacher/TeacherMonitoring.vue';
import TeacherRecordManager from '@/components/teacher/TeacherRecordManager.vue';
import TeacherQA from '@/components/teacher/TeacherQA.vue';
import TeacherAiSettings from '@/components/teacher/TeacherAiSettings.vue';

const router = useRouter();
const userStore = useUserStore();
const teacherStore = useTeacherStore();

const activeTab = ref('monitor');
const tabs = [
  { id: 'teams', label: '📋 담당 팀 현황' },
  { id: 'monitor', label: '📖 활동 결과물 점검' },
  { id: 'records', label: '🖋️ 생기부 초안 작성' },
  { id: 'qa', label: '💬 질문/답변' },
  { id: 'ai-settings', label: '⚙️ AI 환경 설정' }
];

const aiSettings = reactive({ geminiApiKey: '', recordPrompt: '' });

const newQuestionsCount = computed(() => {
  return teacherStore.qaMessages.filter(q => q.status === '대기 중').length;
});

onMounted(async () => {
  if (userStore.isAuthReady) {
    await teacherStore.fetchAllManagedData();
    const settingsDoc = await getDoc(doc(db, "teacherSettings", userStore.currentUser.userKey));
    if (settingsDoc.exists()) Object.assign(aiSettings, settingsDoc.data());
  }
});

const saveAiSettings = async (newSettings) => {
  try {
    await setDoc(doc(db, "teacherSettings", userStore.currentUser.userKey), newSettings);
    Object.assign(aiSettings, newSettings);
    alert("설정이 저장되었습니다.");
  } catch (e) { alert("저장 실패"); }
};

const handleLogout = async () => {
  if (confirm('로그아웃?')) {
    await signOut(auth);
    router.push('/login');
  }
};
</script>