<template>
  <div class="bg-white rounded-xl shadow p-8 space-y-8">
    <div>
      <h2 class="text-xl font-bold text-gray-800 mb-4 flex items-center">
        <span class="mr-2">⚙️</span> 시스템 API 설정
      </h2>
      <p class="text-sm text-gray-500 mb-6">
        Firebase 프로젝트 정보와 Gemini API 키를 설정합니다. 변경 시 앱이 새로고침됩니다.
      </p>
    </div>

    <div class="space-y-4">
      <h3 class="text-md font-bold text-blue-600 border-b pb-2">Firebase Configuration</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div v-for="(val, key) in config.firebase" :key="key">
          <label class="block text-xs font-semibold text-gray-600 mb-1 uppercase">{{ key }}</label>
          <input 
            v-model="config.firebase[key]" 
            type="text" 
            class="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono"
          />
        </div>
      </div>
    </div>

    <div class="space-y-4">
      <h3 class="text-md font-bold text-green-600 border-b pb-2">Gemini AI API Key</h3>
      <div>
        <label class="block text-xs font-semibold text-gray-600 mb-1">VITE_GEMINI_API_KEY</label>
        <input 
          v-model="config.geminiApiKey" 
          type="password" 
          class="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none font-mono"
          placeholder="AIzaSy..."
        />
      </div>
    </div>

    <div class="flex justify-end space-x-3 pt-4 border-t">
      <button @click="resetToDefault" class="px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
        기본값(env)으로 초기화
      </button>
      <button @click="saveSettings" class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-md transition-all">
        설정 저장 및 적용
      </button>
    </div>
  </div>
</template>

<script setup>
import { reactive, onMounted } from 'vue';

const config = reactive({
  firebase: {
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: '',
    measurementId: ''
  },
  geminiApiKey: ''
});

onMounted(() => {
  // 현재 적용된 설정 불러오기
  const savedFb = localStorage.getItem('custom_firebase_config');
  const savedGemini = localStorage.getItem('custom_gemini_key');

  if (savedFb) {
    config.firebase = JSON.parse(savedFb);
  } else {
    // env 값들로 초기화 (시각적 표시용)
    config.firebase.apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
    config.firebase.authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
    config.firebase.projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
    config.firebase.storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET;
    config.firebase.messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID;
    config.firebase.appId = import.meta.env.VITE_FIREBASE_APP_ID;
    config.firebase.measurementId = import.meta.env.VITE_FIREBASE_MEASUREMENT_ID;
  }
  
  config.geminiApiKey = savedGemini || import.meta.env.VITE_GEMINI_API_KEY;
});

const saveSettings = () => {
  if (confirm('설정을 저장하고 앱을 재시작하시겠습니까?')) {
    localStorage.setItem('custom_firebase_config', JSON.stringify(config.firebase));
    localStorage.setItem('custom_gemini_key', config.geminiApiKey);
    window.location.reload(); // 설정 적용을 위해 새로고침
  }
};

const resetToDefault = () => {
  if (confirm('모든 커스텀 설정을 지우고 .env 설정으로 돌아가시겠습니까?')) {
    localStorage.removeItem('custom_firebase_config');
    localStorage.removeItem('custom_gemini_key');
    window.location.reload();
  }
};
</script>