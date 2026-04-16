import { defineStore } from 'pinia';
import { db } from '@/firebase';
import { doc, getDoc, getDocs, collection, query, where } from 'firebase/firestore';

export const useUserStore = defineStore('user', {
  state: () => ({
    currentUser: { userKey: '', name: '', role: '학생', teamId: null },
    mySummary: { team: null, teacher: null, isDefaultTeacher: false, logsCount: 0, hasEval: false },
    menuSettings: { program: true, book: true, log: true, history: true, eval: true, qa: true },
    isLoading: false,
    // 💡 새로고침 시 유저 정보 복구가 완료되었는지 판단하는 기준
    isAuthReady: false 
  }),

  getters: {
    activityStatus: (state) => {
      if (!state.mySummary.team) return { text: '🌱 시작 전', color: 'text-gray-400' };
      if (state.mySummary.logsCount >= 3 && state.mySummary.hasEval) {
        return { text: '✅ 활동 완료', color: 'text-blue-600' };
      }
      return { text: '📖 진행 중', color: 'text-orange-500' };
    }
  },

  actions: {
    async fetchMySummary() {
      if (!this.currentUser.userKey) return;
      this.isLoading = true;
      try {
        const menuSnap = await getDoc(doc(db, "settings", "menuStatus"));
        if (menuSnap.exists()) this.menuSettings = { ...this.menuSettings, ...menuSnap.data() };

        let teacherId = null;
        let myTeam = null;

        const teamQ = query(collection(db, "teams"), where("members", "array-contains", this.currentUser.userKey));
        const teamSnap = await getDocs(teamQ);
        
        if (!teamSnap.empty) {
          myTeam = teamSnap.docs[0].data();
          this.currentUser.teamId = myTeam.teamId;
          if (myTeam.teacherId !== undefined) teacherId = String(myTeam.teacherId);
        }

        if (!teacherId) {
          const classNum = parseInt(this.currentUser.userKey.substring(1, 3)) || 0;
          teacherId = (classNum >= 1 && classNum <= 9) ? String(classNum) : "0";
          this.mySummary.isDefaultTeacher = true;
        }

        const teacherDoc = await getDoc(doc(db, "users", teacherId));
        if (teacherDoc.exists()) {
          this.mySummary.teacher = teacherDoc.data();
        } else {
          this.mySummary.teacher = { 
            name: teacherId === "0" ? "학년부장 선생님" : `${teacherId}반 담임 선생님`, 
            subject: "정보 없음",
            role: "배정 대기"
          };
        }
        this.mySummary.team = myTeam;

        const logSnap = await getDocs(query(collection(db, "readingLogs"), where("studentId", "==", this.currentUser.userKey)));
        this.mySummary.logsCount = logSnap.size;
        
        const evalSnap = await getDocs(query(collection(db, "selfEvaluations"), where("studentId", "==", this.currentUser.userKey)));
        this.mySummary.hasEval = !evalSnap.empty;

      } catch (e) { console.error("Summary 로드 실패:", e); } finally { this.isLoading = false; }
    }
  }
});