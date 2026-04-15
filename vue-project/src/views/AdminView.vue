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
          @click="changeTab('settings')"
          class="flex-1 py-4 text-sm font-bold text-center transition-all border-b-4"
          :class="activeTab === 'settings' ? 'border-green-600 text-green-700 bg-green-50/30' : 'border-transparent text-gray-500 hover:bg-gray-50'"
        >
          ⚙️ 시스템 API 설정
        </button>
      </div>

      <template v-if="activeTab === 'settings'">
        <SystemSettings />
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
      @save="saveEdit"
    />

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { useAdminStore } from '@/stores/adminStore';

// 컴포넌트 임포트
import AdminHeader from '@/components/admin/AdminHeader.vue';
import BulkCreateForm from '@/components/admin/BulkCreateForm.vue';
import UserTable from '@/components/admin/UserTable.vue';
import EditUserModal from '@/components/admin/EditUserModal.vue';
import SystemSettings from '@/components/admin/SystemSettings.vue'; // 시스템 설정 컴포넌트

// --- Firebase 보조 앱 설정 (로컬 스토리지 동적 적용) ---
const savedConfig = localStorage.getItem('custom_firebase_config');
const firebaseConfig = savedConfig ? JSON.parse(savedConfig) : {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// 보조 앱 생성 (이미 있으면 재사용)
const secondaryApp = getApps().find(app => app.name === "SecondaryApp") 
  || initializeApp(firebaseConfig, "SecondaryApp");
const secondaryAuth = getAuth(secondaryApp);

// --- 상태 관리 ---
const adminStore = useAdminStore();

const activeTab = ref('student');
const excelData = ref('');
const isProcessing = ref(false);
const statusMessage = ref('대기 중');
const selectedKeys = ref([]); 
const isEditModalOpen = ref(false);
const currentUserToEdit = ref(null);

// 탭 변경 시 선택 초기화
const changeTab = (tab) => {
  activeTab.value = tab;
  selectedKeys.value = []; 
};

// --- 페이지 로드 시 데이터 초기화 ---
onMounted(() => {
  adminStore.initData();
});

// --- 1. 일괄 생성 및 스토어 저장 ---
const handleBulkCreate = async () => {
  const lines = excelData.value.split('\n').filter(line => line.trim() !== '');
  if (!confirm(`${lines.length}줄의 데이터를 처리하시겠습니까?`)) return;

  isProcessing.value = true;
  let successCount = 0;
  let skippedCount = 0;

  for (let i = 0; i < lines.length; i++) {
    statusMessage.value = `${i + 1} / ${lines.length} 처리 중...`;
    const currentLine = lines[i].trim();

    // 헤더 패스
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
    
    // 포맷 분기
    if (parts.length >= 5) { 
      userKey = parts[0]; loginId = parts[1]; rawPassword = parts[2];
      name = parts[3]; role = parts[4]; subject = parts[5] || '-';
      teamId = null; 
    } else { 
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
        // 이미 있으면 Firestore 정보만 업데이트
        await adminStore.saveUser(userData);
        successCount++;
      } else {
        console.error(error);
      }
    }
    await new Promise(r => setTimeout(r, 100));
  }

  isProcessing.value = false;
  statusMessage.value = `완료! (저장/업데이트: ${successCount}건, 제외: ${skippedCount}건)`;
  excelData.value = '';
};

// --- 2. 개별 및 선택 삭제 ---
const deleteUser = async (key) => {
  if (confirm(`${key} 사용자를 시스템에서 영구 삭제하시겠습니까?`)) {
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

// --- 3. 정보 수정 ---
const openEditModal = (user) => {
  currentUserToEdit.value = user;
  isEditModalOpen.value = true;
};

const saveEdit = async (updatedData) => {
  try {
    await adminStore.saveUser(updatedData);
    isEditModalOpen.value = false;
  } catch (e) { 
    alert('수정 실패'); 
  }
};
</script>