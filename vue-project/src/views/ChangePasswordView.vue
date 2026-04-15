<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 px-4">
    <div class="max-w-md w-full bg-white rounded-xl shadow-lg p-8 border-t-4 border-red-500">
      
      <div class="text-center mb-8">
        <h1 class="text-2xl font-bold text-gray-800 mb-2">비밀번호 변경 안내</h1>
        <p class="text-red-500 text-sm font-medium">초기 비밀번호를 사용 중입니다.<br>안전을 위해 반드시 비밀번호를 변경해주세요.</p>
      </div>

      <form @submit.prevent="handleChangePassword" class="space-y-6">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">새 비밀번호</label>
          <input 
            v-model="newPassword" 
            type="password" 
            placeholder="6자리 이상 입력" 
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
            required
            minlength="6"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">새 비밀번호 확인</label>
          <input 
            v-model="confirmPassword" 
            type="password" 
            placeholder="다시 한 번 입력하세요" 
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
            required
            minlength="6"
          />
        </div>

        <div v-if="errorMessage" class="text-red-500 text-sm text-center bg-red-50 p-2 rounded-md">
          {{ errorMessage }}
        </div>

        <button 
          type="submit" 
          :disabled="isLoading"
          class="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded-lg transition-all"
        >
          {{ isLoading ? '변경 중...' : '비밀번호 변경 및 시작하기' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { updatePassword } from 'firebase/auth';
import { auth } from '@/firebase';

const router = useRouter();
const newPassword = ref('');
const confirmPassword = ref('');
const errorMessage = ref('');
const isLoading = ref(false);

const handleChangePassword = async () => {
  if (newPassword.value !== confirmPassword.value) {
    errorMessage.value = '비밀번호가 서로 일치하지 않습니다.';
    return;
  }

  isLoading.value = true;
  errorMessage.value = '';

  try {
    const user = auth.currentUser;
    if (!user) {
      alert('로그인 정보가 만료되었습니다. 다시 로그인해주세요.');
      router.push('/login');
      return;
    }

    // 💡 Firebase에 새 비밀번호 저장 요청
    await updatePassword(user, newPassword.value);
    
    alert('비밀번호가 성공적으로 변경되었습니다!');
    
    // 역할별 페이지 이동 로직 (이메일 앞자리 등으로 구분)
    const email = user.email;
    if (email.startsWith('admin')) {
      router.push('/admin');
    } else if (email.startsWith('t') || email.startsWith('T')) {
      router.push('/teacher');
    } else {
      router.push('/student');
    }

  } catch (error) {
    console.error(error);
    errorMessage.value = '비밀번호 변경에 실패했습니다. (최근 로그인한 상태여야 합니다)';
  } finally {
    isLoading.value = false;
  }
};
</script>