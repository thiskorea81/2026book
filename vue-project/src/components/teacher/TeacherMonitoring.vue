<template>
  <div class="space-y-6">
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50 p-4 rounded-xl border shadow-sm no-print">
      <div class="flex flex-wrap gap-2">
        <select v-model="groupFilter" class="text-xs font-bold border rounded-lg px-3 py-1.5 bg-white outline-none focus:ring-2 focus:ring-blue-500">
          <option value="mentor">🙋‍♂️ 내가 지도하는 학생</option>
          <option value="homeroom">🏠 우리 반 학생 전체</option>
          <option value="all">전체 보기</option>
        </select>
        <div class="flex bg-white border rounded-lg p-1">
          <button @click="subTab = 'logs'" class="px-3 py-1 text-[11px] font-bold rounded" :class="subTab === 'logs' ? 'bg-blue-600 text-white' : 'text-gray-500'">독서일지</button>
          <button @click="subTab = 'evals'" class="px-3 py-1 text-[11px] font-bold rounded" :class="subTab === 'evals' ? 'bg-blue-600 text-white' : 'text-gray-500'">자기평가서</button>
        </div>
      </div>
      <input v-model="searchQuery" type="text" placeholder="이름 검색..." class="w-full md:w-48 p-2 text-xs border rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
    </div>

    <div class="space-y-3 no-print">
      <div v-for="item in filteredData" :key="item.id" 
        class="border rounded-2xl bg-white transition-all overflow-hidden"
        :class="isMentor(item.studentId) ? 'border-blue-100 shadow-sm' : 'border-gray-100'"
      >
        <div class="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
          <div @click="toggleDetail(item.id)" class="flex-1 cursor-pointer">
            <div class="flex items-center space-x-2 mb-1">
              <span v-if="isMentor(item.studentId)" class="bg-blue-600 text-white text-[9px] px-1.5 py-0.5 rounded font-bold uppercase">Mentor</span>
              <span v-else class="bg-gray-200 text-gray-600 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase">Read Only</span>
              <span class="text-[10px] text-gray-400">{{ subTab === 'logs' ? item.date : '제출 완료' }}</span>
            </div>
            <h4 class="font-bold text-gray-800 text-sm">{{ item.studentName }} ({{ item.studentId }})</h4>
            <p class="text-[11px] text-blue-500 truncate mt-1">
              {{ subTab === 'logs' ? '📖 ' + item.title : '📝 ' + item.bookTitle }}
            </p>
          </div>
          <button @click="openFullView(item)" class="ml-4 px-3 py-1.5 bg-gray-800 text-white rounded-lg text-[10px] font-bold hover:bg-black transition-all">
            🔍 크게 보기 / 인쇄
          </button>
        </div>

        <div v-if="expandedId === item.id" class="px-6 pb-6 pt-4 bg-gray-50/50 border-t border-dashed animate-fade-in">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="bg-white p-5 rounded-2xl border text-[11px] space-y-4 shadow-inner">
              <template v-if="subTab === 'logs'">
                <div><b class="text-blue-700 block mb-1">중심 내용</b><p>{{ item.summary }}</p></div>
                <div><b class="text-blue-700 block mb-1">인상 깊은 부분</b><p>{{ item.impression }}</p></div>
                <div><b class="text-blue-700 block mb-1">깨달은 점</b><p>{{ item.realization }}</p></div>
                <div><b class="text-blue-700 block mb-1">독서 방법</b><p>{{ item.method }}</p></div>
              </template>
              <template v-else>
                <div class="grid grid-cols-2 gap-2 mb-2 bg-blue-50 p-2 rounded">
                  <p><b>학번:</b> {{ item.studentId }}</p><p><b>이름:</b> {{ item.studentName }}</p>
                  <p class="col-span-2"><b>책 제목:</b> {{ item.bookTitle }}</p>
                </div>
                <div><b class="text-purple-700 block mb-1">탐구 주제</b><p class="font-bold">{{ item.careerTopic }}</p></div>
                <div><b class="text-purple-700 block mb-1">소감 및 계획</b><p class="whitespace-pre-wrap">{{ item.reviewAndPlan }}</p></div>
              </template>
            </div>
            
            <div class="bg-white p-5 rounded-2xl border border-blue-100 shadow-sm">
              <label class="text-[10px] font-bold text-blue-600 block mb-2">선생님 메모 (관찰 기록)</label>
              <textarea v-model="tempComments[item.id]" rows="6" class="w-full text-xs p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/30 resize-none"></textarea>
              <button @click="saveComment(item.id)" class="w-full mt-3 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 shadow-md transition-all">메모 저장</button>
            </div>
          </div>

          <TeacherAiAssistant 
            :student="item" 
            :teacher-key="userStore.currentUser.userKey" 
            :sub-tab="subTab"
          />
        </div>
      </div>
    </div>

    <TeacherPrintModal 
      v-if="fullViewItem" 
      :item="fullViewItem" 
      :sub-tab="subTab" 
      :team-members="getTeamMembers(fullViewItem.studentId)"
      @close="fullViewItem = null"
    />
  </div>
</template>

<script setup>
import { ref, computed, reactive, watch } from 'vue';
import { useUserStore } from '@/stores/userStore';
import { useTeacherStore } from '@/stores/teacherStore';
import TeacherPrintModal from './TeacherPrintModal.vue';
import TeacherAiAssistant from './TeacherAiAssistant.vue';

const userStore = useUserStore();
const teacherStore = useTeacherStore();

const subTab = ref('logs');
const groupFilter = ref('mentor');
const searchQuery = ref('');
const expandedId = ref(null);
const fullViewItem = ref(null);
const tempComments = reactive({});

const mentorMemberIds = computed(() => teacherStore.managedTeams.flatMap(t => t.members || []));
const isMentor = (studentId) => mentorMemberIds.value.includes(studentId);

const filteredData = computed(() => {
  const source = subTab.value === 'logs' ? teacherStore.studentLogs : teacherStore.studentEvals;
  const teacherKey = userStore.currentUser.userKey || "";
  const classCode = teacherKey.padStart(2, '0');

  return source.filter(item => {
    const matchesSearch = (item.studentName || "").includes(searchQuery.value) || (item.studentId || "").includes(searchQuery.value);
    let matchesGroup = true;
    if (groupFilter.value === 'homeroom') {
      matchesGroup = (item.studentId || "").substring(1, 3) === classCode;
    } else if (groupFilter.value === 'mentor') {
      matchesGroup = isMentor(item.studentId);
    }
    return matchesSearch && matchesGroup;
  }).sort((a, b) => (b.date || b.createdAt) > (a.date || a.createdAt) ? 1 : -1);
});

const getTeamMembers = (studentId) => {
  const team = teacherStore.managedTeams.find(t => t.members && t.members.includes(studentId));
  return team ? team.members : [studentId];
};

const openFullView = (item) => { fullViewItem.value = item; };
const toggleDetail = (id) => expandedId.value = expandedId.value === id ? null : id;

const saveComment = async (id) => {
  const colName = subTab.value === 'logs' ? 'readingLogs' : 'selfEvaluations';
  const success = await teacherStore.saveComment(colName, id, tempComments[id]);
  if (success) alert('저장되었습니다.');
};

watch(expandedId, (newId) => {
  if (newId && !tempComments[newId]) {
    const list = subTab.value === 'logs' ? teacherStore.studentLogs : teacherStore.studentEvals;
    const target = list.find(i => i.id === newId);
    if (target) tempComments[newId] = target.teacherComment || '';
  }
});
</script>

<style scoped>
.animate-fade-in { animation: fadeIn 0.2s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
</style>