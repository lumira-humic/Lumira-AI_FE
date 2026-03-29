<script setup>
import { ref } from "vue";
import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import { z } from "zod";
import { useRouter, useRoute } from "vue-router";
import { authService } from "@/services/authService";
import { useAppStore } from "@/stores/appStore";

const emit = defineEmits(["close"]);
const router = useRouter();
const route = useRoute();
const appStore = useAppStore();

const loginSchema = toTypedSchema(
  z.object({
    email: z.string().min(1, "Email is required").email("Invalid email format"),
    password: z.string().min(1, "Password is required"),
  }),
);

const { handleSubmit, defineField, errors, isSubmitting } = useForm({
  validationSchema: loginSchema,
});

const [email, emailAttrs] = defineField("email");
const [password, passwordAttrs] = defineField("password");
const showPassword = ref(false);
const authError = ref("");

const handleClose = () => {
  emit("close");
  if (route.name === "login") {
    router.push("/");
  }
};

const handleLogin = handleSubmit(async (values) => {
  authError.value = "";

  try {
    const { role, userDetails, session } = await authService.login(
      values.email,
      values.password,
    );

    appStore.setSession({
      token: session?.access_token || "",
      user: {
        ...userDetails,
        role,
        email: values.email,
        name: userDetails.name || values.email.split("@")[0],
      },
    });

    emit("close");

    if (role === "admin") {
      router.push("/admin");
    } else if (role === "doctor") {
      router.push("/doctor/dashboard");
    } else {
      router.push("/");
    }
  } catch (error) {
    console.error("Login failed:", error);
    authError.value = error.message || "Invalid credentials or login failed.";
  }
});

const togglePassword = () => {
  showPassword.value = !showPassword.value;
};
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center px-4">
    <div
      class="absolute inset-0 bg-black/50 backdrop-blur-sm"
      @click="handleClose"
    ></div>
    <div
      class="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md relative z-10 animate-fade-in-up"
    >
      <button
        @click="handleClose"
        class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="w-6 h-6"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      <h1 class="text-2xl font-bold text-gray-800 text-center mb-8">Login</h1>

      <div
        v-if="authError"
        class="mb-4 p-3 bg-red-50 text-red-500 text-sm rounded-lg border border-red-200 text-center"
      >
        {{ authError }}
      </div>

      <form @submit.prevent="handleLogin" class="space-y-6">
        <div class="space-y-2">
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

        <div class="space-y-2">
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
              <svg
                v-if="!showPassword"
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
                  d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
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

        <button
          type="submit"
          :disabled="isSubmitting"
          class="w-full bg-sky-500 hover:bg-sky-600 disabled:bg-sky-300 text-white font-bold py-3 rounded-full transition-colors cursor-pointer mt-8 shadow-md hover:shadow-lg flex justify-center items-center"
        >
          <span v-if="isSubmitting">Logging in...</span>
          <span v-else>Get in</span>
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
