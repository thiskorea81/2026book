// src/components/teacher/TeacherTeamDetailModal.vue
<template>
  <div class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
    <div class="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
      
      <div class="p-6 border-b bg-gray-50 flex justify-between items-center">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="text-[10px] font-black text-white bg-purple-600 px-2 py-0.5 rounded uppercase">
              ID: {{ team.teamId }}
            </span>
            <span class="text-[10px] font-black text-purple-600 bg-purple-50 px-2 py-0.5 rounded uppercase">
              {{ team.careerField || '일반' }}
            </span>
          </div>
          <h3 class="text-xl font-black text-gray-900">{{ team.teamName }} 상세 정보</h3>
        </div>
        <button @click="$emit('close')" class="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400">
          <span class="text-2xl">&times;</span>
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
        
        <section class="space-y-4">
          <div class="flex items-center space-x-2">
            <span class="w-1 h-4 bg-purple-600 rounded-full"></span>
            <h4 class="text-sm font-black text-gray-800">팀 상세 정보</h4>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="col-span-1 md:col-span-2 bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <p class="text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-tighter">선정 도서 정보</p>
              <p class="text-sm text-gray-700 font-bold leading-relaxed whitespace-pre-wrap">
                {{ formatBookInfo(team.bookInfo || team.books) }}
              </p>
              <p v-if="team.isbn" class="text-[10px] text-gray-400 mt-2 font-mono">참조 ISBN: {{ team.isbn }}</p>
            </div>
            
            <div class="bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <p class="text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-tighter">담당 지도 교사</p>
              <p class="text-sm text-gray-700 font-bold">
                {{ getTeacherName(team.teacherId) }}
              </p>
            </div>

            <div class="bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <p class="text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-tighter">소속 팀원 학번</p>
              <p class="text-sm text-gray-700 font-mono tracking-tight">
                {{ team.members ? team.members.join(', ') : '-' }}
              </p>
            </div>

            <div class="col-span-1 md:col-span-2 bg-orange-50/50 p-4 rounded-2xl border border-orange-100">
              <p class="text-[10px] font-bold text-orange-400 mb-1 uppercase tracking-tighter">비고 (특이사항)</p>
              <p class="text-sm text-gray-700 leading-relaxed italic">
                {{ team.remarks || '등록된 비고 내용이 없습니다.' }}
              </p>
            </div>
          </div>
        </section>

        <section class="space-y-4">
          <div class="flex items-center space-x-2">
            <span class="w-1 h-4 bg-green-600 rounded-full"></span>
            <h4 class="text-sm font-black text-gray-800">팀원별 활동 요약</h4>
          </div>
          <div class="grid grid-cols-1 gap-2">
            <div v-for="mId in team.members" :key="mId" 
              class="flex items-center justify-between p-4 border rounded-2xl bg-white shadow-sm hover:border-green-200 transition-colors"
            >
              <div class="flex items-center space-x-3">
                <div class="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center text-green-600 font-black text-xs">
                  {{ getStudentName(mId).charAt(0) }}
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <p class="font-black text-gray-800 text-sm">{{ getStudentName(mId) }}</p>
                    <span class="text-[9px] text-gray-400 font-mono">{{ mId }}</span>
                  </div>
                </div>
              </div>

              <div class="flex space-x-2">
                <div class="text-center px-2.5 py-1 bg-gray-50 rounded-lg border border-gray-100 min-w-[45px]">
                  <p class="text-[7px] text-gray-400 font-bold uppercase">독서</p>
                  <p class="text-[11px] font-black" :class="getLogCount(mId) > 0 ? 'text-blue-600' : 'text-gray-300'">
                    {{ getLogCount(mId) }}
                  </p>
                </div>
                <div class="text-center px-2.5 py-1 bg-gray-50 rounded-lg border border-gray-100 min-w-[45px]">
                  <p class="text-[7px] text-gray-400 font-bold uppercase">평가</p>
                  <p class="text-[11px] font-black" :class="hasEval(mId) ? 'text-green-600' : 'text-gray-300'">
                    {{ hasEval(mId) ? 'O' : 'X' }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div class="p-4 bg-gray-50 border-t flex justify-end">
        <button @click="$emit('close')" class="px-8 py-2.5 bg-gray-900 text-white font-bold rounded-xl text-sm hover:bg-black transition-all shadow-md">
          닫기
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useTeacherStore } from '@/stores/teacherStore';

const props = defineProps({ team: Object });
defineEmits(['close']);
const teacherStore = useTeacherStore();

/**
 * 💡 [수정] 여러 권의 도서 정보를 모두 포맷팅하여 반환
 */
const formatBookInfo = (info) => {
  if (!info) return '정보 없음';
  
  // 1. 줄바꿈(\n) 기준으로 여러 권의 도서를 분리합니다.
  const lines = info.split('\n').filter(l => l.trim() !== '');
  
  // 2. 각 줄에 대해 '제목 (저자)' 형식으로 가공합니다.
  const formatted = lines.map(line => {
    const parts = line.split(',').map(p => p.trim());
    if (parts.length >= 2) {
      return `${parts[0]} (${parts[1]})`;
    }
    return line;
  });
  
  // 3. 다시 줄바꿈으로 합쳐서 반환합니다.
  return formatted.join('\n');
};

/**
 * 💡 교사 ID를 성함으로 변환
 */
const getTeacherName = (id) => {
  if (!id) return '미지정';
  const teacher = teacherStore.allUsers?.find(u => String(u.userKey) === String(id));
  return teacher ? teacher.name : `${id}반 교사`;
};

/**
 * 💡 학생 이름을 가져오는 로직
 */
const getStudentName = (id) => {
  const student = teacherStore.homeroomStudents.find(s => s.userKey === id);
  if (student) return student.name;
  const record = teacherStore.studentLogs.find(l => l.studentId === id);
  return record ? record.studentName : id;
};

const getLogCount = (id) => teacherStore.studentLogs.filter(l => l.studentId === id).length;
const hasEval = (id) => teacherStore.studentEvals.some(e => e.studentId === id);
</script>

<style scoped>
.animate-fade-in { animation: fadeIn 0.3s ease-out; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>