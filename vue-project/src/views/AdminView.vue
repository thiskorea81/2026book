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

      <UserTable 
        :users="users"
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
import { db } from '@/firebase'; // Firestore 연결
import { collection, doc, setDoc, getDocs, deleteDoc, updateDoc } from 'firebase/firestore';

// 컴포넌트 임포트
import AdminHeader from '@/components/admin/AdminHeader.vue';
import BulkCreateForm from '@/components/admin/BulkCreateForm.vue';
import UserTable from '@/components/admin/UserTable.vue';
import EditUserModal from '@/components/admin/EditUserModal.vue';

// --- Firebase 보조 앱 설정 (관리자 세션 유지용) ---
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
const excelData = ref('');
const isProcessing = ref(false);
const statusMessage = ref('대기 중');
const users = ref([]); 
const selectedKeys = ref([]); 
const isEditModalOpen = ref(false);
const currentUserToEdit = ref(null);

// --- 1. 데이터 불러오기 (Read) ---
const fetchUsers = async () => {
  statusMessage.value = '목록 불러오는 중...';
  try {
    const querySnapshot = await getDocs(collection(db, "users"));
    const data = [];
    querySnapshot.forEach((doc) => {
      data.push(doc.data());
    });
    // Key(학번/번호) 순으로 정렬하여 표시
    users.value = data.sort((a, b) => a.userKey.localeCompare(b.userKey));
    statusMessage.value = '데이터 로드 완료';
  } catch (error) {
    console.error(error);
    statusMessage.value = '로드 실패';
  }
};

// 페이지 로드 시 실행
onMounted(() => {
  fetchUsers();
});

// --- 2. 일괄 생성 및 DB 저장 (Create) ---
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

    let userKey, loginId, rawPassword, name, role, subject;
    if (parts.length >= 5) { // 교사
      userKey = parts[0]; loginId = parts[1]; rawPassword = parts[2];
      name = parts[3]; role = parts[4]; subject = parts[5] || '-';
    } else { // 학생
      userKey = parts[0]; loginId = parts[0]; rawPassword = parts[2];
      name = parts[1]; role = '학생'; subject = '-';
    }

    if (rawPassword.length < 6) continue;
    const email = `${loginId}@sangdang.hs.kr`;

    try {
      // (1) Auth 계정 생성
      await createUserWithEmailAndPassword(secondaryAuth, email, rawPassword);
      
      // (2) Firestore 정보 저장
      const userData = { userKey, loginId, email, name, role, subject };
      await setDoc(doc(db, "users", userKey), userData);
      
      users.value.push(userData);
      successCount++;
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        // 이미 가입된 경우 정보만 업데이트
        const userData = { userKey, loginId, email, name, role, subject };
        await setDoc(doc(db, "users", userKey), userData);
        if(!users.value.find(u => u.userKey === userKey)) users.value.push(userData);
      }
    }
    await new Promise(r => setTimeout(r, 100));
  }

  isProcessing.value = false;
  statusMessage.value = `완료 (${successCount}명 저장)`;
  excelData.value = '';
  users.value.sort((a, b) => a.userKey.localeCompare(b.userKey));
};

// --- 3. 개별 및 선택 삭제 (Delete) ---
const deleteUser = async (key) => {
  if (confirm(`${key} 사용자를 DB에서 영구 삭제하시겠습니까?`)) {
    try {
      await deleteDoc(doc(db, "users", key));
      users.value = users.value.filter(u => u.userKey !== key);
    } catch (e) { alert('삭제 실패'); }
  }
};

const deleteSelected = async () => {
  if (!confirm(`${selectedKeys.value.length}명을 삭제하시겠습니까?`)) return;
  for (const key of selectedKeys.value) {
    await deleteDoc(doc(db, "users", key));
  }
  users.value = users.value.filter(u => !selectedKeys.value.includes(u.userKey));
  selectedKeys.value = [];
};

// --- 4. 정보 수정 (Update) ---
const openEditModal = (user) => {
  currentUserToEdit.value = user;
  isEditModalOpen.value = true;
};

const saveEdit = async (updatedData) => {
  try {
    const userRef = doc(db, "users", updatedData.userKey);
    await updateDoc(userRef, {
      name: updatedData.name,
      role: updatedData.role,
      subject: updatedData.subject
    });
    const idx = users.value.findIndex(u => u.userKey === updatedData.userKey);
    if (idx !== -1) users.value[idx] = { ...updatedData };
    isEditModalOpen.value = false;
  } catch (e) { alert('수정 실패'); }
};
</script>