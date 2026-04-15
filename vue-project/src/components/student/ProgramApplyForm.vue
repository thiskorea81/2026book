<template>
    <div class="space-y-6">
      <h2 class="text-xl font-bold text-gray-800 border-b pb-2">학년 특색 프로그램 신청</h2>
      
      <form @submit.prevent="submitForm" class="space-y-6">
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
  
        <div class="space-y-4 p-4 border rounded-lg bg-gray-50">
          <div>
            <label class="block text-sm font-semibold mb-1">팀명</label>
            <input v-model="form.teamName" type="text" placeholder="팀 이름을 정해주세요" required class="w-full p-2 border rounded">
          </div>
  
          <div>
            <label class="block text-sm font-semibold mb-2">팀원 정보 (학번 및 이름)</label>
            <div v-for="(member, index) in form.members" :key="index" class="flex gap-2 mb-2">
              <input v-model="member.id" type="text" placeholder="학번" class="w-1/3 p-2 border rounded text-sm">
              <input v-model="member.name" type="text" placeholder="이름" class="w-2/3 p-2 border rounded text-sm">
              <button v-if="index > 0" type="button" @click="removeMember(index)" class="text-red-500 px-2 text-sm">삭제</button>
            </div>
            <button type="button" @click="addMember" class="text-blue-600 text-sm font-medium mt-1">+ 팀원 추가</button>
          </div>
        </div>
  
        <div>
          <label class="block text-sm font-semibold mb-1">도서 ISBN</label>
          <input v-model="form.isbn" type="text" placeholder="신청 도서의 ISBN 13자리를 입력하세요" required class="w-full p-2 border rounded font-mono">
        </div>
  
        <button type="submit" class="w-full py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors">프로그램 신청 완료</button>
      </form>
    </div>
  </template>
  
  <script setup>
  import { reactive } from 'vue';
  import { useStudentStore } from '@/stores/studentStore';
  
  const studentStore = useStudentStore();
  const form = reactive({
    teamName: '',
    members: [{ id: '', name: '' }],
    isbn: ''
  });
  
  const addMember = () => form.members.push({ id: '', name: '' });
  const removeMember = (index) => form.members.splice(index, 1);
  
  const submitForm = () => {
    studentStore.submitForm('프로그램신청', form);
  };
  </script>