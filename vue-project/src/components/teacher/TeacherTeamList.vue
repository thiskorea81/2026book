<template>
  <div class="space-y-6 animate-fade-in">
    <div class="flex justify-between items-center">
      <h3 class="text-xl font-black text-gray-800">지도 학생 및 모둠 현황</h3>
      <p class="text-[10px] text-gray-400 font-bold">카드 클릭 시 상세 현황을 확인합니다.</p>
    </div>

    <div v-if="teams.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="team in teams" :key="team.teamId" 
        @click="selectedTeam = team"
        class="p-5 border rounded-3xl hover:border-blue-400 hover:shadow-xl transition-all group bg-white cursor-pointer relative overflow-hidden"
      >
        <div class="flex justify-between items-start mb-3">
          <span class="text-[10px] font-black text-blue-500 bg-blue-50 px-2 py-1 rounded-lg uppercase">{{ team.careerField || '일반' }}</span>
          <span class="text-[10px] text-gray-300 font-mono">{{ team.teamId }}</span>
        </div>
        <h4 class="font-black text-gray-800 text-lg group-hover:text-blue-600 transition-colors mb-4">{{ team.teamName }}</h4>
        
        <div class="flex flex-wrap gap-1.5">
          <span v-for="m in team.members" :key="m" 
            class="text-[10px] bg-gray-50 px-2.5 py-1.5 rounded-xl text-gray-600 font-bold border border-gray-100 group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors"
          >
            {{ getStudentName(m) }}
          </span>
        </div>

        <div class="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
          <span class="text-blue-500">→</span>
        </div>
      </div>
    </div>

    <div v-else class="text-center py-20 bg-gray-50 rounded-3xl border border-dashed text-gray-400">
      현재 배정된 지도 팀 정보가 없습니다.
    </div>

    <TeacherTeamDetailModal 
      v-if="selectedTeam" 
      :team="selectedTeam" 
      @close="selectedTeam = null" 
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useTeacherStore } from '@/stores/teacherStore';
import TeacherTeamDetailModal from './TeacherTeamDetailModal.vue';

const props = defineProps({ teams: Array });
const teacherStore = useTeacherStore();
const selectedTeam = ref(null);

// 리스트에서도 이름을 보여주기 위한 함수
const getStudentName = (id) => {
  const student = teacherStore.homeroomStudents.find(s => s.userKey === id);
  if (student) return student.name;
  
  const record = teacherStore.studentLogs.find(l => l.studentId === id);
  return record ? record.studentName : id;
};
</script>