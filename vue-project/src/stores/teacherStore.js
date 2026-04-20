import { defineStore } from 'pinia';
import { db } from '@/firebase';
import { useUserStore } from './userStore';
import { 
  collection, getDocs, doc, updateDoc, deleteDoc,
  query, where, orderBy, serverTimestamp, onSnapshot, limit
} from 'firebase/firestore';

export const useTeacherStore = defineStore('teacher', {
  state: () => ({
    allTeams: [],         // 전교 모든 팀 정보 (참여 여부 판단용)
    managedTeams: [],     // 내가 지도하는 팀
    homeroomStudents: [], // 우리 반 학생 명단
    studentLogs: [],      // 독서일지 데이터
    studentEvals: [],     // 자기평가서 데이터
    qaMessages: [],       // Q&A 메시지 리스트
    unsubscribes: [],     // 💡 실시간 리스너 해제용 배열
    isLoading: false
  }),

  actions: {
    /**
     * 🛰️ 1. 실시간 리스너 초기화 (Q&A, 팀 정보 전용)
     */
    initRealtimeListeners() {
      const userStore = useUserStore();
      const teacherId = userStore.currentUser.userKey;
      if (!teacherId) return;

      // 기존 리스너가 있다면 중복 방지를 위해 제거
      this.stopListeners();

      // [A] Q&A 메시지 실시간 감시 (최신순)
      const qaQ = query(
        collection(db, "qaMessages"),
        where("teacherId", "==", teacherId),
        orderBy("createdAt", "desc")
      );
      const unsubQa = onSnapshot(qaQ, (snap) => {
        this.qaMessages = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        console.log("🚀 Q&A 데이터 실시간 동기화 완료");
      });

      // [B] 내가 담당하는 팀 실시간 감시
      const teamQ = query(collection(db, "teams"), where("teacherId", "==", teacherId));
      const unsubManagedTeams = onSnapshot(teamQ, (snap) => {
        this.managedTeams = snap.docs.map(d => d.data());
      });

      // [C] 전교 모든 팀 실시간 감시 (우리 반 학생 참여 여부 실시간 판단용)
      const unsubAllTeams = onSnapshot(collection(db, "teams"), (snap) => {
        this.allTeams = snap.docs.map(d => d.data());
      });

      // 리스너 해제 함수들을 배열에 보관
      this.unsubscribes.push(unsubQa, unsubManagedTeams, unsubAllTeams);
    },

    /**
     * 🛑 2. 리스너 중단 (로그아웃 또는 컴포넌트 언마운트 시)
     */
    stopListeners() {
      if (this.unsubscribes.length > 0) {
        this.unsubscribes.forEach(unsub => unsub());
        this.unsubscribes = [];
        console.log("📴 모든 실시간 리스너가 해제되었습니다.");
      }
    },

    /**
     * 📥 3. 일괄 데이터 로드 (우리 반 학생 명단 및 활동 일지)
     */
    async fetchAllManagedData() {
      const userStore = useUserStore();
      const teacherId = userStore.currentUser.userKey;
      if (!teacherId) return;

      this.isLoading = true;
      try {
        // 💡 [참고] 팀 정보는 리스너가 관리하므로 초기 1회 로드만 수행
        const allTeamSnap = await getDocs(collection(db, "teams"));
        this.allTeams = allTeamSnap.docs.map(d => d.data());
        this.managedTeams = this.allTeams.filter(t => t.teacherId === teacherId);

        // 우리 반 학생 정보 로드
        const classCode = teacherId.padStart(2, '0');
        const userSnap = await getDocs(collection(db, "users"));
        this.homeroomStudents = userSnap.docs
          .map(d => d.data())
          .filter(u => u.role === '학생' && u.userKey.substring(1, 3) === classCode);

        // 모든 대상 학생 ID 통합 (내 멘티 + 우리 반 학생)
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

      } catch (e) { 
        console.error("데이터 로드 에러:", e); 
      } finally { 
        this.isLoading = false; 
      }
    },

    /**
     * 📝 4. 활동 피드백 저장
     */
    async saveComment(collectionName, docId, commentText) {
      try {
        const docRef = doc(db, collectionName, docId);
        await updateDoc(docRef, { 
          teacherComment: commentText, 
          commentedAt: serverTimestamp() 
        });
        
        // 로컬 상태 업데이트
        const list = collectionName === 'readingLogs' ? this.studentLogs : this.studentEvals;
        const target = list.find(item => item.id === docId);
        if (target) target.teacherComment = commentText;
        return true;
      } catch (e) { return false; }
    },

    /**
     * 💬 5. Q&A 답변 등록
     */
    async answerQuestion(qaId, answerText) {
      try {
        const qaRef = doc(db, "qaMessages", qaId);
        await updateDoc(qaRef, { 
          answer: answerText, 
          status: "답변 완료", 
          repliedAt: serverTimestamp() 
        });
        
        // 💡 Q&A는 리스너에 의해 자동으로 상태가 동기화되므로 별도의 수동 처리가 필요 없습니다.
        return true;
      } catch (e) { 
        console.error("답변 등록 실패:", e);
        return false; 
      }
    }
  }
});