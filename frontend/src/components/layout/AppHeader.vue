<script setup>
import { ref, watch } from 'vue';
import { RouterLink, useRoute } from 'vue-router';

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/students', label: 'Students' },
  { to: '/courses', label: 'Courses' },
  { to: '/enrollments', label: 'Enrollments' },
];

const route = useRoute();
const menuOpen = ref(false);

// Close the mobile menu after navigating.
watch(
  () => route.fullPath,
  () => {
    menuOpen.value = false;
  }
);
</script>

<template>
  <header class="app-header">
    <div class="container app-header__inner">
      <RouterLink to="/" class="brand" aria-label="Student Management System, dashboard">
        <svg class="brand__logo" viewBox="0 0 32 32" aria-hidden="true">
          <rect width="32" height="32" rx="7" fill="currentColor" opacity=".18" />
          <path d="M16 7 4 13l12 6 9-4.5V21h2v-7.5L16 7Z" fill="currentColor" />
          <path d="M9 17.5V22c0 1.9 3.1 3.5 7 3.5s7-1.6 7-3.5v-4.5l-7 3.5-7-3.5Z" fill="currentColor" opacity=".8" />
        </svg>
        <span class="brand__text">
          <span class="brand__name">Student Management</span>
          <span class="brand__sub">CIS 3339</span>
        </span>
      </RouterLink>

      <button
        type="button"
        class="nav-toggle"
        :aria-expanded="menuOpen"
        aria-controls="primary-nav"
        @click="menuOpen = !menuOpen"
      >
        <span class="visually-hidden">{{ menuOpen ? 'Close menu' : 'Open menu' }}</span>
        <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
          <path v-if="!menuOpen" d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          <path v-else d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        </svg>
      </button>

      <nav id="primary-nav" class="nav" :class="{ 'nav--open': menuOpen }" aria-label="Main">
        <ul class="nav__list">
          <li v-for="link in links" :key="link.to">
            <RouterLink :to="link.to" class="nav__link" :exact-active-class="'nav__link--active'">
              {{ link.label }}
            </RouterLink>
          </li>
        </ul>
      </nav>
    </div>
  </header>
</template>
