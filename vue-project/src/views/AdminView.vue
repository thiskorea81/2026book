<template>
  <div class="min-h-screen bg-gray-100 p-10 font-sans">
    <div class="max-w-7xl mx-auto space-y-6">
      
      <AdminHeader />

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
        v-model:selectedKeys="selectedKeys"
        @delete-selected="deleteSelected"
        @delete="deleteUser"
        @edit="openEditModal"
      />

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
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { useAdminStore } from '@/stores/adminStore'; // 💡 Pinia 스토어 임포트

// 컴포넌트 임포트
import AdminHeader from '@/components/admin/AdminHeader.vue';
import BulkCreateForm from '@/components/admin/BulkCreateForm.vue';
import UserTable from '@/components/admin/UserTable.vue';
import EditUserModal from '@/components/admin/EditUserModal.vue';

// --- Firebase 보조 앱 설정 (관리자 계정 보호용) ---
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};
const secondaryApp = initializeApp(firebaseConfig, "SecondaryApp");
const secondaryAuth = getAuth(secondaryApp);

// --- 상태 관리 ---
const adminStore = useAdminStore(); // 💡 스토어 활성화

const excelData = ref('');
const isProcessing = ref(false);
const statusMessage = ref('대기 중');
const selectedKeys = ref([]); 
const isEditModalOpen = ref(false);
const currentUserToEdit = ref(null);

// --- 페이지 로드 시 데이터 초기화 ---
onMounted(() => {
  adminStore.initData();
});

// --- 1. 일괄 생성 및 스토어 저장 (Create) ---
const handleBulkCreate = async () => {
  const lines = excelData.value.split('\n').filter(line => line.trim() !== '');
  if (!confirm(`${lines.length}줄의 데이터를 처리하시겠습니까?`)) return;

  isProcessing.value = true;
  let successCount = 0;

  for (let i = 0; i < lines.length; i++) {
    statusMessage.value = `${i + 1} / ${lines.length} 처리 중...`;
    const currentLine = lines[i].trim();

    // 헤더 패스
    if (currentLine.includes('학번') || currentLine.includes('교사번호')) continue;

    const parts = currentLine.split(/\s+/); 
    if (parts.length < 3) continue;

    let userKey, loginId, rawPassword, name, role, subject, teamId;
    if (parts.length >= 5) { // 교사
      userKey = parts[0]; loginId = parts[1]; rawPassword = parts[2];
      name = parts[3]; role = parts[4]; subject = parts[5] || '-';
      teamId = null; // 교사는 초기 팀 ID 없음 (teams 컬렉션에서 참조)
    } else { // 학생
      userKey = parts[0]; loginId = parts[0]; rawPassword = parts[parts.length - 1];
      name = parts.slice(1, -1).join(' '); role = '학생'; subject = '-';
      teamId = null; // 학생도 초기에는 소속 팀 없음
    }

    if (rawPassword.length < 6) continue;
    const email = loginId.includes('@') ? loginId : `${loginId}@sangdang.hs.kr`;

    const userData = { userKey, loginId, email, name, role, subject, teamId };

    try {
      // (1) Auth 계정 생성 (보조 앱)
      await createUserWithEmailAndPassword(secondaryAuth, email, rawPassword);
      
      // (2) 💡 스토어 액션을 통해 Firestore 저장 및 상태 업데이트
      await adminStore.saveUser(userData);
      successCount++;
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        // 이미 가입된 경우 정보만 업데이트
        await adminStore.saveUser(userData);
      }
    }
    // 제한 방지를 위한 짧은 딜레이
    await new Promise(r => setTimeout(r, 100));
  }

  isProcessing.value = false;
  statusMessage.value = `완료 (${successCount}명 반영)`;
  excelData.value = '';
};

// --- 2. 개별 및 선택 삭제 (Delete) ---
const deleteUser = async (key) => {
  if (confirm(`${key} 사용자를 시스템에서 영구 삭제하시겠습니까?`)) {
    try {
      await adminStore.removeUser(key); // 💡 스토어 액션 호출
      selectedKeys.value = selectedKeys.value.filter(k => k !== key);
    } catch (e) { alert('삭제 실패'); }
  }
};

const deleteSelected = async () => {
  if (!confirm(`선택한 ${selectedKeys.value.length}명을 일괄 삭제하시겠습니까?`)) return;
  for (const key of selectedKeys.value) {
    await adminStore.removeUser(key); // 💡 스토어 액션 호출
  }
  selectedKeys.value = [];
};

// --- 3. 정보 수정 (Update) ---
const openEditModal = (user) => {
  currentUserToEdit.value = user;
  isEditModalOpen.value = true;
};

const saveEdit = async (updatedData) => {
  try {
    await adminStore.saveUser(updatedData); // 💡 스토어 액션 호출
    isEditModalOpen.value = false;
  } catch (e) { 
    alert('수정 실패'); 
  }
};
</script>