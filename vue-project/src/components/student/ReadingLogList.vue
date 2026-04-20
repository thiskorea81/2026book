// src/components/student/ReadingLogList.vue
<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
      <h3 class="text-xl font-black text-gray-800 flex items-center gap-2">
        📜 나의 활동 기록
        <span class="text-[10px] text-gray-400 font-mono">Archive</span>
      </h3>
      
      <StudentActivityExport 
        :logs="activityStore.myLogs" 
        :self-eval="selfEval" 
        :student-name="userStore.currentUser.name"
      />
    </div>

    <section v-if="selfEval" class="animate-fade-in">
      <div class="flex items-center space-x-2 mb-3 px-1">
        <span class="w-1 h-3 bg-green-500 rounded-full"></span>
        <h4 class="text-sm font-black text-gray-700">최종 제출된 자기평가서</h4>
      </div>
      
      <div class="bg-green-50/50 border-2 border-green-100 rounded-3xl p-6 shadow-sm">
        <div class="flex justify-between items-start mb-4">
          <div>
            <p class="text-[10px] font-black text-green-600 uppercase tracking-tighter mb-1">Career Exploration</p>
            <h5 class="text-lg font-black text-gray-900">{{ selfEval.careerTopic }}</h5>
            <p class="text-xs text-gray-500 mt-0.5">관련 도서: '{{ selfEval.bookTitle }}'</p>
          </div>
          <span class="bg-green-600 text-white text-[9px] px-2 py-1 rounded-lg font-black shadow-sm">SUBMITTED</span>
        </div>

        <div class="grid grid-cols-1 gap-4 mt-6">
          <div v-for="(label, key) in evalLabels" :key="key" class="bg-white p-4 rounded-2xl border border-green-50 shadow-sm">
            <span class="text-[10px] font-black text-green-500 block mb-1.5 uppercase">{{ label }}</span>
            <p class="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap font-medium">
              {{ selfEval[key] }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <section class="space-y-4">
      <div class="flex items-center justify-between mb-3 px-1">
        <div class="flex items-center space-x-2">
          <span class="w-1 h-3 bg-blue-500 rounded-full"></span>
          <h4 class="text-sm font-black text-gray-700">작성된 독서일지</h4>
        </div>
        <span class="text-[11px] font-bold text-gray-400">{{ activityStore.myLogs.length }}건의 기록</span>
      </div>

      <div v-if="activityStore.myLogs.length === 0" class="text-center py-16 text-gray-400 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-100 font-bold text-sm">
        아직 기록된 독서일지가 없습니다.
      </div>

      <div v-else v-for="log in activityStore.myLogs" :key="log.id" 
        class="group border-2 border-gray-50 rounded-[2rem] overflow-hidden transition-all hover:border-blue-200 bg-white"
      >
        <div @click="toggleLog(log.id)" class="p-6 cursor-pointer flex justify-between items-center group-hover:bg-blue-50/20">
          <div class="flex-1">
            <div class="flex items-center space-x-2 mb-2">
              <span class="px-2 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-black rounded-lg border border-blue-100">{{ log.date }}</span>
            </div>
            <h4 class="font-black text-gray-800 text-base group-hover:text-blue-700 transition-colors">{{ log.title }}</h4>
            <p class="text-xs text-gray-400 font-bold mt-0.5">{{ log.author }}</p>
          </div>
          <div class="ml-4 flex items-center justify-center w-8 h-8 rounded-full bg-gray-50 group-hover:bg-blue-100 transition-colors">
            <svg :class="{'rotate-180': expandedId === log.id}" class="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
          </div>
        </div>

        <div v-if="expandedId === log.id" class="px-8 pb-8 pt-2 animate-fade-in border-t border-gray-50">
          <div v-if="editingId !== log.id" class="space-y-6 mt-4">
            <div v-for="(label, key) in logLabels" :key="key">
              <span class="text-[10px] font-black text-blue-400 block mb-2 uppercase tracking-wider">{{ label }}</span>
              <p class="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap font-medium" :class="key === 'summary' ? 'bg-blue-50/50 p-4 rounded-2xl border border-blue-50' : ''">
                {{ log[key] }}
              </p>
            </div>
            <div class="flex justify-end space-x-4 pt-6 border-t border-gray-50">
              <button @click="startEdit(log)" class="text-[11px] font-black text-blue-500 hover:bg-blue-50 px-3 py-1 rounded-lg transition-colors">📝 수정</button>
              <button @click="activityStore.deleteLog(log.id)" class="text-[11px] font-black text-red-400 hover:bg-red-50 px-3 py-1 rounded-lg transition-colors">🗑️ 삭제</button>
            </div>
          </div>

          <div v-else class="space-y-5 mt-6 bg-gray-50 p-6 rounded-3xl border border-gray-100">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input v-model="editForm.title" type="text" class="text-sm p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="책 제목">
              <input v-model="editForm.author" type="text" class="text-sm p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="저자">
            </div>
            <input v-model="editForm.date" type="date" class="text-sm p-3 border rounded-xl outline-none w-full sm:w-40 bg-white">
            
            <div v-for="(label, key) in editableLogFields" :key="key">
              <label class="text-[10px] font-black text-blue-600 mb-2 block">{{ label }}</label>
              <textarea v-model="editForm[key]" rows="3" class="w-full text-sm p-4 border rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"></textarea>
            </div>

            <div class="flex gap-3 pt-4">
              <button @click="saveEdit" class="flex-1 py-3 bg-blue-600 text-white text-sm font-black rounded-xl shadow-lg active:scale-95 transition-all">변경사항 저장</button>
              <button @click="editingId = null" class="px-6 py-3 bg-white text-gray-500 text-sm font-black rounded-xl border border-gray-200">취소</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useUserStore } from '@/stores/userStore';
import { useActivityStore } from '@/stores/activityStore';
import StudentActivityExport from './StudentActivityExport.vue'; // 💡 신규 컴포넌트

const userStore = useUserStore();
const activityStore = useActivityStore();

const expandedId = ref(null);
const editingId = ref(null);
const selfEval = ref(null);

const logLabels = {
  summary: '📍 책의 중심 내용 및 줄거리',
  impression: '✨ 가장 인상 깊거나 흥미로운 부분',
  realization: '💡 새롭게 깨달은 점',
  method: '🔍 사용한 독서 방법과 효과'
};

const evalLabels = {
  careerGoal: '🎯 진로 희망(직업)',
  roleInTeam: '🤝 모둠 내 자신의 역할',
  motivation: '🌱 주제 선정 동기',
  reviewAndPlan: '💭 활동 소감 및 후속 탐구 계획'
};

const editableLogFields = {
  summary: '책의 중심 내용 및 줄거리',
  impression: '가장 인상 깊거나 흥미로운 부분',
  realization: '새롭게 깨달은 점',
  method: '독서 방법과 효과'
};

const editForm = reactive({
  id: '', title: '', author: '', date: '',
  summary: '', impression: '', realization: '', method: ''
});

onMounted(async () => {
  // 💡 컴포넌트 마운트 시 자기평가서 제출본 가져오기
  if (userStore.mySummary.hasEval) {
    selfEval.value = await activityStore.fetchLatestSubmission('selfEvaluations');
  }
});

const toggleLog = (id) => {
  if (editingId.value) return;
  expandedId.value = expandedId.value === id ? null : id;
};

const startEdit = (log) => {
  editingId.value = log.id;
  Object.assign(editForm, { ...log });
};

const saveEdit = async () => {
  const success = await activityStore.updateLog(editingId.value, { ...editForm });
  if (success) editingId.value = null;
};
</script>

<style scoped>
.animate-fade-in { animation: fadeIn 0.3s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
</style>