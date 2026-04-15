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
const router = useRouter();

const handleLogout = () => {
  if (confirm('로그아웃 하시겠습니까?')) {
    router.push('/login');
  }
};
</script>