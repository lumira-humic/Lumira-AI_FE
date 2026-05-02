import { VueQueryPlugin } from '@tanstack/vue-query'
import { createApp } from 'vue'
import VueKonva from 'vue-konva'
import './style.css'

import App from './App.vue'
import { signIntoFirebaseAfterBackendLogin } from './composables/useFirebaseChatSession'
import { pinia } from './lib/pinia'
import { queryClient } from './lib/queryClient'
import router from './router'
import { authService } from './services/authService'
import { useAppStore } from './stores/appStore'


const app = createApp(App)
const appStore = useAppStore(pinia)

appStore.hydrateSession()
appStore.setFeatureToggles({
	chatEnabled: import.meta.env.VITE_FEATURE_CHAT_ENABLED === 'true',
	medgemmaEnabled: import.meta.env.VITE_FEATURE_MEDGEMMA_ENABLED === 'true',
})

if (appStore.isAuthenticated && !appStore.currentRole) {
	try {
		const profile = await authService.getUser()
		appStore.setProfile(profile)
	} catch (error) {
		appStore.clearSession()
	}
}

if (appStore.isAuthenticated) {
	signIntoFirebaseAfterBackendLogin().catch((err) => {
		// eslint-disable-next-line no-console
		console.warn('Firebase sign-in on app boot failed', err)
	})
}

window.addEventListener('auth:unauthorized', () => {
	appStore.clearSession()

	if (router.currentRoute.value.path !== '/login') {
		router.push({ path: '/login' })
	}
})

app.use(pinia)
app.use(router)
app.use(VueKonva)
app.use(VueQueryPlugin, { queryClient })
app.mount('#app')
