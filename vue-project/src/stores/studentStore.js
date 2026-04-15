import { defineStore } from 'pinia';
import { db } from '@/firebase';
import { 
  collection, 
  addDoc, 
  setDoc,
  updateDoc,
  query, 
  where, 
  orderBy, 
  getDocs, 
  getDoc,
  doc,
  serverTimestamp 
} from 'firebase/firestore';

export const useStudentStore = defineStore('student', {
  state: () => ({
    currentUser: {
      userKey: '', 
      name: '',
      role: '학생',
      teamId: null
    },
    mySummary: {
      team: null,
      teacher: null,
      isDefaultTeacher: false,
      logsCount: 0,
      hasEval: false
    },
    myLogs: [],
    isLoading: false,
    searchedBook: null,
  }),

  actions: {
    // 💡 내 정보 및 교사 정보 조회 (팀 데이터의 담당교사번호 우선)
    async fetchMySummary() {
      if (!this.currentUser.userKey) return;
      this.isLoading = true;
      try {
        let assignedTeacherId = null;
        let myTeamData = null;

        // 1. 내가 포함된 팀 찾기 (전체 팀 중 members 배열에 내 학번이 있는 팀)
        const teamQ = query(
          collection(db, "teams"), 
          where("members", "array-contains", this.currentUser.userKey)
        );
        const teamSnap = await getDocs(teamQ);
        
        if (!teamSnap.empty) {
          myTeamData = teamSnap.docs[0].data();
          this.currentUser.teamId = myTeamData.teamId;
          
          // 💡 엑셀로 업로드한 '담당교사번호'가 있다면 해당 번호를 교사 ID로 설정
          if (myTeamData.teacherId !== undefined && myTeamData.teacherId !== null) {
            assignedTeacherId = String(myTeamData.teacherId);
            this.mySummary.isDefaultTeacher = false;
          }
        }

        // 2. 만약 팀이 없거나 담당교사가 지정되지 않았다면 학번 기준 담임 자동 배정
        if (!assignedTeacherId) {
          const classNum = parseInt(this.currentUser.userKey.substring(1, 3)) || 0;
          assignedTeacherId = (classNum >= 1 && classNum <= 9) ? String(classNum) : "0";
          this.mySummary.isDefaultTeacher = true;
        }

        // 3. 결정된 assignedTeacherId("0", "1" 등)로 교사 상세 정보 조회
        if (assignedTeacherId) {
          const teacherDoc = await getDoc(doc(db, "users", assignedTeacherId));
          if (teacherDoc.exists()) {
            this.mySummary.teacher = teacherDoc.data();
          } else {
            // 교사 데이터가 DB에 없는 경우의 대체 텍스트
            this.mySummary.teacher = {
              name: assignedTeacherId === "0" ? "학년부장 선생님" : `${assignedTeacherId}반 담임 선생님`,
              subject: "과목 정보 없음",
              role: this.mySummary.isDefaultTeacher ? "기본 배정" : "지도 교사"
            };
          }
        }

        this.mySummary.team = myTeamData;

        // 4. 활동 기록 현황
        const logQ = query(collection(db, "readingLogs"), where("studentId", "==", this.currentUser.userKey));
        const logSnap = await getDocs(logQ);
        this.mySummary.logsCount = logSnap.size;

        const evalQ = query(collection(db, "selfEvaluations"), where("studentId", "==", this.currentUser.userKey));
        const evalSnap = await getDocs(evalQ);
        this.mySummary.hasEval = !evalSnap.empty;

      } catch (error) {
        console.error("데이터 로드 실패:", error);
      } finally {
        this.isLoading = false;
      }
    },

    // 도서 검색 API
    async searchBookByISBN(isbn) {
      if (!isbn) return null;
      const clientId = import.meta.env.VITE_NAVER_CLIENT_ID;
      const clientSecret = import.meta.env.VITE_NAVER_CLIENT_SECRET;
      try {
        const response = await fetch(`/naver-api/v1/search/book.json?query=${isbn}`, {
          method: 'GET',
          headers: { 'X-Naver-Client-Id': clientId, 'X-Naver-Client-Secret': clientSecret }
        });
        const json = await response.json();
        if (!json.items || json.items.length === 0) return null;
        const item = json.items[0];
        this.searchedBook = {
          isbn: isbn, title: item.title.replace(/<[^>]*>?/gm, ''),
          author: item.author.replace(/<[^>]*>?/gm, ''),
          publisher: item.publisher, price: item.discount || item.price || 0
        };
        return this.searchedBook;
      } catch (e) { return null; }
    },

    // 폼 제출 처리
    async submitForm(formType, formData) {
      this.isLoading = true;
      try {
        const commonData = { studentId: this.currentUser.userKey, studentName: this.currentUser.name, createdAt: serverTimestamp() };
        
        if (formType === '프로그램신청') {
          const year = new Date().getFullYear();
          const teamsSnap = await getDocs(collection(db, "teams"));
          let maxNum = 0;
          teamsSnap.forEach(d => {
            if (d.id.startsWith(`${year}-`)) {
              const n = parseInt(d.id.split('-')[1]);
              if (!isNaN(n) && n > maxNum) maxNum = n;
            }
          });
          const newTeamId = `${year}-${maxNum + 1}`;
          
          await setDoc(doc(db, "teams", newTeamId), { ...commonData, ...formData, teamId: newTeamId, status: 'pending' });
          await updateDoc(doc(db, "users", this.currentUser.userKey), { teamId: newTeamId });
          this.currentUser.teamId = newTeamId;
          await this.fetchMySummary();
        } else {
          let col = formType === '도서신청' ? 'bookApplications' : (formType === '독서일지' ? 'readingLogs' : 'selfEvaluations');
          await addDoc(collection(db, col), { ...commonData, ...formData });
          if (formType === '독서일지') await this.fetchMyLogs();
          if (formType === '자기평가서') await this.fetchMySummary();
        }
        return true;
      } catch (e) { return false; } finally { this.isLoading = false; }
    },

    // 일지 목록 조회
    async fetchMyLogs() {
      if (!this.currentUser.userKey) return;
      this.isLoading = true;
      try {
        const q = query(collection(db, "readingLogs"), where("studentId", "==", this.currentUser.userKey), orderBy("date", "desc"));
        const snap = await getDocs(q);
        this.myLogs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (e) {} finally { this.isLoading = false; }
    }
  }
});