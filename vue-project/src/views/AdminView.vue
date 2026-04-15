<template>
  <div class="min-h-screen bg-gray-100 p-10 font-sans">
    <div class="max-w-7xl mx-auto space-y-6">
      <AdminHeader />

      <div class="flex bg-white rounded-xl shadow overflow-hidden">
        <button v-for="tab in mainTabs" :key="tab.id" @click="changeTab(tab.id)"
          class="flex-1 py-4 text-sm font-bold text-center transition-all border-b-4"
          :class="activeTab === tab.id ? `${tab.color} bg-gray-50/50` : 'border-transparent text-gray-500 hover:bg-gray-50'">
          {{ tab.label }}
        </button>
      </div>

      <template v-if="activeTab === 'settings'">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SystemSettings />
          <div class="bg-white rounded-xl shadow p-8 space-y-6 border border-green-100">
            <div>
              <h3 class="text-lg font-bold text-gray-800 flex items-center"><span class="mr-2">📲</span> 학생용 메뉴 관리</h3>
              <p class="text-sm text-gray-500 mt-1">마감된 항목의 체크를 해제하세요.</p>
            </div>
            <div class="space-y-3">
              <label v-for="(val, key) in menuLabels" :key="key" class="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <span class="text-sm font-bold text-gray-700">{{ val }}</span>
                <input type="checkbox" v-model="adminStore.menuSettings[key]" class="w-5 h-5 text-green-600 rounded">
              </label>
            </div>
            <button @click="adminStore.updateMenuSettings(adminStore.menuSettings)" class="w-full py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700">설정 저장</button>
          </div>
        </div>
      </template>

      <template v-else-if="activeTab === 'team'">
        <BulkTeamForm />
        <TeamTable :teams="adminStore.teams" v-model:selectedKeys="selectedTeamKeys" @delete-selected="deleteSelectedTeams" @delete="deleteTeam" @edit="openEditTeamModal" />
      </template>

      <template v-else>
        <BulkCreateForm v-model="excelData" :isProcessing="isProcessing" :statusMessage="statusMessage" @submit="handleBulkCreate" />
        <div v-if="adminStore.isLoading" class="bg-white p-12 rounded-xl shadow text-center text-gray-500 font-bold">로딩 중...</div>
        <UserTable v-else :users="adminStore.users" :activeTab="activeTab" v-model:selectedKeys="selectedKeys" @delete-selected="deleteSelected" @delete="deleteUser" @edit="openEditModal" />
      </template>
    </div>

    <EditUserModal :isOpen="isEditModalOpen" :user="currentUserToEdit" @close="isEditModalOpen = false" @save="saveUserEdit" />
    <EditTeamModal :isOpen="isEditTeamModalOpen" :team="currentTeamToEdit" @close="isEditTeamModalOpen = false" @save="saveTeamEdit" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { useAdminStore } from '@/stores/adminStore';

import AdminHeader from '@/components/admin/AdminHeader.vue';
import BulkCreateForm from '@/components/admin/BulkCreateForm.vue';
import BulkTeamForm from '@/components/admin/BulkTeamForm.vue'; 
import UserTable from '@/components/admin/UserTable.vue';
import TeamTable from '@/components/admin/TeamTable.vue';
import EditUserModal from '@/components/admin/EditUserModal.vue';
import EditTeamModal from '@/components/admin/EditTeamModal.vue';
import SystemSettings from '@/components/admin/SystemSettings.vue';

const adminStore = useAdminStore();
const activeTab = ref('student');
const mainTabs = [
  { id: 'student', label: '👨‍🎓 학생 관리', color: 'border-blue-600 text-blue-700' },
  { id: 'teacher', label: '👨‍🏫 교사 관리', color: 'border-blue-600 text-blue-700' },
  { id: 'team', label: '🚀 팀 관리', color: 'border-purple-600 text-purple-700' },
  { id: 'settings', label: '⚙️ 시스템 설정', color: 'border-green-600 text-green-700' }
];
const menuLabels = { program: '🚀 프로그램 신청', book: '📚 도서 신청', log: '📝 독서일지 작성', history: '📖 나의 독서 기록', eval: '✅ 자기평가서 작성' };

onMounted(() => adminStore.initData());

const changeTab = (tab) => {
  activeTab.value = tab;
  selectedKeys.value = [];
  selectedTeamKeys.value = [];
};

// --- 기존 생략되었던 로직들 (전체 포함) ---
const excelData = ref('');
const isProcessing = ref(false);
const statusMessage = ref('대기 중');
const selectedKeys = ref([]); 
const isEditModalOpen = ref(false);
const currentUserToEdit = ref(null);
const selectedTeamKeys = ref([]);
const isEditTeamModalOpen = ref(false);
const currentTeamToEdit = ref(null);

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

const handleBulkCreate = async () => {
  const lines = excelData.value.split('\n').filter(line => line.trim() !== '');
  if (!confirm(`${lines.length}명의 계정을 생성/업데이트 하시겠습니까?`)) return;
  isProcessing.value = true;
  for (let i = 0; i < lines.length; i++) {
    statusMessage.value = `${i + 1} / ${lines.length} 처리 중...`;
    const parts = lines[i].trim().split(/\s+/);
    if (parts.length < 3) continue;
    let userKey, loginId, rawPw, name, role, sub;
    if (parts.length >= 5) {
      [userKey, loginId, rawPw, name, role, sub] = parts;
    } else {
      userKey = parts[0]; loginId = parts[0]; rawPw = parts[parts.length-1];
      name = parts.slice(1, -1).join(' '); role = '학생'; sub = '-';
    }
    const email = loginId.includes('@') ? loginId : `${loginId}@sangdang.hs.kr`;
    try {
      await createUserWithEmailAndPassword(secondaryAuth, email, rawPw);
      await adminStore.saveUser({ userKey, loginId, email, name, role, subject: sub || '-', teamId: null });
    } catch (e) {
      if (e.code === 'auth/email-already-in-use') await adminStore.saveUser({ userKey, loginId, email, name, role, subject: sub || '-', teamId: null });
    }
    await new Promise(r => setTimeout(r, 50));
  }
  isProcessing.value = false;
  statusMessage.value = '완료';
  excelData.value = '';
};

const deleteUser = async (k) => { if (confirm('삭제하시겠습니까?')) await adminStore.removeUser(k); };
const deleteSelected = async () => { if (confirm('일괄 삭제하시겠습니까?')) { for (const k of selectedKeys.value) await adminStore.removeUser(k); selectedKeys.value = []; } };
const openEditModal = (u) => { currentUserToEdit.value = u; isEditModalOpen.value = true; };
const saveUserEdit = async (d) => { await adminStore.saveUser(d); isEditModalOpen.value = false; };
const deleteTeam = async (id) => { if (confirm('팀을 삭제하시겠습니까?')) await adminStore.removeTeam(id); };
const deleteSelectedTeams = async () => { if (confirm('일괄 삭제하시겠습니까?')) { for (const id of selectedTeamKeys.value) await adminStore.removeTeam(id); selectedTeamKeys.value = []; } };
const openEditTeamModal = (t) => { currentTeamToEdit.value = t; isEditTeamModalOpen.value = true; };
const saveTeamEdit = async (d) => { await adminStore.saveTeam(d); isEditTeamModalOpen.value = false; };
</script>