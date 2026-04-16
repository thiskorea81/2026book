<template>
  <div class="flex flex-col md:flex-row gap-6 h-[calc(100vh-250px)]">
    <div class="w-full md:w-80 bg-white border rounded-3xl flex flex-col overflow-hidden shadow-sm">
      <div class="flex border-b bg-gray-50 p-1">
        <button v-for="tab in subTabs" :key="tab.id" 
          @click="currentSubTab = tab.id"
          class="flex-1 py-2 text-[11px] font-bold rounded-lg transition-all"
          :class="currentSubTab === tab.id ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'"
        >
          {{ tab.label }}
        </button>
      </div>

      <div class="p-3 border-b">
        <input v-model="searchQuery" type="text" placeholder="이름으로 찾기..." 
          class="w-full p-2 text-xs border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50">
      </div>

      <div class="flex-1 overflow-y-auto no-scrollbar">
        <div v-if="filteredList.length === 0" class="p-10 text-center text-xs text-gray-300">
          대상 학생이 없습니다.
        </div>
        <div v-for="s in filteredList" :key="s.userKey" 
          @click="selectStudent(s)"
          class="p-4 border-b cursor-pointer transition-all hover:bg-blue-50/50"
          :class="selectedStudent?.userKey === s.userKey ? 'bg-blue-50 border-r-4 border-r-blue-600' : ''"
        >
          <div class="flex justify-between items-center">
            <div>
              <span class="text-sm font-black text-gray-800">{{ s.name }}</span>
              <span class="text-[10px] text-gray-400 ml-2 font-mono">{{ s.userKey }}</span>
            </div>
            <span v-if="s.isMentor" class="text-[9px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-black uppercase">Mentee</span>
          </div>
        </div>
      </div>
    </div>

    <div class="flex-1 bg-white border rounded-3xl flex flex-col overflow-hidden shadow-sm">
      <div v-if="selectedStudent" class="flex-1 flex flex-col overflow-hidden animate-fade-in">
        <div class="p-6 border-b flex justify-between items-center bg-gray-50/30">
          <div>
            <div class="flex items-center space-x-2">
              <h3 class="text-xl font-black text-gray-900">{{ selectedStudent.name }}</h3>
              <span class="text-xs text-gray-400">({{ selectedStudent.userKey }})</span>
            </div>
            <p class="text-[11px] font-bold mt-1" :class="selectedStudent.isMentor ? 'text-blue-600' : 'text-orange-500'">
              {{ selectedStudent.isMentor ? '✍️ 생기부 초안을 작성하고 저장할 수 있습니다.' : '👁️ 우리 반 학생의 기록을 열람 중입니다. (읽기 전용)' }}
            </p>
          </div>
          <button v-if="selectedStudent.isMentor" @click="saveRecord" 
            class="px-6 py-2.5 bg-blue-600 text-white font-black rounded-xl shadow-lg hover:bg-blue-700 transition-all active:scale-95">
            기록 저장
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-6 space-y-8">
          <TeacherAiAssistant 
            v-if="selectedStudent.isMentor"
            :student="selectedStudent" 
            :teacher-key="userStore.currentUser.userKey"
            @apply-draft="applyAiDraft"
          />

          <div class="space-y-3">
            <div class="flex justify-between items-end px-1">
              <label class="text-sm font-black text-gray-700">자율활동 특기사항 초안</label>
              <span class="text-[10px] font-mono" :class="getByteCount(recordData.autonomous) > 1500 ? 'text-red-500' : 'text-gray-400'">
                {{ getByteCount(recordData.autonomous) }} / 1500 Bytes
              </span>
            </div>
            <textarea 
              v-model="recordData.autonomous" 
              :disabled="!selectedStudent.isMentor"
              :placeholder="selectedStudent.isMentor ? '학생의 성장이 드러나는 문장을 입력하세요...' : '작성된 기록이 없습니다.'"
              class="w-full p-6 border-2 rounded-2xl text-sm leading-relaxed outline-none focus:ring-2 focus:ring-blue-500 transition-all min-h-[300px] shadow-inner disabled:bg-gray-50 disabled:text-gray-500"
            ></textarea>
          </div>
        </div>
      </div>
      
      <div v-else class="flex-1 flex flex-col items-center justify-center text-gray-300 space-y-4">
        <span class="text-6-xl">📒</span>
        <p class="font-bold">왼쪽 리스트에서 학생을 선택하면 생기부 작성이 시작됩니다.</p>
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

const userStore = useUserStore();
const teacherStore = useTeacherStore();

const currentSubTab = ref('mentee'); // 기본: 지도 학생
const subTabs = [
  { id: 'mentee', label: '지도 학생' },
  { id: 'homeroom-active', label: '우리반(참여)' },
  { id: 'homeroom-inactive', label: '우리반(미참여)' }
];

const searchQuery = ref('');
const selectedStudent = ref(null);
const recordData = reactive({ autonomous: '' });

// 💡 1. 전체 학생 데이터 맵 구성 (타반 학생 이름 보장을 위해)
const studentMap = computed(() => {
  const map = new Map();
  // 우리 반 아이들 먼저 기본 데이터로 사용
  teacherStore.homeroomStudents.forEach(s => map.set(s.userKey, { ...s, isMentor: false }));
  
  // 지도 팀 학생들 병합 (이름이 없을 경우를 대비해 studentLogs나 studentEvals에서 이름을 찾아옴)
  teacherStore.managedTeams.forEach(team => {
    team.members.forEach(mId => {
      if (!map.has(mId)) {
        // 우리 반이 아닌 경우, 기록 데이터에서 이름을 찾음 (타반학생 이름 노출용)
        const record = [...teacherStore.studentLogs, ...teacherStore.studentEvals].find(r => r.studentId === mId);
        map.set(mId, { 
          userKey: mId, 
          name: record ? record.studentName : `[미확인] ${mId}`, 
          isMentor: true 
        });
      } else {
        // 우리 반 아이인데 내 멘티이기도 한 경우 권한 승급
        const student = map.get(mId);
        student.isMentor = true;
      }
    });
  });
  return map;
});

// 💡 2. 탭별 필터링 리스트
const filteredList = computed(() => {
  const all = Array.from(studentMap.value.values());
  const query = searchQuery.value.trim();

  // 참여 여부 판단 (기록이 1개라도 있는지)
  const activeIds = new Set([...teacherStore.studentLogs, ...teacherStore.studentEvals].map(r => r.studentId));

  let baseList = [];
  if (currentSubTab.value === 'mentee') {
    baseList = all.filter(s => s.isMentor);
  } else if (currentSubTab.value === 'homeroom-active') {
    baseList = all.filter(s => !s.isMentor && activeIds.has(s.userKey));
  } else {
    baseList = all.filter(s => !s.isMentor && !activeIds.has(s.userKey));
  }

  return baseList.filter(s => s.name.includes(query)).sort((a, b) => a.userKey.localeCompare(b.userKey));
});

const selectStudent = async (student) => {
  selectedStudent.value = student;
  const docSnap = await getDoc(doc(db, "studentRecords", student.userKey));
  if (docSnap.exists()) {
    recordData.autonomous = docSnap.data().autonomous || '';
  } else {
    recordData.autonomous = '';
  }
};

const saveRecord = async () => {
  if (!selectedStudent.value || !selectedStudent.value.isMentor) return;
  try {
    await setDoc(doc(db, "studentRecords", selectedStudent.value.userKey), {
      autonomous: recordData.autonomous,
      updatedAt: serverTimestamp(),
      teacherId: userStore.currentUser.userKey
    });
    alert(`${selectedStudent.value.name} 학생의 기록이 저장되었습니다.`);
  } catch (e) { alert('저장 중 오류가 발생했습니다.'); }
};

const applyAiDraft = (draft) => {
  if (confirm('AI가 작성한 초안으로 현재 내용을 교체할까요?')) {
    recordData.autonomous = draft.autonomous;
  }
};

const getByteCount = (text) => getNeisByteLength(text);
</script>