<template>
  <div class="min-h-screen bg-gray-50">
    <nav class="bg-white shadow-sm border-b px-6 py-4 flex justify-between items-center">
      <h1 class="text-xl font-bold text-green-600">상당고 특색프로그램 (학생용)</h1>
      <button @click="handleLogout" class="text-sm text-gray-500 hover:text-red-500 transition-colors">로그아웃</button>
    </nav>

    <main class="max-w-4xl mx-auto p-6">
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center mb-8">
        <h2 class="text-2xl font-bold text-gray-800">환영합니다! 👋</h2>
        <p class="text-gray-500 mt-2">현재 참여 가능한 프로그램이 2개 있습니다.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div class="text-3xl mb-4">🚀</div>
          <h3 class="text-lg font-bold text-gray-800">프로그램 신청</h3>
          <p class="text-sm text-gray-500 mt-1">새로운 학년 특색 활동에 참여하세요.</p>
          <button class="mt-4 w-full py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors">신청하기</button>
        </div>

        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div class="text-3xl mb-4">📄</div>
          <h3 class="text-lg font-bold text-gray-800">활동 보고서 제출</h3>
          <p class="text-sm text-gray-500 mt-1">참여한 활동의 결과를 기록하고 제출하세요.</p>
          <button class="mt-4 w-full py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors">작성하기</button>
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