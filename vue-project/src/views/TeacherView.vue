<template>
  <div class="min-h-screen bg-gray-50">
    <nav class="bg-white shadow-sm border-b px-6 py-4 flex justify-between items-center">
      <h1 class="text-xl font-bold text-blue-600">상당고 특색프로그램 (교사용)</h1>
      <button @click="handleLogout" class="text-sm text-gray-500 hover:text-red-500 transition-colors">로그아웃</button>
    </nav>

    <main class="max-w-6xl mx-auto p-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 class="text-gray-500 text-sm font-medium">전체 신청 현황</h2>
          <p class="text-3xl font-bold text-gray-800 mt-2">128명</p>
        </div>
        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 class="text-gray-500 text-sm font-medium">미확인 보고서</h2>
          <p class="text-3xl font-bold text-orange-500 mt-2">12건</p>
        </div>
        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 class="text-gray-500 text-sm font-medium">진행 중인 프로그램</h2>
          <p class="text-3xl font-bold text-green-500 mt-2">4개</p>
        </div>
      </div>

      <div class="mt-10">
        <h3 class="text-lg font-bold text-gray-700 mb-4">주요 관리 메뉴</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button class="p-4 bg-blue-50 text-blue-700 rounded-lg font-medium hover:bg-blue-100 transition-all text-left">
            📁 프로그램 개설 및 수정
          </button>
          <button class="p-4 bg-blue-50 text-blue-700 rounded-lg font-medium hover:bg-blue-100 transition-all text-left">
            📝 학생 보고서 검토 및 승인
          </button>
        </div>
      </div>
    </main>
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