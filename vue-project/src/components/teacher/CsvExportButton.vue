<template>
  <button @click="downloadCsv" 
    class="w-full py-2 bg-green-50 text-green-700 border border-green-200 rounded-xl text-[11px] font-black hover:bg-green-100 transition-all flex items-center justify-center gap-1">
    📊 {{ label }} CSV 저장
  </button>
</template>

<script setup>
import { db } from '@/firebase';
import { collection, getDocs } from 'firebase/firestore';

const props = defineProps({
  label: String,
  students: Array,
  logs: Array,
  evals: Array,
  teams: Array
});

const downloadCsv = async () => {
  if (props.students.length === 0) return alert('내보낼 데이터가 없습니다.');
  
  try {
    // 1. 헤더 및 생기부 초안 맵핑
    const headers = ["학번", "이름", "팀명", "진로분야", "독서기록내역", "자기평가내역", "생기부초안(자율)"];
    const recordSnap = await getDocs(collection(db, "studentRecords"));
    const recordMap = {};
    recordSnap.forEach(doc => { recordMap[doc.id] = doc.data().autonomous || ''; });

    // 2. 데이터 행 생성
    const rows = props.students.map(s => {
      // 독서 기록 가공 (저장 규칙 준수: '책 제목 (저자)')
      const logText = props.logs
        .filter(l => l.studentId === s.userKey)
        .map(l => `'${l.title} (${l.author})' - ${l.summary.replace(/[\n,]/g, ' ')}`)
        .join(' | ');

      // 자기평가서 가공
      const evalText = props.evals
        .filter(e => e.studentId === s.userKey)
        .map(e => `[${e.careerTopic}] ${e.reviewAndPlan.replace(/[\n,]/g, ' ')}`)
        .join(' | ');

      const team = props.teams.find(t => t.members.includes(s.userKey));

      return [
        s.userKey,
        s.name,
        team ? team.teamName : '소속없음',
        team ? team.careerField : '-',
        `"${logText}"`,
        `"${evalText}"`,
        `"${recordMap[s.userKey] || ''}"`
      ];
    });

    // 3. CSV 생성 (BOM 추가로 엑셀 한글 깨짐 방지)
    const csvContent = "\uFEFF" + [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    
    link.href = url;
    link.download = `생기부_추출_${props.label}_${new Date().toLocaleDateString()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  } catch (e) {
    console.error(e);
    alert('CSV 생성 중 오류가 발생했습니다.');
  }
};
</script>