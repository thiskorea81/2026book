<template>
  <div class="space-y-6">
    <div v-if="teacherStore.qaMessages.length === 0" class="text-center py-20 text-gray-400">
      도착한 질문이 없습니다.
    </div>

    <div v-for="qa in teacherStore.qaMessages" :key="qa.id" 
      class="border rounded-2xl p-6 transition-all shadow-sm"
      :class="qa.status === '대기 중' ? 'border-orange-200 bg-orange-50/20' : 'border-gray-100 bg-white'"
    >
      <div class="flex justify-between items-start mb-4">
        <div>
          <span class="text-xs font-bold" :class="qa.status === '대기 중' ? 'text-orange-500' : 'text-green-600'">
            {{ qa.status }}
          </span>
          <h4 class="font-bold text-gray-800">{{ qa.studentName }} ({{ qa.studentId }})</h4>
        </div>
        <span class="text-[10px] text-gray-400">{{ formatDate(qa.createdAt) }}</span>
      </div>

      <div class="bg-white p-4 rounded-xl border border-gray-100 text-sm text-gray-700 mb-4 italic">
        "{{ qa.question }}"
      </div>

      <div v-if="qa.status === '대기 중'" class="space-y-3">
        <textarea v-model="answers[qa.id]" rows="3" placeholder="학생에게 정성스러운 답변을 남겨주세요..."
          class="w-full p-3 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"></textarea>
        <div class="flex justify-end">
          <button @click="submitAnswer(qa.id)" :disabled="!answers[qa.id]"
            class="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
            답변 등록하기
          </button>
        </div>
      </div>

      <div v-else class="bg-blue-50 p-4 rounded-xl border border-blue-100">
        <p class="text-[11px] font-bold text-blue-600 mb-1">나의 답변:</p>
        <p class="text-sm text-gray-800">{{ qa.answer }}</p>
        <p class="text-[10px] text-gray-400 mt-2 text-right">답변일: {{ formatDate(qa.repliedAt) }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive } from 'vue';
import { useTeacherStore } from '@/stores/teacherStore';

const teacherStore = useTeacherStore();
const answers = reactive({}); // qaId별 답변 입력값 관리

const submitAnswer = async (qaId) => {
  const success = await teacherStore.answerQuestion(qaId, answers[qaId]);
  if (success) delete answers[qaId];
};

const formatDate = (ts) => {
  if (!ts) return '';
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
};
</script>