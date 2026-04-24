// src/components/admin/AdminHeader.vue
<template>
  <div class="bg-white rounded-xl shadow p-8 flex justify-between items-center border-t-4 border-blue-600">
    <div>
      <h1 class="text-3xl font-bold text-gray-800 mb-2">관리자 대시보드</h1>
      <p class="text-gray-600">계정 일괄 생성 및 사용자 목록 관리를 진행합니다.</p>
    </div>
    <button @click="handleLogout" class="px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
      로그아웃
    </button>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { auth } from '@/firebase'; // 💡 파이어베이스 인증 객체
import { signOut } from 'firebase/auth'; // 💡 로그아웃 함수
import { useUserStore } from '@/stores/userStore'; // 💡 스토어 리셋용

const router = useRouter();
const userStore = useUserStore();

const handleLogout = async () => {
  if (confirm('로그아웃 하시겠습니까?')) {
    try {
      // 1. 🔥 파이어베이스 로그아웃 (서버 세션 종료)
      await signOut(auth);

      // 2. 🧹 Pinia 스토어 데이터 초기화 
      // (가드에서 '비로그인 상태'로 인식하게 만드는 핵심 단계)
      userStore.currentUser = { userKey: '', name: '', role: '', teamId: null };
      
      // 3. 🏃‍♂️ 로그인 페이지로 이동
      router.push('/login');
    } catch (e) {
      console.error("로그아웃 에러:", e);
      alert("로그아웃 처리 중 오류가 발생했습니다.");
    }
  }
};
</script>