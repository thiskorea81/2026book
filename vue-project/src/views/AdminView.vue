<template>
  <div class="min-h-screen bg-gray-100 p-10 font-sans">
    <div class="max-w-6xl mx-auto space-y-6">
      
      <div class="bg-white rounded-xl shadow p-8 flex justify-between items-center border-t-4 border-blue-600">
        <div>
          <h1 class="text-3xl font-bold text-gray-800 mb-2">관리자 대시보드</h1>
          <p class="text-gray-600">계정 일괄 생성 및 사용자 목록 관리를 진행합니다.</p>
        </div>
        <button @click="$router.push('/login')" class="px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
          로그아웃
        </button>
      </div>

      <div class="bg-white rounded-xl shadow p-8">
        <h2 class="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <span class="mr-2">📁</span> 엑셀 데이터 계정 생성
        </h2>
        <textarea 
          v-model="excelData" 
          rows="4" 
          class="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none font-mono text-sm bg-gray-50"
          placeholder="[아이디] [성명] [비밀번호] 순으로 복사하여 붙여넣으세요.&#10;예시: 10101 권민혁 s1234!"
        ></textarea>

        <div class="mt-4 flex items-center justify-between">
          <div class="text-sm font-medium text-gray-600">
            상태: <span :class="isProcessing ? 'text-blue-600' : 'text-gray-500'">{{ statusMessage }}</span>
          </div>
          <button 
            @click="startBulkCreation" 
            :disabled="isProcessing || !excelData.trim()"
            class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold disabled:bg-blue-300 transition-colors"
          >
            {{ isProcessing ? '생성 중...' : '일괄 생성 시작' }}
          </button>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow overflow-hidden">
        <div class="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h2 class="text-lg font-bold text-gray-800">사용자 목록 ({{ users.length }}명)</h2>
          <button 
            @click="deleteSelected"
            :disabled="selectedIds.length === 0"
            class="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
          >
            선택 삭제 ({{ selectedIds.length }})
          </button>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-white border-b text-sm text-gray-500 uppercase tracking-wider">
                <th class="p-4 w-12 text-center">
                  <input 
                    type="checkbox" 
                    :checked="isAllSelected" 
                    @change="toggleSelectAll"
                    class="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                  >
                </th>
                <th class="p-4 font-semibold">아이디</th>
                <th class="p-4 font-semibold">이름</th>
                <th class="p-4 font-semibold">이메일</th>
                <th class="p-4 font-semibold text-center">관리</th>
              </tr>
            </thead>
            <tbody class="text-gray-700 text-sm divide-y divide-gray-100">
              <tr v-if="users.length === 0">
                <td colspan="5" class="p-8 text-center text-gray-400">등록된 사용자가 없습니다. 위에서 일괄 생성해주세요.</td>
              </tr>
              <tr v-for="user in users" :key="user.id" class="hover:bg-blue-50/50 transition-colors">
                <td class="p-4 text-center">
                  <input 
                    type="checkbox" 
                    v-model="selectedIds" 
                    :value="user.id"
                    class="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                  >
                </td>
                <td class="p-4 font-medium">{{ user.id }}</td>
                <td class="p-4">{{ user.name }}</td>
                <td class="p-4 text-gray-500">{{ user.email }}</td>
                <td class="p-4 text-center space-x-2">
                  <button @click="openEditModal(user)" class="text-blue-500 hover:text-blue-700 font-medium">수정</button>
                  <button @click="deleteUser(user.id)" class="text-red-500 hover:text-red-700 font-medium">삭제</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>

    <div v-if="isEditModalOpen" class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <h3 class="text-xl font-bold text-gray-800 mb-4">사용자 정보 수정</h3>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm text-gray-600 mb-1">아이디 (수정 불가)</label>
            <input type="text" v-model="editForm.id" disabled class="w-full p-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-500">
          </div>
          <div>
            <label class="block text-sm text-gray-600 mb-1">이름</label>
            <input type="text" v-model="editForm.name" class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
          </div>
        </div>

        <div class="mt-8 flex justify-end space-x-3">
          <button @click="isEditModalOpen = false" class="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg">취소</button>
          <button @click="saveEdit" class="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-bold">저장하기</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

// --- Firebase 보조 앱 설정 (관리자 튕김 방지) ---
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};
const secondaryApp = initializeApp(firebaseConfig, "SecondaryAppForCreation");
const secondaryAuth = getAuth(secondaryApp);

// --- 상태 관리 ---
const excelData = ref('');
const isProcessing = ref(false);
const statusMessage = ref('대기 중');

// 사용자 목록 상태
const users = ref([]); // { id, name, email }
const selectedIds = ref([]); // 체크박스 선택된 ID 배열

// 모달 상태
const isEditModalOpen = ref(false);
const editForm = ref({ id: '', name: '' });


// --- 1. 엑셀 일괄 생성 로직 ---
const startBulkCreation = async () => {
  const lines = excelData.value.split('\n').filter(line => line.trim() !== '');
  if (lines.length === 0) return;
  if (!confirm(`${lines.length}명의 계정을 생성하시겠습니까?`)) return;

  isProcessing.value = true;
  let successCount = 0;

  for (let i = 0; i < lines.length; i++) {
    statusMessage.value = `${i + 1} / ${lines.length} 명 처리 중...`;
    
    // 공백을 기준으로 분리 (아이디, 성명, 비번)
    const parts = lines[i].trim().split(/\s+/); 
    if (parts.length < 2) continue;

    const rawId = parts[0];
    const rawPassword = parts[parts.length - 1]; 
    const rawName = parts.slice(1, -1).join(' ') || '-'; // 중간에 낀 문자열을 이름으로 처리
    const email = rawId.includes('@') ? rawId : `${rawId}@sangdang.hs.kr`;

    try {
      // Firebase 계정 생성
      await createUserWithEmailAndPassword(secondaryAuth, email, rawPassword);
      
      // 💡 생성 성공 시 테이블 목록(users 배열)에 즉시 추가!
      users.value.push({
        id: rawId,
        name: rawName,
        email: email
      });
      successCount++;
    } catch (error) {
      if (error.code !== 'auth/email-already-in-use') {
        console.error(`생성 실패 (${rawId}):`, error.message);
      } else {
        // 이미 존재하는 계정이면 테이블에 띄워주기만 함
        const exists = users.value.find(u => u.id === rawId);
        if(!exists) {
           users.value.push({ id: rawId, name: rawName, email: email });
        }
      }
    }
    await new Promise(resolve => setTimeout(resolve, 200)); // API 속도 조절
  }

  isProcessing.value = false;
  statusMessage.value = `완료! (신규 생성: ${successCount}건)`;
  excelData.value = ''; // 입력창 비우기
};


// --- 2. 테이블 관리 로직 (전체선택, 수정, 삭제) ---

// 전체 선택 기능
const isAllSelected = computed(() => {
  return users.value.length > 0 && selectedIds.value.length === users.value.length;
});

const toggleSelectAll = (event) => {
  if (event.target.checked) {
    selectedIds.value = users.value.map(user => user.id);
  } else {
    selectedIds.value = [];
  }
};

// 개별 삭제
const deleteUser = (id) => {
  if (confirm(`${id} 계정을 목록에서 삭제하시겠습니까?\n(주의: 실제 Firebase 서버에서는 수동으로 지워야 합니다)`)) {
    users.value = users.value.filter(user => user.id !== id);
    selectedIds.value = selectedIds.value.filter(selectedId => selectedId !== id);
  }
};

// 선택 삭제
const deleteSelected = () => {
  if (confirm(`선택한 ${selectedIds.value.length}개의 계정을 목록에서 삭제하시겠습니까?`)) {
    users.value = users.value.filter(user => !selectedIds.value.includes(user.id));
    selectedIds.value = [];
  }
};

// 수정 모달 열기
const openEditModal = (user) => {
  editForm.value = { id: user.id, name: user.name };
  isEditModalOpen.value = true;
};

// 수정 저장
const saveEdit = () => {
  const index = users.value.findIndex(u => u.id === editForm.value.id);
  if (index !== -1) {
    users.value[index].name = editForm.value.name;
  }
  isEditModalOpen.value = false;
};
</script>