<script setup>
import { computed, onMounted } from 'vue';
import { RouterLink } from 'vue-router';
import PageHeader from '@/components/ui/PageHeader.vue';
import PanelCard from '@/components/ui/PanelCard.vue';
import StateMessage from '@/components/ui/StateMessage.vue';
import { useStudentStore } from '@/stores/students';
import { useCourseStore } from '@/stores/courses';
import { useEnrollmentStore } from '@/stores/enrollments';
import { useSystemStore } from '@/stores/system';
import { formatDate } from '@/utils/format';

const studentStore = useStudentStore();
const courseStore = useCourseStore();
const enrollmentStore = useEnrollmentStore();
const system = useSystemStore();

onMounted(() => {
  studentStore.fetchStudents({ force: true });
  courseStore.fetchCourses({ force: true });
  enrollmentStore.fetchEnrollments({ force: true });
});

const loading = computed(() => studentStore.loading || courseStore.loading || enrollmentStore.loading);
const error = computed(() => studentStore.error || courseStore.error || enrollmentStore.error);

const stats = computed(() => [
  { label: 'Students', value: studentStore.count, to: '/students', action: 'Manage students' },
  { label: 'Courses', value: courseStore.count, to: '/courses', action: 'Manage courses' },
  { label: 'Enrollments', value: enrollmentStore.count, to: '/enrollments', action: 'Manage enrollments' },
]);

const recentEnrollments = computed(() => enrollmentStore.enrollments.slice(0, 5));

const statusLabel = computed(
  () =>
    ({ connected: 'Connected', unavailable: 'Unavailable', offline: 'Server offline', unknown: 'Checking…' })[system.status]
);

function reload() {
  studentStore.fetchStudents({ force: true });
  courseStore.fetchCourses({ force: true });
  enrollmentStore.fetchEnrollments({ force: true });
}
</script>

<template>
  <PageHeader title="Dashboard" subtitle="An overview of students, courses, and enrollments.">
    <span class="status-pill" :class="`status-pill--${system.status}`">
      <span class="status-pill__dot" aria-hidden="true"></span>
      Database: {{ statusLabel }}
    </span>
  </PageHeader>

  <StateMessage v-if="error" type="error" title="Some data could not be loaded" :message="error">
    <button type="button" class="btn btn--small btn--secondary" @click="reload">Try again</button>
  </StateMessage>

  <ul class="stat-grid" aria-label="Totals">
    <li v-for="stat in stats" :key="stat.label" class="stat">
      <p class="stat__label">{{ stat.label }}</p>
      <p class="stat__value">
        <span v-if="loading && !stat.value" class="spinner spinner--small" aria-hidden="true"></span>
        <span v-else>{{ stat.value }}</span>
        <span v-if="loading && !stat.value" class="visually-hidden">Loading</span>
      </p>
      <RouterLink :to="stat.to" class="stat__link">{{ stat.action }} <span aria-hidden="true">→</span></RouterLink>
    </li>
  </ul>

  <PanelCard title="Recent enrollments" heading-id="recent-title" description="The five most recent enrollments.">
    <StateMessage v-if="enrollmentStore.loading && !enrollmentStore.loaded" type="loading" message="Loading enrollments…" />
    <StateMessage
      v-else-if="!recentEnrollments.length && !enrollmentStore.error"
      type="empty"
      title="No enrollments yet"
      message="Add students and courses, then enroll students from the Enrollments page."
    >
      <RouterLink to="/enrollments" class="btn btn--small btn--primary">Go to Enrollments</RouterLink>
    </StateMessage>
    <ul v-else class="activity">
      <li v-for="enrollment in recentEnrollments" :key="enrollment.id" class="activity__item">
        <span>
          <strong>{{ enrollment.student.name }}</strong>
          <span class="muted"> ({{ enrollment.student.studentId }})</span>
          enrolled in
          <RouterLink :to="{ name: 'enrollments', query: { course: enrollment.course.courseId } }">
            {{ enrollment.course.courseId }} – {{ enrollment.course.name }}
          </RouterLink>
        </span>
        <time class="muted" :datetime="enrollment.enrolledAt">{{ formatDate(enrollment.enrolledAt) }}</time>
      </li>
    </ul>
  </PanelCard>
</template>
