import { defineStore } from 'pinia';
import { db } from '@/firebase';
import { 
  collection, 
  addDoc, 
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
      isDefaultTeacher: false, // 💡 기본 배정 교사 여부 확인용
      logsCount: 0,
      hasEval: false
    },
    myLogs: [],
    isLoading: false,
    searchedBook: null,
  }),

  actions: {
    // 💡 내 활동 및 교사 정보 가져오기 (배정 로직 포함)
    async fetchMySummary() {
      if (!this.currentUser.userKey) return;
      this.isLoading = true;
      try {
        let assignedTeacherId = null;

        // A. 팀 정보 확인
        if (this.currentUser.teamId) {
          const teamDoc = await getDoc(doc(db, "teams", this.currentUser.teamId));
          if (teamDoc.exists()) {
            this.mySummary.team = teamDoc.data();
            assignedTeacherId = this.mySummary.team.teacherId;
          }
        }

        // B. 💡 교사 배정 로직 (미배정 시 기본값 설정)
        if (!assignedTeacherId) {
          this.mySummary.isDefaultTeacher = true;
          // 학번 5자리(예: 10501)에서 2~3번째 자리(05) 추출
          const classNum = parseInt(this.currentUser.userKey.substring(1, 3));
          
          if (classNum >= 1 && classNum <= 9) {
            // 1~9반: T01 ~ T09 (담임)
            assignedTeacherId = `T0${classNum}`;
          } else {
            // 그 외: T00 (학년부장)
            assignedTeacherId = 'T00';
          }
        } else {
          this.mySummary.isDefaultTeacher = false;
        }

        // C. 교사 상세 정보 가져오기
        if (assignedTeacherId) {
          const teacherDoc = await getDoc(doc(db, "users", assignedTeacherId));
          if (teacherDoc.exists()) {
            this.mySummary.teacher = teacherDoc.data();
          }
        }

        // D. 기타 현황 (기존 동일)
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

    async submitForm(formType, formData) {
      this.isLoading = true;
      try {
        const commonData = {
          studentId: this.currentUser.userKey,
          studentName: this.currentUser.name,
          createdAt: serverTimestamp(),
        };
        let collectionName = '';
        if (formType === '프로그램신청') collectionName = 'teams';
        else if (formType === '도서신청') collectionName = 'bookApplications';
        else if (formType === '독서일지') collectionName = 'readingLogs';
        else if (formType === '자기평가서') collectionName = 'selfEvaluations';

        await addDoc(collection(db, collectionName), { ...commonData, ...formData });
        alert(`${formType} 제출 완료!`);
        return true;
      } catch (error) { return false; } finally { this.isLoading = false; }
    },

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