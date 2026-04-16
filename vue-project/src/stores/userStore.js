import { defineStore } from 'pinia';
import { db } from '@/firebase';
import { doc, getDoc, getDocs, collection, query, where } from 'firebase/firestore';

export const useUserStore = defineStore('user', {
  state: () => ({
    currentUser: { userKey: '', name: '', role: '학생', teamId: null },
    mySummary: { team: null, teacher: null, isDefaultTeacher: false, logsCount: 0, hasEval: false },
    menuSettings: { program: true, book: true, log: true, history: true, eval: true },
    isLoading: false
  }),

  actions: {
    // 💡 학생의 기본 상태와 교사 정보를 가져오는 로직
    async fetchMySummary() {
      if (!this.currentUser.userKey) return;
      this.isLoading = true;
      try {
        // 1. 메뉴 노출 설정 로드
        const menuSnap = await getDoc(doc(db, "settings", "menuStatus"));
        if (menuSnap.exists()) this.menuSettings = { ...this.menuSettings, ...menuSnap.data() };

        let teacherId = null;
        let myTeam = null;

        // 2. 팀 매칭 (members 배열에 내 학번이 있는지 확인)
        const teamQ = query(collection(db, "teams"), where("members", "array-contains", this.currentUser.userKey));
        const teamSnap = await getDocs(teamQ);
        
        if (!teamSnap.empty) {
          myTeam = teamSnap.docs[0].data();
          this.currentUser.teamId = myTeam.teamId;
          // 엑셀에서 지정한 담당교사번호가 있다면 우선 사용
          if (myTeam.teacherId !== undefined) teacherId = String(myTeam.teacherId);
        }

        // 3. 교사 매칭 (0~9 숫자 ID 방식)
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
            role: this.mySummary.isDefaultTeacher ? "기본 배정" : "지도 교사"
          };
        }
        this.mySummary.team = myTeam;

        // 4. 제출 현황 업데이트
        const logSnap = await getDocs(query(collection(db, "readingLogs"), where("studentId", "==", this.currentUser.userKey)));
        this.mySummary.logsCount = logSnap.size;
        
        const evalSnap = await getDocs(query(collection(db, "selfEvaluations"), where("studentId", "==", this.currentUser.userKey)));
        this.mySummary.hasEval = !evalSnap.empty;

      } catch (e) { console.error("Summary 로드 실패:", e); } finally { this.isLoading = false; }
    }
  }
});