// src/stores/teacherStore.js
import { defineStore } from 'pinia';
import { db } from '@/firebase';
import { useUserStore } from './userStore';
import { 
  collection, getDocs, doc, updateDoc, 
  query, where, orderBy, serverTimestamp 
} from 'firebase/firestore';

export const useTeacherStore = defineStore('teacher', {
  state: () => ({
    allTeams: [],       // 💡 [추가] 전교 모든 팀 정보 (참여 여부 판단용)
    managedTeams: [],   // 내가 지도하는 팀
    homeroomStudents: [],
    studentLogs: [],
    studentEvals: [],
    qaMessages: [],
    isLoading: false
  }),

  actions: {
    async fetchAllManagedData() {
      const userStore = useUserStore();
      const teacherId = userStore.currentUser.userKey;
      if (!teacherId) return;

      this.isLoading = true;
      try {
        // 1. 💡 전교 모든 팀 정보 로드 (우리 반 학생의 타 팀 참여 확인용)
        const allTeamSnap = await getDocs(collection(db, "teams"));
        this.allTeams = allTeamSnap.docs.map(d => d.data());

        // 2. 내가 담당하는 팀만 필터링
        this.managedTeams = this.allTeams.filter(t => t.teacherId === teacherId);

        // 3. 우리 반 학생 정보 로드
        const classCode = teacherId.padStart(2, '0');
        const userSnap = await getDocs(collection(db, "users"));
        this.homeroomStudents = userSnap.docs
          .map(d => d.data())
          .filter(u => u.role === '학생' && u.userKey.substring(1, 3) === classCode);

        // 4. 모든 대상 학생 ID 통합 (내 멘티 + 우리 반 학생)
        const myMenteeIds = this.managedTeams.flatMap(t => t.members || []);
        const myClassMemberIds = this.homeroomStudents.map(s => s.userKey);
        const allTargetIds = [...new Set([...myMenteeIds, ...myClassMemberIds])];

        if (allTargetIds.length > 0) {
          const chunk = (arr, size) => Array.from({ length: Math.ceil(arr.length / size) }, (v, i) => arr.slice(i * size, i * size + size));
          const idChunks = chunk(allTargetIds, 30);

          const logs = [];
          const evals = [];

          for (const ids of idChunks) {
            const logSnap = await getDocs(query(collection(db, "readingLogs"), where("studentId", "in", ids)));
            const evalSnap = await getDocs(query(collection(db, "selfEvaluations"), where("studentId", "in", ids)));
            logs.push(...logSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            evals.push(...evalSnap.docs.map(d => ({ id: d.id, ...d.data() })));
          }

          this.studentLogs = logs;
          this.studentEvals = evals;
        }

        const qaSnap = await getDocs(query(collection(db, "qaMessages"), where("teacherId", "==", teacherId), orderBy("createdAt", "desc")));
        this.qaMessages = qaSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      } catch (e) { 
        console.error("데이터 로드 에러:", e); 
      } finally { 
        this.isLoading = false; 
      }
    },

    async saveComment(collectionName, docId, commentText) {
      try {
        const docRef = doc(db, collectionName, docId);
        await updateDoc(docRef, { teacherComment: commentText, commentedAt: serverTimestamp() });
        const list = collectionName === 'readingLogs' ? this.studentLogs : this.studentEvals;
        const target = list.find(item => item.id === docId);
        if (target) target.teacherComment = commentText;
        return true;
      } catch (e) { return false; }
    },

    async answerQuestion(qaId, answerText) {
      const qaRef = doc(db, "qaMessages", qaId);
      await updateDoc(qaRef, { answer: answerText, status: "답변 완료", repliedAt: serverTimestamp() });
      const idx = this.qaMessages.findIndex(q => q.id === qaId);
      if (idx !== -1) {
        this.qaMessages[idx].answer = answerText;
        this.qaMessages[idx].status = "답변 완료";
      }
    }
  }
});