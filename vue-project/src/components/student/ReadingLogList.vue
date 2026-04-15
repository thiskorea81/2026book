<template>
    <div class="space-y-4">
      <div v-if="studentStore.myLogs.length === 0" class="text-center py-10 text-gray-400">
        아직 작성된 독서일지가 없습니다. 첫 일지를 작성해보세요!
      </div>
  
      <div v-else v-for="log in studentStore.myLogs" :key="log.id" 
           class="border rounded-xl p-5 hover:shadow-md transition-shadow bg-white">
        <div class="flex justify-between items-start mb-3">
          <div>
            <span class="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">
              {{ log.date }}
            </span>
            <h3 class="text-lg font-bold text-gray-800 mt-2">{{ log.title }}</h3>
            <p class="text-sm text-gray-500">{{ log.author }}</p>
          </div>
          <button @click="viewDetail(log)" class="text-blue-500 text-sm font-medium">자세히 보기</button>
        </div>
        
        <p class="text-gray-600 text-sm line-clamp-2 leading-relaxed">
          {{ log.summary }}
        </p>
      </div>
    </div>
  </template>
  
  <script setup>
  import { useStudentStore } from '@/stores/studentStore';
  const studentStore = useStudentStore();
  
  const viewDetail = (log) => {
    alert(`[${log.title}] 상세 내용을 확인합니다.`);
  };
  </script>