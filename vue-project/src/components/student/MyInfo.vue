<template>
  <div class="space-y-8">
    <div class="border-b pb-4">
      <h2 class="text-xl font-bold text-gray-800">나의 활동 현황</h2>
      <p class="text-sm text-gray-500">현재까지 참여한 프로그램 및 제출 정보를 확인하세요.</p>
    </div>

    <div v-if="userStore.isLoading" class="py-20 text-center text-gray-400 font-bold animate-pulse">
      현황 정보를 불러오는 중입니다...
    </div>

    <div v-else class="space-y-8">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="bg-blue-50 p-6 rounded-2xl border border-blue-100 shadow-sm transition-all hover:shadow-md">
          <h3 class="text-blue-700 font-bold mb-4 flex items-center">
            <span class="mr-2">🚀</span> 프로그램 및 팀 정보
          </h3>
          <div v-if="userStore.mySummary.team" class="space-y-3 text-sm">
            <div class="flex justify-between items-center"><span class="text-gray-500">팀명</span><span class="font-bold text-blue-900">{{ userStore.mySummary.team.teamName }}</span></div>
            <div class="flex justify-between items-center"><span class="text-gray-500">신청 분야</span><span class="font-bold">{{ userStore.mySummary.team.careerField }}</span></div>
            <div class="border-t border-blue-100 pt-3 mt-2">
              <span class="text-gray-500 block mb-2 font-semibold">함께하는 팀원</span>
              <div class="flex flex-wrap gap-2">
                <span v-for="memberId in userStore.mySummary.team.members" :key="memberId" class="bg-white px-2 py-1 rounded-lg border border-blue-200 text-[11px] text-blue-600 font-medium">{{ memberId }}</span>
              </div>
            </div>
          </div>
          <div v-else class="text-gray-400 text-sm py-4 flex flex-col items-center">
            <span class="mb-2">아직 신청된 팀 정보가 없습니다.</span>
          </div>
        </div>

        <div class="bg-purple-50 p-6 rounded-2xl border border-purple-100 shadow-sm transition-all hover:shadow-md">
          <h3 class="text-purple-700 font-bold mb-4 flex items-center"><span class="mr-2">👨‍🏫</span> 지도 교사 정보</h3>
          <div v-if="userStore.mySummary.teacher" class="space-y-3 text-sm">
            <div class="flex justify-between items-center"><span class="text-gray-500">성함</span><span class="font-bold text-purple-900">{{ userStore.mySummary.teacher.name }} 선생님</span></div>
            <div class="flex justify-between items-center"><span class="text-gray-500">담당 교과</span><span class="font-bold">{{ userStore.mySummary.teacher.subject }}</span></div>
            <div class="flex justify-between items-center"><span class="text-gray-500">역할</span><span class="px-2 py-0.5 bg-purple-200 text-purple-800 rounded text-[10px] font-bold">{{ userStore.mySummary.teacher.role || '지도교사' }}</span></div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-3 gap-4">
        <div class="bg-white border border-gray-100 p-6 rounded-2xl text-center shadow-sm">
          <p class="text-[11px] font-bold text-gray-400 mb-1 uppercase tracking-wider">독서일지</p>
          <p class="text-3xl font-black text-green-600">{{ userStore.mySummary.logsCount }}<span class="text-sm font-normal text-gray-400 ml-0.5">건</span></p>
        </div>

        <div class="bg-white border border-gray-100 p-6 rounded-2xl text-center shadow-sm">
          <p class="text-[11px] font-bold text-gray-400 mb-1 uppercase tracking-wider">자기평가서</p>
          <p :class="userStore.mySummary.hasEval ? 'text-blue-600' : 'text-red-400'" class="text-lg font-black mt-1">
            {{ userStore.mySummary.hasEval ? '제출 완료' : '미제출' }}
          </p>
        </div>

        <div class="bg-white border border-gray-100 p-6 rounded-2xl text-center shadow-sm">
          <p class="text-[11px] font-bold text-gray-400 mb-1 uppercase tracking-wider">현재 상태</p>
          <p :class="userStore.activityStatus.color" class="text-lg font-black mt-1 transition-all duration-500">
            {{ userStore.activityStatus.text }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useUserStore } from '@/stores/userStore';
const userStore = useUserStore();
onMounted(() => userStore.fetchMySummary());
</script>