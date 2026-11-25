<script setup>
import { computed } from 'vue';
import SelectField from '@/components/ui/SelectField.vue';
import StateMessage from '@/components/ui/StateMessage.vue';
import { formatDate, plural } from '@/utils/format';
import { useCourseStore } from '@/stores/courses';
import { useEnrollmentStore } from '@/stores/enrollments';

const props = defineProps({
  removingId: { type: String, default: '' },
});

const emit = defineEmits(['remove']);

/** The selected course ID is owned by the parent view (kept in the URL). */
const courseId = defineModel('courseId', { type: String, default: '' });

const courseStore = useCourseStore();
const enrollmentStore = useEnrollmentStore();

const roster = computed(() => enrollmentStore.roster);
const students = computed(() => roster.value?.students ?? []);
const summary = computed(() =>
  roster.value ? `${plural(students.value.length, 'student')} enrolled in ${roster.value.course.courseId}` : ''
);
</script>

<template>
  <div class="roster">
    <div class="roster__controls">
      <SelectField
        id="roster-course"
        v-model="courseId"
        label="Course"
        placeholder="-- Select course --"
        :options="courseStore.courseOptions"
        :disabled="!courseStore.loaded"
      />
      <button
        type="button"
        class="btn btn--secondary roster__refresh"
        :disabled="!courseId || enrollmentStore.rosterLoading"
        @click="enrollmentStore.fetchRoster(courseId)"
      >
        Refresh list
      </button>
    </div>

    <StateMessage
      v-if="!courseId"
      type="empty"
      title="No course selected"
      message="Choose a course to list the students enrolled in it."
    />
    <StateMessage v-else-if="enrollmentStore.rosterLoading && !roster" type="loading" message="Loading enrolled students…" />
    <StateMessage
      v-else-if="enrollmentStore.rosterError"
      type="error"
      title="Could not load the roster"
      :message="enrollmentStore.rosterError"
    >
      <button type="button" class="btn btn--small btn--secondary" @click="enrollmentStore.fetchRoster(courseId)">
        Try again
      </button>
    </StateMessage>

    <template v-else-if="roster">
      <p class="roster__summary" role="status">
        <strong>{{ roster.course.name }}</strong>
        <span>{{ summary }}</span>
        <span v-if="enrollmentStore.rosterLoading" class="spinner spinner--small" aria-hidden="true"></span>
      </p>

      <StateMessage
        v-if="!students.length"
        type="empty"
        title="No students enrolled"
        message="Use the form to enroll students in this course."
      />

      <div v-else class="table-wrap">
        <table class="table table--responsive">
          <caption class="visually-hidden">Students enrolled in {{ roster.course.courseId }}</caption>
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Student ID</th>
              <th scope="col">Phone</th>
              <th scope="col">ZIP</th>
              <th scope="col">Enrolled</th>
              <th scope="col" class="table__actions-col"><span class="visually-hidden">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="student in students" :key="student.enrollmentId">
              <td data-label="Name" class="table__primary">{{ student.name }}</td>
              <td data-label="Student ID"><span class="badge">{{ student.studentId }}</span></td>
              <td data-label="Phone">{{ student.phone }}</td>
              <td data-label="ZIP">{{ student.zip }}</td>
              <td data-label="Enrolled">{{ formatDate(student.enrolledAt) }}</td>
              <td class="table__actions">
                <button
                  type="button"
                  class="btn btn--small btn--danger-outline"
                  :disabled="props.removingId === student.enrollmentId"
                  :aria-label="`Remove ${student.name} from ${roster.course.courseId}`"
                  @click="emit('remove', student)"
                >
                  {{ props.removingId === student.enrollmentId ? 'Removing…' : 'Remove' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>
