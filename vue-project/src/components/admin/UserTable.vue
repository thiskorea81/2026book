<template>
  <div class="bg-white rounded-xl shadow overflow-hidden">
    
    <div class="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
      <h2 class="text-lg font-bold text-gray-800">
        {{ activeTab === 'student' ? '학생' : '교사' }} 목록 ({{ filteredUsers.length }}명)
      </h2>
      <button 
        @click="$emit('delete-selected')"
        :disabled="selectedKeys.length === 0"
        class="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
      >
        선택 삭제 ({{ selectedKeys.length }})
      </button>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full text-left border-collapse whitespace-nowrap">
        <thead>
          <tr class="bg-gray-50 border-b text-sm text-gray-500 uppercase tracking-wider">
            <th class="p-4 w-12 text-center">
              <input 
                type="checkbox" 
                :checked="isAllSelected" 
                @change="toggleSelectAll"
                class="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
              >
            </th>
            <th class="p-4 font-semibold text-blue-700">{{ activeTab === 'student' ? '학번' : '교사번호' }}</th>
            <th class="p-4 font-semibold">로그인 ID</th>
            <th class="p-4 font-semibold">이름</th>
            <th v-if="activeTab === 'teacher'" class="p-4 font-semibold text-center">업무</th>
            <th v-if="activeTab === 'teacher'" class="p-4 font-semibold text-center">담당 교과</th>
            <th class="p-4 font-semibold text-center">관리</th>
          </tr>
        </thead>
        <tbody class="text-gray-700 text-sm divide-y divide-gray-100">
          <tr v-if="filteredUsers.length === 0">
            <td :colspan="activeTab === 'teacher' ? 7 : 5" class="p-12 text-center text-gray-400">
              등록된 사용자가 없습니다.
            </td>
          </tr>
          <tr v-for="user in filteredUsers" :key="user.userKey" class="hover:bg-blue-50/50 transition-colors">
            <td class="p-4 text-center">
              <input 
                type="checkbox" 
                :value="user.userKey"
                v-model="localSelectedKeys"
                class="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
              >
            </td>
            <td class="p-4 font-bold text-gray-800">{{ user.userKey }}</td>
            <td class="p-4 text-gray-500">{{ user.loginId }}</td>
            <td class="p-4 font-medium">{{ user.name }}</td>
            
            <td v-if="activeTab === 'teacher'" class="p-4 text-center">
              <span class="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                {{ user.role }}
              </span>
            </td>
            <td v-if="activeTab === 'teacher'" class="p-4 text-center text-gray-600">
              {{ user.subject }}
            </td>
            
            <td class="p-4 text-center space-x-3">
              <button @click="$emit('edit', user)" class="text-blue-500 hover:text-blue-700 font-medium transition-colors">수정</button>
              <button @click="$emit('delete', user.userKey)" class="text-red-500 hover:text-red-700 font-medium transition-colors">삭제</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  users: Array,
  selectedKeys: Array,
  activeTab: String // 💡 AdminView에서 활성화된 탭 정보를 받아옵니다.
});

const emit = defineEmits(['update:selectedKeys', 'delete-selected', 'edit', 'delete']);

// 역할별 데이터 필터링 로직 (관리자 계정은 항상 숨김)
const filteredUsers = computed(() => {
  if (!props.users) return [];
  return props.users.filter(user => {
    if (user.role === '관리자' || user.loginId.includes('admin')) return false;
    if (props.activeTab === 'student') return user.role === '학생';
    if (props.activeTab === 'teacher') return user.role !== '학생';
    return false;
  });
});

// 체크박스 양방향 바인딩
const localSelectedKeys = computed({
  get: () => props.selectedKeys,
  set: (val) => emit('update:selectedKeys', val)
});

// 전체 선택
const isAllSelected = computed(() => {
  return filteredUsers.value.length > 0 && 
         filteredUsers.value.every(user => props.selectedKeys.includes(user.userKey));
});

const toggleSelectAll = (event) => {
  if (event.target.checked) {
    emit('update:selectedKeys', filteredUsers.value.map(u => u.userKey));
  } else {
    emit('update:selectedKeys', []);
  }
};
</script>