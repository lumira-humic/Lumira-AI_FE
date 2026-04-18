<script setup>
const emit = defineEmits(["open-login"])

const handleStartNow = () => {
  emit("open-login")
}
</script>

<template>
  <div class="w-full relative overflow-x-hidden">
    <!-- Hero Section (Highest Z-Index for text visibility) -->
    <section class="relative pt-20 pb-32 bg-linear-to-r from-[#9AD7FD] to-[#C3E8FF] overflow-visible">
      <div class="max-w-378 mx-auto px-6 sm:px-8 xl:px-11 relative grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] items-center">
        <!-- Left Content -->
        <div class="flex flex-col items-start lg:ml-26 z-30 bg-linear-to-r from-[#9AD7FD] to-[#e0f3ff5d] rounded-xl">
          <div
            class="inline-flex items-center gap-2 bg-[#0093EE] text-white px-4 py-2 rounded-full font-semibold mb-6">
            <img src="@/assets/icons/eos-icons_ai.svg" alt="AI Hero Icon" class="w-7 h-7 object-contain" />
            <span class="text-base sm:text-lg">Powered By AI</span>
          </div>  
          <h1 class="text-3xl sm:text-5xl xl:text-[64px] font-semibold text-white leading-tight mb-2">
            Early Detection of <br />
            Breast Cancer with <br />
            AI Technology
          </h1>
          <p class="text-white text-base sm:text-lg xl:text-xl leading-relaxed mb-8">
            An AI-based mammogram analysis system that helps doctors provide more accurate and faster diagnoses for breast cancer treatment.
          </p>
          <button
            @click="handleStartNow"
            class="text-base sm:text-xl xl:text-3xl bg-[#0093EE] hover:bg-white text-white hover:text-[#0093EE] hover:ring-none ring-2 ring-white px-10 py-3 rounded-xl font-semibold transition-colors duration-300 cursor-pointer">
            Start Now!
          </button>
        </div>
        <!-- Right Content -->
        <div class="hidden lg:block"></div>
        <!-- Elips Background -->
        <div class="hidden lg:block absolute -top-5 right-0 w-40 z-10 pointer-events-none">
          <img src="@/assets/icons/elips-half-icon.svg" alt="Half Circle" class="w-full h-auto" />
        </div>
      </div>
    </section>
    <!-- Key Features Section (Middle Z-Index) -->
    <section id="features" class="relative py-30 bg-linear-to-r from-[#4CBBFF] to-[#E2F4FF] z-20 mt-8 overflow-visible">
      <div class="max-w-378 mx-auto px-6 sm:px-8 xl:px-11 relative z-10">
        <!-- Doctor Image (Overlaying Hero and Features and How It Works) -->
        <div class="hidden lg:block absolute -bottom-38 right-0 w-190 z-1 pointer-events-none">
          <img src="@/assets/images/doctor.png" alt="Doctor" class="w-full h-auto" />
        </div>
        <!-- Header -->
        <div class="mb-12 text-center relative z-20">
          <h2 class="text-xl sm:text-2xl xl:text-4xl font-semibold text-neutral-800 mb-2">Key Features</h2>
          <p class="text-sm sm:text-lg xl:text-xl text-neutral-700">
            Leading-edge technology for better diagnosis
          </p>
        </div>
        <!-- Cards -->
        <div class="flex flex-wrap lg:flex-nowrap gap-6 sm:gap-12 justify-center items-center relative z-20">
          <!-- AI Analysis Card -->
          <div
            class="group bg-white hover:bg-[#0093EE] border-2 border-neutral-300 hover:border-neutral-100 rounded-xl p-4 sm:px-8 sm:py-8 max-w-105 flex flex-col items-center text-center duration-700">
            <div class="w-16 h-16 sm:w-26 sm:h-26 xl:w-32 xl:h-32">
              <img src="@/assets/images/ai-vector.png" alt="AI Analysis" class="w-full h-full object-contain group-hover:invert group-hover:brightness-0 group-hover:contrast-700" />
            </div>
            <h3 class="text-xl sm:text-xl lg:text-4xl font-bold text-neutral-700 group-hover:text-white mb-3 sm:mb-4">AI Analysis</h3>
            <p class="text-neutral-500 group-hover:text-white text-base lg:text-2xl leading-relaxed">
              Deep learning algorithms analyze ultrasound images with exceptional
              accuracy to aid in early detection.
            </p>
          </div>
          <!-- Doctor Review Card -->
          <div
            class="group bg-white hover:bg-[#0093EE] border-2 border-neutral-300 hover:border-neutral-200 rounded-xl p-4 xl:px-8 xl:py-8 w-full max-w-105 flex flex-col items-center text-center duration-700">
            <div class="w-14 h-14 sm:w-24 sm:h-24 xl:w-30 xl:h-30 mb-1 sm:mb-4">
              <img src="@/assets/images/doctor-vector.png" alt="Doctor Review" class="w-full h-full object-contain group-hover:invert group-hover:brightness-0 group-hover:contrast-700" />
            </div>
            <h3 class="text-xl sm:text-xl lg:text-4xl font-bold text-neutral-700 group-hover:text-white mb-3 sm:mb-4">Doctor Review</h3>
            <p class="text-neutral-500 group-hover:text-white text-base lg:text-2xl leading-relaxed">
              Every AI insight is strictly reviewed by specialist doctors to
              ensure diagnosis accuracy and safety.
            </p>
          </div>
        </div>
      </div>
    </section>
    <!-- How It Work Section (Lower Z-Index) -->
    <section id="how-it-works" class="relative py-26 bg-linear-to-b from-[#4CBBFF] to-[#E2F4FF] z-10 mt-8">
      <div class="max-w-378 mx-auto px-11">
        <!-- Header -->
        <div class="mb-10 text-center">
          <h2 class="text-xl sm:text-2xl xl:text-4xl font-semibold text-neutral-800 mb-2">How It Works</h2>
          <p class="text-sm sm:text-lg xl:text-xl text-neutral-700">
            A simple process for an accurate diagnosis
          </p>
        </div>
        <!-- Main Content -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <!-- Step 1 -->
          <div class="flex flex-col items-center text-center">
            <div
              class="w-18 h-18 bg-[#0093EE] text-white rounded-full flex items-center justify-center font-bold text-2xl mb-6">
              1
            </div>
            <h4 class="text-neutral-700 font-bold text-lg sm:text-xl xl:text-2xl mb-2">Image Upload</h4>
            <p class="text-neutral-600 text-sm sm:text-base xl:text-lg leading-relaxed max-w-50">
              The admin uploads the patient's mammogram image to the system
            </p>
          </div>
          <!-- Step 2 -->
          <div class="flex flex-col items-center text-center">
            <div
              class="w-18 h-18 bg-[#0093EE] text-white rounded-full flex items-center justify-center font-bold text-2xl mb-6">
              2
            </div>
            <h4 class="text-neutral-700 font-bold text-lg sm:text-xl xl:text-2xl mb-2">AI Analysis</h4>
            <p class="text-neutral-600 text-sm sm:text-base xl:text-lg leading-relaxed max-w-50">
              The AI ​​analyzes the image and predicts the cancer stage
            </p>
          </div>
          <!-- Step 3 -->
          <div class="flex flex-col items-center text-center">
            <div
              class="w-18 h-18 bg-[#0093EE] text-white rounded-full flex items-center justify-center font-bold text-2xl mb-6">
              3
            </div>
            <h4 class="text-neutral-700 font-bold text-lg sm:text-xl xl:text-2xl mb-2">Doctor Review</h4>
            <p class="text-neutral-600 text-sm sm:text-base xl:text-lg leading-relaxed max-w-50">
              The doctor reviews the AI results and provides a final diagnosis
            </p>
          </div>
          <!-- Step 4 -->
          <div class="flex flex-col items-center text-center">
            <div
              class="w-18 h-18 bg-[#0093EE] text-white rounded-full flex items-center justify-center font-bold text-2xl mb-6 shadow-md">
              4
            </div>
            <h4 class="text-neutral-700 font-bold text-lg sm:text-xl xl:text-2xl mb-2">Treatment Plan</h4>
            <p class="text-neutral-600 text-sm sm:text-base xl:text-lg leading-relaxed max-w-50">
              The doctor provides appropriate treatment recommendations
            </p>
          </div>
        </div>
      </div>
    </section>
    <!-- Why Us Section (Unchanged mostly, just fixing z-index references if needed to be safe) -->
    <section id="why-us" class="relative py-20 bg-white z-30">
      <div class="max-w-378 mx-auto px-6 sm:px-8 xl:px-11 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <!-- List Content -->
        <div>
          <h2 class="text-xl sm:text-2xl xl:text-4xl text-center font-semibold text-neutral-800 mb-8">Why Choose Us?</h2>
          <ul class="space-y-8">
            <li class="flex flex-col gap-2">
              <div class="flex items-center gap-4">
                <div class="w-4 h-4 sm:h-6 sm:w-6 bg-[#0093EE] rounded-full"></div>
                <strong class="block text-xl sm:text-2xl text-neutral-700">More Accurate Early Detection</strong>
              </div>
              <p class="text-neutral-600 text-base sm:text-lg">
                AI helps detect signs of cancer that the human eye might miss
              </p>
            </li>
            <li class="flex flex-col gap-2">
              <div class="flex items-center gap-4">
                <div class="w-4 h-4 sm:h-6 sm:w-6 bg-[#0093EE] rounded-full"></div>
                <strong class="block text-xl sm:text-2xl text-neutral-700">Faster Diagnosis</strong>
              </div>
              <p class="text-neutral-600 text-base sm:text-lg">
                Automated analysis saves time for faster treatment
              </p>
            </li>
            <li class="flex flex-col gap-2">
              <div class="flex items-center gap-4">
                <div class="w-4 h-4 sm:h-6 sm:w-6 bg-[#0093EE] rounded-full"></div>
                <strong class="block text-xl sm:text-2xl text-neutral-700">Doctor & AI Collaboration</strong>
              </div>
              <p class="text-neutral-600 text-base sm:text-lg">
                Combining doctor expertise and AI intelligence for optimal results
              </p>
            </li>
          </ul>
        </div>
        <!-- Image  -->
        <div class="flex justify-center">
          <img src="@/assets/images/lumira-logo-img.png" alt="Lumira Logo" class="w-4/5 h-auto object-contain" />
        </div>
      </div>
    </section>
  </div>
</template>