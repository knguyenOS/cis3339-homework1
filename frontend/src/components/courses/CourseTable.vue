<script setup>
import { RouterLink } from 'vue-router';
import { plural } from '@/utils/format';

defineProps({
  courses: { type: Array, required: true },
  deletingId: { type: String, default: '' },
});

const emit = defineEmits(['delete']);
</script>

<template>
  <div class="table-wrap">
    <table class="table table--responsive">
      <caption class="visually-hidden">All courses</caption>
      <thead>
        <tr>
          <th scope="col">Course ID</th>
          <th scope="col">Course name</th>
          <th scope="col">Enrolled</th>
          <th scope="col" class="table__actions-col"><span class="visually-hidden">Actions</span></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="course in courses" :key="course.courseId">
          <td data-label="Course ID"><span class="badge badge--accent">{{ course.courseId }}</span></td>
          <td data-label="Course name" class="table__primary">{{ course.name }}</td>
          <td data-label="Enrolled">{{ plural(course.enrollmentCount || 0, 'student') }}</td>
          <td class="table__actions">
            <RouterLink
              class="btn btn--small btn--secondary"
              :to="{ name: 'enrollments', query: { course: course.courseId } }"
              :aria-label="`View roster for ${course.courseId}`"
            >
              Roster
            </RouterLink>
            <button
              type="button"
              class="btn btn--small btn--danger-outline"
              :disabled="deletingId === course.courseId"
              :aria-label="`Delete ${course.courseId} ${course.name}`"
              @click="emit('delete', course)"
            >
              {{ deletingId === course.courseId ? 'Deleting…' : 'Delete' }}
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
