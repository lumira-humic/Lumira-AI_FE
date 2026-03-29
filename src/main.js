import './style.css'
import { createApp } from 'vue'
import { VueQueryPlugin } from '@tanstack/vue-query'
import VueKonva from 'vue-konva'

import App from './App.vue'
import router from './router'
import { pinia } from './lib/pinia'
import { queryClient } from './lib/queryClient'
import { useAppStore } from './stores/appStore'


const app = createApp(App)
const appStore = useAppStore(pinia)

appStore.hydrateSession()
appStore.setFeatureToggles({
	chatEnabled: import.meta.env.VITE_FEATURE_CHAT_ENABLED === 'true',
	medgemmaEnabled: import.meta.env.VITE_FEATURE_MEDGEMMA_ENABLED === 'true',
})

app.use(pinia)
app.use(router)
app.use(VueKonva)
app.use(VueQueryPlugin, { queryClient })
app.mount('#app')