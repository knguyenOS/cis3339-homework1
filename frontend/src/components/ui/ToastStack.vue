<script setup>
import { useNotificationStore } from '@/stores/notifications';

const notifications = useNotificationStore();

const icons = { success: '✓', error: '!', info: 'i' };
const labels = { success: 'Success', error: 'Error', info: 'Notice' };
</script>

<template>
  <!-- Polite live region announces new messages to screen-reader users. -->
  <div class="toast-stack" aria-live="polite" aria-relevant="additions">
    <TransitionGroup name="toast">
      <div
        v-for="toast in notifications.toasts"
        :key="toast.id"
        class="toast"
        :class="`toast--${toast.type}`"
        :role="toast.type === 'error' ? 'alert' : 'status'"
      >
        <span class="toast__icon" aria-hidden="true">{{ icons[toast.type] }}</span>
        <p class="toast__message">
          <span class="visually-hidden">{{ labels[toast.type] }}: </span>{{ toast.message }}
        </p>
        <button type="button" class="toast__close" @click="notifications.dismiss(toast.id)">
          <span aria-hidden="true">×</span>
          <span class="visually-hidden">Dismiss notification</span>
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>
