<script setup>
import { ref } from 'vue';
import { useStudentStore } from '@/stores/students';
import { useNotificationStore } from '@/stores/notifications';

const studentStore = useStudentStore();
const notifications = useNotificationStore();

const query = ref(studentStore.searchQuery);
const validationError = ref('');

async function submit() {
  validationError.value = '';
  // Require a non-empty query; the store also handles clearing the search.
  if (!query.value.trim()) {
    validationError.value = 'Enter a name or student ID to search.';
    return;
  }
  try {
    await studentStore.search(query.value);
  } catch (error) {
    notifications.error(error.message);
  }
}

function clear() {
  query.value = '';
  validationError.value = '';
  studentStore.clearSearch();
}
</script>

<template>
  <form class="search" role="search" novalidate @submit.prevent="submit">
    <label for="student-search" class="field__label">Search by name or student ID</label>
    <div class="search__controls">
      <input
        id="student-search"
        v-model="query"
        type="search"
        class="field__input"
        placeholder="e.g. John or 1001"
        autocomplete="off"
        :aria-invalid="validationError ? 'true' : undefined"
        :aria-describedby="validationError ? 'student-search-error' : undefined"
        @input="validationError = ''"
      />
      <button type="submit" class="btn btn--primary" :disabled="studentStore.searching">
        <span v-if="studentStore.searching" class="spinner spinner--small" aria-hidden="true"></span>
        {{ studentStore.searching ? 'Searching…' : 'Search' }}
      </button>
      <button v-if="studentStore.hasSearched || query" type="button" class="btn btn--ghost" @click="clear">
        Show all
      </button>
    </div>
    <p v-if="validationError" id="student-search-error" class="field__error">{{ validationError }}</p>
  </form>
</template>
