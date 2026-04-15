<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 px-4">
    <div class="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
      
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-800 mb-2">상당고 특색프로그램</h1>
        <p class="text-gray-500 text-sm">아이디만 입력하여 로그인하세요</p>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-6">
        <div>
          <label for="userId" class="block text-sm font-medium text-gray-700 mb-1">아이디</label>
          <div class="relative flex items-center">
            <input 
              v-model="userId" 
              type="text" 
              id="userId"
              placeholder="아이디 입력" 
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              required
            />
            <span class="absolute right-3 text-gray-400 text-sm pointer-events-none">@sangdang.hs.kr</span>
          </div>
        </div>

        <div>
          <label for="password" class="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
          <input 
            v-model="password" 
            type="password" 
            id="password"
            placeholder="비밀번호 입력" 
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            required
          />
        </div>

        <div v-if="errorMessage" class="text-red-500 text-sm text-center font-medium bg-red-50 p-2 rounded-md">
          {{ errorMessage }}
        </div>

        <button 
          type="submit" 
          :disabled="isLoading"
          class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors duration-200 flex justify-center items-center disabled:bg-blue-400"
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
import { auth } from '@/firebase';

const router = useRouter();
const userId = ref('');
const password = ref('');
const errorMessage = ref('');
const isLoading = ref(false);

const handleLogin = async () => {
  errorMessage.value = '';
  isLoading.value = true;

  // 아이디 파싱 및 도메인 자동 결합
  const pureId = userId.value.split('@')[0]; 
  const fullEmail = userId.value.includes('@') 
    ? userId.value 
    : `${userId.value}@sangdang.hs.kr`;

  try {
    // 💡 모든 사용자를 Firebase Auth로 인증 (관리자, 교사, 학생 전부)
    const userCredential = await signInWithEmailAndPassword(auth, fullEmail, password.value);
    
    // 💡 초기 비밀번호 감지 로직
    const isInitialPassword = 
      password.value === 's1234!' || 
      password.value === 'admin1234' ||
      password.value.endsWith('$'); // t2419$ 등 교사 초기비번 패턴

    if (isInitialPassword) {
      alert("초기 비밀번호를 사용 중입니다. 안전을 위해 비밀번호를 변경해주세요.");
      router.push('/change-password');
      return; // 변경 페이지로 보내고 함수 종료
    }

    // 💡 초기 비밀번호가 아니라면 권한별 페이지로 이동
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
        errorMessage.value = '로그인 중 오류가 발생했습니다.';
    }
  } finally {
    isLoading.value = false;
  }
};
</script>