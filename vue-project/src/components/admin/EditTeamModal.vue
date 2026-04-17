// src/components/admin/EditTeamModal.vue
<template>
  <div v-if="isOpen" class="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4 backdrop-blur-sm">
    <div class="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-fade-in">
      
      <div class="p-6 border-b flex justify-between items-center bg-gray-50/50">
        <h3 class="text-xl font-black text-gray-800">🚀 팀 정보 수정</h3>
        <button @click="$emit('close')" class="text-gray-400 hover:text-red-500 text-2xl font-bold transition-colors">&times;</button>
      </div>

      <div class="p-6 overflow-y-auto space-y-5 flex-1 no-scrollbar">
        <div class="grid grid-cols-2 gap-4">
          <div class="col-span-1">
            <label class="block text-[10px] font-black text-gray-400 mb-1 uppercase">팀 번호 (ID)</label>
            <input v-model="formData.teamId" type="text" disabled 
              class="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-400 font-mono text-sm">
          </div>
          <div class="col-span-1">
            <label class="block text-[10px] font-black text-purple-600 mb-1 uppercase">진로 분야</label>
            <input v-model="formData.careerField" type="text" 
              class="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm font-bold">
          </div>
        </div>

        <div>
          <label class="block text-[10px] font-black text-gray-500 mb-1 uppercase">팀 이름</label>
          <input v-model="formData.teamName" type="text" 
            class="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm font-bold">
        </div>

        <div>
          <label class="block text-[10px] font-black text-gray-500 mb-1 uppercase">담당 교사 (ID)</label>
          <input v-model="formData.teacherId" type="text" 
            class="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm font-mono">
        </div>

        <div>
          <label class="block text-[10px] font-black text-blue-600 mb-1 uppercase">도서 신청 정보</label>
          <textarea v-model="formData.bookInfo" rows="3" 
            class="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs leading-relaxed"
            placeholder="일괄 등록된 상세 도서 정보"></textarea>
        </div>

        <div>
          <label class="block text-[10px] font-black text-orange-500 mb-1 uppercase">비고 (특이사항)</label>
          <input v-model="formData.remarks" type="text" 
            class="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-xs"
            placeholder="예: 도서관 도서 활용 등">
        </div>

        <div>
          <label class="block text-[10px] font-black text-gray-500 mb-1 uppercase">팀원 학번 (쉼표로 구분)</label>
          <input v-model="membersString" type="text" 
            class="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none font-mono text-xs">
        </div>
      </div>

      <div class="p-6 border-t bg-gray-50/50 flex justify-end space-x-3">
        <button @click="$emit('close')" class="px-6 py-2.5 text-gray-500 bg-white border border-gray-200 hover:bg-gray-100 rounded-xl font-bold text-sm transition-all">취소</button>
        <button @click="handleSave" class="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-sm shadow-lg active:scale-95 transition-all">저장하기</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({ isOpen: Boolean, team: Object });
const emit = defineEmits(['close', 'save']);

const formData = ref({});
const membersString = ref('');

watch(() => props.isOpen, (newVal) => {
  if (newVal && props.team) {
    // 💡 데이터 복사 시 비고(remarks) 필드가 undefined가 되지 않도록 안전장치
    formData.value = { 
      ...props.team,
      remarks: props.team.remarks || '', 
      bookInfo: props.team.bookInfo || '' 
    };
    membersString.value = props.team.members ? props.team.members.join(', ') : '';
  }
});

const handleSave = () => {
  formData.value.members = membersString.value.split(',').map(m => m.trim()).filter(m => m !== '');
  emit('save', formData.value);
};
</script>