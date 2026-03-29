<script setup>
defineProps(['agreement', 'note']);
defineEmits(['update:agreement', 'update:note']);
</script>

<template>
    <div class="bg-gray-100 rounded-xl p-6 border border-slate-200 flex flex-col md:flex-row gap-6">
        <div class="flex-1">
            <h3 class="font-bold text-slate-700 mb-4 text-lg">Doctor's Diagnosis</h3>
            <div class="flex items-center gap-4 text-sm font-bold text-slate-500">
                <span>Agree With AI Diagnosis?</span>

                <label class="flex items-center gap-2 cursor-pointer">
                    <input type="radio" value="agree" :checked="agreement === 'agree'"
                        @change="$emit('update:agreement', 'agree')" class="accent-green-500 w-5 h-5">
                    <span :class="agreement === 'agree' ? 'text-green-600' : ''">Agree</span>
                </label>

                <label class="flex items-center gap-2 cursor-pointer">
                    <input type="radio" value="disagree" :checked="agreement === 'disagree'"
                        @change="$emit('update:agreement', 'disagree')" class="accent-red-500 w-5 h-5">
                    <span :class="agreement === 'disagree' ? 'text-red-600' : ''">Disagree</span>
                </label>
            </div>
        </div>

        <div class="flex-[2] flex gap-4">
            <label class="font-bold text-slate-700 whitespace-nowrap mt-2">Add Note</label>
            <textarea :value="note" @input="$emit('update:note', $event.target.value)"
                class="w-full h-24 p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#0099ff] outline-none resize-none bg-white"
                placeholder="Type Here.."></textarea>
        </div>
    </div>
</template>