<template>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
    <div class="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center space-x-4">
      <div class="p-3 bg-blue-50 rounded-2xl text-2xl">📋</div>
      <div>
        <p class="text-xs text-gray-400 font-bold uppercase">담당 팀</p>
        <p class="text-2xl font-black text-blue-600">{{ teamCount }}개 팀</p>
      </div>
    </div>
    <div class="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center space-x-4">
      <div class="p-3 bg-orange-50 rounded-2xl text-2xl">💬</div>
      <div>
        <p class="text-xs text-gray-400 font-bold uppercase">대기 중인 Q&A</p>
        <p class="text-2xl font-black text-orange-500">{{ qaCount }}건</p>
      </div>
    </div>
    <div class="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center space-x-4">
      <div class="p-3 bg-green-50 rounded-2xl text-2xl">📖</div>
      <div>
        <p class="text-xs text-gray-400 font-bold uppercase">누적 활동 점검</p>
        <p class="text-2xl font-black text-green-600">{{ activityCount }}건</p>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  teamCount: Number,
  qaCount: Number,
  activityCount: Number
});
</script>