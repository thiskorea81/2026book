<template>
  <div class="p-8 space-y-6 animate-fade-in">
    <div class="flex justify-between items-center bg-white p-6 rounded-3xl border shadow-sm">
      <div>
        <h2 class="text-2xl font-black text-gray-800">📚 도서 일괄 등록 및 ISBN 조회</h2>
        <p class="text-xs text-gray-400 mt-1">엑셀 데이터를 붙여넣으면 팀별 도서 정보가 '대체(Overwrite)'됩니다.</p>
      </div>
      <div class="flex gap-3">
        <button @click="processData" :disabled="isFetching"
          class="px-6 py-3 bg-blue-600 text-white font-black rounded-2xl shadow-lg hover:bg-blue-700 transition-all disabled:bg-gray-300">
          {{ isFetching ? '조회 중...' : '1. 데이터 분석 및 조회' }}
        </button>
        <button @click="saveToFirestore" :disabled="processedItems.length === 0 || isFetching"
          class="px-6 py-3 bg-purple-600 text-white font-black rounded-2xl shadow-lg hover:bg-purple-700 transition-all disabled:bg-gray-300">
          2. 최신 정보로 덮어쓰기
        </button>
      </div>
    </div>

    <div class="bg-white p-6 rounded-3xl border shadow-sm">
      <textarea v-model="rawInput" rows="8" 
        class="w-full p-5 border-2 border-gray-100 rounded-2xl text-xs font-mono bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
        placeholder="팀번호	ISBN	도서정보 순으로 붙여넣으세요..."></textarea>
    </div>

    <div v-if="processedItems.length > 0" class="bg-white border rounded-3xl overflow-hidden shadow-sm animate-fade-in">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-gray-50 text-gray-500 font-black border-b">
            <tr>
              <th class="p-4 w-24">팀번호</th>
              <th class="p-4 w-40">ISBN</th>
              <th class="p-4">도서 정보 (API 조회 결과 또는 원문)</th>
              <th class="p-4 w-24">상태</th>
            </tr>
          </thead>
          <tbody class="divide-y">
            <tr v-for="(item, idx) in processedItems" :key="idx" class="hover:bg-gray-50/50 transition-colors">
              <td class="p-4 font-black text-gray-700">{{ item.teamId }}</td>
              <td class="p-4 font-mono text-gray-400">{{ item.isbn || '-' }}</td>
              <td class="p-4">
                <div v-if="item.fetched" class="flex items-center gap-2">
                  <span class="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-black uppercase">API</span>
                  <span class="font-bold text-gray-800">{{ item.fetched.title }}</span>
                  <span class="text-gray-400">| {{ item.fetched.author }} ({{ item.fetched.publisher }})</span>
                </div>
                <div v-else class="text-gray-500 italic">
                  {{ item.rawTitle }}
                </div>
              </td>
              <td class="p-4">
                <span v-if="item.loading" class="flex items-center text-blue-500 font-bold">
                  <svg class="animate-spin h-3 w-3 mr-1" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  조회중
                </span>
                <span v-else-if="item.fetched" class="text-green-600 font-black">✅ 매칭</span>
                <span v-else class="text-gray-300">수동</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { bookApi } from '@/services/bookApi';
import { db } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';

const rawInput = ref('');
const processedItems = ref([]);
const isFetching = ref(false);

/**
 * 💡 1. 텍스트 파싱 및 API 데이터 로드
 */
const processData = async () => {
  if (!rawInput.value.trim()) return alert('데이터를 입력해주세요.');
  
  isFetching.value = true;
  const lines = rawInput.value.trim().split('\n');
  const items = [];

  // 1차 파싱
  for (const line of lines) {
    const parts = line.split('\t');
    if (parts.length < 3) continue;

    items.push({
      teamId: parts[0].trim(),
      isbn: parts[1].trim(),
      rawTitle: parts[2].trim(),
      fetched: null,
      loading: parts[1].trim().length >= 10
    });
  }

  processedItems.value = items;

  // 2차 비동기 ISBN 조회
  for (let item of processedItems.value) {
    if (item.isbn && item.isbn.length >= 10) {
      const data = await bookApi.fetchBookByIsbn(item.isbn);
      if (data) item.fetched = data;
      item.loading = false;
    }
  }
  isFetching.value = false;
};

/**
 * 💡 2. Firestore 저장 (대체 로직)
 */
const saveToFirestore = async () => {
  if (processedItems.value.length === 0) return;
  if (!confirm('기존 도서 정보를 지우고, 현재 목록으로 완전히 대체할까요?')) return;

  try {
    // 팀별로 데이터 그룹화 (한 팀 여러 권 처리)
    const teamGroups = new Map();

    processedItems.value.forEach(item => {
      const text = item.fetched 
        ? `${item.fetched.title} (${item.fetched.author})` 
        : item.rawTitle;
      
      if (!teamGroups.has(item.teamId)) {
        teamGroups.set(item.teamId, [text]);
      } else {
        teamGroups.get(item.teamId).push(text);
      }
    });

    // Firestore 일괄 업데이트
    for (const [teamId, books] of teamGroups) {
      const teamRef = doc(db, "teams", teamId);
      
      // 줄바꿈으로 합쳐서 저장 (기존 데이터는 자연스럽게 이 값으로 덮어씌워짐)
      await updateDoc(teamRef, {
        bookInfo: books.join('\n'),
        updatedAt: new Date()
      });
    }

    alert(`총 ${teamGroups.size}개 팀의 도서 정보가 최신 상태로 갱신되었습니다.`);
    processedItems.value = [];
    rawInput.value = '';
  } catch (e) {
    console.error(e);
    alert('저장 중 오류가 발생했습니다. (팀 번호가 DB에 존재하는지 확인하세요)');
  }
};
</script>

<style scoped>
.animate-fade-in { animation: fadeIn 0.4s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
</style>