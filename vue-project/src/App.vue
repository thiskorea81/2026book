<template>
  <div v-if="!userStore.isAuthReady" class="h-screen flex flex-col items-center justify-center bg-gray-50">
    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
    <p class="text-gray-500 font-bold animate-pulse">사용자 권한을 확인하고 있습니다...</p>
  </div>
  
  <router-view v-else />
</template>

<script setup>
import { onMounted } from 'vue';
import { auth, db } from '@/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useUserStore } from '@/stores/userStore';

const userStore = useUserStore();

onMounted(() => {
  // 💡 앱이 켜질 때 로그인 상태를 확인하여 스토어 복구
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const userId = user.email.split('@')[0];
      const userDoc = await getDoc(doc(db, "users", userId));
      
      if (userDoc.exists()) {
        userStore.currentUser = userDoc.data();
        // 필요 시 요약 정보까지 미리 로드
        await userStore.fetchMySummary();
      }
    }
    // 💡 정보 복구 완료! 이제 router-view를 보여줌
    userStore.isAuthReady = true;
  });
});
</script>

<style>
/* 전역 스타일 */
@import "tailwindcss";
body { @apply antialiased text-gray-900; }
</style>