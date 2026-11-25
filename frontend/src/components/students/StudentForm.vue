<script setup>
import { nextTick } from 'vue';
import TextField from '@/components/ui/TextField.vue';
import { useForm } from '@/composables/useForm';
import { studentRules } from '@/utils/validators';
import { useStudentStore } from '@/stores/students';
import { useNotificationStore } from '@/stores/notifications';

const studentStore = useStudentStore();
const notifications = useNotificationStore();

const form = useForm({ name: '', studentId: '', phone: '', zip: '' }, studentRules);
const { values, errors } = form;

async function submit() {
  // Run local rules first, then focus the first invalid control.
  if (!form.validateAll()) {
    await nextTick();
    document.querySelector('#student-form [aria-invalid="true"]')?.focus();
    return;
  }

  form.submitting.value = true;
  try {
    const result = await studentStore.addStudent({
      name: values.name.trim(),
      studentId: values.studentId.trim(),
      phone: values.phone.trim(),
      zip: values.zip.trim(),
    });
    notifications.success(result.message);
    form.reset();
    document.getElementById('student-name')?.focus();
  } catch (error) {
    form.applyServerErrors(error);
    if (error.status === 409) errors.studentId = error.message;
    notifications.error(error.message);
  } finally {
    form.submitting.value = false;
  }
}
</script>

<template>
  <form id="student-form" class="form" novalidate @submit.prevent="submit">
    <p v-if="form.formError.value" class="form__error" role="alert">{{ form.formError.value }}</p>

    <TextField
      id="student-name"
      v-model="values.name"
      label="Name"
      required
      autocomplete="name"
      maxlength="100"
      placeholder="e.g. John"
      :error="errors.name"
      @blur="form.onBlur('name')"
    />
    <TextField
      id="student-id"
      v-model="values.studentId"
      label="Student ID"
      required
      inputmode="numeric"
      maxlength="10"
      placeholder="e.g. 1001"
      hint="Digits only. Must be unique."
      :error="errors.studentId"
      @blur="form.onBlur('studentId')"
    />
    <div class="form__row">
      <TextField
        id="student-phone"
        v-model="values.phone"
        label="Phone"
        type="tel"
        required
        autocomplete="tel"
        maxlength="20"
        placeholder="e.g. 555-1234"
        :error="errors.phone"
        @blur="form.onBlur('phone')"
      />
      <TextField
        id="student-zip"
        v-model="values.zip"
        label="ZIP code"
        required
        inputmode="numeric"
        autocomplete="postal-code"
        maxlength="10"
        placeholder="e.g. 77001"
        :error="errors.zip"
        @blur="form.onBlur('zip')"
      />
    </div>

    <div class="form__actions">
      <button type="submit" class="btn btn--primary" :disabled="form.submitting.value">
        <span v-if="form.submitting.value" class="spinner spinner--small" aria-hidden="true"></span>
        {{ form.submitting.value ? 'Adding…' : 'Add student' }}
      </button>
      <button type="button" class="btn btn--ghost" :disabled="form.submitting.value" @click="form.reset()">Clear</button>
    </div>
  </form>
</template>
