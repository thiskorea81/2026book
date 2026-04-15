<template>
  <div class="bg-white rounded-xl shadow p-8">
    <div class="flex justify-between items-end mb-4">
      <h2 class="text-xl font-bold text-gray-800 flex items-center">
        <span class="mr-2">📁</span> 엑셀 데이터 계정 생성
      </h2>
      <div class="text-xs text-gray-500 text-right space-y-1">
        <p>👨‍🎓 <b>학생 포맷:</b> [학번] [성명] [비밀번호]</p>
        <p>👨‍🏫 <b>교사 포맷:</b> [번호] [아이디] [비밀번호] [성명] [업무] [교과]</p>
        <p class="text-blue-500 mt-1">※ 표의 맨 윗줄(헤더)을 포함하여 복사해도 자동으로 필터링됩니다.</p>
      </div>
    </div>

    <textarea 
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
      rows="6" 
      class="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none font-mono text-sm bg-gray-50 leading-relaxed"
      placeholder="엑셀에서 복사한 데이터를 그대로 붙여넣으세요.&#10;예(학생): 10101 권민혁 s1234!&#10;예(교사): 0 T00 t2419$ 정재경 학년부장 수학"
    ></textarea>

    <div class="mt-4 flex items-center justify-between">
      <div class="text-sm font-medium text-gray-600">
        상태: <span :class="isProcessing ? 'text-blue-600 font-bold' : 'text-gray-500'">{{ statusMessage }}</span>
      </div>
      <button 
        @click="$emit('submit')" 
        :disabled="isProcessing || !modelValue.trim()"
        class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold disabled:bg-blue-300 transition-colors shadow-sm"
      >
        {{ isProcessing ? '생성 중...' : '일괄 생성 시작' }}
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  modelValue: String,
  isProcessing: Boolean,
  statusMessage: String
});
defineEmits(['update:modelValue', 'submit']);
</script>