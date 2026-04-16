<template>
  <div class="space-y-6">
    <div class="border-b pb-4 flex justify-between items-center">
      <div>
        <h2 class="text-xl font-bold text-gray-800">지도교사 Q&A</h2>
        <p class="text-xs text-gray-500 mt-1">
          {{ userStore.mySummary.teacher?.name }} 선생님께 궁금한 점을 물어보세요.
        </p>
      </div>
    </div>

    <div class="bg-white border-2 border-green-100 p-5 rounded-2xl shadow-sm">
      <textarea v-model="newQuestion" rows="3" 
        placeholder="탐구 주제나 독서 내용 중 궁금한 점을 적어주세요..."
        class="w-full p-4 border-none bg-green-50/30 rounded-xl focus:ring-0 text-sm outline-none resize-none"></textarea>
      <div class="flex justify-end mt-3">
        <button @click="handleAsk" :disabled="qaStore.isLoading || !newQuestion.trim()"
          class="px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-all disabled:opacity-50">
          질문 보내기
        </button>
      </div>
    </div>

    <div class="space-y-4 pt-4">
      <div v-for="qa in qaStore.myQuestions" :key="qa.id" class="space-y-2">
        <div class="flex justify-end">
          <div class="max-w-[80%] bg-blue-600 text-white p-4 rounded-2xl rounded-tr-none shadow-sm">
            <p class="text-sm">{{ qa.question }}</p>
            <span class="text-[10px] opacity-70 mt-2 block text-right">{{ formatDate(qa.createdAt) }}</span>
          </div>
        </div>

        <div v-if="qa.answer" class="flex justify-start">
          <div class="max-w-[80%] bg-white border border-gray-100 p-4 rounded-2xl rounded-tl-none shadow-sm relative">
            <span class="absolute -top-3 left-0 text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
              {{ qa.teacherName }} 선생님의 답변
            </span>
            <p class="text-sm text-gray-800">{{ qa.answer }}</p>
            <span class="text-[10px] text-gray-400 mt-2 block">{{ formatDate(qa.repliedAt) }}</span>
          </div>
        </div>
        
        <div v-else class="flex justify-start">
          <div class="text-[11px] text-gray-400 italic ml-2">선생님의 답변을 기다리고 있습니다... ⏳</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useUserStore } from '@/stores/userStore';
import { useQaStore } from '@/stores/qaStore';

const userStore = useUserStore();
const qaStore = useQaStore();
const newQuestion = ref('');

onMounted(() => qaStore.fetchMyQuestions());

const handleAsk = async () => {
  const success = await qaStore.askQuestion(newQuestion.value);
  if (success) newQuestion.value = '';
};

const formatDate = (ts) => {
  if (!ts) return '';
  const date = ts.toDate();
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
};
</script>