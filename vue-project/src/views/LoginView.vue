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
              class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-gray-50 focus:bg-white"
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
            class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-gray-50 focus:bg-white"
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
          <span v-if="isLoading" class="flex items-center">
            로그인 처리 중...
          </span>
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
import { auth } from '@/firebase';

const router = useRouter();
const userId = ref('');
const password = ref('');
const errorMessage = ref('');
const isLoading = ref(false);

const handleLogin = async () => {
  errorMessage.value = '';
  isLoading.value = true;

  const pureId = userId.value.split('@')[0]; 
  const fullEmail = userId.value.includes('@') ? userId.value : `${userId.value}@sangdang.hs.kr`;

  try {
    await signInWithEmailAndPassword(auth, fullEmail, password.value);
    
    // 💡 강제 비밀번호 변경 대상에서 교사(끝이 $인 비밀번호)를 제외했습니다.
    // 학생(s1234!)과 관리자(admin1234)만 강제로 비밀번호 변경 페이지로 이동합니다.
    const isInitialPassword = 
      password.value === 's1234!' || 
      password.value === 'admin1234';

    if (isInitialPassword) {
      router.push('/change-password');
      return; 
    }

    // 역할에 맞게 페이지 이동
    if (pureId === 'admin') {
      router.push('/admin');
    } else if (pureId.toLowerCase().startsWith('t')) {
      router.push('/teacher');
    } else {
      router.push('/student');
    }

  } catch (error) {
    console.error("로그인 에러:", error);
    switch (error.code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        errorMessage.value = '아이디 또는 비밀번호가 일치하지 않습니다.';
        break;
      case 'auth/too-many-requests':
        errorMessage.value = '접근이 일시적으로 제한되었습니다. 잠시 후 시도해주세요.';
        break;
      default:
        errorMessage.value = '로그인 중 서버 오류가 발생했습니다.';
    }
  } finally {
    isLoading.value = false;
  }
};
</script>