<template>
    <div class="space-y-6">
      <h2 class="text-xl font-bold text-gray-800 border-b pb-2">자기평가서 작성</h2>
  
      <form @submit.prevent="submitForm" class="space-y-5">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-semibold mb-1">학번</label>
            <input :value="studentStore.currentUser.userKey" disabled class="w-full p-2 bg-gray-100 border rounded">
          </div>
          <div>
            <label class="block text-sm font-semibold mb-1">이름</label>
            <input :value="studentStore.currentUser.name" disabled class="w-full p-2 bg-gray-100 border rounded">
          </div>
        </div>
  
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="md:col-span-2">
            <label class="block text-sm font-semibold mb-1">책 제목</label>
            <input v-model="form.bookTitle" type="text" required class="w-full p-2 border rounded">
          </div>
          <div>
            <label class="block text-sm font-semibold mb-1">진로 탐구 주제</label>
            <input v-model="form.careerTopic" type="text" required class="w-full p-2 border rounded">
          </div>
          <div>
            <label class="block text-sm font-semibold mb-1">진로 희망(직업)</label>
            <input v-model="form.careerGoal" type="text" required class="w-full p-2 border rounded">
          </div>
          <div>
            <label class="block text-sm font-semibold mb-1">진학 희망(학과)</label>
            <input v-model="form.majorGoal" type="text" required class="w-full p-2 border rounded">
          </div>
          <div>
            <label class="block text-sm font-semibold mb-1">진로 탐구활동 관련 분야 및 교과</label>
            <input v-model="form.subjectField" type="text" placeholder="예: 생명과학, 의학" required class="w-full p-2 border rounded">
          </div>
        </div>
  
        <div class="space-y-4 border-t pt-4">
          <div>
            <label class="block text-sm font-semibold mb-1">모둠 내 자신의 역할</label>
            <input v-model="form.roleInTeam" type="text" placeholder="예: 자료 조사, 실험 설계 등" required class="w-full p-2 border rounded">
          </div>
          <div>
            <label class="block text-sm font-semibold mb-1">주제 선정 동기</label>
            <textarea v-model="form.motivation" rows="3" required class="w-full p-2 border rounded outline-none focus:ring-2 focus:ring-green-500"></textarea>
          </div>
          <div>
            <label class="block text-sm font-semibold mb-1">활동 소감 및 후속 탐구 계획</label>
            <p class="text-xs text-gray-400 mb-1">(소감, 느낀점, 후속 활동 계획, 전공계열 탐구, 추가 독서 계획 등 포함)</p>
            <textarea v-model="form.reviewAndPlan" rows="6" required class="w-full p-2 border rounded outline-none focus:ring-2 focus:ring-green-500"></textarea>
          </div>
        </div>
  
        <button type="submit" class="w-full py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors">자기평가서 제출</button>
      </form>
    </div>
  </template>
  
  <script setup>
  import { reactive } from 'vue';
  import { useStudentStore } from '@/stores/studentStore';
  
  const studentStore = useStudentStore();
  const form = reactive({
    bookTitle: '', careerTopic: '', careerGoal: '', majorGoal: '',
    subjectField: '', roleInTeam: '', motivation: '', reviewAndPlan: ''
  });
  
  const submitForm = () => {
    studentStore.submitForm('자기평가서', form);
  };
  </script>