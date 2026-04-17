// src/components/teacher/TeacherActivityDetailView.vue
<template>
  <div class="mb-8">
    <div class="flex items-center justify-between mb-4 gap-3">
      <button 
        @click="isVisible = !isVisible"
        class="flex items-center justify-between flex-1 p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-white transition-all group"
      >
        <div class="flex items-center space-x-2">
          <span class="w-2 h-2 rounded-full bg-purple-600 animate-pulse"></span>
          <h5 class="text-sm font-black text-gray-700">세부활동 확인하기</h5>
          <span class="text-[10px] text-gray-400 font-bold ml-1">({{ activityList.length }}건)</span>
        </div>
        <span class="text-gray-400 group-hover:text-purple-600 transition-colors text-xs font-bold">
          {{ isVisible ? '▲ 접기' : '▼ 펼쳐서 데이터 확인' }}
        </span>
      </button>

      <button 
        v-if="activityList.length > 0"
        @click="exportToCsv"
        class="px-5 py-4 bg-green-50 text-green-600 rounded-2xl border border-green-100 hover:bg-green-600 hover:text-white transition-all flex items-center gap-2 group"
      >
        <span class="text-lg group-hover:scale-110 transition-transform">📊</span>
        <span class="text-xs font-black">Excel 다운로드</span>
      </button>
    </div>

    <div v-if="isVisible" class="grid grid-cols-1 gap-3 animate-fade-in">
      <div v-for="(item, idx) in activityList" :key="idx" 
        class="bg-white p-5 rounded-2xl border border-purple-50 shadow-sm">
        <div class="flex items-center space-x-2 mb-3 border-b border-gray-50 pb-2">
          <span class="text-[9px] font-black px-1.5 py-0.5 bg-purple-100 text-purple-600 rounded uppercase tracking-tighter">{{ item.category }}</span>
          <span class="text-[11px] font-bold text-gray-800">{{ item.label }}</span>
        </div>
        <p class="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">{{ item.content }}</p>
      </div>
      <div v-if="activityList.length === 0" class="text-center py-10 text-gray-300 text-xs italic">
        활동 데이터가 존재하지 않습니다.
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  activityList: Array,
  studentName: String
});

const isVisible = ref(false);

// 학생이 바뀌면 아코디언을 자동으로 닫습니다.
watch(() => props.studentName, () => {
  isVisible.value = false;
});

/**
 * 💡 활동 데이터를 CSV로 변환하여 다운로드
 */
const exportToCsv = () => {
  if (props.activityList.length === 0) return;

  // BOM 추가 (Excel 한글 깨짐 방지)
  let csv = "\ufeff";
  csv += "구분,항목명,상세내용\n";

  props.activityList.forEach(item => {
    // 쉼표와 줄바꿈이 CSV 구조를 깨트리지 않게 따옴표로 감싸고 이중 따옴표 처리
    const category = `"${item.category}"`;
    const label = `"${item.label.replace(/"/g, '""')}"`;
    const content = `"${item.content.replace(/"/g, '""')}"`;
    csv += `${category},${label},${content}\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  
  const today = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `${props.studentName}_활동기록_${today}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};
</script>

<style scoped>
.animate-fade-in { animation: fadeIn 0.3s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
</style>