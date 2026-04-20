// src/components/teacher/TeacherQA.vue
<template>
  <div class="space-y-6">
    <div v-if="teacherStore.qaMessages.length === 0" class="text-center py-20 text-gray-400 font-bold">
      도착한 질문이 없습니다. 😊
    </div>

    <div v-for="qa in teacherStore.qaMessages" :key="qa.id" 
      class="border-2 rounded-[2rem] p-6 transition-all animate-fade-in"
      :class="qa.status === '대기 중' ? 'border-orange-200 bg-orange-50/20' : 'border-gray-50 bg-white'"
    >
      <div class="flex justify-between items-start mb-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-lg">
            {{ qa.status === '대기 중' ? '❓' : '✅' }}
          </div>
          <div>
            <span class="text-[10px] font-black uppercase tracking-tighter" :class="qa.status === '대기 중' ? 'text-orange-500' : 'text-green-600'">
              {{ qa.status }}
            </span>
            <h4 class="font-black text-gray-900 text-sm">{{ qa.studentName }} <span class="text-xs font-normal text-gray-400">({{ qa.studentId }})</span></h4>
          </div>
        </div>
        <span class="text-[10px] font-mono text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">{{ formatDate(qa.createdAt) }}</span>
      </div>

      <div class="bg-white p-5 rounded-2xl border border-gray-100 text-sm text-gray-700 mb-5 leading-relaxed shadow-inner">
        <p class="font-medium text-gray-800">"{{ qa.question }}"</p>
      </div>

      <div v-if="qa.status === '대기 중'" class="space-y-3 animate-fade-in">
        <textarea v-model="answers[qa.id]" rows="3" placeholder="학생에게 따뜻한 조언을 남겨주세요..."
          class="w-full p-4 border-2 border-orange-100 rounded-2xl text-sm focus:border-orange-300 outline-none transition-all resize-none bg-white/50"></textarea>
        <div class="flex justify-end">
          <button @click="submitAnswer(qa.id)" :disabled="!answers[qa.id]"
            class="px-8 py-3 bg-orange-500 text-white font-black rounded-xl text-xs hover:bg-orange-600 shadow-lg shadow-orange-100 transition-all active:scale-95 disabled:bg-gray-200">
            답변 등록하기
          </button>
        </div>
      </div>

      <div v-else class="bg-green-50/50 p-5 rounded-2xl border border-green-100 relative">
        <span class="absolute -top-3 left-4 px-2 py-0.5 bg-green-600 text-white text-[9px] font-black rounded-md">나의 답변</span>
        <p class="text-sm text-gray-800 leading-relaxed font-medium">{{ qa.answer }}</p>
        <p class="text-[9px] text-gray-400 mt-3 text-right font-mono">답변일: {{ formatDate(qa.repliedAt) }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive } from 'vue';
import { useTeacherStore } from '@/stores/teacherStore';

const teacherStore = useTeacherStore();
const answers = reactive({}); 

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