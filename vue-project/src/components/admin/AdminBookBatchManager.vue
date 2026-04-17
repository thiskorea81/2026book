// src/components/admin/AdminBookBatchManager.vue
<template>
  <div class="p-8 space-y-6 animate-fade-in">
    <div class="flex justify-between items-center bg-white p-6 rounded-3xl border shadow-sm">
      <div>
        <h2 class="text-2xl font-black text-gray-800">📚 도서 일괄 등록 및 ISBN 조회</h2>
        <p class="text-xs text-gray-400 mt-1">팀번호 | ISBN | 도서정보 | 비고 순으로 붙여넣으면 최신 정보로 '대체'됩니다.</p>
      </div>
      <div class="flex gap-3">
        <button @click="processData" :disabled="isFetching"
          class="px-6 py-3 bg-blue-600 text-white font-black rounded-2xl shadow-lg hover:bg-blue-700 transition-all disabled:bg-gray-300 text-sm">
          {{ isFetching ? '조회 중...' : '1. 데이터 분석 및 조회' }}
        </button>
        <button @click="saveToFirestore" :disabled="processedItems.length === 0 || isFetching"
          class="px-6 py-3 bg-purple-600 text-white font-black rounded-2xl shadow-lg hover:bg-purple-700 transition-all disabled:bg-gray-300 text-sm">
          2. 최신 정보로 덮어쓰기
        </button>
      </div>
    </div>

    <div class="bg-white p-6 rounded-3xl border shadow-sm">
      <textarea v-model="rawInput" rows="8" 
        class="w-full p-5 border-2 border-gray-100 rounded-2xl text-xs font-mono bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
        placeholder="팀번호	ISBN	도서정보	비고 (탭 구분 데이터를 붙여넣으세요)"></textarea>
    </div>

    <div v-if="processedItems.length > 0" class="bg-white border rounded-3xl overflow-hidden shadow-sm animate-fade-in">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-gray-50 text-gray-500 font-black border-b">
            <tr>
              <th class="p-4 w-24">팀번호</th>
              <th class="p-4 w-32">ISBN</th>
              <th class="p-4">도서 정보 (API 조회 결과 또는 원문)</th>
              <th class="p-4">비고</th>
              <th class="p-4 w-20 text-center">상태</th>
            </tr>
          </thead>
          <tbody class="divide-y">
            <tr v-for="(item, idx) in processedItems" :key="idx" class="hover:bg-gray-50/50 transition-colors">
              <td class="p-4 font-black text-gray-700">{{ item.teamId }}</td>
              <td class="p-4 font-mono text-gray-400">{{ item.isbn || '-' }}</td>
              <td class="p-4">
                <div v-if="item.fetched" class="flex items-center gap-2">
                  <span class="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[9px] font-black uppercase">API</span>
                  <span class="font-bold text-gray-800">{{ item.fetched.title }}</span>
                  <span class="text-gray-400">| {{ item.fetched.author }} ({{ item.fetched.publisher }})</span>
                </div>
                <div v-else class="text-gray-500 italic">{{ item.rawTitle }}</div>
              </td>
              <td class="p-4 text-orange-600 font-bold">{{ item.remarks || '-' }}</td>
              <td class="p-4 text-center">
                <span v-if="item.loading" class="text-blue-500 animate-pulse font-bold">조회중</span>
                <span v-else-if="item.fetched" class="text-green-600 font-black">매칭</span>
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
import { useAdminStore } from '@/stores/adminStore';

const adminStore = useAdminStore();
const rawInput = ref('');
const processedItems = ref([]);
const isFetching = ref(false);

const processData = async () => {
  if (!rawInput.value.trim()) return alert('데이터를 입력해주세요.');
  isFetching.value = true;
  const lines = rawInput.value.trim().split('\n');
  const items = [];

  for (const line of lines) {
    const parts = line.split('\t');
    if (parts.length < 3) continue;
    items.push({
      teamId: parts[0].trim(),
      isbn: parts[1].trim(),
      rawTitle: parts[2].trim(),
      remarks: parts[3] ? parts[3].trim() : '',
      fetched: null,
      loading: parts[1].trim().length >= 10
    });
  }
  processedItems.value = items;

  for (let item of processedItems.value) {
    if (item.isbn && item.isbn.length >= 10) {
      const data = await bookApi.fetchBookByIsbn(item.isbn);
      if (data) item.fetched = data;
      item.loading = false;
    }
  }
  isFetching.value = false;
};

const saveToFirestore = async () => {
  if (processedItems.value.length === 0) return;
  if (!confirm('기존 정보를 지우고 현재 목록으로 완전히 대체하시겠습니까?')) return;

  try {
    const teamGroups = new Map();
    processedItems.value.forEach(item => {
      const bookText = item.fetched 
        ? `${item.fetched.title}, ${item.fetched.author}, ${item.fetched.publisher}, ${item.fetched.price}원`
        : item.rawTitle;
      
      if (!teamGroups.has(item.teamId)) {
        teamGroups.set(item.teamId, { books: [bookText], remarks: item.remarks ? [item.remarks] : [] });
      } else {
        teamGroups.get(item.teamId).books.push(bookText);
        if (item.remarks) teamGroups.get(item.teamId).remarks.push(item.remarks);
      }
    });

    for (const [teamId, data] of teamGroups) {
      const teamRef = doc(db, "teams", teamId);
      await updateDoc(teamRef, {
        bookInfo: data.books.join('\n'),
        remarks: data.remarks.join(' / '),
        updatedAt: new Date()
      });
    }

    // 💡 저장 후 스토어 데이터 새로고침 (이게 있어야 모달에서 보임)
    await adminStore.initData();

    alert(`총 ${teamGroups.size}개 팀의 정보가 갱신되었습니다.`);
    processedItems.value = [];
    rawInput.value = '';
  } catch (e) {
    console.error(e);
    alert('저장 중 오류 발생');
  }
};
</script>