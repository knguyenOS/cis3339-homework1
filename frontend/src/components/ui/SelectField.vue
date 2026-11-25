<script setup>
import { computed } from 'vue';

const props = defineProps({
  id: { type: String, required: true },
  label: { type: String, required: true },
  /** [{ value, label }] — always populated from backend data */
  options: { type: Array, default: () => [] },
  placeholder: { type: String, default: '-- Select --' },
  error: { type: String, default: '' },
  hint: { type: String, default: '' },
  required: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
});

const emit = defineEmits(['blur']);
const model = defineModel({ type: String, default: '' });

const hintId = computed(() => (props.hint ? `${props.id}-hint` : null));
const errorId = computed(() => (props.error ? `${props.id}-error` : null));
const describedBy = computed(() => [hintId.value, errorId.value].filter(Boolean).join(' ') || undefined);
</script>

<template>
  <div class="field" :class="{ 'field--invalid': error }">
    <label :for="id" class="field__label">
      {{ label }}<span v-if="required" class="field__required" aria-hidden="true"> *</span>
    </label>
    <select
      :id="id"
      v-model="model"
      class="field__input field__select"
      :name="id"
      :disabled="disabled"
      :required="required"
      :aria-required="required || undefined"
      :aria-invalid="error ? 'true' : undefined"
      :aria-describedby="describedBy"
      @blur="emit('blur')"
    >
      <option value="">{{ placeholder }}</option>
      <option v-for="option in options" :key="option.value" :value="option.value">{{ option.label }}</option>
    </select>
    <p v-if="hint" :id="hintId" class="field__hint">{{ hint }}</p>
    <p v-if="error" :id="errorId" class="field__error">{{ error }}</p>
  </div>
</template>
