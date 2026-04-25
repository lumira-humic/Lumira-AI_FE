import { createRouter, createWebHistory } from 'vue-router';

import { pinia } from '@/lib/pinia';
import { useAppStore } from '@/stores/appStore';
import { authService } from '@/services/authService';
// 1. LAYOUTS
import PublicLayout from '@/layouts/PublicLayout.vue'
import AdminLayout from '@/layouts/AdminLayout.vue'
import DoctorLayout from '@/layouts/DoctorLayout.vue'
import PatientLayout from '@/layouts/PatientLayout.vue'
import AuthLayout from '@/layouts/AuthLayout.vue'
// 2. VIEWS & COMPONENTS
import HomeView from '@/views/public/HomeView.vue'
import LoginModal from '@/components/auth/LoginModal.vue' 
import DashboardHome from '@/views/admin/page/DashboardHome.vue'
import DashboardDoctor from '@/views/admin/page/DashboardDoctor.vue'
import DashboardPatient from '@/views/admin/page/DashboardPatient.vue'
import DoctorDashboardHome from '@/views/doctor/DashboardHome.vue'
import PatientDashboardHome from '@/views/patient/DashboardHome.vue'
import PatientChatDoctor from '@/views/patient/ChatDoctor.vue'
import PatientConsultAI from '@/views/patient/ConsultAI.vue'
import PatientHistory from '@/views/patient/History.vue'
import PatientRecordDetail from '@/views/patient/RecordDetail.vue'
import ReviewConsole from '@/views/doctor/ReviewConsole.vue'


const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // PUBLIC
    {
      path: '/',
      component: PublicLayout,
      children: [
        { path: '', name: 'home', component: HomeView }
      ]
    },
    // AUTH (Using LoginModal as the View)
    {
      path: '/login',
      component: AuthLayout,
      children: [
        {
          path: '',
          name: 'login',
          component: LoginModal // <--- Direct link to your component
        }
      ]
    },
    // ADMIN
    {
      path: '/admin',
      component: AdminLayout,
      meta: { requiresAuth: true, role: 'admin' },
      children: [
        { path: '', name: 'admin-dashboard', component: DashboardHome },
        { path: 'doctors', name: 'admin-doctors', component: DashboardDoctor },
        { path: 'patients', name: 'admin-patients', component: DashboardPatient }
      ]
    },
    // DOCTOR
    {
      path: '/doctor',
      component: DoctorLayout,
      meta: { requiresAuth: true, role: 'doctor' },
      children: [
        { path: 'dashboard', name: 'doctor-dashboard', component: DoctorDashboardHome },
        { path: 'review/:id', name: 'review-console', component: ReviewConsole, props: true }
      ]
    },
    // PATIENT
    {
      path: '/patient',
      component: PatientLayout,
      meta: { requiresAuth: true, role: 'patient' },
      children: [
        { path: '', redirect: '/patient/dashboard' },
        { path: 'dashboard', name: 'patient-dashboard', component: PatientDashboardHome },
        { path: 'chat-doctor', name: 'patient-chat-doctor', component: PatientChatDoctor },
        { path: 'consult-ai', name: 'patient-consult-ai', component: PatientConsultAI },
        { path: 'history', name: 'patient-history', component: PatientHistory },
        { path: 'records/:recordId', name: 'patient-record-detail', component: PatientRecordDetail, props: true }
      ]
    }
  ]
})

// Navigation Guard
router.beforeEach(async (to) => {
  const appStore = useAppStore(pinia)
  if (!appStore.isAuthenticated) {
    appStore.hydrateSession()
  }

  if (appStore.isAuthenticated && !appStore.currentRole) {
    try {
      const profile = await authService.getUser()
      appStore.setProfile(profile)
    } catch (error) {
      appStore.clearSession()
    }
  }

  if (to.name === 'login' && appStore.isAuthenticated) {
    if (appStore.currentRole === 'admin') return '/admin'
    if (appStore.currentRole === 'doctor') return '/doctor/dashboard'
    if (appStore.currentRole === 'patient') return '/patient/dashboard'
    return '/'
  }

  if (to.meta.requiresAuth) {
    const userRole = appStore.currentRole || localStorage.getItem('userRole') || ''
    if (!userRole) {
      return {
        path: '/login',
        query: { redirect: to.fullPath },
      }
    }

    if (to.meta.role && to.meta.role !== userRole) {
      if (userRole === 'admin') return '/admin'
      if (userRole === 'doctor') return '/doctor/dashboard'
      if (userRole === 'patient') return '/patient/dashboard'

      return '/login'
    }
  }

  return true
})

export default router