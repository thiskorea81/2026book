<template>
  <div class="max-w-2xl mx-auto space-y-8 animate-fade-in">
    <div class="bg-indigo-50 p-5 rounded-2xl border border-indigo-100 flex items-start space-x-3">
      <span class="text-xl">⚙️</span>
      <div>
        <p class="text-sm text-indigo-900 font-bold">AI 비서 개인화 설정</p>
        <p class="text-xs text-indigo-700 mt-1">선생님만의 API 키와 작성 프롬프트를 저장하세요.</p>
      </div>
    </div>

    <div class="bg-white p-6 rounded-2xl border-2 border-gray-50 space-y-6">
      <div>
        <label class="block text-xs font-black text-gray-400 uppercase mb-2">Google Gemini API Key</label>
        <input v-model="localSettings.geminiApiKey" type="password" 
          placeholder="AIzaSy..." 
          class="w-full p-4 border rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50/50">
      </div>
      <div>
        <label class="block text-xs font-black text-gray-400 uppercase mb-2">생기부 초안 생성 프롬프트</label>
        <textarea v-model="localSettings.recordPrompt" rows="12" 
          class="w-full p-5 border rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50/50 leading-relaxed"></textarea>
      </div>
      <button @click="$emit('save', localSettings)" 
        class="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 shadow-xl transition-all transform active:scale-[0.98]">
        환경 설정 저장하기
      </button>
    </div>
  </div>
</template>

<script setup>
import { reactive, watch } from 'vue';
const props = defineProps({ settings: Object });
const emit = defineEmits(['save']);

// 부모의 데이터를 로컬 상태로 복사
const localSettings = reactive({ ...props.settings });

// 부모 데이터가 외부에서 변경될 경우 동기화
watch(() => props.settings, (newVal) => {
  Object.assign(localSettings, newVal);
}, { deep: true });
</script>