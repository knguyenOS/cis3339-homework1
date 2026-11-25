<script setup>
import { computed, onMounted, ref } from 'vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import PanelCard from '@/components/ui/PanelCard.vue';
import StateMessage from '@/components/ui/StateMessage.vue';
import CourseForm from '@/components/courses/CourseForm.vue';
import CourseTable from '@/components/courses/CourseTable.vue';
import { useCourseStore } from '@/stores/courses';
import { useNotificationStore } from '@/stores/notifications';
import { useConfirmStore } from '@/stores/confirm';
import { plural } from '@/utils/format';

const courseStore = useCourseStore();
const notifications = useNotificationStore();
const confirm = useConfirmStore();

const deletingId = ref('');

onMounted(() => {
  // Force a fresh course list when this route is entered.
  courseStore.fetchCourses({ force: true });
});

// Aggregate server-provided enrollment counts for the panel description.
const totalEnrollments = computed(() => courseStore.courses.reduce((sum, c) => sum + (c.enrollmentCount || 0), 0));
const listDescription = computed(
  () => `${plural(courseStore.count, 'course')} · ${plural(totalEnrollments.value, 'enrollment')}`
);

async function deleteCourse(course) {
  const count = course.enrollmentCount || 0;
  const confirmed = await confirm.ask({
    title: `Delete ${course.courseId}?`,
    message:
      `${course.courseId} – ${course.name} will be permanently removed` +
      (count ? `, along with ${plural(count, 'enrollment')}.` : '. No students are enrolled in it.'),
    confirmLabel: 'Delete course',
    danger: true,
  });
  if (!confirmed) return;

  deletingId.value = course.courseId;
  try {
    const result = await courseStore.deleteCourse(course);
    notifications.success(result.message);
  } catch (error) {
    notifications.error(error.message);
    if (error.status === 404) courseStore.fetchCourses({ force: true });
  } finally {
    deletingId.value = '';
  }
}
</script>

<template>
  <PageHeader title="Courses" subtitle="Add courses, see how many students are enrolled, and delete courses." />

  <div class="layout-split">
    <PanelCard title="Add a course" heading-id="add-course-title" description="All fields are required.">
      <CourseForm />
    </PanelCard>

    <PanelCard title="Course list" :description="listDescription" heading-id="course-list-title">
      <template #actions>
        <button
          type="button"
          class="btn btn--small btn--ghost"
          :disabled="courseStore.loading"
          @click="courseStore.fetchCourses({ force: true })"
        >
          {{ courseStore.loading ? 'Loading…' : 'Refresh' }}
        </button>
      </template>

      <StateMessage v-if="courseStore.loading && !courseStore.loaded" type="loading" message="Loading courses…" />
      <StateMessage v-else-if="courseStore.error" type="error" title="Could not load courses" :message="courseStore.error">
        <button type="button" class="btn btn--small btn--secondary" @click="courseStore.fetchCourses({ force: true })">
          Try again
        </button>
      </StateMessage>
      <StateMessage
        v-else-if="!courseStore.count"
        type="empty"
        title="No courses yet"
        message="Use the form to add your first course."
      />
      <CourseTable v-else :courses="courseStore.courses" :deleting-id="deletingId" @delete="deleteCourse" />
    </PanelCard>
  </div>
</template>
