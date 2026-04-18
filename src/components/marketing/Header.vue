<script setup>
import { Menu, X } from '@lucide/vue'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

const emit = defineEmits(['open-login'])

const SCROLL_THRESHOLD = 100
const MOBILE_BREAKPOINT = 640

const isScrolled = ref(false)
const isMobileMenuOpen = ref(false)

const handleScroll = () => {
  isScrolled.value = window.scrollY > SCROLL_THRESHOLD
}

const handleResize = () => {
  if (window.innerWidth >= MOBILE_BREAKPOINT) {
    isMobileMenuOpen.value = false
  }
}

const openLogin = () => {
  emit('open-login')
}

const openMobileMenu = () => {
  isMobileMenuOpen.value = true
}

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false
}

const handleEscape = (event) => {
  if (event.key === 'Escape') {
    closeMobileMenu()
  }
}

const handleMobileNavClick = () => {
  closeMobileMenu()
}

watch(isMobileMenuOpen, (isOpen) => {
  document.body.style.overflow = isOpen ? 'hidden' : ''
})

onMounted(() => {
  handleScroll()
  window.addEventListener('scroll', handleScroll, { passive: true })
  window.addEventListener('resize', handleResize)
  window.addEventListener('keydown', handleEscape)
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('keydown', handleEscape)
  document.body.style.overflow = ''
})
</script>

<template>
  <nav :class="['navbar', { 'navbar-scrolled': isScrolled }]">
    <div class="container">
      <a href="#" class="logo" aria-label="Go to top">
        <img src="@/assets/images/lumira-logo.png" alt="Lumira AI" class="logo-img" style="width: 100%; height: 100%;" />
      </a>

      <ul class="nav-links font-normal text-neutral-700">
        <li><a href="#features">Key Features</a></li>
        <li><a href="#how-it-works">How It Works</a></li>
        <li><a href="#why-us">Why Choose Us?</a></li>
      </ul>

      <button
        @click="openLogin"
        class="btn-login-desktop text-lg bg-[#0093EE] hover:bg-white text-white hover:text-[#0093EE] hover:ring-none ring-2 ring-white px-6 py-2.5 rounded-xl font-semibold transition-colors cursor-pointer"
      >
        Login
      </button>

      <div class="mobile-controls">
        <button
          @click="openLogin"
          class="text-sm bg-[#0093EE] hover:bg-white text-white hover:text-[#0093EE] ring-2 ring-white px-4 py-2 rounded-lg font-semibold transition-colors cursor-pointer"
        >
          Login
        </button>

        <button
          type="button"
          class="hamburger-btn"
          :aria-expanded="isMobileMenuOpen"
          aria-label="Open mobile navigation"
          @click="openMobileMenu"
        >
          <Menu :size="20" />
        </button>
      </div>
    </div>
  </nav>

  <Teleport to="body">
    <div
      class="mobile-menu-overlay"
      :class="{ open: isMobileMenuOpen }"
      @click="closeMobileMenu"
    ></div>

    <aside class="mobile-menu-panel" :class="{ open: isMobileMenuOpen }" @click.stop>
      <div class="mobile-menu-header">
        <a href="#" class="mobile-panel-logo" aria-label="Go to top" @click="handleMobileNavClick">
          <img src="@/assets/images/lumira-logo.png" alt="Lumira AI" class="mobile-panel-logo-img" />
        </a>
        <button type="button" class="mobile-close-btn" aria-label="Close mobile navigation" @click="closeMobileMenu">
          <X :size="20" />
        </button>
      </div>

      <ul class="mobile-nav-links">
        <li><a href="#features" @click="handleMobileNavClick">Key Features</a></li>
        <li><a href="#how-it-works" @click="handleMobileNavClick">How It Works</a></li>
        <li><a href="#why-us" @click="handleMobileNavClick">Why Choose Us?</a></li>
      </ul>
    </aside>
  </Teleport>
</template>

<style scoped>
.navbar {
  position: sticky;
  top: 0;
  z-index: 1000;
  padding: 0.9rem 0;
  background: transparent;
  transition: background-color 0.35s ease, box-shadow 0.35s ease, backdrop-filter 0.35s ease;
}

.navbar-scrolled {
  background: rgba(255, 255, 255, 0.82);
  box-shadow: 0 8px 14px rgba(20, 60, 90, 0.08);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.55);
}

.container {
  display: flex;
  align-items: center;
  max-width: 1512px;
  margin: 0 auto;
  padding: 0 43px;
}

.logo {
  display: flex;
  align-items: center;
  width: 200px;
}

.logo-img {
  height: 40px;
}

.nav-links {
  display: flex;
  flex: 1;
  justify-content: center;
  gap: 60px;
  list-style: none;
  margin: 0;
  padding: 0;
}

.nav-links a {
  text-decoration: none;
  transition: color 0.3s ease;
}

.nav-links a:hover {
  color: #0099ff;
}

.mobile-controls {
  display: none;
  align-items: center;
  gap: 0.6rem;
  margin-left: auto;
}

.hamburger-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 8px;
  border: 1px solid #0093EE;
  background: white;
  color: #0093EE;
  transition: background-color 0.25s ease, transform 0.25s ease;
  cursor: pointer;
}

.hamburger-btn:hover {
  background: #007fd0;
  color: white;
  transform: translateY(-1px);
}

.mobile-menu-overlay {
  position: fixed;
  inset: 0;
  background: rgba(5, 18, 33, 0.56);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.28s ease;
  z-index: 1200;
}

.mobile-menu-overlay.open {
  opacity: 1;
  pointer-events: auto;
}

.mobile-menu-panel {
  position: fixed;
  top: 0;
  right: 0;
  height: 100dvh;
  width: min(84vw, 340px);
  padding: 1rem 1.2rem 2rem;
  background: white;
  transform: translateX(100%);
  transition: transform 0.33s cubic-bezier(0.22, 1, 0.36, 1);
  z-index: 1201;
}

.mobile-menu-panel.open {
  transform: translateX(0);
}

.mobile-menu-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
}

.mobile-panel-logo {
  display: inline-flex;
  width: 128px;
}

.mobile-panel-logo-img {
  width: 100%;
  height: auto;
  object-fit: contain;
}

.mobile-close-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: 1px solid #0093ee;
  background: white;
  color: #0093ee;
  cursor: pointer;
  transition: background-color 0.25s ease, color 0.25s ease;
}

.mobile-close-btn:hover {
  background: #0093ee;
  color: white;
}

.mobile-nav-links {
  list-style: none;
  margin: 1rem 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.mobile-nav-links a {
  display: block;
  text-decoration: none;
  color: #0093EE;
  font-size: 1.1rem;
  font-weight: 600;
  padding: 0.50rem 1rem;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.08);
  transition: background-color 0.25s ease, transform 0.25s ease;
}

.mobile-nav-links a:hover {
  background: #0093EE18;
  transform: translateX(-2px);
}

@media (max-width: 639px) {
  .container {
    padding: 0 16px;
  }

  .logo {
    width: 120px;
  }

  .logo-img {
    object-fit: contain;
    width: 200px;
    height: 60px;
  }

  .nav-links,
  .btn-login-desktop {
    display: none;
  }

  .mobile-controls {
    display: flex;
  }
}

@media (min-width: 640px) {
  .mobile-menu-overlay,
  .mobile-menu-panel {
    display: none;
  }
}
</style>