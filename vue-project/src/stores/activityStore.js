import { defineStore } from 'pinia';
import { db } from '@/firebase';
import { useUserStore } from './userStore';
import { 
  collection, addDoc, setDoc, updateDoc, deleteDoc, getDoc, getDocs, 
  doc, query, where, orderBy, serverTimestamp, limit 
} from 'firebase/firestore';

export const useActivityStore = defineStore('activity', {
  state: () => ({
    myLogs: [],
    searchedBook: null,
    isLoading: false
  }),

  actions: {
    // 1. 도서 검색 (Naver API)
    async searchBook(isbn) {
      const clientId = import.meta.env.VITE_NAVER_CLIENT_ID;
      const clientSecret = import.meta.env.VITE_NAVER_CLIENT_SECRET;
      try {
        const res = await fetch(`/naver-api/v1/search/book.json?query=${isbn}`, {
          headers: { 'X-Naver-Client-Id': clientId, 'X-Naver-Client-Secret': clientSecret }
        });
        const json = await res.json();
        if (!json.items?.length) return null;
        const item = json.items[0];
        this.searchedBook = { 
          isbn, 
          title: `'${item.title.replace(/<[^>]*>?/gm, '')} (${item.author.replace(/<[^>]*>?/gm, '')})'`,
          author: item.author.replace(/<[^>]*>?/gm, '')
        };
        return this.searchedBook;
      } catch (e) { return null; }
    },

    // 2. 임시 저장 (Drafts) 관리
    async saveDraft(type, formData) {
      const userStore = useUserStore();
      const userKey = userStore.currentUser.userKey;
      if (!userKey) return;
      
      const hasContent = Object.values(formData).some(v => v && v.trim() !== '');
      if (!hasContent) return;

      await setDoc(doc(db, "drafts", `${userKey}_${type}`), {
        studentId: userKey, formData, updatedAt: serverTimestamp()
      });
    },

    async fetchDraft(type) {
      const userStore = useUserStore();
      const userKey = userStore.currentUser.userKey;
      const snap = await getDoc(doc(db, "drafts", `${userKey}_${type}`));
      return snap.exists() ? snap.data().formData : null;
    },

    // 3. 최신 제출물 1건 로드 (자기평가서 복구용)
    async fetchLatestSubmission(collectionName) {
      const userStore = useUserStore();
      const q = query(
        collection(db, collectionName),
        where("studentId", "==", userStore.currentUser.userKey),
        orderBy("createdAt", "desc"),
        limit(1)
      );
      const snap = await getDocs(q);
      return !snap.empty ? snap.docs[0].data() : null;
    },

    // 4. 데이터 제출 (프로그램 신청 시 자동 채번 포함)
    async submitForm(formType, formData) {
      const userStore = useUserStore();
      this.isLoading = true;
      try {
        const common = { 
          studentId: userStore.currentUser.userKey, 
          studentName: userStore.currentUser.name, 
          createdAt: serverTimestamp() 
        };

        if (formType === '프로그램신청') {
          const year = new Date().getFullYear();
          const tSnap = await getDocs(collection(db, "teams"));
          let max = 0;
          tSnap.forEach(d => {
            if (d.id.startsWith(`${year}-`)) {
              const n = parseInt(d.id.split('-')[1]);
              if (n > max) max = n;
            }
          });
          const newId = `${year}-${max + 1}`;
          await setDoc(doc(db, "teams", newId), { ...common, ...formData, teamId: newId, status: 'pending' });
          await updateDoc(doc(db, "users", userStore.currentUser.userKey), { teamId: newId });
          userStore.currentUser.teamId = newId;
        } else {
          let col = formType === '도서신청' ? 'bookApplications' : (formType === '독서일지' ? 'readingLogs' : 'selfEvaluations');
          await addDoc(collection(db, col), { ...common, ...formData });
          
          // 임시 저장 삭제
          const dType = formType === '자기평가서' ? 'eval' : (formType === '독서일지' ? 'log' : '');
          if (dType) await deleteDoc(doc(db, "drafts", `${userStore.currentUser.userKey}_${dType}`));
        }
        
        await userStore.fetchMySummary(); // 현황 갱신
        alert('제출 완료되었습니다.');
        return true;
      } catch (e) { return false; } finally { this.isLoading = false; }
    },

    // 5. 독서일지 CRUD
    async fetchLogs() {
      const userStore = useUserStore();
      this.isLoading = true;
      const q = query(collection(db, "readingLogs"), where("studentId", "==", userStore.currentUser.userKey), orderBy("date", "desc"));
      const snap = await getDocs(q);
      this.myLogs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      this.isLoading = false;
    },

    async updateLog(id, data) {
      await updateDoc(doc(db, "readingLogs", id), { ...data, updatedAt: serverTimestamp() });
      await this.fetchLogs();
    },

    async deleteLog(id) {
      if (confirm('삭제하시겠습니까?')) {
        await deleteDoc(doc(db, "readingLogs", id));
        this.myLogs = this.myLogs.filter(l => l.id !== id);
        await useUserStore().fetchMySummary();
      }
    }
  }
});