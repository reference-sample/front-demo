import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
    },
    {
      path: '/file-upload',
      name: 'file-upload',
      component: () => import('../views/FileUploadView.vue'),
    },
    {
      path: '/large-file-upload',
      name: 'large-file-upload',
      component: () => import('../views/LargeFileUploadView.vue'),
    },
  ],
})

export default router
