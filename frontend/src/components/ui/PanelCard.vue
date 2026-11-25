<script setup>
/** Card with a heading, optional description and header actions. */
defineProps({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  headingId: { type: String, default: undefined },
  headingLevel: { type: Number, default: 2 },
});
</script>

<template>
  <section class="card" :aria-labelledby="headingId">
    <header class="card__header">
      <div>
        <component :is="`h${headingLevel}`" :id="headingId" class="card__title">{{ title }}</component>
        <p v-if="description" class="card__description">{{ description }}</p>
      </div>
      <div v-if="$slots.actions" class="card__actions"><slot name="actions" /></div>
    </header>
    <div class="card__body"><slot /></div>
  </section>
</template>
