<template>
  <div class="fixed inset-0 z-[100] bg-white md:bg-black/60 flex justify-center items-start md:items-center overflow-y-auto p-0 md:p-8 animate-fade-in">
    <div class="bg-white w-full max-w-4xl min-h-screen md:min-h-0 md:rounded-3xl shadow-2xl flex flex-col print:shadow-none print:m-0">
      <div class="px-8 py-5 border-b flex justify-between items-center bg-gray-50 no-print">
        <h3 class="text-xl font-black text-gray-900">{{ item.studentName }} 상세 기록</h3>
        <div class="flex items-center space-x-2">
          <button @click="onPrint" class="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm">🖨️ PDF/인쇄</button>
          <button @click="$emit('close')" class="p-2 text-gray-400 text-2xl font-bold">&times;</button>
        </div>
      </div>

      <div id="print-content" class="p-10 md:p-16 text-gray-900 leading-relaxed print:p-0">
        <div class="border-b-2 border-black pb-4 mb-8 flex justify-between items-end">
          <div>
            <p class="text-sm font-bold text-gray-500 mb-1">상당고 특색프로그램 활동 결과물</p>
            <h1 class="text-3xl font-black">{{ subTab === 'logs' ? '독서 활동 일지' : '자기 탐구 평가서' }}</h1>
          </div>
          <div class="text-right text-lg font-bold">
            <p>{{ item.studentId }} {{ item.studentName }}</p>
          </div>
        </div>

        <div class="space-y-10 text-lg">
          <template v-if="subTab === 'logs'">
            <div class="bg-gray-100 p-4 rounded-lg"><b class="text-gray-500 mr-4">대상 도서</b> {{ item.title }} ({{ item.author }})</div>
            <div><h4 class="font-black text-xl mb-3">1. 중심 내용 및 줄거리</h4><p class="bg-gray-50 p-6 rounded-xl border whitespace-pre-wrap">{{ item.summary }}</p></div>
            <div><h4 class="font-black text-xl mb-3">2. 가장 인상 깊은 부분</h4><p class="bg-gray-50 p-6 rounded-xl border whitespace-pre-wrap">{{ item.impression }}</p></div>
            <div><h4 class="font-black text-xl mb-3">3. 새롭게 깨달은 점</h4><p class="bg-gray-50 p-6 rounded-xl border whitespace-pre-wrap">{{ item.realization }}</p></div>
            <div><h4 class="font-black text-xl mb-3">4. 독서 방법과 효과</h4><p class="bg-gray-50 p-6 rounded-xl border whitespace-pre-wrap">{{ item.method }}</p></div>
          </template>

          <template v-else>
            <div class="grid grid-cols-2 gap-4 border p-4 rounded-xl bg-gray-50 text-sm">
              <p><b>책 제목:</b> {{ item.bookTitle }}</p>
              <p><b>진로 탐구 주제:</b> {{ item.careerTopic }}</p>
              <p><b>희망 진로:</b> {{ item.careerGoal }} ({{ item.majorGoal }})</p>
              <p><b>관련 분야:</b> {{ item.subjectField }}</p>
              <p class="col-span-2"><b>모둠원:</b> {{ teamMembers.join(', ') }}</p>
              <p class="col-span-2"><b>자신의 역할:</b> {{ item.roleInTeam }}</p>
            </div>
            <div><h4 class="font-black text-xl mb-3"># 주제 선정 동기</h4><p class="bg-gray-50 p-6 rounded-xl border whitespace-pre-wrap">{{ item.motivation }}</p></div>
            <div><h4 class="font-black text-xl mb-3"># 활동 소감 및 후속 탐구 계획</h4><p class="bg-gray-50 p-6 rounded-xl border whitespace-pre-wrap min-h-[300px]">{{ item.reviewAndPlan }}</p></div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  item: Object,
  subTab: String,
  teamMembers: Array
});

defineEmits(['close']);

const onPrint = () => {
  window.print();
};
</script>

<style scoped>
.animate-fade-in { animation: fadeIn 0.2s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }

@media print {
  body * { visibility: hidden; }
  #print-content, #print-content * { visibility: visible; }
  #print-content {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    padding: 0;
    margin: 0;
  }
  .no-print { display: none !important; }
}
</style>