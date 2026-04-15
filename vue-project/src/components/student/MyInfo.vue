<template>
    <div class="space-y-8">
      <div class="border-b pb-4">
        <h2 class="text-xl font-bold text-gray-800">나의 활동 현황</h2>
        <p class="text-sm text-gray-500">현재까지 참여한 프로그램 및 제출 정보를 확인하세요.</p>
      </div>
  
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="bg-blue-50 p-6 rounded-2xl border border-blue-100">
          <h3 class="text-blue-700 font-bold mb-4 flex items-center">
            <span class="mr-2">🚀</span> 프로그램 및 팀 정보
          </h3>
          <div v-if="studentStore.mySummary.team" class="space-y-3 text-sm">
            <div class="flex justify-between"><span class="text-gray-500">팀명</span><span class="font-bold">{{ studentStore.mySummary.team.teamName }}</span></div>
            <div class="flex justify-between"><span class="text-gray-500">신청 도서</span><span class="font-bold">{{ studentStore.mySummary.team.bookTitle }}</span></div>
            <div class="border-t pt-2 mt-2">
              <span class="text-gray-500 block mb-1">함께하는 팀원</span>
              <div class="flex flex-wrap gap-2">
                <span v-for="m in studentStore.mySummary.team.members" :key="m.id" class="bg-white px-2 py-1 rounded border text-xs">
                  {{ m.name }}({{ m.id }})
                </span>
              </div>
            </div>
          </div>
          <div v-else class="text-gray-400 text-sm py-4">아직 신청된 프로그램이 없습니다.</div>
        </div>
  
        <div class="bg-purple-50 p-6 rounded-2xl border border-purple-100">
          <h3 class="text-purple-700 font-bold mb-4 flex items-center">
            <span class="mr-2">👨‍🏫</span> 지도 교사 정보
          </h3>
          <div v-if="studentStore.mySummary.teacher" class="space-y-3 text-sm">
            <div class="flex justify-between"><span class="text-gray-500">성함</span><span class="font-bold">{{ studentStore.mySummary.teacher.name }} 선생님</span></div>
            <div class="flex justify-between"><span class="text-gray-500">담당 교과</span><span class="font-bold">{{ studentStore.mySummary.teacher.subject }}</span></div>
            <div class="flex justify-between"><span class="text-gray-500">업무</span><span class="font-bold text-purple-600">{{ studentStore.mySummary.teacher.role }}</span></div>
          </div>
          <div v-else class="text-gray-400 text-sm py-4">지도 교사가 아직 배정되지 않았습니다.</div>
        </div>
      </div>
  
      <div class="grid grid-cols-3 gap-4">
        <div class="bg-white border p-6 rounded-2xl text-center shadow-sm">
          <p class="text-xs text-gray-500 mb-1">독서일지</p>
          <p class="text-2xl font-black text-green-600">{{ studentStore.mySummary.logsCount }}<span class="text-sm font-normal text-gray-400 ml-1">건</span></p>
        </div>
        <div class="bg-white border p-6 rounded-2xl text-center shadow-sm">
          <p class="text-xs text-gray-500 mb-1">자기평가서</p>
          <p :class="studentStore.mySummary.hasEval ? 'text-blue-600' : 'text-red-400'" class="text-lg font-bold">
            {{ studentStore.mySummary.hasEval ? '제출 완료' : '미제출' }}
          </p>
        </div>
        <div class="bg-white border p-6 rounded-2xl text-center shadow-sm">
          <p class="text-xs text-gray-500 mb-1">현재 상태</p>
          <p class="text-lg font-bold text-orange-500">진행 중</p>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { useStudentStore } from '@/stores/studentStore';
  const studentStore = useStudentStore();
  </script>