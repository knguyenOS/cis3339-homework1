<script setup>
/** One component for the loading, empty, and error states used across every view. */
defineProps({
  type: { type: String, default: 'empty', validator: (v) => ['loading', 'empty', 'error'].includes(v) },
  title: { type: String, default: '' },
  message: { type: String, default: '' },
});
</script>

<template>
  <div class="state" :class="`state--${type}`" :role="type === 'error' ? 'alert' : 'status'">
    <span v-if="type === 'loading'" class="spinner" aria-hidden="true"></span>
    <span v-else class="state__icon" aria-hidden="true">{{ type === 'error' ? '!' : '∅' }}</span>
    <div class="state__text">
      <p v-if="title" class="state__title">{{ title }}</p>
      <p v-if="message" class="state__message">{{ message }}</p>
      <div v-if="$slots.default" class="state__actions"><slot /></div>
    </div>
  </div>
</template>
