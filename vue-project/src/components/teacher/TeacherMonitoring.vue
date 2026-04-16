<template>
  <div class="space-y-6">
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50 p-4 rounded-xl border">
      <div class="flex flex-wrap gap-2">
        <div class="flex bg-white border rounded-lg p-1 shadow-sm mr-2">
          <button @click="subTab = 'logs'" class="px-4 py-1.5 text-xs font-bold rounded-md transition-all" :class="subTab === 'logs' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500'">📖 독서일지</button>
          <button @click="subTab = 'evals'" class="px-4 py-1.5 text-xs font-bold rounded-md transition-all" :class="subTab === 'evals' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500'">✅ 자기평가서</button>
        </div>
        <select v-model="groupFilter" class="text-xs font-bold border rounded-lg px-3 py-1.5 bg-white outline-none focus:ring-2 focus:ring-blue-500">
          <option value="all">전체 학생 보기</option>
          <option value="homeroom">우리 반 아이들만</option>
          <option value="mentor">내가 지도하는 학생만</option>
        </select>
      </div>

      <div class="relative w-full md:w-64">
        <input v-model="searchQuery" type="text" placeholder="이름 또는 학번 검색..." class="w-full pl-9 pr-4 py-2 text-sm border rounded-lg outline-none shadow-sm">
        <svg class="w-4 h-4 absolute left-3 top-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
      </div>
    </div>

    <div class="space-y-4">
      <div v-if="filteredData.length === 0" class="text-center py-20 text-gray-400 text-sm">표시할 데이터가 없습니다.</div>
      
      <div v-else v-for="item in filteredData" :key="item.id" 
        class="border rounded-2xl overflow-hidden bg-white shadow-sm transition-all hover:border-blue-200"
      >
        <div @click="toggleDetail(item.id)" class="p-5 cursor-pointer flex justify-between items-center hover:bg-gray-50">
          <div>
            <div class="flex items-center space-x-2 mb-1">
              <span class="text-[10px] font-bold px-2 py-0.5 rounded" :class="isHomeroom(item.studentId) ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'">
                {{ isHomeroom(item.studentId) ? '우리 반' : '지도 학생' }}
              </span>
              <span class="text-xs text-gray-400">{{ item.date || formatDate(item.createdAt) }}</span>
            </div>
            <h4 class="font-bold text-gray-800">{{ item.studentName }} ({{ item.studentId }})</h4>
            <p class="text-xs text-blue-600 mt-1">{{ item.title || item.bookTitle }}</p>
          </div>
          <svg :class="{'rotate-180': expandedId === item.id}" class="w-5 h-5 text-gray-300 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" /></svg>
        </div>

        <div v-if="expandedId === item.id" class="px-6 pb-6 pt-2 bg-gray-50/50 border-t animate-fade-in">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div class="space-y-4">
              <div v-if="subTab === 'logs'" class="space-y-3">
                <p class="text-xs"><b class="text-blue-600">[중심내용]</b><br/>{{ item.summary }}</p>
                <p class="text-xs"><b class="text-blue-600">[소감/깨달은점]</b><br/>{{ item.impression }} / {{ item.realization }}</p>
              </div>
              <div v-else class="space-y-3">
                <p class="text-xs"><b class="text-purple-600">[주제]</b><br/>{{ item.careerTopic }}</p>
                <p class="text-xs"><b class="text-purple-600">[소감 및 계획]</b><br/>{{ item.reviewAndPlan }}</p>
              </div>
            </div>

            <div class="bg-white p-4 rounded-xl border border-blue-100 shadow-sm">
              <label class="block text-[11px] font-bold text-blue-600 mb-2">🖋️ 생기부용 교사 코멘트 (학생에겐 보이지 않음)</label>
              <textarea v-model="tempComments[item.id]" rows="4" 
                placeholder="관찰한 내용이나 생기부 기록 시 참고할 사항을 메모하세요..."
                class="w-full text-xs p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"></textarea>
              <div class="flex justify-between items-center mt-2">
                <span class="text-[10px] text-gray-400">마지막 저장: {{ formatDate(item.commentedAt) || '없음' }}</span>
                <button @click="saveComment(item.id)" 
                  class="px-4 py-1.5 bg-blue-600 text-white text-[11px] font-bold rounded-md hover:bg-blue-700 transition-all">
                  저장하기
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, watch } from 'vue';
import { useUserStore } from '@/stores/userStore';
import { useTeacherStore } from '@/stores/teacherStore';

const userStore = useUserStore();
const teacherStore = useTeacherStore();

const subTab = ref('logs');
const groupFilter = ref('all');
const searchQuery = ref('');
const expandedId = ref(null);
const tempComments = reactive({});

// 💡 데이터 필터링 핵심 로직
const filteredData = computed(() => {
  const source = subTab.value === 'logs' ? teacherStore.studentLogs : teacherStore.studentEvals;
  const classCode = userStore.currentUser.userKey.padStart(2, '0');

  return source.filter(item => {
    // 1. 이름/학번 검색
    const matchesSearch = item.studentName.includes(searchQuery.value) || item.studentId.includes(searchQuery.value);
    
    // 2. 그룹 필터링 (홈룸 vs 멘토)
    let matchesGroup = true;
    if (groupFilter.value === 'homeroom') {
      matchesGroup = item.studentId.substring(1, 3) === classCode;
    } else if (groupFilter.value === 'mentor') {
      // 내가 지도하는 팀의 멤버인지 확인
      const mentorMemberIds = teacherStore.managedTeams.flatMap(t => t.members || []);
      matchesGroup = mentorMemberIds.includes(item.studentId);
    }
    
    return matchesSearch && matchesGroup;
  }).sort((a, b) => (b.date || b.createdAt) > (a.date || a.createdAt) ? 1 : -1);
});

// 코멘트 초기값 세팅
watch(expandedId, (newId) => {
  if (newId && !tempComments[newId]) {
    const data = subTab.value === 'logs' ? teacherStore.studentLogs : teacherStore.studentEvals;
    const target = data.find(i => i.id === newId);
    if (target) tempComments[newId] = target.teacherComment || '';
  }
});

const isHomeroom = (studentId) => {
  return studentId.substring(1, 3) === userStore.currentUser.userKey.padStart(2, '0');
};

const saveComment = async (id) => {
  const colName = subTab.value === 'logs' ? 'readingLogs' : 'selfEvaluations';
  const success = await teacherStore.saveComment(colName, id, tempComments[id]);
  if (success) alert('코멘트가 저장되었습니다.');
};

const toggleDetail = (id) => expandedId.value = expandedId.value === id ? null : id;

const formatDate = (ts) => {
  if (!ts) return '';
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
};
</script>