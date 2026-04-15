import { defineStore } from 'pinia';
import { db } from '@/firebase';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';

export const useAdminStore = defineStore('admin', {
  state: () => ({
    users: [],
    teams: [],
    isLoading: false,
    statusMessage: ''
  }),

  getters: {
    students: (state) => state.users.filter(u => u.role === '학생'),
    teachers: (state) => state.users.filter(u => u.role !== '학생' && u.role !== '관리자'),
  },

  actions: {
    // 1. 모든 사용자 및 팀 정보 로드
    async initData() {
      this.isLoading = true;
      try {
        const userSnap = await getDocs(collection(db, "users"));
        this.users = userSnap.docs.map(doc => doc.data());
        
        const teamSnap = await getDocs(collection(db, "teams"));
        this.teams = teamSnap.docs.map(doc => doc.data());
      } finally {
        this.isLoading = false;
      }
    },

    // 2. 사용자 추가/업데이트 (Firestore & State 동시 반영)
    async saveUser(userData) {
      const userRef = doc(db, "users", userData.userKey);
      await setDoc(userRef, userData);
      
      const idx = this.users.findIndex(u => u.userKey === userData.userKey);
      if (idx !== -1) this.users[idx] = userData;
      else this.users.push(userData);
    },

    // 3. 사용자 삭제
    async removeUser(userKey) {
      await deleteDoc(doc(db, "users", userKey));
      this.users = this.users.filter(u => u.userKey !== userKey);
    }
  }
});