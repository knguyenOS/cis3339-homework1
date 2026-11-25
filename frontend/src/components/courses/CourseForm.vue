<script setup>
import { computed, nextTick } from 'vue';
import TextField from '@/components/ui/TextField.vue';
import { useForm } from '@/composables/useForm';
import { courseRules, normalizeCourseId } from '@/utils/validators';
import { useCourseStore } from '@/stores/courses';
import { useNotificationStore } from '@/stores/notifications';

const courseStore = useCourseStore();
const notifications = useNotificationStore();

const form = useForm({ courseId: '', name: '' }, courseRules);
const { values, errors } = form;

/** Show users how their course ID will be saved (e.g. "cis3339" → "CIS 3339"). */
const normalizedPreview = computed(() => {
  const normalized = normalizeCourseId(values.courseId);
  return normalized && normalized !== values.courseId.trim() && !errors.courseId ? `Will be saved as ${normalized}.` : '';
});

async function submit() {
  // Validate locally before sending the POST request to the API.
  if (!form.validateAll()) {
    await nextTick();
    document.querySelector('#course-form [aria-invalid="true"]')?.focus();
    return;
  }

  form.submitting.value = true;
  try {
    const result = await courseStore.addCourse({ courseId: values.courseId.trim(), name: values.name.trim() });
    notifications.success(result.message);
    form.reset();
    document.getElementById('course-id')?.focus();
  } catch (error) {
    form.applyServerErrors(error);
    if (error.status === 409) errors.courseId = error.message;
    notifications.error(error.message);
  } finally {
    form.submitting.value = false;
  }
}
</script>

<template>
  <form id="course-form" class="form" novalidate @submit.prevent="submit">
    <p v-if="form.formError.value" class="form__error" role="alert">{{ form.formError.value }}</p>

    <TextField
      id="course-id"
      v-model="values.courseId"
      label="Course ID"
      required
      maxlength="20"
      placeholder="e.g. CIS 3339"
      :hint="normalizedPreview || 'Subject code and number. Must be unique.'"
      :error="errors.courseId"
      @blur="form.onBlur('courseId')"
    />
    <TextField
      id="course-name"
      v-model="values.name"
      label="Course name"
      required
      maxlength="120"
      placeholder="e.g. Enterprise Applications Development"
      :error="errors.name"
      @blur="form.onBlur('name')"
    />

    <div class="form__actions">
      <button type="submit" class="btn btn--primary" :disabled="form.submitting.value">
        <span v-if="form.submitting.value" class="spinner spinner--small" aria-hidden="true"></span>
        {{ form.submitting.value ? 'Adding…' : 'Add course' }}
      </button>
      <button type="button" class="btn btn--ghost" :disabled="form.submitting.value" @click="form.reset()">Clear</button>
    </div>
  </form>
</template>
