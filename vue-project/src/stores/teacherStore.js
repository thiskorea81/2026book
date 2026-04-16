import { defineStore } from 'pinia';
import { db } from '@/firebase';
import { useUserStore } from './userStore';
import { 
  collection, getDocs, doc, updateDoc, 
  query, where, orderBy, serverTimestamp 
} from 'firebase/firestore';

export const useTeacherStore = defineStore('teacher', {
  state: () => ({
    managedTeams: [],      // 내가 지도하는 팀들
    homeroomStudents: [],  // 우리 반 학생들 전체 (타 교사 지도 학생 포함)
    studentLogs: [],       
    studentEvals: [],      
    qaMessages: [],        
    isLoading: false
  }),

  actions: {
    async fetchAllManagedData() {
      const userStore = useUserStore();
      const teacherId = userStore.currentUser.userKey; // "3" (3반 담임)
      if (!teacherId) return;

      this.isLoading = true;
      try {
        // 1. 내가 지도교사인 팀들 가져오기
        const teamQ = query(collection(db, "teams"), where("teacherId", "==", teacherId));
        const teamSnap = await getDocs(teamQ);
        this.managedTeams = teamSnap.docs.map(d => d.data());

        // 2. 💡 우리 반 학생들(홈룸) 찾기 로직
        // 학번 10301~10399 형식을 찾기 위해 "03" 클래스 코드 생성
        const classCode = teacherId.padStart(2, '0'); // "3" -> "03"
        const userSnap = await getDocs(collection(db, "users"));
        
        // 우리 반 아이들 필터링 (학년 상관 없이 2~3번째 자리가 내 반 번호인 경우)
        this.homeroomStudents = userSnap.docs
          .map(d => d.data())
          .filter(u => u.role === '학생' && u.userKey.substring(1, 3) === classCode);

        // 3. 💡 모든 관련 학생 ID 통합 (내 팀원 + 우리 반 아이들)
        const myTeamMemberIds = this.managedTeams.flatMap(t => t.members || []);
        const myClassMemberIds = this.homeroomStudents.map(s => s.userKey);
        const allTargetIds = [...new Set([...myTeamMemberIds, ...myClassMemberIds])];

        if (allTargetIds.length > 0) {
          // 4. 통합된 학생들의 모든 기록 로드 (Firebase 'in' 쿼리는 최대 30개이므로 분할 처리 권장하나 여기선 기본 구현)
          const logQ = query(collection(db, "readingLogs"), where("studentId", "in", allTargetIds.slice(0, 30)));
          const logSnap = await getDocs(logQ);
          this.studentLogs = logSnap.docs.map(d => ({ id: d.id, ...d.data() }));

          const evalQ = query(collection(db, "selfEvaluations"), where("studentId", "in", allTargetIds.slice(0, 30)));
          const evalSnap = await getDocs(evalQ);
          this.studentEvals = evalSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        }

        // 5. 나에게 온 Q&A
        const qaQ = query(collection(db, "qaMessages"), where("teacherId", "==", teacherId), orderBy("createdAt", "desc"));
        const qaSnap = await getDocs(qaQ);
        this.qaMessages = qaSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      } catch (e) { console.error(e); } finally { this.isLoading = false; }
    },

    // 💡 6. 코멘트 저장 기능 (독서일지 또는 자기평가서 공용)
    async saveComment(collectionName, docId, commentText) {
      try {
        const docRef = doc(db, collectionName, docId);
        await updateDoc(docRef, {
          teacherComment: commentText,
          commentedAt: serverTimestamp()
        });

        // 로컬 상태 즉시 반영
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