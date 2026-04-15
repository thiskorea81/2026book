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
    // 1. 내 활동 요약 정보 가져오기
    async fetchMySummary() {
      if (!this.currentUser.userKey) return;
      this.isLoading = true;
      try {
        let assignedTeacherId = null;

        if (this.currentUser.teamId) {
          const teamDoc = await getDoc(doc(db, "teams", this.currentUser.teamId));
          if (teamDoc.exists()) {
            this.mySummary.team = teamDoc.data();
            assignedTeacherId = this.mySummary.team.teacherId;
          }
        }

        if (!assignedTeacherId) {
          this.mySummary.isDefaultTeacher = true;
          const classNum = parseInt(this.currentUser.userKey.substring(1, 3));
          
          if (classNum >= 1 && classNum <= 9) {
            assignedTeacherId = `T0${classNum}`;
          } else {
            assignedTeacherId = 'T00';
          }
        } else {
          this.mySummary.isDefaultTeacher = false;
        }

        if (assignedTeacherId) {
          const teacherDoc = await getDoc(doc(db, "users", assignedTeacherId));
          if (teacherDoc.exists()) {
            this.mySummary.teacher = teacherDoc.data();
          }
        }

        const logQ = query(collection(db, "readingLogs"), where("studentId", "==", this.currentUser.userKey));
        const logSnap = await getDocs(logQ);
        this.mySummary.logsCount = logSnap.size;

        const evalQ = query(collection(db, "selfEvaluations"), where("studentId", "==", this.currentUser.userKey));
        const evalSnap = await getDocs(evalQ);
        this.mySummary.hasEval = !evalSnap.empty;

      } catch (error) {
        console.error("현황 로드 실패:", error);
      } finally {
        this.isLoading = false;
      }
    },

    // 2. 네이버 도서 검색 API
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
          isbn: isbn,
          title: item.title.replace(/<[^>]*>?/gm, ''),
          author: item.author.replace(/<[^>]*>?/gm, ''),
          publisher: item.publisher,
          price: item.discount || item.price || 0
        };
        return this.searchedBook;
      } catch (error) { return null; }
    },

    // 3. 💡 폼 제출 및 팀 번호 자동 배정 로직
    async submitForm(formType, formData) {
      this.isLoading = true;
      try {
        const commonData = {
          studentId: this.currentUser.userKey,
          studentName: this.currentUser.name,
          createdAt: serverTimestamp(),
        };

        if (formType === '프로그램신청') {
          // --- 팀 번호 자동 생성 (예: 2026-96) ---
          const year = new Date().getFullYear();
          const teamsSnap = await getDocs(collection(db, "teams"));
          
          let maxNum = 0;
          teamsSnap.forEach(docSnap => {
            const id = docSnap.id;
            if (id.startsWith(`${year}-`)) {
              const num = parseInt(id.split('-')[1]);
              if (!isNaN(num) && num > maxNum) {
                maxNum = num;
              }
            }
          });
          
          const newTeamId = `${year}-${maxNum + 1}`;

          // 지정된 팀 번호를 문서 ID로 사용하여 teams 컬렉션에 저장
          await setDoc(doc(db, "teams", newTeamId), {
            ...commonData,
            ...formData,
            teamId: newTeamId,
            status: 'pending' // 승인 대기 상태
          });

          // 신청한 학생 본인의 정보에 팀 번호 연동
          await updateDoc(doc(db, "users", this.currentUser.userKey), {
            teamId: newTeamId
          });
          this.currentUser.teamId = newTeamId; // 로컬 상태 즉시 업데이트

          await this.fetchMySummary(); // 내 정보 즉시 갱신
          alert(`프로그램 신청이 완료되었습니다! (부여된 팀 번호: ${newTeamId})`);

        } else {
          // --- 다른 양식 (독서일지, 평가서 등) 저장 ---
          let collectionName = '';
          if (formType === '도서신청') collectionName = 'bookApplications';
          else if (formType === '독서일지') collectionName = 'readingLogs';
          else if (formType === '자기평가서') collectionName = 'selfEvaluations';

          await addDoc(collection(db, collectionName), { ...commonData, ...formData });
          
          if (formType === '독서일지') await this.fetchMyLogs();
          if (formType === '자기평가서') await this.fetchMySummary();
          
          alert(`${formType} 제출이 완료되었습니다!`);
        }
        
        return true;
      } catch (error) {
        console.error("제출 실패:", error);
        alert("데이터 저장 중 오류가 발생했습니다. 다시 시도해 주세요.");
        return false;
      } finally {
        this.isLoading = false;
      }
    },

    // 4. 내 독서일지 목록 로드
    async fetchMyLogs() {
      if (!this.currentUser.userKey) return;
      this.isLoading = true;
      try {
        const q = query(collection(db, "readingLogs"), where("studentId", "==", this.currentUser.userKey), orderBy("date", "desc"));
        const snap = await getDocs(q);
        this.myLogs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (error) { } finally { this.isLoading = false; }
    }
  }
});