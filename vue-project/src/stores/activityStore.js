// src/stores/activityStore.js
import { defineStore } from 'pinia';
import { db } from '@/firebase';
import { useUserStore } from './userStore';
import { 
  collection, addDoc, setDoc, updateDoc, deleteDoc, 
  getDoc, getDocs, doc, query, where, orderBy, 
  serverTimestamp, limit 
} from 'firebase/firestore';

export const useActivityStore = defineStore('activity', {
  state: () => ({
    myLogs: [],        
    searchedBook: null, 
    isLoading: false    
  }),

  actions: {
    /**
     * 1. 네이버 도서 검색 API
     */
    async searchBook(isbn) {
      const clientId = import.meta.env.VITE_NAVER_CLIENT_ID;
      const clientSecret = import.meta.env.VITE_NAVER_CLIENT_SECRET;
      try {
        const res = await fetch(`/naver-api/v1/search/book.json?query=${isbn}`, {
          headers: { 
            'X-Naver-Client-Id': clientId, 
            'X-Naver-Client-Secret': clientSecret 
          }
        });
        const json = await res.json();
        if (!json.items?.length) return null;

        const item = json.items[0];
        this.searchedBook = { 
          isbn, 
          title: item.title.replace(/<[^>]*>?/gm, ''), 
          author: item.author.replace(/<[^>]*>?/gm, ''),
          publisher: item.publisher,
          price: item.discount || item.price || 0
        };
        return this.searchedBook;
      } catch (e) {
        console.error("도서 검색 실패:", e);
        return null;
      }
    },

    /**
     * 2. 임시 저장 (Drafts) 관리
     */
    async saveDraft(type, formData) {
      const userStore = useUserStore();
      const userKey = userStore.currentUser.userKey;
      if (!userKey) return;
      
      const hasContent = Object.values(formData).some(v => v && String(v).trim() !== '');
      if (!hasContent) return;

      try {
        await setDoc(doc(db, "drafts", `${userKey}_${type}`), {
          studentId: userKey,
          type,
          formData,
          updatedAt: serverTimestamp()
        });
      } catch (e) {
        console.error("임시 저장 실패:", e);
      }
    },

    async fetchDraft(type) {
      const userStore = useUserStore();
      const userKey = userStore.currentUser.userKey;
      if (!userKey) return null;

      try {
        const snap = await getDoc(doc(db, "drafts", `${userKey}_${type}`));
        return snap.exists() ? snap.data().formData : null;
      } catch (e) {
        return null;
      }
    },

    /**
     * 3. 🚀 [수정됨] 최신 제출 데이터 로드 및 필드 매핑
     * 제출된 데이터를 불러올 때 정의되지 않은 필드는 빈 문자열로 처리하여 에러를 방지합니다.
     */
    async fetchLatestSubmission(collectionName) {
      const userStore = useUserStore();
      if (!userStore.currentUser.userKey) return null;

      try {
        const q = query(
          collection(db, collectionName),
          where("studentId", "==", userStore.currentUser.userKey),
          orderBy("createdAt", "desc"),
          limit(1)
        );
        const snap = await getDocs(q);
        if (snap.empty) return null;

        const data = snap.docs[0].data();
        
        // 폼 필드 구조에 맞춰서 안전하게 반환 (데이터 유실 방지)
        return {
          bookTitle: data.bookTitle || '',
          careerTopic: data.careerTopic || '',
          careerGoal: data.careerGoal || '',
          majorGoal: data.majorGoal || '',
          subjectField: data.subjectField || '',
          roleInTeam: data.roleInTeam || '',
          motivation: data.motivation || '',
          reviewAndPlan: data.reviewAndPlan || ''
        };
      } catch (e) {
        console.error("최신 제출 데이터 로드 실패:", e);
        return null;
      }
    },

    /**
     * 4. 데이터 최종 제출 (통합 처리)
     */
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
          const colMap = { '도서신청': 'bookApplications', '독서일지': 'readingLogs', '자기평가서': 'selfEvaluations' };
          const colName = colMap[formType];
          await addDoc(collection(db, colName), { ...common, ...formData });
          
          const dType = formType === '자기평가서' ? 'eval' : (formType === '독서일지' ? 'log' : '');
          if (dType) await deleteDoc(doc(db, "drafts", `${userStore.currentUser.userKey}_${dType}`));
        }
        
        await userStore.fetchMySummary();
        return true;
      } catch (e) {
        console.error("제출 실패:", e);
        return false;
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * 5. 독서일지 관리
     */
    async fetchLogs() {
      const userStore = useUserStore();
      if (!userStore.currentUser.userKey) return;
      this.isLoading = true;
      try {
        const q = query(collection(db, "readingLogs"), where("studentId", "==", userStore.currentUser.userKey), orderBy("date", "desc"));
        const snap = await getDocs(q);
        this.myLogs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      } catch (e) { console.error("로그 로드 실패:", e); } finally { this.isLoading = false; }
    },

    async updateLog(id, data) {
      try {
        await updateDoc(doc(db, "readingLogs", id), { ...data, updatedAt: serverTimestamp() });
        await this.fetchLogs();
        return true;
      } catch (e) { return false; }
    },

    async deleteLog(id) {
      if (!confirm('삭제하시겠습니까?')) return;
      try {
        await deleteDoc(doc(db, "readingLogs", id));
        this.myLogs = this.myLogs.filter(l => l.id !== id);
        await useUserStore().fetchMySummary();
      } catch (e) { alert('삭제 실패'); }
    },

    /**
     * 6. 자기평가서 제출 취소 (hasEval 갱신 포함)
     */
    async cancelEvaluation() {
      const userStore = useUserStore();
      const userKey = userStore.currentUser.userKey;
      if (!confirm('제출을 취소하시겠습니까?\n취소 후 내용을 수정하여 다시 제출할 수 있습니다.')) return false;

      this.isLoading = true;
      try {
        const q = query(collection(db, "selfEvaluations"), where("studentId", "==", userKey));
        const snap = await getDocs(q);
        
        const deletePromises = snap.docs.map(d => deleteDoc(doc(db, "selfEvaluations", d.id)));
        await Promise.all(deletePromises);

        await userStore.fetchMySummary();
        alert('취소되었습니다. 이제 내용을 수정할 수 있습니다.');
        return true;
      } catch (e) {
        alert('취소 처리 중 오류가 발생했습니다.');
        return false;
      } finally {
        this.isLoading = false;
      }
    }
  }
});