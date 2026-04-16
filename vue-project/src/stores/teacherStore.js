import { defineStore } from 'pinia';
import { db } from '@/firebase';
import { useUserStore } from './userStore';
import { 
  collection, getDocs, doc, updateDoc, 
  query, where, orderBy, serverTimestamp 
} from 'firebase/firestore';

export const useTeacherStore = defineStore('teacher', {
  state: () => ({
    managedTeams: [],
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
        // 1. 담당 팀 및 우리 반 학생 정보 로드
        const teamQ = query(collection(db, "teams"), where("teacherId", "==", teacherId));
        const teamSnap = await getDocs(teamQ);
        this.managedTeams = teamSnap.docs.map(d => d.data());

        const classCode = teacherId.padStart(2, '0');
        const userSnap = await getDocs(collection(db, "users"));
        this.homeroomStudents = userSnap.docs
          .map(d => d.data())
          .filter(u => u.role === '학생' && u.userKey.substring(1, 3) === classCode);

        // 2. 모든 대상 학생 ID 통합
        const myMenteeIds = this.managedTeams.flatMap(t => t.members || []);
        const myClassMemberIds = this.homeroomStudents.map(s => s.userKey);
        const allTargetIds = [...new Set([...myMenteeIds, ...myClassMemberIds])];

        if (allTargetIds.length > 0) {
          // 💡 30명씩 끊어서 가져오는 헬퍼 함수
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

      } catch (e) { console.error(e); } finally { this.isLoading = false; }
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