<script setup>
import { ref } from 'vue';

import Header from '@/components/marketing/Header.vue';
import Footer from '@/components/marketing/Footer.vue';
import LoginModal from '@/components/auth/LoginModal.vue';


const showLogin = ref(false);
</script>

<template>
  <div class="flex flex-col min-h-screen">
    <Header @open-login="showLogin = true" />
    <main class="flex-1">
      <router-view v-slot="{ Component }">
        <component :is="Component" @open-login="showLogin = true" />
      </router-view>
    </main>
    <Footer />

    <LoginModal v-if="showLogin" @close="showLogin = false" />
  </div>
</template>
