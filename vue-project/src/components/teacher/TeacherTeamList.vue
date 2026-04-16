<template>
  <div class="space-y-6 animate-fade-in">
    <h3 class="text-xl font-black text-gray-800">지도 학생 및 모둠 현황</h3>
    <div v-if="teams.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="team in teams" :key="team.teamId" class="p-5 border rounded-2xl hover:border-blue-300 hover:shadow-md transition-all group bg-white">
        <div class="flex justify-between items-start mb-3">
          <span class="text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-1 rounded-lg">{{ team.careerField || '일반' }}</span>
          <span class="text-[10px] text-gray-300 font-mono">{{ team.teamId }}</span>
        </div>
        <h4 class="font-black text-gray-800 text-lg group-hover:text-blue-600 transition-colors">{{ team.teamName }}</h4>
        <div class="mt-4 flex flex-wrap gap-1.5">
          <span v-for="m in team.members" :key="m" class="text-[10px] bg-gray-100 px-2 py-1 rounded-md text-gray-600 font-medium border border-gray-200">
            {{ m }}
          </span>
        </div>
      </div>
    </div>
    <div v-else class="text-center py-20 bg-gray-50 rounded-3xl border border-dashed text-gray-400">
      현재 배정된 지도 팀 정보가 없습니다.
    </div>
  </div>
</template>

<script setup>
defineProps({ teams: Array });
</script>