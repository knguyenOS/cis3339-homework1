<script setup>
import { computed, nextTick } from 'vue';
import { RouterLink } from 'vue-router';
import SelectField from '@/components/ui/SelectField.vue';
import StateMessage from '@/components/ui/StateMessage.vue';
import { useForm } from '@/composables/useForm';
import { enrollmentRules } from '@/utils/validators';
import { useStudentStore } from '@/stores/students';
import { useCourseStore } from '@/stores/courses';
import { useEnrollmentStore } from '@/stores/enrollments';
import { useNotificationStore } from '@/stores/notifications';

const emit = defineEmits(['enrolled']);

const studentStore = useStudentStore();
const courseStore = useCourseStore();
const enrollmentStore = useEnrollmentStore();
const notifications = useNotificationStore();

const form = useForm({ studentId: '', courseId: '' }, enrollmentRules);
const { values, errors } = form;

const loadingOptions = computed(
  () => (studentStore.loading && !studentStore.loaded) || (courseStore.loading && !courseStore.loaded)
);
const optionsError = computed(() => studentStore.error || courseStore.error);
const missingData = computed(() => studentStore.loaded && courseStore.loaded && (!studentStore.count || !courseStore.count));

function reload() {
  studentStore.fetchStudents({ force: true });
  courseStore.fetchCourses({ force: true });
}

async function submit() {
  // Empty dropdown selections are caught by the shared form validator.
  if (!form.validateAll()) {
    await nextTick();
    document.querySelector('#enrollment-form [aria-invalid="true"]')?.focus();
    return;
  }

  form.submitting.value = true;
  const { studentId, courseId } = values;
  try {
    const result = await enrollmentStore.enroll(studentId, courseId);
    notifications.success(result.message);
    // Keep the course selected so several students can be enrolled in a row.
    values.studentId = '';
    form.touched.studentId = false;
    errors.studentId = '';
    emit('enrolled', courseId);
    document.getElementById('enroll-student')?.focus();
  } catch (error) {
    form.applyServerErrors(error);
    notifications.error(error.message);
    // A student or course may have been deleted elsewhere: refresh the dropdowns.
    if (error.status === 404) reload();
  } finally {
    form.submitting.value = false;
  }
}
</script>

<template>
  <StateMessage v-if="loadingOptions" type="loading" message="Loading students and courses…" />

  <StateMessage v-else-if="optionsError" type="error" title="Could not load students or courses" :message="optionsError">
    <button type="button" class="btn btn--small btn--secondary" @click="reload">Try again</button>
  </StateMessage>

  <StateMessage
    v-else-if="missingData"
    type="empty"
    title="Nothing to enroll yet"
    message="You need at least one student and one course before you can create an enrollment."
  >
    <RouterLink v-if="!studentStore.count" to="/students" class="btn btn--small btn--primary">Add a student</RouterLink>
    <RouterLink v-if="!courseStore.count" to="/courses" class="btn btn--small btn--primary">Add a course</RouterLink>
  </StateMessage>

  <form v-else id="enrollment-form" class="form" novalidate @submit.prevent="submit">
    <p v-if="form.formError.value" class="form__error" role="alert">{{ form.formError.value }}</p>

    <SelectField
      id="enroll-student"
      v-model="values.studentId"
      label="Student"
      placeholder="-- Select student --"
      required
      :options="studentStore.studentOptions"
      :error="errors.studentId"
      @blur="form.onBlur('studentId')"
    />
    <SelectField
      id="enroll-course"
      v-model="values.courseId"
      label="Course"
      placeholder="-- Select course --"
      required
      :options="courseStore.courseOptions"
      :error="errors.courseId"
      @blur="form.onBlur('courseId')"
    />

    <div class="form__actions">
      <button type="submit" class="btn btn--primary" :disabled="form.submitting.value">
        <span v-if="form.submitting.value" class="spinner spinner--small" aria-hidden="true"></span>
        {{ form.submitting.value ? 'Enrolling…' : 'Enroll student' }}
      </button>
    </div>
  </form>
</template>
