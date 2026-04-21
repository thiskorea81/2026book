// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { auth, db } from '@/firebase'
import { doc, getDoc } from 'firebase/firestore'

import LoginView from '../views/LoginView.vue'
import AdminView from '../views/AdminView.vue'
import TeacherView from '../views/TeacherView.vue'
import StudentView from '../views/StudentView.vue'
import ChangePasswordView from '../views/ChangePasswordView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/login' },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { requiresGuest: true }
    },
    {
      path: '/change-password',
      name: 'change-password',
      component: ChangePasswordView,
      meta: { requiresAuth: true }
    },
    {
      path: '/admin',
      name: 'admin',
      component: AdminView,
      meta: { requiresAuth: true, role: 'admin' }
    },
    {
      path: '/teacher',
      name: 'teacher',
      component: TeacherView,
      meta: { requiresAuth: true, role: 'teacher' }
    },
    {
      path: '/student',
      name: 'student',
      component: StudentView,
      meta: { requiresAuth: true, role: 'student' }
    },
    // 정의되지 않은 모든 경로 → 로그인으로
    {
      path: '/:pathMatch(.*)*',
      redirect: '/login'
    }
  ]
})

/**
 * Firebase Auth 상태가 준비될 때까지 기다리는 헬퍼
 * onAuthStateChanged는 비동기이므로 최초 1회만 resolve
 */
const getCurrentUser = () => {
  return new Promise((resolve, reject) => {
    // 이미 초기화된 경우 즉시 반환
    const unsubscribe = auth.onAuthStateChanged(user => {
      unsubscribe()
      resolve(user)
    }, reject)
  })
}

/**
 * Firestore에서 사용자 역할을 검증하는 헬퍼
 * 클라이언트 단의 role 판단을 서버 데이터로 교차 검증
 */
const verifyUserRole = async (user) => {
  if (!user) return null

  const email = user.email || ''
  const loginId = email.split('@')[0].toLowerCase()

  // 관리자: 이메일 앞자리가 정확히 'admin'이어야 함
  if (loginId === 'admin') return 'admin'

  try {
    // Firestore DB에서 역할 확인 (클라이언트 조작 불가)
    const userDoc = await getDoc(doc(db, 'users', loginId))
    if (!userDoc.exists()) return null

    const userData = userDoc.data()
    const role = userData.role?.trim() ?? ''

    const teacherRoles = ['교사', '담임', '학년부장', '교감', '교장', '부장교사']

    if (
      loginId.startsWith('t') ||
      teacherRoles.includes(role) ||
      role.includes('교사') ||
      role.includes('담임')
    ) {
      return 'teacher'
    }

    if (role === '학생') return 'student'

    return null
  } catch (e) {
    console.error('역할 검증 실패:', e)
    return null
  }
}

router.beforeEach(async (to, from, next) => {
  const user = await getCurrentUser()

  // ── 1. 인증이 필요 없는 페이지(로그인) ──────────────────────────────
  if (to.meta.requiresGuest) {
    // 이미 로그인된 상태면 역할에 맞는 페이지로 리다이렉트
    if (user) {
      const role = await verifyUserRole(user)
      if (role === 'admin') return next('/admin')
      if (role === 'teacher') return next('/teacher')
      if (role === 'student') return next('/student')
    }
    return next()
  }

  // ── 2. 인증이 필요한 페이지 ────────────────────────────────────────
  if (to.meta.requiresAuth) {
    // 2-a. 비로그인 → 로그인 페이지
    if (!user) {
      return next({ name: 'login', query: { redirect: to.fullPath } })
    }

    // 2-b. 비밀번호 변경 페이지는 로그인만 되어 있으면 통과
    if (to.name === 'change-password') {
      return next()
    }

    // 2-c. 역할 기반 접근 제어 (Firestore 교차 검증)
    if (to.meta.role) {
      const actualRole = await verifyUserRole(user)

      if (actualRole !== to.meta.role) {
        // 역할 불일치 → 자신의 페이지로 강제 이동
        console.warn(`[Router] 권한 없음: ${user.email} → ${to.path}`)
        if (actualRole === 'admin') return next('/admin')
        if (actualRole === 'teacher') return next('/teacher')
        if (actualRole === 'student') return next('/student')
        // 역할 자체가 없으면 로그아웃 처리
        await auth.signOut()
        return next('/login')
      }
    }

    return next()
  }

  // ── 3. meta가 없는 기타 경로 ────────────────────────────────────────
  next()
})

export default router