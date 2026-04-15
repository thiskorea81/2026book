<template>
    <div v-if="isOpen" class="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4 backdrop-blur-sm">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        
        <div class="p-6 border-b flex justify-between items-center bg-gray-50">
          <h3 class="text-xl font-bold text-gray-800">팀 정보 수정</h3>
          <button @click="$emit('close')" class="text-gray-400 hover:text-red-500 text-2xl font-bold">&times;</button>
        </div>
  
        <div class="p-6 overflow-y-auto space-y-4 flex-1">
          <div>
            <label class="block text-xs font-bold text-gray-500 mb-1">팀 번호 (ID)</label>
            <input v-model="formData.teamId" type="text" disabled class="w-full p-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-500 font-mono">
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-500 mb-1">팀 이름</label>
            <input v-model="formData.teamName" type="text" class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none">
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-gray-500 mb-1">진로 분야</label>
              <input v-model="formData.careerField" type="text" class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none">
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-500 mb-1">담당 교사 (ID)</label>
              <input v-model="formData.teacherId" type="text" class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none">
            </div>
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-500 mb-1">선정 도서 정보</label>
            <textarea v-model="formData.bookInfo" rows="2" class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"></textarea>
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-500 mb-1">팀원 학번 (쉼표로 구분)</label>
            <input v-model="membersString" type="text" placeholder="예: 10501, 10502" class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none font-mono text-sm">
          </div>
        </div>
  
        <div class="p-6 border-t bg-gray-50 flex justify-end space-x-3">
          <button @click="$emit('close')" class="px-5 py-2 text-gray-600 bg-white border border-gray-300 hover:bg-gray-100 rounded-lg font-medium transition-colors">취소</button>
          <button @click="handleSave" class="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold shadow-md transition-colors">저장하기</button>
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
  
  // 모달이 열릴 때 데이터 복사
  watch(() => props.isOpen, (newVal) => {
    if (newVal && props.team) {
      formData.value = { ...props.team };
      membersString.value = props.team.members ? props.team.members.join(', ') : '';
    }
  });
  
  const handleSave = () => {
    // 쉼표로 구분된 문자열을 다시 배열로 변환
    formData.value.members = membersString.value.split(',').map(m => m.trim()).filter(m => m !== '');
    emit('save', formData.value);
  };
  </script>