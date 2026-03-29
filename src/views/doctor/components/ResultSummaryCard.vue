<script setup>
defineProps({
    imageSrc: String,
    agreement: String,
    note: String,
    aiClassification: { type: String, default: 'Benign' }
});
</script>

<template>
    <div class="mt-10 animate-fade-in-up">
        <h2 class="text-2xl font-bold text-slate-700 mb-6">Result By Doctor</h2>
        <div class="bg-gray-100 rounded-3xl p-8 border border-slate-200 flex flex-col md:flex-row gap-8">

            <div class="w-64 h-64 bg-black rounded-xl overflow-hidden border-4 border-white shadow-sm shrink-0">
                <img :src="imageSrc" class="w-full h-full object-cover opacity-80" />
                <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div class="w-20 h-20 border-4 border-green-500 rounded-full"></div>
                </div>
            </div>

            <div class="flex-1 space-y-4">
                <div class="flex items-center gap-2">
                    <span class="font-bold text-slate-600">Agree With AI Diagnosis?</span>
                    <span class="font-bold" :class="agreement === 'agree' ? 'text-green-500' : 'text-red-500'">
                        {{ agreement === 'agree' ? 'Agree' : 'Disagree' }}
                    </span>
                </div>

                <div>
                    <span class="font-bold text-slate-600">Note:</span>
                    <p class="text-slate-500 text-sm mt-1 leading-relaxed">{{ note || "No notes added." }}</p>
                </div>

                <div>
                    <p class="font-bold text-slate-600 mb-2">Classification Result By AI</p>
                    <span class="bg-yellow-400 text-white px-6 py-2 rounded-lg font-bold shadow-md inline-block">
                        {{ aiClassification }}
                    </span>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.animate-fade-in-up {
    animation: fadeInUp 0.5s ease-out forwards;
}

@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>