<script setup>
import { computed, watch } from 'vue';
import { useSystemStore } from '@/stores/system';
import { useNotificationStore } from '@/stores/notifications';
import { useStudentStore } from '@/stores/students';
import { useCourseStore } from '@/stores/courses';
import { useEnrollmentStore } from '@/stores/enrollments';

const system = useSystemStore();
const notifications = useNotificationStore();
const studentStore = useStudentStore();
const courseStore = useCourseStore();
const enrollmentStore = useEnrollmentStore();

const message = computed(() =>
  system.status === 'offline'
    ? 'Cannot reach the server. Make sure the backend is running (npm start).'
    : 'The database is unavailable. Make sure MongoDB Community Edition is running on this computer.'
);

// When the connection comes back, reload the shared data automatically.
watch(
  () => system.status,
  (now, before) => {
    if (now === 'connected' && (before === 'unavailable' || before === 'offline')) {
      notifications.success('Connection restored.');
      studentStore.fetchStudents({ force: true });
      courseStore.fetchCourses({ force: true });
      enrollmentStore.fetchEnrollments({ force: true });
      if (enrollmentStore.rosterCourseId) enrollmentStore.fetchRoster(enrollmentStore.rosterCourseId);
    }
  }
);
</script>

<template>
  <div v-if="system.hasProblem" class="status-banner" role="alert">
    <div class="container status-banner__inner">
      <span><strong>Connection problem:</strong> {{ message }} Retrying automatically…</span>
      <button type="button" class="btn btn--small btn--light" :disabled="system.checking" @click="system.checkHealth()">
        {{ system.checking ? 'Checking…' : 'Retry now' }}
      </button>
    </div>
  </div>
</template>
