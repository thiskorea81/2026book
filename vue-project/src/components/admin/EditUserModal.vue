<template>
  <div v-if="isOpen" class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
      <h3 class="text-xl font-bold text-gray-800 mb-6">사용자 정보 수정</h3>
      
      <div class="space-y-4">
        <div class="flex gap-4">
          <div class="w-1/2">
            <label class="block text-sm text-gray-600 mb-1">고유 Key</label>
            <input type="text" :value="userForm.userKey" disabled class="w-full p-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-500 text-sm">
          </div>
          <div class="w-1/2">
            <label class="block text-sm text-gray-600 mb-1">로그인 ID</label>
            <input type="text" :value="userForm.loginId" disabled class="w-full p-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-500 text-sm">
          </div>
        </div>

        <div>
          <label class="block text-sm text-gray-600 mb-1">이름</label>
          <input type="text" v-model="userForm.name" class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
        </div>

        <div v-if="userForm.role !== '학생'" class="flex gap-4 p-4 bg-blue-50 rounded-lg mt-2">
          <div class="w-1/2">
            <label class="block text-sm text-blue-800 font-medium mb-1">역할 (업무)</label>
            <input type="text" v-model="userForm.role" class="w-full p-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm">
          </div>
          <div class="w-1/2">
            <label class="block text-sm text-blue-800 font-medium mb-1">담당 교과</label>
            <input type="text" v-model="userForm.subject" class="w-full p-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm">
          </div>
        </div>
      </div>

      <div class="mt-8 flex justify-end space-x-3">
        <button @click="$emit('close')" class="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors">취소</button>
        <button @click="$emit('save', userForm)" class="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-bold transition-colors">저장하기</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  isOpen: Boolean,
  user: Object
});

const emit = defineEmits(['close', 'save']);

const userForm = ref({});

// 모달이 열릴 때마다 넘겨받은 원본 데이터를 복사해서 폼에 채워넣습니다.
watch(() => props.isOpen, (newVal) => {
  if (newVal && props.user) {
    userForm.value = { ...props.user };
  }
});
</script>