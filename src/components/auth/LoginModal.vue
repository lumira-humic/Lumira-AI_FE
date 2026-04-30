<script setup>
import { ref } from "vue";
import { useForm } from "vee-validate";
import { useRouter, useRoute } from "vue-router";
import { X, Eye } from '@lucide/vue';

import { authService } from "@/services/authService";
import { useAppStore } from "@/stores/appStore";
import { getApiErrorMessage, getApiFieldErrors } from "@/lib/apiResponse";
import { loginSchema } from "@/lib/validation/auth.validation";
import { useToast } from "@/composables/useToast";
import { signIntoFirebaseAfterBackendLogin } from "@/composables/useFirebaseChatSession";


const emit = defineEmits(["close"]);
const router = useRouter();
const route = useRoute();
const appStore = useAppStore();
const toast = useToast();


const { handleSubmit, defineField, errors, isSubmitting } = useForm({
  validationSchema: loginSchema,
});

const [email, emailAttrs] = defineField("email");
const [password, passwordAttrs] = defineField("password");
const showPassword = ref(false);
const authError = ref("");
const backendFieldErrors = ref([]);

const handleClose = () => {
  emit("close");
  if (route.name === "login") {
    router.push("/");
  }
};

const handleLogin = handleSubmit(async (values) => {
  authError.value = "";
  backendFieldErrors.value = [];

  try {
    const { role, user, accessToken, refreshToken } = await authService.login(
      values.email,
      values.password,
    );

    appStore.setSession({
      accessToken,
      refreshToken,
      role,
      user,
    });

    try {
      await signIntoFirebaseAfterBackendLogin();
    } catch (firebaseErr) {
      // eslint-disable-next-line no-console
      console.warn("Firebase sign-in after login failed", firebaseErr);
    }

    emit("close");

    const redirectPath =
      typeof route.query.redirect === "string" ? route.query.redirect : "";

    if (redirectPath) {
      router.push(redirectPath);
      return;
    }

    if (role === "admin") {
      router.push("/admin");
    } else if (role === "doctor") {
      router.push("/doctor/dashboard");
    } else if (role === "patient") {
      router.push("/patient/dashboard");
    } else {
      router.push("/");
    }
  } catch (error) {
    backendFieldErrors.value = getApiFieldErrors(error);
    authError.value = getApiErrorMessage(
      error,
      "Invalid credentials or login failed.",
    );
    toast.error(authError.value);
  }
});

const togglePassword = () => {
  showPassword.value = !showPassword.value;
};
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center px-4">
    <!-- Background Layout -->
    <div
      class="absolute inset-0 bg-black/40 backdrop-blur-sm"
    >
    </div>
    <!-- Form -->
    <div
      class="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md relative z-10 animate-fade-in-up"
    >
      <!-- Close Button -->
      <button
        @click="handleClose"
        class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
      >
        <X class="w-6 h-6" />
      </button>
      <h1 class="text-lg sm:text-xl xl:text-2xl font-semibold text-gray-800 text-center mb-8">Login</h1>
      <!-- Error Global Message -->
      <div
        v-if="authError"
        class="mb-2 p-2 bg-red-50 text-red-500 text-sm rounded-lg border border-red-100"
      >
        {{ authError }}

        <ul v-if="backendFieldErrors.length > 0" class="mt-2 space-y-1 text-left text-xs">
          <li v-for="fieldError in backendFieldErrors" :key="`${fieldError.field}-${fieldError.message}`">
            - {{ fieldError.message }}
          </li>
        </ul>
      </div>
      <!-- Main Content -->
      <form @submit.prevent="handleLogin" class="space-y-6">
        <!-- Email  -->
        <div class="flex flex-col gap-2">
          <label class="text-gray-600 font-medium ml-1">Email</label>
          <input
            v-model="email"
            v-bind="emailAttrs"
            type="email"
            placeholder="Enter your email"
            class="w-full bg-gray-100 px-6 py-3 rounded-full focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
          />
          <p v-if="errors.email" class="text-red-500 text-xs ml-1">{{ errors.email }}</p>
        </div>
        <!-- Password -->
        <div class="flex flex-col gap-2">
          <label class="text-gray-600 font-medium ml-1">Password</label>
          <div class="relative">
            <input
              v-model="password"
              v-bind="passwordAttrs"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Enter your password"
              class="w-full bg-gray-100 px-6 py-3 rounded-full focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all pr-12"
            />
            <button
              type="button"
              @click="togglePassword"
              class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <Eye v-if="!showPassword" class="w-5 h-5" />
              <svg
                v-else
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="w-5 h-5"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                />
              </svg>
            </button>
          </div>
          <p v-if="errors.password" class="text-red-500 text-xs ml-1">{{ errors.password }}</p>
        </div>
        <!-- Action Button -->
        <button
          type="submit"
          :disabled="isSubmitting"
          class="cursor-pointer w-full bg-sky-500 hover:bg-sky-600 disabled:bg-sky-300 text-white font-bold py-3 rounded-full transition-colors mt-10 flex justify-center items-center disabled:cursor-not-allowed disabled:shadow-none"
        >
          <span v-if="isSubmitting">Logging in...</span>
          <span class="text-base sm:text-lg 2xl:text-xl font-semibold" v-else>Get in</span>
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.animate-fade-in-up {
  animation: fadeInUp 0.3s ease-out forwards;
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
