<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 px-4 font-sans">
    <div class="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 border-t-4 border-blue-600">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-extrabold text-gray-800 mb-2">상당고 특색프로그램</h1>
        <p class="text-gray-500 text-sm">아이디만 입력하여 로그인하세요</p>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-6">
        <div>
          <label for="userId" class="block text-sm font-semibold text-gray-700 mb-1">아이디</label>
          <div class="relative flex items-center">
            <input 
              v-model="userId" 
              type="text" 
              id="userId"
              placeholder="학번 또는 교사 아이디" 
              class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-gray-50 focus:bg-white"
              required
            />
            <span class="absolute right-4 text-gray-400 text-sm pointer-events-none font-medium">@sangdang.hs.kr</span>
          </div>
        </div>

        <div>
          <label for="password" class="block text-sm font-semibold text-gray-700 mb-1">비밀번호</label>
          <input 
            v-model="password" 
            type="password" 
            id="password"
            placeholder="비밀번호 입력" 
            class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-gray-50 focus:bg-white"
            required
          />
        </div>

        <div v-if="errorMessage" class="text-red-500 text-sm text-center font-bold bg-red-50 p-3 rounded-lg border border-red-100">
          {{ errorMessage }}
        </div>

        <button 
          type="submit" 
          :disabled="isLoading"
          class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-colors duration-200 shadow-md disabled:bg-blue-300 flex justify-center items-center"
        >
          <span v-if="isLoading">로그인 처리 중...</span>
          <span v-else>로그인</span>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useUserStore } from '@/stores/userStore';

const router = useRouter();
const userStore = useUserStore();
const userId = ref('');
const password = ref('');
const errorMessage = ref('');
const isLoading = ref(false);

const handleLogin = async () => {
  errorMessage.value = '';
  isLoading.value = true;

  const inputId = userId.value.trim();
  const pureId = inputId.split('@')[0].toUpperCase(); 
  const fullEmail = inputId.includes('@') ? inputId : `${inputId}@sangdang.hs.kr`;

  try {
    await signInWithEmailAndPassword(auth, fullEmail, password.value);
    
    // 초기 비밀번호 변경 체크
    if (password.value === 's1234!' || password.value === 'admin1234') {
      router.push('/change-password');
      return; 
    }

    // 💡 Firestore에서 사용자 데이터 로드
    const q = query(collection(db, "users"), where("email", "==", fullEmail));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      errorMessage.value = 'DB에 사용자 정보가 없습니다.';
      isLoading.value = false;
      return;
    }

    const userData = querySnapshot.docs[0].data();
    const roleFromDB = userData.role ? userData.role.trim() : "";

    // 💡 핵심: 페이지 이동 전에 스토어에 유저 정보 먼저 저장
    userStore.currentUser = userData; 

    // 최종 분기 판정
    const teacherRoles = ['교사', '담임', '학년부장', '교감', '교장', '부장교사'];

    if (pureId === 'ADMIN' || roleFromDB === '관리자') {
      router.push('/admin');
    } 
    else if (
      pureId.startsWith('T') || 
      teacherRoles.includes(roleFromDB) ||
      roleFromDB.includes('교사') || 
      roleFromDB.includes('담임')
    ) {
      router.push('/teacher');
    } 
    else {
      router.push('/student');
    }

  } catch (error) {
    console.error("Login Error:", error);
    errorMessage.value = '아이디 또는 비밀번호가 일치하지 않습니다.';
  } finally {
    isLoading.value = false;
  }
};
</script>