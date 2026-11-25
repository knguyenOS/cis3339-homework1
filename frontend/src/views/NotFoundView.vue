<script setup>
import { RouterLink, useRoute } from 'vue-router';

const route = useRoute();
</script>

<template>
  <div class="not-found">
    <p class="not-found__code" aria-hidden="true">404</p>
    <h1 class="page-header__title">Page not found</h1>
    <p class="muted">There is no page at <code>{{ route.fullPath }}</code>.</p>
    <RouterLink to="/" class="btn btn--primary">Back to the dashboard</RouterLink>
  </div>
</template>
