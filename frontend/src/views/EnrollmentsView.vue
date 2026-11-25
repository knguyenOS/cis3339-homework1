<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import PageHeader from '@/components/ui/PageHeader.vue';
import PanelCard from '@/components/ui/PanelCard.vue';
import EnrollmentForm from '@/components/enrollments/EnrollmentForm.vue';
import CourseRoster from '@/components/enrollments/CourseRoster.vue';
import { useStudentStore } from '@/stores/students';
import { useCourseStore } from '@/stores/courses';
import { useEnrollmentStore } from '@/stores/enrollments';
import { useNotificationStore } from '@/stores/notifications';
import { useConfirmStore } from '@/stores/confirm';

const route = useRoute();
const router = useRouter();
const studentStore = useStudentStore();
const courseStore = useCourseStore();
const enrollmentStore = useEnrollmentStore();
const notifications = useNotificationStore();
const confirm = useConfirmStore();

const removingId = ref('');

onMounted(() => {
  // Dropdowns are always populated from fresh backend data.
  studentStore.fetchStudents({ force: true });
  courseStore.fetchCourses({ force: true });
});

/** The roster course lives in the URL (?course=CIS%203339) so it survives a refresh. */
const rosterCourseId = computed({
  get: () => (typeof route.query.course === 'string' ? route.query.course : ''),
  set: (value) => router.replace({ query: value ? { ...route.query, course: value } : {} }),
});

watch(rosterCourseId, (courseId) => enrollmentStore.fetchRoster(courseId), { immediate: true });

function onEnrolled(courseId) {
  if (rosterCourseId.value !== courseId) rosterCourseId.value = courseId;
}

async function removeFromCourse(student) {
  const course = enrollmentStore.roster?.course;
  const confirmed = await confirm.ask({
    title: `Remove ${student.name}?`,
    message: `${student.name} (${student.studentId}) will be removed from ${course?.courseId}. The student record is kept.`,
    confirmLabel: 'Remove from course',
    danger: true,
  });
  if (!confirmed) return;

  removingId.value = student.enrollmentId;
  try {
    const result = await enrollmentStore.unenroll(student.enrollmentId);
    notifications.success(result.message);
  } catch (error) {
    notifications.error(error.message);
    enrollmentStore.fetchRoster(rosterCourseId.value);
  } finally {
    removingId.value = '';
  }
}
</script>

<template>
  <PageHeader title="Enrollments" subtitle="Enroll students in courses and see who is enrolled in each course." />

  <div class="layout-split">
    <PanelCard
      title="Enroll a student"
      heading-id="enroll-title"
      description="Pick an existing student and course. Duplicate enrollments are rejected."
    >
      <EnrollmentForm @enrolled="onEnrolled" />
    </PanelCard>

    <PanelCard title="Students in course" heading-id="roster-title" description="Select a course to list its students.">
      <CourseRoster v-model:course-id="rosterCourseId" :removing-id="removingId" @remove="removeFromCourse" />
    </PanelCard>
  </div>
</template>
