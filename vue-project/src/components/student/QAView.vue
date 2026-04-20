<template>
  <div class="space-y-6">
    <div class="border-b pb-4 flex justify-between items-center">
      <div>
        <h2 class="text-xl font-black text-gray-800">지도교사 Q&A</h2>
        <p class="text-[11px] text-gray-500 mt-1 font-bold">
          <span class="text-green-600">{{ userStore.mySummary.teacher?.name }}</span> 선생님께 질문하기
        </p>
      </div>
    </div>

    <div class="bg-white border-2 border-green-100 p-4 rounded-[2rem] shadow-sm mb-8">
      <div class="flex items-center gap-3">
        <textarea 
          v-model="newQuestion" 
          rows="1" 
          placeholder="선생님께 궁금한 점을 남겨보세요..."
          class="flex-1 p-3 bg-transparent border-none focus:ring-0 text-sm outline-none resize-none"
        ></textarea>
        <button 
          @click="handleAsk" 
          :disabled="qaStore.isLoading || !newQuestion.trim()"
          class="px-5 py-3 bg-green-600 text-white rounded-2xl font-black text-xs hover:bg-green-700 transition-all disabled:bg-gray-100 flex items-center gap-2 shadow-md active:scale-95"
        >
          <span>전송</span>
          <svg class="w-4 h-4 rotate-90" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path></svg>
        </button>
      </div>
    </div>

    <div class="space-y-8">
      <div v-for="qa in sortedQuestions" :key="qa.id" class="flex flex-col space-y-3 animate-fade-in">
        
        <div class="flex justify-end">
          <div class="max-w-[90%] bg-white border-2 border-gray-100 p-5 rounded-3xl rounded-tr-none shadow-sm">
            <div class="flex items-center gap-2 mb-2">
              <span class="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
              <span class="text-[10px] font-black text-gray-400 uppercase">My Question</span>
            </div>
            <p class="text-[14px] font-medium text-gray-800 leading-relaxed">{{ qa.question }}</p>
            <span class="text-[10px] text-gray-300 mt-3 block text-right font-mono">{{ formatDate(qa.createdAt) }}</span>
          </div>
        </div>

        <div v-if="qa.answer" class="flex justify-start">
          <div class="max-w-[90%] bg-green-50/50 border-2 border-green-100 p-5 rounded-3xl rounded-tl-none relative pt-8">
            <span class="absolute top-2.5 left-5 text-[10px] font-black text-green-700 bg-white px-2.5 py-0.5 rounded-full border border-green-100 shadow-sm">
              {{ qa.teacherName || '지도교사' }} 선생님의 답변
            </span>
            <p class="text-[14px] text-gray-800 leading-relaxed whitespace-pre-wrap font-bold italic">
              "{{ qa.answer }}"
            </p>
            <div class="flex justify-between items-center mt-4 pt-3 border-t border-green-100/50">
              <span class="text-[10px] text-green-600 font-black">답변 완료</span>
              <span class="text-[10px] text-green-400 font-mono">{{ formatDate(qa.repliedAt) }}</span>
            </div>
          </div>
        </div>
        
        <div v-else class="flex justify-start">
          <div class="bg-gray-50 px-4 py-2 rounded-2xl border border-dashed border-gray-200">
            <p class="text-[11px] text-gray-400 font-bold flex items-center gap-2">
              <span class="animate-bounce">⏳</span> 선생님이 질문을 확인하고 있습니다...
            </p>
          </div>
        </div>
      </div>

      <div v-if="sortedQuestions.length === 0" class="py-20 text-center text-gray-300">
        <p class="text-4xl mb-4">💬</p>
        <p class="text-xs font-bold">아직 질문 내역이 없습니다.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useUserStore } from '@/stores/userStore';
import { useQaStore } from '@/stores/qaStore';
import { db } from '@/firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';

const userStore = useUserStore();
const qaStore = useQaStore();
const newQuestion = ref('');
let unsubscribe = null;

onMounted(() => {
  if (!userStore.currentUser.userKey) return;

  // 🚀 [수정] 최신글이 위로 오도록 desc 정렬
  const q = query(
    collection(db, "qaMessages"),
    where("studentId", "==", userStore.currentUser.userKey),
    orderBy("createdAt", "desc") 
  );

  unsubscribe = onSnapshot(q, (snapshot) => {
    qaStore.myQuestions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  });
});

onUnmounted(() => { if (unsubscribe) unsubscribe(); });

const sortedQuestions = computed(() => qaStore.myQuestions);

const handleAsk = async () => {
  if (!newQuestion.value.trim()) return;
  const success = await qaStore.askQuestion(newQuestion.value);
  if (success) {
    newQuestion.value = '';
    // 💡 최신글이 위로 오기 때문에 별도의 스크롤 로직이 필요 없습니다. (바로 상단에 나타남)
  }
};

const formatDate = (ts) => {
  if (!ts) return '';
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
};
</script>

<style scoped>
.animate-fade-in { animation: fadeIn 0.4s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
</style>