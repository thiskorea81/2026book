import { defineStore } from 'pinia';
import { db } from '@/firebase';
import { 
  collection, addDoc, setDoc, updateDoc, query, where, orderBy, 
  getDocs, getDoc, doc, serverTimestamp, limit, deleteDoc
} from 'firebase/firestore';

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
          else this.mySummary.teacher = { name: teacherId === "0" ? "학년부장" : `${teacherId}반 담임`, subject: "정보 없음", role: "기본 배정" };
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

    // 💡 임시 저장 데이터 가져오기 (학번 필수 체크)
    async fetchDraft(type) {
      if (!this.currentUser.userKey) return null;
      try {
        const draftDoc = await getDoc(doc(db, "drafts", `${this.currentUser.userKey}_${type}`));
        return draftDoc.exists() ? draftDoc.data().formData : null;
      } catch (e) { return null; }
    },

    // 💡 임시 저장하기 (내용이 있을 때만 실행)
    async saveDraft(type, formData) {
      if (!this.currentUser.userKey) return;
      // 모든 필드가 비어있으면 저장하지 않음 (빈 데이터로 덮어쓰기 방지)
      const hasContent = Object.values(formData).some(val => val && val.trim() !== '');
      if (!hasContent) return;

      try {
        await setDoc(doc(db, "drafts", `${this.currentUser.userKey}_${type}`), {
          studentId: this.currentUser.userKey,
          type,
          formData,
          updatedAt: serverTimestamp()
        });
      } catch (e) { console.error("임시 저장 실패", e); }
    },

    // 💡 가장 최근 제출 데이터 가져오기
    async fetchLatestSubmission(collectionName) {
      if (!this.currentUser.userKey) return null;
      try {
        const q = query(
          collection(db, collectionName),
          where("studentId", "==", this.currentUser.userKey),
          orderBy("createdAt", "desc"),
          limit(1)
        );
        const snap = await getDocs(q);
        return !snap.empty ? snap.docs[0].data() : null;
      } catch (e) { return null; }
    },

    async submitForm(formType, formData) {
      this.isLoading = true;
      try {
        const common = { studentId: this.currentUser.userKey, studentName: this.currentUser.name, createdAt: serverTimestamp() };
        
        let col = formType === '도서신청' ? 'bookApplications' : (formType === '독서일지' ? 'readingLogs' : 'selfEvaluations');
        await addDoc(collection(db, col), { ...common, ...formData });
        
        // 제출 성공 시 임시 저장 파일 삭제
        const draftType = formType === '자기평가서' ? 'eval' : (formType === '독서일지' ? 'log' : '');
        if (draftType) {
          await deleteDoc(doc(db, "drafts", `${this.currentUser.userKey}_${draftType}`));
        }

        alert('제출 완료되었습니다.');
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