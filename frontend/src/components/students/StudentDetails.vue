<script setup>
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import StateMessage from '@/components/ui/StateMessage.vue';
import { formatDate, plural } from '@/utils/format';

const props = defineProps({
  student: { type: Object, default: null },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
});

const emit = defineEmits(['close', 'delete']);

const courseSummary = computed(() => (props.student ? plural(props.student.courses.length, 'course') : ''));
</script>

<template>
  <section class="details" aria-labelledby="student-details-title" aria-live="polite">
    <header class="details__header">
      <h2 id="student-details-title" class="card__title">Student details</h2>
      <button type="button" class="btn btn--small btn--ghost" @click="emit('close')">
        Close<span class="visually-hidden"> student details</span>
      </button>
    </header>

    <StateMessage v-if="loading" type="loading" message="Loading student details…" />
    <StateMessage v-else-if="error" type="error" title="Could not load details" :message="error" />

    <template v-else-if="student">
      <dl class="details__grid">
        <div><dt>Name</dt><dd>{{ student.name }}</dd></div>
        <div><dt>Student ID</dt><dd>{{ student.studentId }}</dd></div>
        <div><dt>Phone</dt><dd>{{ student.phone }}</dd></div>
        <div><dt>ZIP code</dt><dd>{{ student.zip }}</dd></div>
        <div><dt>Added</dt><dd>{{ formatDate(student.createdAt) }}</dd></div>
        <div><dt>Enrolled in</dt><dd>{{ courseSummary }}</dd></div>
      </dl>

      <h3 class="details__subtitle">Courses</h3>
      <ul v-if="student.courses.length" class="chip-list">
        <li v-for="course in student.courses" :key="course.enrollmentId" class="chip">
          <strong>{{ course.courseId }}</strong> {{ course.name }}
        </li>
      </ul>
      <p v-else class="muted">
        Not enrolled in any courses yet.
        <RouterLink to="/enrollments">Enroll this student</RouterLink>.
      </p>

      <div class="details__actions">
        <button type="button" class="btn btn--small btn--danger-outline" @click="emit('delete', student)">
          Delete {{ student.name }}
        </button>
      </div>
    </template>
  </section>
</template>
