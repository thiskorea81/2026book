<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center border-b pb-2">
      <h2 class="text-xl font-bold text-gray-800">학년 특색 프로그램 신청</h2>
      <span class="text-xs text-gray-400 font-medium">팀을 구성하고 연구할 도서를 등록해 주세요.</span>
    </div>

    <div v-if="userStore.isLoading" class="py-20 text-center text-gray-400 font-bold animate-pulse">
      사용자 정보를 확인하는 중입니다...
    </div>
    
    <form v-else @submit.prevent="handleSubmit" class="space-y-6">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-semibold mb-1">학번</label>
          <input :value="userStore.currentUser.userKey" disabled 
            class="w-full p-2 bg-gray-100 border rounded text-gray-500 font-mono">
        </div>
        <div>
          <label class="block text-sm font-semibold mb-1">이름</label>
          <input :value="userStore.currentUser.name" disabled 
            class="w-full p-2 bg-gray-100 border rounded text-gray-500">
        </div>
      </div>

      <div class="space-y-4 p-5 border rounded-2xl bg-gray-50 shadow-inner">
        <div>
          <label class="block text-sm font-semibold mb-1 text-gray-700">팀명</label>
          <input v-model="form.teamName" type="text" placeholder="우리 팀의 이름을 정해주세요" required 
            class="w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white">
        </div>

        <div>
          <label class="block text-sm font-semibold mb-2 text-gray-700">팀원 정보 (학번 및 이름)</label>
          <div class="space-y-2">
            <div v-for="(member, index) in form.members" :key="index" class="flex gap-2 animate-fade-in">
              <input v-model="member.id" type="text" placeholder="학번" required
                class="w-1/3 p-2 border rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-400 outline-none bg-white">
              <input v-model="member.name" type="text" placeholder="이름" required
                class="w-2/3 p-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-400 outline-none bg-white">
              <button v-if="index > 0" type="button" @click="removeMember(index)" 
                class="text-red-400 hover:text-red-600 px-1 transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </button>
            </div>
          </div>
          <button type="button" @click="addMember" 
            class="flex items-center text-blue-600 text-sm font-bold mt-3 hover:text-blue-800 transition-colors">
            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
            팀원 추가
          </button>
        </div>
      </div>

      <div>
        <label class="block text-sm font-semibold mb-1 text-gray-700">연구 도서 ISBN</label>
        <input v-model="form.isbn" type="text" placeholder="신청 도서의 ISBN 13자리를 입력하세요" required 
          class="w-full p-2 border rounded-lg font-mono focus:ring-2 focus:ring-green-500 outline-none">
        <p class="text-[10px] text-gray-400 mt-1">* 한 학기 동안 탐구할 도서의 ISBN을 정확히 입력해 주세요.</p>
      </div>

      <button type="submit" :disabled="activityStore.isLoading"
        class="w-full py-4 bg-green-600 text-white font-black rounded-xl hover:bg-green-700 shadow-lg shadow-green-100 transition-all disabled:opacity-50">
        {{ activityStore.isLoading ? '신청서를 전송 중입니다...' : '프로그램 신청 완료' }}
      </button>
    </form>
  </div>
</template>

<script setup>
import { reactive, onMounted } from 'vue';
import { useUserStore } from '@/stores/userStore';
import { useActivityStore } from '@/stores/activityStore';

const userStore = useUserStore();
const activityStore = useActivityStore();

const form = reactive({
  teamName: '',
  members: [], // 초기화는 onMounted에서 본인 포함으로 진행
  isbn: ''
});

onMounted(() => {
  // 💡 신청 페이지 진입 시, 본인의 학번과 이름을 첫 번째 팀원으로 자동 세팅
  if (form.members.length === 0) {
    form.members.push({ 
      id: userStore.currentUser.userKey || '', 
      name: userStore.currentUser.name || '' 
    });
  }
});

const addMember = () => {
  if (form.members.length >= 6) {
    alert('팀원은 최대 6명까지만 구성할 수 있습니다.');
    return;
  }
  form.members.push({ id: '', name: '' });
};

const removeMember = (index) => {
  form.members.splice(index, 1);
};

const handleSubmit = async () => {
  if (form.members.some(m => !m.id || !m.name)) {
    alert('팀원 정보를 모두 입력해 주세요.');
    return;
  }

  if (!confirm('프로그램 신청을 완료하시겠습니까? 제출 후 팀 정보가 생성됩니다.')) return;

  // 💡 activityStore의 submitForm 호출 (내부에서 자동 팀 번호 생성 로직 실행)
  const success = await activityStore.submitForm('프로그램신청', { ...form });
  
  if (success) {
    // 신청 성공 후 알림은 activityStore에서 처리하므로 여기서는 탭 이동 등의 로직을 추가할 수 있습니다.
  }
};
</script>

<style scoped>
.animate-fade-in { animation: fadeIn 0.3s ease-in-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }
</style>