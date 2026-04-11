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
- Pastikan kasih space 1 line untuk pemisahan import berdasarkan library/framework/instalassion dan local file. Contoh
- Urutan pengimportan berdasarkan level luar ke dalam, contoh = service->component->ui->assets. Contoh
import { computed, ref } from "vue";
import { defineStore } from "pinia";

import { dataService } from "@/services/dataService.js";
import InfoCard from "../components/InfoCard.vue";
import PatientIcon from "@/assets/admin/patient.png";

- Pastikan kasih space 2 line dari are import ke area core code dalam suatu file. Contoh
import { computed, ref } from "vue";
import { defineStore } from "pinia";

import { dataService } from "@/services/dataService.js";
import InfoCard from "../components/InfoCard.vue";
import PatientIcon from "@/assets/admin/patient.png";


code


- Pastikan penulisan commit mengikuti kaidah
https://www.conventionalcommits.org/en/v1.0.0/

- Jika ada code yang dirasa compleks/bersangkutan dengan banyak kondisi, wajib menuliskan komentar