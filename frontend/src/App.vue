<script setup>
import { nextTick, onMounted, ref, watch } from 'vue';
import { RouterView, useRoute } from 'vue-router';
import AppHeader from '@/components/layout/AppHeader.vue';
import AppFooter from '@/components/layout/AppFooter.vue';
import DbStatusBanner from '@/components/layout/DbStatusBanner.vue';
import ToastStack from '@/components/ui/ToastStack.vue';
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue';
import { useSystemStore } from '@/stores/system';

const route = useRoute();
const system = useSystemStore();
const mainRef = ref(null);

onMounted(() => {
  system.checkHealth();
});

// Move keyboard / screen-reader focus to the new page after client-side navigation.
let firstNavigation = true;
watch(
  () => route.path,
  async () => {
    if (firstNavigation) {
      firstNavigation = false;
      return;
    }
    await nextTick();
    mainRef.value?.focus({ preventScroll: true });
  }
);
</script>

<template>
  <a class="skip-link" href="#main">Skip to main content</a>
  <AppHeader />
  <DbStatusBanner />
  <main id="main" ref="mainRef" class="container main" tabindex="-1">
    <RouterView />
  </main>
  <AppFooter />
  <ToastStack />
  <ConfirmDialog />
</template>
