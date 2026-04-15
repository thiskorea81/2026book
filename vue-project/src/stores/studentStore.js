import { defineStore } from 'pinia';
import { db } from '@/firebase';
import { collection, addDoc, setDoc, updateDoc, query, where, orderBy, getDocs, getDoc, doc, serverTimestamp } from 'firebase/firestore';

export const useStudentStore = defineStore('student', {
  state: () => ({
    currentUser: { userKey: '', name: '', role: '학생', teamId: null },
    mySummary: { team: null, teacher: null, isDefaultTeacher: false, logsCount: 0, hasEval: false },
    myLogs: [],
    menuSettings: { program: true, book: true, log: true, history: true, eval: true },
    isLoading: false,
    searchedBook: null,
  }),

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

        if (teacherId) {
          const teacherDoc = await getDoc(doc(db, "users", teacherId));
          if (teacherDoc.exists()) this.mySummary.teacher = teacherDoc.data();
          else this.mySummary.teacher = { name: teacherId === "0" ? "학년부장 선생님" : `${teacherId}반 담임 선생님`, subject: "과목 정보 없음", role: "기본 배정" };
        }

        this.mySummary.team = myTeam;
        const logQ = query(collection(db, "readingLogs"), where("studentId", "==", this.currentUser.userKey));
        const logSnap = await getDocs(logQ);
        this.mySummary.logsCount = logSnap.size;
        const evalQ = query(collection(db, "selfEvaluations"), where("studentId", "==", this.currentUser.userKey));
        const evalSnap = await getDocs(evalQ);
        this.mySummary.hasEval = !evalSnap.empty;
      } catch (e) { console.error(e); } finally { this.isLoading = false; }
    },

    async searchBookByISBN(isbn) {
      if (!isbn) return null;
      const clientId = import.meta.env.VITE_NAVER_CLIENT_ID;
      const clientSecret = import.meta.env.VITE_NAVER_CLIENT_SECRET;
      try {
        const res = await fetch(`/naver-api/v1/search/book.json?query=${isbn}`, {
          method: 'GET',
          headers: { 'X-Naver-Client-Id': clientId, 'X-Naver-Client-Secret': clientSecret }
        });
        const json = await res.json();
        if (!json.items?.length) return null;
        const item = json.items[0];
        this.searchedBook = { 
          isbn, 
          title: `'${item.title.replace(/<[^>]*>?/gm, '')} (${item.author.replace(/<[^>]*>?/gm, '')})'`,
          author: item.author.replace(/<[^>]*>?/gm, ''),
          publisher: item.publisher, 
          price: item.discount || item.price || 0 
        };
        return this.searchedBook;
      } catch (e) { return null; }
    },

    async submitForm(formType, formData) {
      this.isLoading = true;
      try {
        const common = { studentId: this.currentUser.userKey, studentName: this.currentUser.name, createdAt: serverTimestamp() };
        if (formType === '프로그램신청') {
          const year = new Date().getFullYear();
          const tSnap = await getDocs(collection(db, "teams"));
          let max = 0;
          tSnap.forEach(d => { if (d.id.startsWith(`${year}-`)) { const n = parseInt(d.id.split('-')[1]); if (n > max) max = n; } });
          const newId = `${year}-${max + 1}`;
          await setDoc(doc(db, "teams", newId), { ...common, ...formData, teamId: newId, status: 'pending' });
          await updateDoc(doc(db, "users", this.currentUser.userKey), { teamId: newId });
          this.currentUser.teamId = newId;
          await this.fetchMySummary();
        } else {
          let col = formType === '도서신청' ? 'bookApplications' : (formType === '독서일지' ? 'readingLogs' : 'selfEvaluations');
          await addDoc(collection(db, col), { ...common, ...formData });
          if (formType === '독서일지') await this.fetchMyLogs();
          if (formType === '자기평가서') await this.fetchMySummary();
        }
        alert('제출 완료');
        return true;
      } catch (e) { return false; } finally { this.isLoading = false; }
    },

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