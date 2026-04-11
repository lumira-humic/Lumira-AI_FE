<script setup>
import iconAiLumira from '@/assets/images/lumira-logo-img.png'

const productLinks = [
  { name: 'Key Features', href: '#' },
  { name: 'How It Works', href: '#' },
  { name: 'Pricing', href: '#' },
]

const supportLinks = [
  { name: 'Help Center', href: '#' },
  { name: 'Contact Us', href: '#' },
  { name: 'Privacy Policy', href: '#' },
]

const socialLinks = [
  { name: 'Instagram', href: '#' },
  { name: 'Twitter', href: '#' },
  { name: 'LinkedIn', href: '#' },
]
</script>


<template>
  <footer class="bg-[#2E2E2E] text-white py-12 font-sans">
    <div class="max-w-7xl mx-auto px-6 lg:px-8">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-8 mb-12">
        <!-- Logo & Description -->
        <div class="md:col-span-2 flex items-start gap-8 pr-0 md:pr-12">
          <div>
            <img :src="iconAiLumira" alt="Lumira AI Logo" class="h-fit w-40 object-contain" />
          </div>
          <div class="space-y-4">
            <p class="text-gray-200 text-lg leading-relaxed mb-6">
              Integrasi model AI medis dari Google DeepMind untuk memberikan second opinion klinis yang akurat dan kontekstual.
            </p>
            <p class="text-gray-200 text-lg">
              Lumira AI x PT Dutormasi Membangun Indonesia
            </p>
          </div>
        </div>
        <!-- Product -->
        <div>
          <h3 class="text-2xl font-medium mb-3">Product</h3>
          <ul class="space-y-1">
            <li v-for="link in productLinks" :key="link.name">
              <a :href="link.href" class="text-gray-300 hover:text-white text-lg transition-colors duration-200">
                {{ link.name }}
              </a>
            </li>
          </ul>
        </div>
        <!-- Support -->
        <div>
          <h3 class="text-2xl font-medium mb-3">Support</h3>
          <ul class="space-y-1">
            <li v-for="link in supportLinks" :key="link.name">
              <a :href="link.href" class="text-gray-300 hover:text-white text-lg transition-colors duration-200">
                {{ link.name }}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <hr class="border-gray-500 mb-8" />

      <!-- Copyright -->
      <div class="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
        <p class="text-gray-200 text-base">
          &copy; 2026 Lumira AI. All rights reserved.
        </p>
        
        <div class="flex space-x-8">
          <a 
            v-for="social in socialLinks" 
            :key="social.name" 
            :href="social.href" 
            class="text-gray-200 hover:text-white text-base transition-colors duration-200"
          >
            {{ social.name }}
          </a>
        </div>
      </div>
      
    </div>
  </footer>
</template>