<template>
  <div class="min-h-screen bg-gray-50 font-sans">
    
    <nav class="bg-white shadow-sm border-b px-6 py-4 flex justify-between items-center">
      <h1 class="text-xl font-bold text-blue-600">상당고 특색프로그램 (교사용)</h1>
      
      <div class="space-x-4">
        <button @click="goToChangePassword" class="text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors">
          비밀번호 변경
        </button>
        <button @click="handleLogout" class="text-sm font-medium text-gray-500 hover:text-red-500 transition-colors">
          로그아웃
        </button>
      </div>
    </nav>

    <main class="max-w-6xl mx-auto p-6 mt-8">
      <div class="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center">
        <h2 class="text-2xl font-bold text-gray-800">선생님, 환영합니다!</h2>
        <p class="text-gray-500 mt-2">이곳에 향후 특색 프로그램 관리, 보고서 승인 기능이 추가될 예정입니다.</p>
      </div>
    </main>

  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
// Firebase 로그아웃 기능을 사용하시려면 아래 주석을 풀고 연결하세요
// import { auth } from '@/firebase'; 
// import { signOut } from 'firebase/auth';

const router = useRouter();

// 💡 비밀번호 변경 페이지로 이동
const goToChangePassword = () => {
  router.push('/change-password');
};

const handleLogout = async () => {
  if (confirm('로그아웃 하시겠습니까?')) {
    // await signOut(auth); // 실제 연동 시 주석 해제
    router.push('/login');
  }
};
</script>