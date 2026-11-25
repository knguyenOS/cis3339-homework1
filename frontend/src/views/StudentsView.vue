<script setup>
import { computed, nextTick, onMounted, ref } from 'vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import PanelCard from '@/components/ui/PanelCard.vue';
import StateMessage from '@/components/ui/StateMessage.vue';
import StudentForm from '@/components/students/StudentForm.vue';
import StudentSearch from '@/components/students/StudentSearch.vue';
import StudentTable from '@/components/students/StudentTable.vue';
import StudentDetails from '@/components/students/StudentDetails.vue';
import { useStudentStore } from '@/stores/students';
import { useNotificationStore } from '@/stores/notifications';
import { useConfirmStore } from '@/stores/confirm';
import { plural } from '@/utils/format';

const studentStore = useStudentStore();
const notifications = useNotificationStore();
const confirm = useConfirmStore();

const deletingId = ref('');

onMounted(() => {
  studentStore.fetchStudents({ force: true });
});

const listTitle = computed(() =>
  studentStore.hasSearched ? `Results for “${studentStore.searchQuery}”` : 'All students'
);
const listDescription = computed(() => plural(studentStore.visibleStudents.length, 'student'));
const showDetails = computed(() => studentStore.detailsLoading || studentStore.detailsError || studentStore.selected);

async function viewStudent(student) {
  await studentStore.loadDetails(student.studentId);
  await nextTick();
  document.getElementById('student-details-title')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

async function deleteStudent(student) {
  const confirmed = await confirm.ask({
    title: `Delete ${student.name}?`,
    message: `Student ${student.name} (ID ${student.studentId}) and all of their course enrollments will be permanently removed.`,
    confirmLabel: 'Delete student',
    danger: true,
  });
  if (!confirmed) return;

  deletingId.value = student.studentId;
  try {
    const result = await studentStore.deleteStudent(student);
    notifications.success(result.message);
  } catch (error) {
    notifications.error(error.message);
    if (error.status === 404) studentStore.fetchStudents({ force: true });
  } finally {
    deletingId.value = '';
  }
}
</script>

<template>
  <PageHeader title="Students" subtitle="Add, search, view, and delete student records." />

  <div class="layout-split">
    <PanelCard title="Add a student" heading-id="add-student-title" description="All fields are required.">
      <StudentForm />
    </PanelCard>

    <div class="stack">
      <PanelCard title="Find students" heading-id="find-student-title">
        <StudentSearch />
      </PanelCard>

      <PanelCard :title="listTitle" :description="listDescription" heading-id="student-list-title">
        <template #actions>
          <button
            type="button"
            class="btn btn--small btn--ghost"
            :disabled="studentStore.loading"
            @click="studentStore.fetchStudents({ force: true })"
          >
            Refresh
          </button>
        </template>

        <StateMessage v-if="studentStore.loading && !studentStore.loaded" type="loading" message="Loading students…" />
        <StateMessage v-else-if="studentStore.error" type="error" title="Could not load students" :message="studentStore.error">
          <button type="button" class="btn btn--small btn--secondary" @click="studentStore.fetchStudents({ force: true })">
            Try again
          </button>
        </StateMessage>
        <StateMessage v-else-if="studentStore.searchError" type="error" title="Search failed" :message="studentStore.searchError" />
        <StateMessage
          v-else-if="studentStore.hasSearched && !studentStore.visibleStudents.length"
          type="empty"
          title="No matching students"
          :message="`No student name or ID matches “${studentStore.searchQuery}”.`"
        >
          <button type="button" class="btn btn--small btn--secondary" @click="studentStore.clearSearch()">Show all students</button>
        </StateMessage>
        <StateMessage
          v-else-if="!studentStore.visibleStudents.length"
          type="empty"
          title="No students yet"
          message="Use the form to add your first student."
        />
        <StudentTable
          v-else
          :students="studentStore.visibleStudents"
          :caption="listTitle"
          :deleting-id="deletingId"
          :selected-id="studentStore.selected?.studentId || ''"
          @view="viewStudent"
          @delete="deleteStudent"
        />

        <StudentDetails
          v-if="showDetails"
          :student="studentStore.selected"
          :loading="studentStore.detailsLoading"
          :error="studentStore.detailsError"
          @close="studentStore.closeDetails()"
          @delete="deleteStudent"
        />
      </PanelCard>
    </div>
  </div>
</template>
