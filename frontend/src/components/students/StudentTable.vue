<script setup>
// This presentational table only renders rows and emits view/delete actions;
// Pinia stores own loading, filtering, and API state.
defineProps({
  students: { type: Array, required: true },
  caption: { type: String, required: true },
  /** studentId of the row currently being deleted */
  deletingId: { type: String, default: '' },
  selectedId: { type: String, default: '' },
});

const emit = defineEmits(['view', 'delete']);
</script>

<template>
  <div class="table-wrap">
    <table class="table table--responsive">
      <caption class="visually-hidden">{{ caption }}</caption>
      <thead>
        <tr>
          <th scope="col">Name</th>
          <th scope="col">Student ID</th>
          <th scope="col">Phone</th>
          <th scope="col">ZIP</th>
          <th scope="col" class="table__actions-col"><span class="visually-hidden">Actions</span></th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="student in students"
          :key="student.studentId"
          :class="{ 'table__row--selected': student.studentId === selectedId }"
        >
          <td data-label="Name" class="table__primary">{{ student.name }}</td>
          <td data-label="Student ID"><span class="badge">{{ student.studentId }}</span></td>
          <td data-label="Phone">{{ student.phone }}</td>
          <td data-label="ZIP">{{ student.zip }}</td>
          <td class="table__actions">
            <button
              type="button"
              class="btn btn--small btn--secondary"
              :aria-label="`View details for ${student.name}`"
              @click="emit('view', student)"
            >
              View
            </button>
            <button
              type="button"
              class="btn btn--small btn--danger-outline"
              :disabled="deletingId === student.studentId"
              :aria-label="`Delete ${student.name}`"
              @click="emit('delete', student)"
            >
              {{ deletingId === student.studentId ? 'Deleting…' : 'Delete' }}
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
