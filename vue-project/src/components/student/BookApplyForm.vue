<template>
    <div class="space-y-6">
      <h2 class="text-xl font-bold text-gray-800 border-b pb-2">도서 신청</h2>
  
      <form @submit.prevent="submitForm" class="space-y-5">
        <div>
          <label class="block text-sm font-semibold mb-1">팀명</label>
          <input v-model="form.teamName" type="text" required class="w-full p-2 border rounded">
        </div>
  
        <div class="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4">
          <div>
            <label class="block text-sm font-semibold mb-1">도서 ISBN</label>
            <div class="flex gap-2">
              <input v-model="form.isbn" type="text" placeholder="숫자 13자리 입력" required class="flex-1 p-2 border rounded font-mono">
              <button type="button" @click="searchBook" :disabled="isSearching" class="px-4 py-2 bg-gray-600 text-white font-medium rounded hover:bg-gray-700 disabled:opacity-50">
                {{ isSearching ? '검색 중...' : '도서 검색' }}
              </button>
            </div>
          </div>
  
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs text-gray-500 mb-1">도서명 (수동 입력 가능)</label>
              <input v-model="form.bookTitle" type="text" required class="w-full p-2 border rounded">
            </div>
            <div>
              <label class="block text-xs text-gray-500 mb-1">저자</label>
              <input v-model="form.author" type="text" required class="w-full p-2 border rounded">
            </div>
            <div>
              <label class="block text-xs text-gray-500 mb-1">출판사</label>
              <input v-model="form.publisher" type="text" required class="w-full p-2 border rounded">
            </div>
            <div>
              <label class="block text-xs text-gray-500 mb-1">가격 (정찰가)</label>
              <div class="relative">
                <input v-model.number="form.price" type="number" required class="w-full p-2 border rounded text-right pr-6">
                <span class="absolute right-3 top-2.5 text-gray-500 text-sm">원</span>
              </div>
            </div>
          </div>
        </div>
  
        <div>
          <label class="block text-sm font-semibold mb-1">신청 갯수</label>
          <input v-model.number="form.quantity" type="number" min="1" required class="w-32 p-2 border rounded text-right">
        </div>
  
        <div v-if="form.price && form.quantity" class="text-right text-lg font-bold text-blue-600">
          총 예상 금액: {{ (form.price * form.quantity).toLocaleString() }}원
        </div>
  
        <button type="submit" class="w-full py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700">도서 신청하기</button>
      </form>
    </div>
  </template>
  
  <script setup>
  import { reactive, ref } from 'vue';
  import { useStudentStore } from '@/stores/studentStore';
  
  const studentStore = useStudentStore();
  const isSearching = ref(false);
  
  const form = reactive({
    teamName: '', isbn: '', bookTitle: '', author: '', publisher: '', price: null, quantity: 1
  });
  
  const searchBook = async () => {
    if (!form.isbn) {
      alert('ISBN을 입력해주세요.'); return;
    }
    
    isSearching.value = true;
    const bookInfo = await studentStore.searchBookByISBN(form.isbn);
    isSearching.value = false;
  
    if (bookInfo) {
      // 검색된 정보로 폼 자동 채우기
      form.bookTitle = bookInfo.title;
      form.author = bookInfo.author;
      form.publisher = bookInfo.publisher;
      form.price = bookInfo.price;
    } else {
      alert('도서 정보를 찾을 수 없습니다. 직접 입력해주세요.');
    }
  };
  
  const submitForm = () => {
    studentStore.submitForm('도서신청', form);
  };
  </script>