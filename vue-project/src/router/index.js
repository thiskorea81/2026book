import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import AdminView from '../views/AdminView.vue'
import TeacherView from '../views/TeacherView.vue'
import StudentView from '../views/StudentView.vue'
// 💡 비밀번호 변경 페이지 추가
import ChangePasswordView from '../views/ChangePasswordView.vue' 

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/login' },
    { path: '/login', name: 'login', component: LoginView },
    { path: '/change-password', name: 'change-password', component: ChangePasswordView }, // 💡 라우트 추가
    { path: '/admin', name: 'admin', component: AdminView },
    { path: '/teacher', name: 'teacher', component: TeacherView },
    { path: '/student', name: 'student', component: StudentView },
  ]
})

export default router