<script setup>
// No script logic needed
</script>

<template>
  <div class="w-full relative overflow-x-hidden">
    <!-- Hero Section (Highest Z-Index for text visibility) -->
    <section class="relative pt-20 pb-32 bg-blue-100 overflow-visible">
      <div class="max-w-[1200px] mx-auto px-8 relative grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] items-center">
        <div class="flex flex-col items-start z-30">
          <div
            class="inline-flex items-center gap-2 bg-[#0099ff] text-white px-5 py-2 rounded-full font-semibold mb-6 shadow-md">
            <span class="text-xl">🤖</span> Powered By AI
          </div>
          <h1 class="text-5xl font-extrabold text-slate-800 leading-tight mb-6">
            Early Detection of <br />
            Breast Cancer with <br />
            AI Technology
          </h1>
          <p class="text-slate-500 text-lg leading-relaxed mb-8 max-w-[90%]">
            A state-of-the-art ultrasound analysis system empowering doctors
            with faster, more accurate diagnostic insights.
          </p>
          <button
            class="bg-[#0099ff] text-white border-2 border-[#0099ff] px-10 py-3 rounded-lg font-bold text-lg hover:bg-blue-600 transition-colors duration-300">
            Start Now!
          </button>
        </div>

        <!-- Placeholder for grid layout -->
        <div class="hidden lg:block"></div>
      </div>
    </section>

    <!-- Key Features Section (Middle Z-Index) -->
    <section id="features" class="relative py-24 bg-white z-20 overflow-visible">
      <!-- Doctor Image (Overlaying Hero and Features and How It Works) -->
      <div class="hidden lg:block absolute bottom-0 right-[100px] w-[600px] z-0 pointer-events-none">
        <img src="@/assets/images/doctor.png" alt="Doctor" class="w-full h-auto" />
      </div>
      <div class="max-w-[1200px] mx-auto px-8 relative z-10">
        <!-- Centered Header -->
        <div class="mb-16 text-center">
          <h2 class="text-3xl font-bold text-slate-800 mb-2">Key Features</h2>
          <p class="text-slate-500">
            Cutting-edge technology enabling precise healthcare
          </p>
        </div>
        <!-- Centered Cards -->
        <div class="flex flex-wrap lg:flex-nowrap gap-8 justify-center items-center">
          <!-- AI Analysis Card -->
          <div
            class="bg-white border border-gray-200 rounded-xl p-8 w-full max-w-[320px] shadow-sm flex flex-col items-center text-center hover:shadow-md transition-shadow duration-300">
            <div class="w-16 h-16 mb-6">
              <img src="@/assets/images/ai-vector.png" alt="AI Analysis" class="w-full h-full object-contain" />
            </div>
            <h3 class="text-xl font-bold text-slate-800 mb-4">AI Analysis</h3>
            <p class="text-slate-500 text-sm leading-relaxed">
              Deep learning algorithms analyze ultrasound images with exceptional
              accuracy to aid in early detection.
            </p>
          </div>

          <!-- Doctor Review Card -->
          <div
            class="bg-white border border-gray-200 rounded-xl p-8 w-full max-w-[320px] shadow-sm flex flex-col items-center text-center hover:shadow-md transition-shadow duration-300">
            <div class="w-16 h-16 mb-6">
              <img src="@/assets/images/doctor-vector.png" alt="Doctor Review" class="w-full h-full object-contain" />
            </div>
            <h3 class="text-xl font-bold text-slate-800 mb-4">Doctor Review</h3>
            <p class="text-slate-500 text-sm leading-relaxed">
              Every AI insight is strictly reviewed by specialist doctors to
              ensure diagnosis accuracy and safety.
            </p>
          </div>
        </div>
      </div>
    </section>
    <!-- How It Works Section (Lower Z-Index) -->
    <section id="how-it-works" class="relative py-20 bg-gradient-to-b from-cyan-50 to-cyan-100 z-10">
      <div class="max-w-[1200px] mx-auto px-8">
        <div class="mb-16 text-center">
          <h2 class="text-3xl font-bold text-slate-800 mb-2">How It Works</h2>
          <p class="text-slate-500">
            A simple process for an accurate diagnosis
          </p>
        </div>

        <!-- 4 Column Grid, Centered -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <!-- Step 1 -->
          <div class="flex flex-col items-center text-center">
            <div
              class="w-16 h-16 bg-[#0099ff] text-white rounded-full flex items-center justify-center font-bold text-2xl mb-6 shadow-md">
              1
            </div>
            <h4 class="text-slate-800 font-bold text-xl mb-3">Upload Ultrasound</h4>
            <p class="text-slate-500 text-sm leading-relaxed max-w-[200px]">
              Securely upload patient ultrasound images to our encrypted
              platform for instant processing.
            </p>
          </div>

          <!-- Step 2 -->
          <div class="flex flex-col items-center text-center">
            <div
              class="w-16 h-16 bg-[#0099ff] text-white rounded-full flex items-center justify-center font-bold text-2xl mb-6 shadow-md">
              2
            </div>
            <h4 class="text-slate-800 font-bold text-xl mb-3">AI Processing</h4>
            <p class="text-slate-500 text-sm leading-relaxed max-w-[200px]">
              Our advanced deep learning algorithms analyze the images to
              identify potential abnormalities with high precision.
            </p>
          </div>

          <!-- Step 3 -->
          <div class="flex flex-col items-center text-center">
            <div
              class="w-16 h-16 bg-[#0099ff] text-white rounded-full flex items-center justify-center font-bold text-2xl mb-6 shadow-md">
              3
            </div>
            <h4 class="text-slate-800 font-bold text-xl mb-3">Expert Validation</h4>
            <p class="text-slate-500 text-sm leading-relaxed max-w-[200px]">
              A specialized radiologist reviews the AI-generated findings to
              verify accuracy and provide clinical context.
            </p>
          </div>

          <!-- Step 4 -->
          <div class="flex flex-col items-center text-center">
            <div
              class="w-16 h-16 bg-[#0099ff] text-white rounded-full flex items-center justify-center font-bold text-2xl mb-6 shadow-md">
              4
            </div>
            <h4 class="text-slate-800 font-bold text-xl mb-3">Actionable Result</h4>
            <p class="text-slate-500 text-sm leading-relaxed max-w-[200px]">
              Receive a detailed diagnostic report with clear, actionable
              insights to guide treatment decisions.
            </p>
          </div>
        </div>
      </div>
    </section>
    <!-- Why Us Section (Unchanged mostly, just fixing z-index references if needed to be safe) -->
    <section id="why-us" class="relative py-20 bg-white z-30">
      <div class="max-w-[1200px] mx-auto px-8 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div>
          <h2 class="text-3xl font-bold text-slate-800 mb-8">Why Choose Us?</h2>
          <ul class="space-y-8">
            <li class="flex gap-4">
              <div class="min-w-[16px] h-4 w-4 bg-[#0099ff] rounded-full mt-1.5"></div>
              <div>
                <strong class="block text-xl text-slate-800 mb-2">More Accurate Early Detection</strong>
                <p class="text-slate-500 text-base">
                  AI identifies subtle patterns potentially missed by the human eye, enhancing detection rates.
                </p>
              </div>
            </li>
            <li class="flex gap-4">
              <div class="min-w-[16px] h-4 w-4 bg-[#0099ff] rounded-full mt-1.5"></div>
              <div>
                <strong class="block text-xl text-slate-800 mb-2">Faster Diagnosis</strong>
                <p class="text-slate-500 text-base">
                  Automated screening significantly reduces analysis time, allowing for prompt medical attention.
                </p>
              </div>
            </li>
            <li class="flex gap-4">
              <div class="min-w-[16px] h-4 w-4 bg-[#0099ff] rounded-full mt-1.5"></div>
              <div>
                <strong class="block text-xl text-slate-800 mb-2">Doctor & AI Collaboration</strong>
                <p class="text-slate-500 text-base">
                  The perfect synergy of medical expertise and artificial intelligence for optimal patient care.
                </p>
              </div>
            </li>
          </ul>
        </div>

        <div class="flex justify-center">
          <img src="@/assets/images/lumira-logo-img.png" alt="Lumira Logo" class="w-4/5 h-auto object-contain" />
        </div>
      </div>
    </section>
  </div>
</template>
