<template>
    <div class="space-y-6">
      <div class="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg text-sm text-blue-800 space-y-1">
        <h4 class="font-bold mb-2">💡 독서일지 작성 가이드</h4>
        <ul class="list-disc pl-5">
          <li>매시간 읽은 날짜와 쪽수를 씁니다.</li>
          <li>수업 50분 중 40분은 독서, 10분은 독서 일지를 작성합니다.</li>
          <li>책의 내용과 관련 있는 경험이나 최근 시사 쟁점을 떠올려 보세요.</li>
          <li>길게 쓰지 않아도 좋지만, 매시간 꾸준히 쓰는 것이 중요합니다!</li>
        </ul>
      </div>
  
      <form @submit.prevent="submitForm" class="space-y-4">
        <div class="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
          <div>
            <label class="block text-xs text-gray-500 mb-1">학번</label>
            <input type="text" :value="studentStore.currentUser.userKey" disabled class="w-full p-2 bg-gray-200 rounded border">
          </div>
          <div>
            <label class="block text-xs text-gray-500 mb-1">이름</label>
            <input type="text" :value="studentStore.currentUser.name" disabled class="w-full p-2 bg-gray-200 rounded border">
          </div>
        </div>
  
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-semibold mb-1">책 제목</label>
            <input v-model="form.title" type="text" required class="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 outline-none">
          </div>
          <div>
            <label class="block text-sm font-semibold mb-1">글쓴이</label>
            <input v-model="form.author" type="text" required class="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 outline-none">
          </div>
        </div>
  
        <div>
          <label class="block text-sm font-semibold mb-1">읽은 날짜</label>
          <input v-model="form.date" type="date" required class="p-2 border rounded focus:ring-2 focus:ring-green-500 outline-none">
        </div>
  
        <div>
          <label class="block text-sm font-semibold mb-1">책의 중심 내용 및 줄거리</label>
          <textarea v-model="form.summary" rows="3" required class="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 outline-none"></textarea>
        </div>
  
        <div>
          <label class="block text-sm font-semibold mb-1">가장 인상 깊거나 흥미로운 부분</label>
          <textarea v-model="form.impression" rows="3" required class="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 outline-none"></textarea>
        </div>
  
        <div>
          <label class="block text-sm font-semibold mb-1">새롭게 깨달은 점</label>
          <textarea v-model="form.realization" rows="3" required class="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 outline-none"></textarea>
        </div>
  
        <div>
          <label class="block text-sm font-semibold mb-1">책 내용을 잘 이해하기 위해 사용한 독서 방법과 효과</label>
          <textarea v-model="form.method" rows="3" required class="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 outline-none"></textarea>
        </div>
  
        <button type="submit" class="w-full py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700">제출하기</button>
      </form>
    </div>
  </template>
  
  <script setup>
  import { reactive, onMounted } from 'vue';
  import { useStudentStore } from '@/stores/studentStore';
  
  const studentStore = useStudentStore();
  
  const form = reactive({
    title: '', author: '', date: '',
    summary: '', impression: '', realization: '', method: ''
  });
  
  onMounted(() => {
    // 오늘 날짜 기본 세팅
    const today = new Date().toISOString().split('T')[0];
    form.date = today;
  });
  
  const submitForm = () => {
    studentStore.submitForm('독서일지', form);
  };
  </script>