import { defineStore } from 'pinia';
import { db } from '@/firebase';
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc, 
  serverTimestamp 
} from 'firebase/firestore';

export const useAdminStore = defineStore('admin', {
  state: () => ({
    users: [],
    teams: [], // 💡 팀 데이터를 보관할 상태 추가
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
      } catch (error) {
        console.error("데이터 초기화 실패:", error);
      } finally {
        this.isLoading = false;
      }
    },

    // 2. 사용자 추가/업데이트
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
    },

    // 💡 4. 팀 일괄 등록용 저장 액션
    async saveTeam(teamData) {
      // 문서 ID를 팀번호(예: 2026-1)로 지정하여 중복 방지 및 덮어쓰기 지원
      const teamRef = doc(db, "teams", String(teamData.teamId));
      await setDoc(teamRef, {
        ...teamData,
        updatedAt: serverTimestamp()
      });
      
      // 스토어 로컬 상태 즉시 업데이트
      const idx = this.teams.findIndex(t => t.teamId === teamData.teamId);
      if (idx !== -1) this.teams[idx] = teamData;
      else this.teams.push(teamData);
    },

    // 💡 팀 삭제 (adminStore.js actions 내부에 추가)
    async removeTeam(teamId) {
      await deleteDoc(doc(db, "teams", String(teamId)));
      this.teams = this.teams.filter(t => t.teamId !== teamId);
    }
  }
});