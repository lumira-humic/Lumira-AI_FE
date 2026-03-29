# Lumira AI FE (JavaScript)

Frontend base workspace untuk integrasi API backend (tanpa Supabase logic di FE).

## Stack

- Vue 3 + Vite
- Vue Router
- Pinia
- Axios + Interceptor
- TanStack Vue Query
- VeeValidate + Zod
- Socket.IO Client
- Tailwind CSS v4

## Jalankan Project

```bash
npm install
npm run dev
```

## Environment

Copy `.env.example` ke `.env` lalu sesuaikan:

```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_WS_BASE_URL=http://localhost:3000
VITE_FILE_BASE_URL=http://localhost:3000/files
VITE_AI_API_URL=http://localhost:8000
VITE_APP_ENV=development
VITE_SENTRY_DSN=
VITE_FEATURE_CHAT_ENABLED=true
VITE_FEATURE_MEDGEMMA_ENABLED=true
VITE_MAX_UPLOAD_MB=10
```

## Struktur Folder

```text
src/
	assets/
	components/
	composables/
	layouts/
	lib/
		httpClient.js   # Axios client + auth interceptor
		pinia.js        # Pinia instance
		queryClient.js  # TanStack Query client
		socketClient.js # Socket.IO client helper
	router/
	services/
		authService.js  # Auth API service
		dataService.js  # Domain API service (doctor/patient/record/activity)
		aiService.js    # AI endpoint adapter
	stores/
		appStore.js     # Session, role map, feature toggles
	views/
```

## Titik Logic Utama

- App bootstrap: `src/main.js`
- Global state: `src/stores/appStore.js`
- Axios handler + auth header interceptor: `src/lib/httpClient.js`
- Server-state client: `src/lib/queryClient.js`
- Realtime client: `src/lib/socketClient.js`
- Route + RBAC guard: `src/router/index.js`

## Catatan Integrasi API

- Endpoint bisnis utama sekarang berjalan via service API-first:
	- `src/services/authService.js`
	- `src/services/dataService.js`
- Tidak ada lagi operasi bisnis utama yang langsung memanggil Supabase dari browser.
- Bila kontrak endpoint backend berubah, sesuaikan mapping request/response di service tersebut.
