<script setup>
// No script logic needed yet
</script>

<template>
  <nav class="navbar" position="sticky" top="0">
    <div class="container">
      <div class="logo">
        <img src="@/assets/images/lumira-logo.png" alt="Lumira AI" class="logo-img" style="width: 100%; height: 100%;" />
        <!-- <span class="logo-text">Lumira AI</span> -->
      </div>

      <ul class="nav-links">
        <li><a href="#features">Key Features</a></li>
        <li><a href="#how-it-works">How It Works</a></li>
        <li><a href="#why-us">Why Choose Us?</a></li>
      </ul>

      <button 
        @click="$emit('open-login')"
        class="bg-[#0099ff] text-white px-6 py-2.5 rounded-full font-bold hover:bg-[#007acc] transition-colors cursor-pointer"
      >
        Login
      </button>
    </div>
  </nav>
</template>

<style scoped>
.navbar {
  position: sticky;
  top: 0;
  z-index: 1000;
  background: white;
  padding: 1rem 0; /* Reduced vertical padding slightly for a sleeker look */
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}

.container {
  display: flex;
  align-items: center; /* Vertically centers everything */
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem; /* Adds safe space on left/right edges */
}

/* 1. THE LOGO: Stays on the left */
.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: bold;
  font-size: 1.5rem;
  color: #333;
  width: 150px; /* Fixed width ensures the logo doesn't shift the center balance */
}

.logo-img {
  height: 40px; /* Ensures logo fits nicely */
}

/* 2. THE NAV LINKS: Takes up all middle space & Centers itself */
.nav-links {
  display: flex;
  flex: 1;               /* MAGIC LINE: Takes up all empty space between logo and button */
  justify-content: center; /* MAGIC LINE: Centers the items inside that space */
  gap: 60px;             /* INCREASED GAP: Spreads the words apart more evenly */
  list-style: none;
  margin: 0;
  padding: 0;
}

.nav-links a {
  text-decoration: none;
  color: #555;
  font-weight: 600;
  font-size: 1rem;
  transition: color 0.3s ease;
}

.nav-links a:hover {
  color: #0099ff;
}

/* 3. THE BUTTON: Stays on the right */
.btn-login {
  background-color: #0099ff;
  color: white;
  padding: 0.7rem 2rem;
  border-radius: 30px;
  text-decoration: none;
  font-weight: bold;
  transition: all 0.3s ease;
  width: 150px; /* Match logo width to ensure perfect center balance */
  text-align: center;
  display: inline-block;
}

.btn-login:hover {
  background-color: #007acc;
  transform: translateY(-2px); /* nice little lift effect */
  box-shadow: 0 4px 12px rgba(0, 153, 255, 0.3);
}
</style>