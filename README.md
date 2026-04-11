# Project

Frontend base workspace for LUMIRA AI

## Stack

- Vue 3 + Vite
- Vue Router
- Pinia
- Axios + Interceptor
- TanStack Vue Query
- VeeValidate + Zod
- Socket.IO Client
- Tailwind CSS v4

## How to run

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
```


## Codebase

### Import Rules

- Beri **1 baris kosong** untuk memisahkan:
  - Library / framework / installation
  - Local file
- Penulisan import local file diurutkan berdasarkan level paling luar sampai dalam = service->component->ui->assets
- Beri **2 baris kosong** untuk jarak dari area import ke area code

#### Contoh:
```js
import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { userIcon } from "lucide";

import { dataService } from "@/services/dataService.js";
import AboutPage from "@pages/AboutPage"
import InfoCard from "../components/InfoCard.vue";
import PatientIcon from "@/assets/admin/patient.png";


<template>
    <div></div>
</template>
```

- Pastikan penulisan commit mengikuti kaidah
https://www.conventionalcommits.org/en/v1.0.0/

- Jika ada code yang dirasa compleks/bersangkutan dengan banyak kondisi, wajib menuliskan komentar