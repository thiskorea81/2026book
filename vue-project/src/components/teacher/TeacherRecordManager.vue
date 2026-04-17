<template>
  <div class="flex flex-col md:flex-row gap-6 h-[calc(100vh-250px)]">
    <div class="w-full md:w-80 bg-white border rounded-3xl flex flex-col overflow-hidden shadow-sm">
      <div class="flex border-b bg-gray-50 p-1">
        <button v-for="tab in subTabs" :key="tab.id" @click="currentSubTab = tab.id"
          class="flex-1 py-2 text-[10px] sm:text-[11px] font-black rounded-lg transition-all"
          :class="currentSubTab === tab.id ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'">
          {{ tab.label }}
        </button>
      </div>

      <div class="p-3 border-b space-y-2">
        <input v-model="searchQuery" type="text" placeholder="이름으로 학생 찾기..." 
          class="w-full p-2 text-xs border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50">
        
        <CsvExportButton 
          :label="currentTabLabel"
          :students="filteredList"
          :logs="teacherStore.studentLogs"
          :evals="teacherStore.studentEvals"
          :teams="teacherStore.managedTeams"
        />
      </div>

      <div class="flex-1 overflow-y-auto no-scrollbar">
        <div v-for="s in filteredList" :key="s.userKey" @click="selectStudent(s)"
          class="p-4 border-b cursor-pointer transition-all hover:bg-blue-50/50"
          :class="selectedStudent?.userKey === s.userKey ? 'bg-blue-50 border-r-4 border-r-blue-600' : ''">
          <div class="flex justify-between items-center text-sm font-black">
            <div class="flex flex-col">
              <span class="text-gray-800">{{ s.name }}</span>
              <span class="text-[10px] text-gray-400 font-mono">{{ s.userKey }}</span>
            </div>
            <div class="flex flex-col items-end gap-1">
              <span v-if="s.isMentor" class="text-[8px] bg-blue-600 text-white px-1.5 py-0.5 rounded uppercase">Mentee</span>
              <span v-if="!s.isHomeroom" class="text-[8px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded uppercase tracking-tighter">타반</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="flex-1 bg-white border rounded-3xl flex flex-col overflow-hidden shadow-sm">
      <div v-if="selectedStudent" class="flex-1 flex flex-col overflow-hidden animate-fade-in">
        <div class="p-6 border-b flex justify-between items-center bg-gray-50/30">
          <div>
            <h3 class="text-xl font-black text-gray-900">{{ selectedStudent.name }} <span class="text-xs font-normal text-gray-400">({{ selectedStudent.userKey }})</span></h3>
            <p class="text-[11px] font-bold mt-1" :class="selectedStudent.isMentor ? 'text-blue-600' : 'text-orange-500'">
              {{ selectedStudent.isMentor ? '✍️ 지도 학생 (초안 작성 가능)' : '👁️ 우리 반 학생 (읽기 전용)' }}
            </p>
          </div>
          <button v-if="selectedStudent.isMentor" @click="saveRecord" 
            class="px-6 py-2.5 bg-blue-600 text-white font-black rounded-xl shadow-lg hover:bg-blue-700 transition-all active:scale-95">
            기록 저장
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
          <TeacherAiAssistant v-if="selectedStudent.isMentor" :student="selectedStudent" :teacher-key="userStore.currentUser.userKey" @apply-draft="applyAiDraft" />

          <div class="space-y-4">
            <div class="flex justify-between items-end px-1">
              <label class="text-sm font-black text-gray-700">자율활동 특기사항 초안</label>
              <span class="text-[10px] font-mono text-gray-400">{{ getByteCount(recordData.autonomous) }} / 1500 Bytes</span>
            </div>
            <textarea v-model="recordData.autonomous" :disabled="!selectedStudent.isMentor"
              class="w-full p-6 border-2 rounded-2xl text-sm leading-relaxed outline-none focus:ring-2 focus:ring-blue-500 transition-all min-h-[400px] shadow-inner disabled:bg-gray-50 resize-none"
              placeholder="자율활동 기록을 입력하세요."></textarea>
          </div>
        </div>
      </div>
      <div v-else class="flex-1 flex flex-col items-center justify-center text-gray-300 space-y-4">
        <div class="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-4xl">📒</div>
        <p class="font-bold text-sm">학생을 선택하여 작성을 시작하세요.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue';
import { useUserStore } from '@/stores/userStore';
import { useTeacherStore } from '@/stores/teacherStore';
import { db } from '@/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getNeisByteLength } from '@/utils/textUtils';
import TeacherAiAssistant from './TeacherAiAssistant.vue';
import CsvExportButton from './CsvExportButton.vue'; // 💡 임포트

const userStore = useUserStore();
const teacherStore = useTeacherStore();
const currentSubTab = ref('mentee');
const searchQuery = ref('');
const selectedStudent = ref(null);
const recordData = reactive({ autonomous: '' });
const resolvedNames = reactive({}); 

const subTabs = [
  { id: 'mentee', label: '지도 학생' },
  { id: 'homeroom-active', label: '우리반(참여)' },
  { id: 'homeroom-inactive', label: '우리반(미참여)' }
];

const currentTabLabel = computed(() => subTabs.find(t => t.id === currentSubTab.value)?.label || '');

const studentMap = computed(() => {
  const map = new Map();
  const myHomeroomIds = new Set(teacherStore.homeroomStudents.map(s => s.userKey));
  const myMenteeIds = new Set(teacherStore.managedTeams.flatMap(t => t.members));
  const participatingIds = new Set([...teacherStore.studentLogs, ...teacherStore.studentEvals].map(r => r.studentId));

  teacherStore.homeroomStudents.forEach(s => {
    map.set(s.userKey, { ...s, isHomeroom: true, isMentor: myMenteeIds.has(s.userKey), isParticipating: participatingIds.has(s.userKey) });
  });
  
  teacherStore.managedTeams.forEach(team => {
    team.members.forEach(mId => {
      if (!map.has(mId)) {
        const record = [...teacherStore.studentLogs, ...teacherStore.studentEvals].find(r => r.studentId === mId);
        let name = record ? record.studentName : (resolvedNames[mId] || `[조회중...] ${mId}`);
        if (!record && !resolvedNames[mId]) fetchStudentName(mId);
        map.set(mId, { userKey: mId, name, isHomeroom: false, isMentor: true, isParticipating: true });
      }
    });
  });
  return map;
});

const filteredList = computed(() => {
  const all = Array.from(studentMap.value.values());
  let base = [];
  if (currentSubTab.value === 'mentee') base = all.filter(s => s.isMentor);
  else if (currentSubTab.value === 'homeroom-active') base = all.filter(s => s.isHomeroom && !s.isMentor && s.isParticipating);
  else base = all.filter(s => s.isHomeroom && !s.isMentor && !s.isParticipating);
  return base.filter(s => s.name.includes(searchQuery.value.trim())).sort((a, b) => a.userKey.localeCompare(b.userKey));
});

const fetchStudentName = async (id) => {
  try {
    const docSnap = await getDoc(doc(db, "users", id));
    if (docSnap.exists()) resolvedNames[id] = docSnap.data().name;
  } catch (e) {}
};

const selectStudent = async (student) => {
  selectedStudent.value = student;
  const docSnap = await getDoc(doc(db, "studentRecords", student.userKey));
  recordData.autonomous = docSnap.exists() ? docSnap.data().autonomous || '' : '';
};

const saveRecord = async () => {
  if (!selectedStudent.value?.isMentor) return;
  await setDoc(doc(db, "studentRecords", selectedStudent.value.userKey), { autonomous: recordData.autonomous, updatedAt: serverTimestamp(), teacherId: userStore.currentUser.userKey });
  alert('저장 완료');
};

const applyAiDraft = (draft) => { if (confirm('교체할까요?')) recordData.autonomous = draft.autonomous; };
const getByteCount = (text) => getNeisByteLength(text);
</script>