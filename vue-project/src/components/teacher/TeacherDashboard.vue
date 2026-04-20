// src/components/teacher/TeacherDashboard.vue
<template>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
    <div class="bg-white p-7 rounded-[2.5rem] shadow-sm border border-gray-100 flex items-center space-x-5 transition-all hover:shadow-md">
      <div class="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-2xl shadow-inner">📋</div>
      <div>
        <p class="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Managed Teams</p>
        <p class="text-2xl font-black text-blue-600">{{ teamCount }}<span class="text-xs ml-1 text-gray-400">개 팀</span></p>
      </div>
    </div>

    <div class="bg-white p-7 rounded-[2.5rem] shadow-sm border border-gray-100 flex items-center space-x-5 transition-all hover:shadow-md"
      :class="qaCount > 0 ? 'ring-2 ring-orange-100' : ''">
      <div class="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center text-2xl shadow-inner relative">
        💬
        <span v-if="qaCount > 0" class="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full animate-ping opacity-75"></span>
      </div>
      <div>
        <p class="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Pending Q&A</p>
        <p class="text-2xl font-black text-orange-500">{{ qaCount }}<span class="text-xs ml-1 text-gray-400">건</span></p>
      </div>
    </div>

    <div class="bg-white p-7 rounded-[2.5rem] shadow-sm border border-gray-100 flex items-center space-x-5 transition-all hover:shadow-md">
      <div class="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-2xl shadow-inner">📖</div>
      <div>
        <p class="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Activity Review</p>
        <p class="text-2xl font-black text-green-600">{{ activityCount }}<span class="text-xs ml-1 text-gray-400">건</span></p>
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