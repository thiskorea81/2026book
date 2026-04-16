import { defineStore } from 'pinia';
import { db } from '@/firebase';
import { useUserStore } from './userStore';
import { 
  collection, addDoc, updateDoc, deleteDoc, getDocs, 
  doc, query, where, orderBy, serverTimestamp 
} from 'firebase/firestore';

export const useQaStore = defineStore('qa', {
  state: () => ({
    myQuestions: [],
    isLoading: false
  }),

  actions: {
    // 💡 질문 목록 가져오기 (학생용)
    async fetchMyQuestions() {
      const userStore = useUserStore();
      if (!userStore.currentUser.userKey) return;

      this.isLoading = true;
      try {
        const q = query(
          collection(db, "qaMessages"),
          where("studentId", "==", userStore.currentUser.userKey),
          orderBy("createdAt", "desc")
        );
        const snap = await getDocs(q);
        this.myQuestions = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      } catch (e) {
        console.error("Q&A 로드 실패:", e);
      } finally {
        this.isLoading = false;
      }
    },

    // 💡 질문 등록하기
    async askQuestion(content) {
      const userStore = useUserStore();
      // 배정된 교사가 있는지 확인
      const teacherId = userStore.mySummary.teacher?.userKey || 
                        (userStore.mySummary.isDefaultTeacher ? "0" : null);

      if (!teacherId) {
        alert("배정된 지도 교사가 없어 질문을 보낼 수 없습니다.");
        return false;
      }

      this.isLoading = true;
      try {
        await addDoc(collection(db, "qaMessages"), {
          studentId: userStore.currentUser.userKey,
          studentName: userStore.currentUser.name,
          teacherId: String(teacherId), // 0~9 숫자 ID
          teacherName: userStore.mySummary.teacher.name,
          question: content,
          answer: "",
          status: "대기 중", // 대기 중, 답변 완료
          createdAt: serverTimestamp(),
          repliedAt: null
        });
        await this.fetchMyQuestions();
        return true;
      } catch (e) {
        return false;
      } finally {
        this.isLoading = false;
      }
    },

    // 💡 질문 삭제 (답변 전까지만 가능하게 로직 구성 가능)
    async deleteQuestion(qaId) {
      if (!confirm('질문을 삭제하시겠습니까?')) return;
      try {
        await deleteDoc(doc(db, "qaMessages", qaId));
        this.myQuestions = this.myQuestions.filter(q => q.id !== qaId);
      } catch (e) {
        alert('삭제 실패');
      }
    }
  }
});