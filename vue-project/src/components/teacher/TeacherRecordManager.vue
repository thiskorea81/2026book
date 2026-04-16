<template>
  <div class="flex flex-col md:flex-row gap-6 h-[calc(100vh-250px)]">
    <div class="w-full md:w-64 bg-white border rounded-2xl flex flex-col overflow-hidden shadow-sm">
      <div class="p-4 border-b bg-gray-50">
        <input v-model="searchQuery" type="text" placeholder="학생 검색..." class="w-full p-2 text-xs border rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
      </div>
      <div class="flex-1 overflow-y-auto">
        <div v-for="s in combinedStudents" :key="s.userKey" 
          @click="selectStudent(s)"
          class="p-4 border-b cursor-pointer transition-all hover:bg-blue-50"
          :class="selectedStudent?.userKey === s.userKey ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''"
        >
          <div class="flex justify-between items-start">
            <span class="text-sm font-bold text-gray-800">{{ s.name }}</span>
            <span :class="s.isMentor ? 'text-blue-600' : 'text-gray-400'" class="text-[9px] font-black uppercase">
              {{ s.isMentor ? 'Mentor' : 'ReadOnly' }}
            </span>
          </div>
          <p class="text-[10px] text-gray-400 mt-1">{{ s.userKey }}</p>
        </div>
      </div>
    </div>

    <div class="flex-1 bg-white border rounded-2xl flex flex-col overflow-hidden shadow-sm">
      <div v-if="selectedStudent" class="flex-1 flex flex-col overflow-hidden">
        <div class="p-6 border-b flex justify-between items-center bg-gray-50/50">
          <div>
            <h3 class="text-xl font-black text-gray-900">{{ selectedStudent.name }} 학생 생기부 작성</h3>
            <p class="text-xs text-gray-500 mt-1">
              {{ selectedStudent.isMentor ? '✍️ 내용을 수정하고 저장할 수 있습니다.' : '👁️ 우리 반 학생입니다. 읽기만 가능합니다.' }}
            </p>
          </div>
          <button v-if="selectedStudent.isMentor" @click="saveRecord" class="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-all">
            최종 저장하기
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-6 space-y-8">
          <TeacherAiAssistant 
            v-if="selectedStudent.isMentor"
            :student="selectedStudent" 
            :teacher-key="userStore.currentUser.userKey"
            @apply-draft="applyAiDraft"
          />

          <div class="grid grid-cols-1 gap-6">
            <div v-for="field in fields" :key="field.id" class="space-y-2">
              <div class="flex justify-between items-end">
                <label class="text-sm font-black text-gray-700">{{ field.label }}</label>
                <span class="text-[10px] text-gray-400 font-mono">{{ getByteCount(recordData[field.id]) }} / {{ field.maxByte }} Bytes</span>
              </div>
              <textarea 
                v-model="recordData[field.id]" 
                :disabled="!selectedStudent.isMentor"
                :placeholder="selectedStudent.isMentor ? '내용을 입력하세요...' : '작성된 기록이 없습니다.'"
                class="w-full p-4 border rounded-2xl text-sm leading-relaxed outline-none focus:ring-2 focus:ring-blue-500 transition-all min-h-[150px] disabled:bg-gray-50 disabled:text-gray-500"
              ></textarea>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="flex-1 flex items-center justify-center text-gray-400">
        <p>왼쪽 목록에서 학생을 선택해주세요.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, watch } from 'vue';
import { useUserStore } from '@/stores/userStore';
import { useTeacherStore } from '@/stores/teacherStore';
import { db } from '@/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getNeisByteLength } from '@/utils/textUtils';
import TeacherAiAssistant from './TeacherAiAssistant.vue';

const userStore = useUserStore();
const teacherStore = useTeacherStore();

const searchQuery = ref('');
const selectedStudent = ref(null);
const recordData = reactive({ autonomous: '', career: '', behavior: '' });

const fields = [
  { id: 'autonomous', label: '자율활동 특기사항', maxByte: 1500 },
  { id: 'career', label: '진로활동 특기사항', maxByte: 2100 },
  { id: 'behavior', label: '행동특성 및 종합의견', maxByte: 1500 }
];

// 통합 학생 리스트 (멘티 + 우리 반)
const combinedStudents = computed(() => {
  const mentors = teacherStore.managedTeams.flatMap(t => t.members.map(mId => ({ userKey: mId, isMentor: true })));
  const homerooms = teacherStore.homeroomStudents.map(s => ({ userKey: s.userKey, isMentor: false }));
  
  // 중복 제거 (멘티이면서 우리 반인 경우 멘티 권한 우선)
  const map = new Map();
  [...homerooms, ...mentors].forEach(s => {
    // 실제 학생 객체 정보 병합 (teacherStore.homeroomStudents 또는 users 전체 스냅샷 필요)
    const studentInfo = teacherStore.homeroomStudents.find(h => h.userKey === s.userKey) || { name: '타반 학생' };
    map.set(s.userKey, { ...s, name: studentInfo.name });
  });

  return Array.from(map.values()).filter(s => s.name.includes(searchQuery.value));
});

// 학생 선택 시 기존 기록 불러오기
const selectStudent = async (student) => {
  selectedStudent.value = student;
  const docSnap = await getDoc(doc(db, "studentRecords", student.userKey));
  if (docSnap.exists()) {
    Object.assign(recordData, docSnap.data());
  } else {
    recordData.autonomous = ''; recordData.career = ''; recordData.behavior = '';
  }
};

const saveRecord = async () => {
  if (!selectedStudent.value) return;
  try {
    await setDoc(doc(db, "studentRecords", selectedStudent.value.userKey), {
      ...recordData,
      updatedAt: serverTimestamp(),
      teacherId: userStore.currentUser.userKey
    });
    alert('저장되었습니다.');
  } catch (e) { alert('저장 실패'); }
};

const applyAiDraft = (draft) => {
  if (confirm('AI가 생성한 초안으로 본문을 덮어쓸까요?')) {
    Object.assign(recordData, draft);
  }
};

const getByteCount = (text) => getNeisByteLength(text);
</script>