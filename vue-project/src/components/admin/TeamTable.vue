<template>
    <div class="bg-white rounded-xl shadow overflow-hidden mt-6">
      <div class="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
        <h2 class="text-lg font-bold text-gray-800">등록된 팀 목록 ({{ teams.length }}팀)</h2>
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
                  class="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500 cursor-pointer"
                >
              </th>
              <th class="p-4 font-semibold text-purple-700">팀 번호</th>
              <th class="p-4 font-semibold">팀 이름</th>
              <th class="p-4 font-semibold">진로 분야</th>
              <th class="p-4 font-semibold text-center">팀원 수</th>
              <th class="p-4 font-semibold text-center">담당 교사</th>
              <th class="p-4 font-semibold text-center">관리</th>
            </tr>
          </thead>
          <tbody class="text-gray-700 text-sm divide-y divide-gray-100">
            <tr v-if="teams.length === 0">
              <td colspan="7" class="p-12 text-center text-gray-400">등록된 팀이 없습니다.</td>
            </tr>
            <tr v-for="team in teams" :key="team.teamId" class="hover:bg-purple-50/50 transition-colors">
              <td class="p-4 text-center">
                <input 
                  type="checkbox" 
                  :value="team.teamId"
                  v-model="localSelectedKeys"
                  class="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500 cursor-pointer"
                >
              </td>
              <td class="p-4 font-bold text-gray-800">{{ team.teamId }}</td>
              <td class="p-4 font-bold text-purple-700">{{ team.teamName }}</td>
              <td class="p-4 text-gray-500">{{ team.careerField }}</td>
              <td class="p-4 text-center">
                <span class="px-2.5 py-1 bg-gray-100 rounded-full text-xs font-bold">{{ team.members?.length || 0 }}명</span>
              </td>
              <td class="p-4 text-center">
                <span class="px-2.5 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">{{ team.teacherId }}</span>
              </td>
              <td class="p-4 text-center space-x-3">
                <button @click="$emit('edit', team)" class="text-blue-500 hover:text-blue-700 font-medium">수정</button>
                <button @click="$emit('delete', team.teamId)" class="text-red-500 hover:text-red-700 font-medium">삭제</button>
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
    teams: Array,
    selectedKeys: Array
  });
  
  const emit = defineEmits(['update:selectedKeys', 'delete-selected', 'edit', 'delete']);
  
  const localSelectedKeys = computed({
    get: () => props.selectedKeys,
    set: (val) => emit('update:selectedKeys', val)
  });
  
  const isAllSelected = computed(() => {
    return props.teams.length > 0 && props.teams.every(team => props.selectedKeys.includes(team.teamId));
  });
  
  const toggleSelectAll = (event) => {
    if (event.target.checked) {
      emit('update:selectedKeys', props.teams.map(t => t.teamId));
    } else {
      emit('update:selectedKeys', []);
    }
  };
  </script>