<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center border-b pb-2">
      <h2 class="text-xl font-bold text-gray-800">도서 신청</h2>
      <span class="text-xs text-gray-400 font-medium">희망하는 도서의 ISBN을 입력해 주세요.</span>
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-5">
      <div>
        <label class="block text-sm font-semibold mb-1">팀명</label>
        <input v-model="form.teamName" type="text" required 
          class="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 outline-none shadow-sm"
          placeholder="팀명을 입력하세요.">
      </div>

      <div class="bg-gray-50 p-5 rounded-2xl border border-gray-200 space-y-4 shadow-inner">
        <div>
          <label class="block text-sm font-semibold mb-1 text-gray-700">도서 ISBN</label>
          <div class="flex gap-2">
            <input v-model="form.isbn" type="text" placeholder="숫자 13자리 입력" required 
              class="flex-1 p-2 border rounded font-mono focus:ring-2 focus:ring-blue-500 outline-none">
            <button type="button" @click="handleSearch" :disabled="isSearching" 
              class="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 shadow-md transition-colors">
              {{ isSearching ? '검색 중...' : '도서 검색' }}
            </button>
          </div>
          <p class="text-[10px] text-gray-400 mt-1">ISBN을 입력하고 검색하면 도서 정보가 자동으로 채워집니다.</p>
        </div>

        <div class="grid grid-cols-2 gap-4 pt-2">
          <div class="col-span-2">
            <label class="block text-[11px] font-bold text-gray-500 mb-1">도서명 (수동 입력 가능)</label>
            <input v-model="form.bookTitle" type="text" required class="w-full p-2 border rounded bg-white">
          </div>
          <div>
            <label class="block text-[11px] font-bold text-gray-500 mb-1">저자</label>
            <input v-model="form.author" type="text" required class="w-full p-2 border rounded bg-white">
          </div>
          <div>
            <label class="block text-[11px] font-bold text-gray-500 mb-1">출판사</label>
            <input v-model="form.publisher" type="text" required class="w-full p-2 border rounded bg-white">
          </div>
          <div class="col-span-2 sm:col-span-1">
            <label class="block text-[11px] font-bold text-gray-500 mb-1">가격 (정찰가)</label>
            <div class="relative">
              <input v-model.number="form.price" type="number" required class="w-full p-2 border rounded text-right pr-8 bg-white">
              <span class="absolute right-3 top-2.5 text-gray-400 text-sm">원</span>
            </div>
          </div>
        </div>
      </div>

      <div class="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div>
          <label class="block text-sm font-semibold mb-1">신청 갯수</label>
          <input v-model.number="form.quantity" type="number" min="1" required 
            class="w-24 p-2 border rounded text-right focus:ring-2 focus:ring-green-500 outline-none">
        </div>
        <div v-if="form.price && form.quantity" class="text-right">
          <p class="text-xs text-gray-400 mb-1">총 예상 금액</p>
          <p class="text-xl font-black text-blue-600">{{ (form.price * form.quantity).toLocaleString() }}원</p>
        </div>
      </div>

      <button type="submit" :disabled="activityStore.isLoading"
        class="w-full py-4 bg-green-600 text-white font-black rounded-xl hover:bg-green-700 shadow-lg shadow-green-100 transition-all disabled:opacity-50">
        {{ activityStore.isLoading ? '신청 처리 중...' : '도서 신청하기' }}
      </button>
    </form>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue';
import { useUserStore } from '@/stores/userStore'; // 💡 유저 정보용
import { useActivityStore } from '@/stores/activityStore'; // 💡 도서 검색/제출용

const userStore = useUserStore();
const activityStore = useActivityStore();

const isSearching = ref(false);

const form = reactive({
  teamName: '', 
  isbn: '', 
  bookTitle: '', 
  author: '', 
  publisher: '', 
  price: null, 
  quantity: 1
});

// 초기화: 학생이 팀에 소속되어 있다면 팀명을 미리 채워줌
onMounted(() => {
  if (userStore.mySummary.team?.teamName) {
    form.teamName = userStore.mySummary.team.teamName;
  }
});

const handleSearch = async () => {
  if (!form.isbn || form.isbn.length < 10) {
    alert('올바른 ISBN을 입력해 주세요.');
    return;
  }
  
  isSearching.value = true;
  try {
    // 💡 activityStore의 도서 검색 액션 호출
    const bookInfo = await activityStore.searchBook(form.isbn);
    
    if (bookInfo) {
      form.bookTitle = bookInfo.title;
      form.author = bookInfo.author;
      form.publisher = bookInfo.publisher || '';
      form.price = bookInfo.price || 0;
    } else {
      alert('도서 정보를 찾을 수 없습니다. 정보를 직접 입력해 주세요.');
    }
  } catch (e) {
    alert('검색 중 오류가 발생했습니다.');
  } finally {
    isSearching.value = false;
  }
};

const handleSubmit = async () => {
  if (!form.bookTitle || !form.price) {
    alert('도서 정보를 완성해 주세요.');
    return;
  }
  
  if (!confirm('입력하신 정보로 도서를 신청하시겠습니까?')) return;
  
  // 💡 activityStore의 제출 액션 호출
  const success = await activityStore.submitForm('도서신청', { ...form });
  
  if (success) {
    // 신청 성공 후 갯수와 ISBN 초기화 (팀명은 유지)
    form.isbn = '';
    form.bookTitle = '';
    form.author = '';
    form.publisher = '';
    form.price = null;
    form.quantity = 1;
  }
};
</script>