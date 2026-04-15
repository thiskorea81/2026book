<template>
  <div class="min-h-screen bg-gray-100 p-10 font-sans">
    <div class="max-w-7xl mx-auto space-y-6">
      
      <AdminHeader />

      <div class="flex bg-white rounded-xl shadow overflow-hidden">
        <button 
          @click="changeTab('student')"
          class="flex-1 py-4 text-sm font-bold text-center transition-all border-b-4"
          :class="activeTab === 'student' ? 'border-blue-600 text-blue-700 bg-blue-50/30' : 'border-transparent text-gray-500 hover:bg-gray-50'"
        >
          👨‍🎓 학생 관리
        </button>
        <button 
          @click="changeTab('teacher')"
          class="flex-1 py-4 text-sm font-bold text-center transition-all border-b-4"
          :class="activeTab === 'teacher' ? 'border-blue-600 text-blue-700 bg-blue-50/30' : 'border-transparent text-gray-500 hover:bg-gray-50'"
        >
          👨‍🏫 교사 관리
        </button>
        <button 
          @click="changeTab('team')"
          class="flex-1 py-4 text-sm font-bold text-center transition-all border-b-4"
          :class="activeTab === 'team' ? 'border-purple-600 text-purple-700 bg-purple-50/30' : 'border-transparent text-gray-500 hover:bg-gray-50'"
        >
          🚀 팀 관리
        </button>
        <button 
          @click="changeTab('settings')"
          class="flex-1 py-4 text-sm font-bold text-center transition-all border-b-4"
          :class="activeTab === 'settings' ? 'border-green-600 text-green-700 bg-green-50/30' : 'border-transparent text-gray-500 hover:bg-gray-50'"
        >
          ⚙️ 시스템 설정
        </button>
      </div>

      <template v-if="activeTab === 'settings'">
        <SystemSettings />
      </template>

      <template v-else-if="activeTab === 'team'">
        <BulkTeamForm />
        
        <TeamTable 
          :teams="adminStore.teams"
          v-model:selectedKeys="selectedTeamKeys"
          @delete-selected="deleteSelectedTeams"
          @delete="deleteTeam"
          @edit="openEditTeamModal"
        />
      </template>

      <template v-else>
        <BulkCreateForm 
          v-model="excelData"
          :isProcessing="isProcessing"
          :statusMessage="statusMessage"
          @submit="handleBulkCreate"
        />

        <div v-if="adminStore.isLoading" class="bg-white p-12 rounded-xl shadow text-center text-gray-500 font-bold">
          데이터를 불러오는 중입니다... ⏳
        </div>
        
        <UserTable 
          v-else
          :users="adminStore.users" 
          :activeTab="activeTab"
          v-model:selectedKeys="selectedKeys"
          @delete-selected="deleteSelected"
          @delete="deleteUser"
          @edit="openEditModal"
        />
      </template>

    </div>

    <EditUserModal 
      :isOpen="isEditModalOpen"
      :user="currentUserToEdit"
      @close="isEditModalOpen = false"
      @save="saveUserEdit"
    />

    <EditTeamModal 
      :isOpen="isEditTeamModalOpen"
      :team="currentTeamToEdit"
      @close="isEditTeamModalOpen = false"
      @save="saveTeamEdit"
    />

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { useAdminStore } from '@/stores/adminStore';

// 컴포넌트 임포트
import AdminHeader from '@/components/admin/AdminHeader.vue';
import BulkCreateForm from '@/components/admin/BulkCreateForm.vue';
import BulkTeamForm from '@/components/admin/BulkTeamForm.vue'; 
import UserTable from '@/components/admin/UserTable.vue';
import TeamTable from '@/components/admin/TeamTable.vue';
import EditUserModal from '@/components/admin/EditUserModal.vue';
import EditTeamModal from '@/components/admin/EditTeamModal.vue';
import SystemSettings from '@/components/admin/SystemSettings.vue';

// --- Firebase 보조 앱 설정 (계정 일괄 생성용, 로컬 설정 우선 적용) ---
const savedConfig = localStorage.getItem('custom_firebase_config');
const firebaseConfig = savedConfig ? JSON.parse(savedConfig) : {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const secondaryApp = getApps().find(app => app.name === "SecondaryApp") || initializeApp(firebaseConfig, "SecondaryApp");
const secondaryAuth = getAuth(secondaryApp);

// --- 전역 상태 관리 ---
const adminStore = useAdminStore();
const activeTab = ref('student');

// 탭 변경 시 선택 항목 초기화
const changeTab = (tab) => {
  activeTab.value = tab;
  selectedKeys.value = []; 
  selectedTeamKeys.value = [];
};

onMounted(() => {
  adminStore.initData();
});

// ==========================================
// 1. 사용자 (학생/교사) 관리 로직
// ==========================================
const excelData = ref('');
const isProcessing = ref(false);
const statusMessage = ref('대기 중');
const selectedKeys = ref([]); 
const isEditModalOpen = ref(false);
const currentUserToEdit = ref(null);

const handleBulkCreate = async () => {
  const lines = excelData.value.split('\n').filter(line => line.trim() !== '');
  if (!confirm(`${lines.length}줄의 데이터를 처리하시겠습니까?`)) return;

  isProcessing.value = true;
  let successCount = 0;
  let skippedCount = 0;

  for (let i = 0; i < lines.length; i++) {
    statusMessage.value = `${i + 1} / ${lines.length} 처리 중...`;
    const currentLine = lines[i].trim();

    if (currentLine.includes('학번') || currentLine.includes('교사번호') || currentLine.includes('비밀번호')) {
      skippedCount++;
      continue;
    }

    const parts = currentLine.split(/\s+/); 
    if (parts.length < 3) {
      skippedCount++;
      continue;
    }

    let userKey, loginId, rawPassword, name, role, subject, teamId;
    
    if (parts.length >= 5) { 
      // 교사 포맷
      userKey = parts[0]; loginId = parts[1]; rawPassword = parts[2];
      name = parts[3]; role = parts[4]; subject = parts[5] || '-';
      teamId = null; 
    } else { 
      // 학생 포맷
      userKey = parts[0]; loginId = parts[0]; rawPassword = parts[parts.length - 1];
      name = parts.slice(1, -1).join(' '); role = '학생'; subject = '-';
      teamId = null; 
    }

    if (rawPassword.length < 6) {
      skippedCount++;
      continue;
    }

    const email = loginId.includes('@') ? loginId : `${loginId}@sangdang.hs.kr`;
    const userData = { userKey, loginId, email, name, role, subject, teamId };

    try {
      await createUserWithEmailAndPassword(secondaryAuth, email, rawPassword);
      await adminStore.saveUser(userData);
      successCount++;
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        await adminStore.saveUser(userData); // 이미 있으면 덮어쓰기 업데이트
        successCount++;
      } else {
        console.error(error);
      }
    }
    await new Promise(r => setTimeout(r, 100)); // Firebase 요청 제한 방지 딜레이
  }

  isProcessing.value = false;
  statusMessage.value = `완료! (저장: ${successCount}건, 제외: ${skippedCount}건)`;
  excelData.value = '';
};

const deleteUser = async (key) => {
  if (confirm(`[${key}] 사용자를 영구 삭제하시겠습니까?`)) {
    try {
      await adminStore.removeUser(key);
      selectedKeys.value = selectedKeys.value.filter(k => k !== key);
    } catch (e) { alert('삭제 실패'); }
  }
};

const deleteSelected = async () => {
  if (!confirm(`선택한 ${selectedKeys.value.length}명을 일괄 삭제하시겠습니까?`)) return;
  for (const key of selectedKeys.value) {
    await adminStore.removeUser(key);
  }
  selectedKeys.value = [];
};

const openEditModal = (user) => {
  currentUserToEdit.value = user;
  isEditModalOpen.value = true;
};

const saveUserEdit = async (updatedData) => {
  try {
    await adminStore.saveUser(updatedData);
    isEditModalOpen.value = false;
  } catch (e) { 
    alert('사용자 수정 실패'); 
  }
};

// ==========================================
// 2. 팀 관리 로직
// ==========================================
const selectedTeamKeys = ref([]);
const isEditTeamModalOpen = ref(false);
const currentTeamToEdit = ref(null);

const deleteTeam = async (teamId) => {
  if (confirm(`[${teamId}] 팀을 완전히 삭제하시겠습니까?`)) {
    try {
      await adminStore.removeTeam(teamId);
      selectedTeamKeys.value = selectedTeamKeys.value.filter(k => k !== teamId);
    } catch (e) { alert('팀 삭제 실패'); }
  }
};

const deleteSelectedTeams = async () => {
  if (!confirm(`선택한 ${selectedTeamKeys.value.length}개 팀을 삭제하시겠습니까?`)) return;
  for (const teamId of selectedTeamKeys.value) {
    await adminStore.removeTeam(teamId);
  }
  selectedTeamKeys.value = [];
};

const openEditTeamModal = (team) => {
  currentTeamToEdit.value = team;
  isEditTeamModalOpen.value = true;
};

const saveTeamEdit = async (updatedData) => {
  try {
    await adminStore.saveTeam(updatedData);
    isEditTeamModalOpen.value = false;
  } catch (e) { 
    alert('팀 수정 실패'); 
  }
};
</script>