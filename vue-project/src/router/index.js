// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { auth } from '@/firebase'
import { useUserStore } from '@/stores/userStore' // 스토어 임포트

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/login' },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { requiresGuest: true }
    },
    {
      path: '/change-password',
      name: 'change-password',
      component: () => import('../views/ChangePasswordView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('../views/AdminView.vue'),
      meta: { requiresAuth: true, role: 'admin' }
    },
    {
      path: '/teacher',
      name: 'teacher',
      component: () => import('../views/TeacherView.vue'),
      meta: { requiresAuth: true, role: 'teacher' }
    },
    {
      path: '/student',
      name: 'student',
      component: () => import('../views/StudentView.vue'),
      meta: { requiresAuth: true, role: 'student' }
    },
    { path: '/:pathMatch(.*)*', redirect: '/login' }
  ]
})

/**
 * 💡 라우터 가드 (Navigation Guard)
 */
router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore();

  // 1. 초기 인증 상태 복구 대기 (App.vue에서 처리하지만 한 번 더 안전장치)
  // 인증 체크가 끝날 때까지 잠시 대기해야 새로고침 시 튕기지 않습니다.
  const waitForAuth = () => {
    return new Promise((resolve) => {
      if (userStore.isAuthReady) return resolve();
      const unwatch = watch(() => userStore.isAuthReady, (ready) => {
        if (ready) { unwatch(); resolve(); }
      });
    });
  };

  // 파이어베이스 현재 세션 유저 확인
  const firebaseUser = auth.currentUser;

  // ── A. 로그인 페이지 접근 (requiresGuest) ────────────────────────
  if (to.meta.requiresGuest) {
    if (firebaseUser && userStore.currentUser.role) {
      // 이미 로그인된 상태라면 역할에 맞춰 리다이렉트 (로그아웃 루프 방지)
      const role = userStore.currentUser.role === '학생' ? 'student' : 
                   (userStore.currentUser.role === '관리자' || userStore.currentUser.userKey === 'admin' ? 'admin' : 'teacher');
      return next(`/${role}`);
    }
    return next();
  }

  // ── B. 인증이 필요한 페이지 (requiresAuth) ───────────────────────
  if (to.meta.requiresAuth) {
    // 로그인이 안 되어 있으면 로그인으로
    if (!firebaseUser) {
      return next('/login');
    }

    // 비밀번호 변경은 로그인만 되어있으면 통과
    if (to.name === 'change-password') return next();

    // 💡 역할 검증 (스토어에 저장된 role 활용)
    const userRole = userStore.currentUser.role;
    const userKey = userStore.currentUser.userKey;

    // 관리자 판단 (ID가 admin이거나 역할이 관리자인 경우)
    const isAdmin = userKey === 'admin' || userRole === '관리자';
    // 교사 판단
    const isTeacher = userRole === '교사' || userRole?.includes('담임') || userRole?.includes('부장');
    // 학생 판단
    const isStudent = userRole === '학생';

    const actualRolePath = isAdmin ? 'admin' : (isTeacher ? 'teacher' : (isStudent ? 'student' : null));

    if (to.meta.role) {
      if (to.meta.role !== actualRolePath) {
        console.warn(`[Router] 권한 불일치: ${to.path} 접근 시도`);
        return next(actualRolePath ? `/${actualRolePath}` : '/login');
      }
    }
    return next();
  }

  next();
});

export default router