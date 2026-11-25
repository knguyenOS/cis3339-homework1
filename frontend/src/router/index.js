import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '@/views/HomeView.vue';

const APP_NAME = 'Student Management System';

const routes = [
  { path: '/', name: 'home', component: HomeView, meta: { title: 'Dashboard' } },
  {
    path: '/students',
    name: 'students',
    component: () => import('@/views/StudentsView.vue'),
    meta: { title: 'Students' },
  },
  {
    path: '/courses',
    name: 'courses',
    component: () => import('@/views/CoursesView.vue'),
    meta: { title: 'Courses' },
  },
  {
    path: '/enrollments',
    name: 'enrollments',
    component: () => import('@/views/EnrollmentsView.vue'),
    meta: { title: 'Enrollments' },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
    meta: { title: 'Page not found' },
  },
];

const router = createRouter({
  // HTML5 history mode: clean URLs like /courses. Express returns index.html
  // for these paths so refreshing a page never produces a 404.
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
});

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} · ${APP_NAME}` : APP_NAME;
});

export default router;
