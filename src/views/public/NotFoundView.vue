<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goHome = () => {
  router.push('/')
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-linear-to-br from-[#E2F4FF] via-[#C3E8FF] to-[#9AD7FD] px-6 py-12">
    <div class="max-w-md w-full bg-white/80 backdrop-blur-md border border-white/20 p-8 rounded-2xl shadow-2xl text-center flex flex-col items-center">
      <!-- Icon / Illus -->
      <div class="w-48 h-48 mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#0093EE" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full animate-bounce">
          <circle cx="12" cy="12" r="10" />
          <path d="M16 16s-1.5-2-4-2-4 2-4 2" />
          <line x1="9" y1="9" x2="9.01" y2="9" />
          <line x1="15" y1="9" x2="15.01" y2="9" />
        </svg>
      </div>

      <h1 class="text-6xl font-extrabold text-[#0093EE] tracking-tight mb-2">404</h1>
      <h2 class="text-2xl font-bold text-neutral-800 mb-4">Page Not Found</h2>
      <p class="text-neutral-600 mb-8 text-sm sm:text-base leading-relaxed">
        Maaf, halaman yang Anda cari tidak ditemukan. Periksa kembali URL atau kembali ke halaman utama.
      </p>

      <button
        @click="goHome"
        class="cursor-pointer px-8 py-3 bg-[#0093EE] hover:bg-[#007cc8] text-white font-bold rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105"
      >
        Kembali ke Beranda
      </button>
    </div>
  </div>
</template>
