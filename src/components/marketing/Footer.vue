<script setup>
const currentYear = new Date().getFullYear();
</script>

<template>
  <footer class="bg-[#f8f9fa] pt-12 pb-6 px-8 text-[#5d6d7e] border-t border-[#eef2f6] mt-auto">
    <div class="max-w-7xl mx-auto">
      <div class="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr] gap-12 mb-8">
        <div class="brand-column">
          <div class="logo">
            <span class="font-bold text-2xl text-[#2c3e50] block mb-4">Lumira AI</span>
          </div>
          <p class="leading-relaxed max-w-[300px]">
            Empowering doctors with AI-driven precision for early breast cancer detection.
          </p>
        </div>

        <div class="link-column">
          <h4 class="text-[#2c3e50] mb-5 text-lg font-bold">Product</h4>
          <ul class="list-none p-0">
            <li class="mb-3"><a href="#features" class="no-underline text-[#5d6d7e] transition-colors hover:text-[#0099ff]">Key Features</a></li>
            <li class="mb-3"><a href="#how-it-works" class="no-underline text-[#5d6d7e] transition-colors hover:text-[#0099ff]">How It Works</a></li>
            <li class="mb-3"><a href="#pricing" class="no-underline text-[#5d6d7e] transition-colors hover:text-[#0099ff]">Pricing</a></li>
          </ul>
        </div>

        <div class="link-column">
          <h4 class="text-[#2c3e50] mb-5 text-lg font-bold">Support</h4>
          <ul class="list-none p-0">
            <li class="mb-3"><a href="#" class="no-underline text-[#5d6d7e] transition-colors hover:text-[#0099ff]">Help Center</a></li>
            <li class="mb-3"><a href="#" class="no-underline text-[#5d6d7e] transition-colors hover:text-[#0099ff]">Contact Us</a></li>
            <li class="mb-3"><a href="#" class="no-underline text-[#5d6d7e] transition-colors hover:text-[#0099ff]">Privacy Policy</a></li>
          </ul>
        </div>
      </div>

      <hr class="border-0 border-t border-[#e0e0e0] my-4" />

      <div class="flex justify-between items-center text-sm pt-4">
        <p>&copy; {{ currentYear }} Lumira AI. All rights reserved.</p>
        <div class="flex gap-6 font-medium cursor-pointer">
          <span>Instagram</span>
          <span>Twitter</span>
          <span>LinkedIn</span>
        </div>
      </div>
    </div>
  </footer>
</template>
