import { defineStore } from 'pinia';
import { db } from '@/firebase';
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  getDoc,
  deleteDoc, 
  serverTimestamp 
} from 'firebase/firestore';

export const useAdminStore = defineStore('admin', {
  state: () => ({
    users: [],
    teams: [],
    menuSettings: {
      program: true,
      book: true,
      log: true,
      history: true,
      eval: true
    },
    isLoading: false,
    statusMessage: ''
  }),

  getters: {
    students: (state) => state.users.filter(u => u.role === '학생'),
    teachers: (state) => state.users.filter(u => u.role !== '학생' && u.role !== '관리자'),
  },

  actions: {
    sortTeams() {
      this.teams.sort((a, b) => {
        const numA = parseInt(a.teamId.split('-')[1]) || 0;
        const numB = parseInt(b.teamId.split('-')[1]) || 0;
        return numA - numB; 
      });
    },

    async initData() {
      this.isLoading = true;
      try {
        const userSnap = await getDocs(collection(db, "users"));
        this.users = userSnap.docs.map(doc => doc.data());
        
        const teamSnap = await getDocs(collection(db, "teams"));
        this.teams = teamSnap.docs.map(doc => doc.data());
        this.sortTeams();

        const menuDoc = await getDoc(doc(db, "settings", "menuStatus"));
        if (menuDoc.exists()) {
          this.menuSettings = { ...this.menuSettings, ...menuDoc.data() };
        }
      } catch (error) {
        console.error("데이터 초기화 실패:", error);
      } finally {
        this.isLoading = false;
      }
    },

    async updateMenuSettings(newSettings) {
      try {
        const menuRef = doc(db, "settings", "menuStatus");
        await setDoc(menuRef, newSettings);
        this.menuSettings = newSettings;
        alert('메뉴 설정이 저장되었습니다.');
      } catch (error) {
        alert('메뉴 설정 저장 실패');
      }
    },

    async saveUser(userData) {
      const userRef = doc(db, "users", userData.userKey);
      await setDoc(userRef, userData);
      const idx = this.users.findIndex(u => u.userKey === userData.userKey);
      if (idx !== -1) this.users[idx] = userData;
      else this.users.push(userData);
    },

    async removeUser(userKey) {
      await deleteDoc(doc(db, "users", userKey));
      this.users = this.users.filter(u => u.userKey !== userKey);
    },

    async saveTeam(teamData) {
      const teamRef = doc(db, "teams", String(teamData.teamId));
      await setDoc(teamRef, { ...teamData, updatedAt: serverTimestamp() });
      const idx = this.teams.findIndex(t => t.teamId === teamData.teamId);
      if (idx !== -1) this.teams[idx] = teamData;
      else this.teams.push(teamData);
      this.sortTeams();
    },

    async removeTeam(teamId) {
      await deleteDoc(doc(db, "teams", String(teamId)));
      this.teams = this.teams.filter(t => t.teamId !== teamId);
    }
  }
});