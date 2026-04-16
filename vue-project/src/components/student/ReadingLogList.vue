<template>
  <div class="space-y-4">
    <div class="flex justify-between items-center mb-2">
      <h3 class="text-lg font-bold text-gray-800">📖 나의 독서 기록</h3>
      <span class="text-xs text-gray-400 font-medium font-mono">Total: {{ activityStore.myLogs.length }}건</span>
    </div>

    <div v-if="activityStore.myLogs.length === 0" class="text-center py-20 text-gray-400 bg-gray-50 rounded-2xl border border-dashed">
      아직 작성된 독서일지가 없습니다.
    </div>

    <div v-else v-for="log in activityStore.myLogs" :key="log.id" 
      class="group border border-gray-100 rounded-2xl overflow-hidden transition-all hover:border-blue-200 shadow-sm"
    >
      <div @click="toggleLog(log.id)" class="p-5 bg-white cursor-pointer flex justify-between items-center group-hover:bg-blue-50/30">
        <div class="flex-1">
          <div class="flex items-center space-x-2 mb-1">
            <span class="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-md">{{ log.date }}</span>
          </div>
          <h4 class="font-bold text-gray-800 group-hover:text-blue-700 transition-colors">{{ log.title }}</h4>
          <p class="text-xs text-gray-500">{{ log.author }}</p>
        </div>
        <div class="ml-4 flex items-center space-x-2">
          <svg :class="{'rotate-180': expandedId === log.id}" class="w-5 h-5 text-gray-300 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
        </div>
      </div>

      <div v-if="expandedId === log.id" class="px-6 pb-6 pt-2 bg-white border-t border-gray-50 animate-fade-in">
        
        <div v-if="editingId !== log.id" class="space-y-5 mt-2">
          <div v-for="(label, key) in fieldLabels" :key="key">
            <span class="text-[11px] font-bold text-gray-400 block mb-1">{{ label }}</span>
            <p class="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap" :class="key === 'summary' ? 'bg-gray-50 p-3 rounded-lg' : ''">
              {{ log[key] }}
            </p>
          </div>
          <div class="flex justify-end space-x-3 pt-4 border-t border-gray-50">
            <button @click="startEdit(log)" class="text-xs font-bold text-blue-600 hover:underline">수정하기</button>
            <button @click="activityStore.deleteLog(log.id)" class="text-xs font-bold text-red-500 hover:underline">삭제하기</button>
          </div>
        </div>

        <div v-else class="space-y-4 mt-4">
          <div class="grid grid-cols-2 gap-3">
            <input v-model="editForm.title" type="text" class="text-sm p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" placeholder="책 제목">
            <input v-model="editForm.author" type="text" class="text-sm p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" placeholder="저자">
          </div>
          <input v-model="editForm.date" type="date" class="text-sm p-2 border rounded outline-none w-32">
          
          <div v-for="(label, key) in editableTextFields" :key="key">
            <label class="text-[11px] font-bold text-blue-600 mb-1 block">{{ label }}</label>
            <textarea v-model="editForm[key]" rows="3" class="w-full text-sm p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"></textarea>
          </div>

          <div class="flex space-x-2 pt-2">
            <button @click="saveEdit" class="flex-1 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg shadow-md">변경사항 저장</button>
            <button @click="editingId = null" class="px-4 py-2 bg-gray-100 text-gray-600 text-sm font-bold rounded-lg">취소</button>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useUserStore } from '@/stores/userStore'; // 유저 정보가 필요할 경우 대비 (현재는 미사용이나 확장성 위해)
import { useActivityStore } from '@/stores/activityStore'; // 💡 활동 스토어 임포트

const userStore = useUserStore();
const activityStore = useActivityStore();

const expandedId = ref(null);
const editingId = ref(null);

const fieldLabels = {
  summary: '📍 책의 중심 내용 및 줄거리',
  impression: '✨ 가장 인상 깊거나 흥미로운 부분',
  realization: '💡 새롭게 깨달은 점',
  method: '🔍 사용한 독서 방법과 효과'
};

const editableTextFields = {
  summary: '책의 중심 내용 및 줄거리',
  impression: '가장 인상 깊거나 흥미로운 부분',
  realization: '새롭게 깨달은 점',
  method: '독서 방법과 효과'
};

const editForm = reactive({
  id: '', title: '', author: '', date: '',
  summary: '', impression: '', realization: '', method: ''
});

const toggleLog = (id) => {
  if (editingId.value) return; // 수정 중일 때는 닫기 방지
  expandedId.value = expandedId.value === id ? null : id;
};

const startEdit = (log) => {
  editingId.value = log.id;
  Object.assign(editForm, { ...log });
};

const saveEdit = async () => {
  // 💡 activityStore의 updateLog 호출
  const success = await activityStore.updateLog(editingId.value, { ...editForm });
  if (success) editingId.value = null;
};
</script>

<style scoped>
.animate-fade-in { animation: fadeIn 0.2s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
</style>