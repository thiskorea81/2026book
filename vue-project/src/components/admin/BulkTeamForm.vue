<template>
    <div class="bg-white rounded-xl shadow p-6 space-y-4">
      <div class="flex justify-between items-center">
        <h2 class="text-lg font-bold text-gray-800">🚀 팀 정보 일괄 등록</h2>
        <span class="text-xs text-gray-400">엑셀 데이터를 아래에 붙여넣으세요.</span>
      </div>
  
      <textarea 
        v-model="rawInput"
        placeholder="팀번호  팀이름  팀원1  ... 담당교사번호 순으로 붙여넣기"
        class="w-full h-48 p-4 text-xs font-mono border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50"
      ></textarea>
  
      <div class="flex justify-between items-center">
        <div class="text-sm">
          <span v-if="isProcessing" class="text-blue-600 font-bold animate-pulse">{{ statusMessage }}</span>
          <span v-else class="text-gray-500">줄 바꿈으로 구분된 팀 데이터를 입력하세요.</span>
        </div>
        <button 
          @click="processData"
          :disabled="isProcessing || !rawInput"
          class="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold shadow-md hover:bg-blue-700 disabled:opacity-50"
        >
          팀 데이터 업로드
        </button>
      </div>
    </div>
  </template>
  
  <script setup>
import { ref } from 'vue';
import { useAdminStore } from '@/stores/adminStore';

const adminStore = useAdminStore();
const rawInput = ref('');
const isProcessing = ref(false);
const statusMessage = ref('');

const processData = async () => {
  const lines = rawInput.value.split('\n').filter(l => l.trim() !== '');
  if (!confirm(`${lines.length}줄의 데이터를 처리하시겠습니까? (헤더는 자동 제외됩니다)`)) return;

  isProcessing.value = true;
  let success = 0;
  let skipped = 0;

  for (let line of lines) {
    // 💡 엑셀 헤더(맨 윗줄) 자동 건너뛰기
    if (line.includes('팀번호') || line.includes('팀이름')) {
      skipped++;
      continue;
    }

    const p = line.split('\t'); 
    if (p.length < 12) {
      skipped++; // 데이터가 부족한 줄도 건너뛰기
      continue; 
    }

    const memberIds = [p[2], p[3], p[4], p[5], p[6], p[7]]
      .map(id => id?.trim())
      .filter(id => id && id !== '');

    let tNum = p[12]?.trim() || "0";
    const teacherId = tNum.startsWith('T') ? tNum : `T${tNum.padStart(2, '0')}`;

    const teamData = {
      teamId: p[0].trim(),           
      teamName: p[1].trim(),         
      members: memberIds,            
      leaderId: p[8]?.trim(),        
      memberCount: parseInt(p[9]),   
      careerField: p[10]?.trim(),    
      bookInfo: p[11]?.trim(),       
      teacherId: teacherId           
    };

    try {
      await adminStore.saveTeam(teamData);
      success++;
      statusMessage.value = `${success}번째 팀 처리 중...`;
    } catch (e) {
      console.error("팀 등록 에러:", e);
    }
  }

  isProcessing.value = false;
  // 💡 제외된 줄이 몇 개인지도 알림으로 띄워줍니다.
  alert(`완료! (${success}개 팀 등록 성공, ${skipped}줄 제외됨)`);
  rawInput.value = '';
};
</script>