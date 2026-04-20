// src/components/student/StudentActivityExport.vue
<template>
  <button 
    v-if="hasData"
    @click="exportToCsv"
    class="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-xl hover:bg-green-600 hover:text-white transition-all shadow-sm active:scale-95"
  >
    <span class="text-lg">📊</span>
    <span class="text-xs font-black">전체 활동 엑셀 다운로드</span>
  </button>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  logs: Array,
  selfEval: Object,
  studentName: String
});

const hasData = computed(() => props.logs.length > 0 || props.selfEval);

/**
 * 💡 CSV 내보내기 로직
 */
const exportToCsv = () => {
  let csv = "\ufeff"; // Excel 한글 깨짐 방지용 BOM
  csv += "활동구분,항목/도서명,상세내용,날짜\n";

  // 1. 독서일지 추가
  props.logs.forEach(log => {
    const content = [
      `[저자] ${log.author}`,
      `[요약] ${log.summary}`,
      `[소감] ${log.impression}`,
      `[깨달음] ${log.realization}`,
      `[방법] ${log.method}`
    ].join(' | ').replace(/"/g, '""');

    csv += `"독서일지","${log.title}","${content}","${log.date}"\n`;
  });

  // 2. 자기평가서 추가
  if (props.selfEval) {
    const evalContent = [
      `[탐구주제] ${props.selfEval.careerTopic}`,
      `[진로희망] ${props.selfEval.careerGoal}`,
      `[동기] ${props.selfEval.motivation}`,
      `[역할] ${props.selfEval.roleInTeam}`,
      `[소감 및 계획] ${props.selfEval.reviewAndPlan}`
    ].join(' | ').replace(/"/g, '""');

    csv += `"자기평가서","${props.selfEval.bookTitle}","${evalContent}","제출완료"\n`;
  }

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const today = new Date().toISOString().slice(0, 10);
  
  link.href = url;
  link.download = `${props.studentName}_활동증빙자료_${today}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};
</script>