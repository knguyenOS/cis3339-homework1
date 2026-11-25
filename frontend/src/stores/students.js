import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { api } from '@/services/api';
import { useEnrollmentStore } from './enrollments';
import { useCourseStore } from './courses';

const byName = (a, b) => a.name.localeCompare(b.name) || a.studentId.localeCompare(b.studentId);

/**
 * Students are shared by the Students view, the Enrollments view (student
 * dropdown) and the Home dashboard, so they live in a Pinia store.
 */
export const useStudentStore = defineStore('students', () => {
  // All students
  const students = ref([]);
  const loading = ref(false);
  const loaded = ref(false);
  const error = ref('');

  // Search
  const searchQuery = ref('');
  const searchResults = ref([]);
  const searching = ref(false);
  const hasSearched = ref(false);
  const searchError = ref('');

  // Selected student details (with their courses)
  const selected = ref(null);
  const detailsLoading = ref(false);
  const detailsError = ref('');

  const count = computed(() => students.value.length);
  /** The table shows search results after a search, otherwise every student. */
  const visibleStudents = computed(() => (hasSearched.value ? searchResults.value : students.value));
  const studentOptions = computed(() =>
    students.value.map((s) => ({ value: s.studentId, label: `${s.name} (${s.studentId})` }))
  );

  async function fetchStudents({ force = false } = {}) {
    if (loaded.value && !force) return;
    loading.value = true;
    error.value = '';
    try {
      students.value = (await api.students.list()).sort(byName);
      loaded.value = true;
    } catch (err) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  }

  async function search(query) {
    searchQuery.value = query.trim();
    searchError.value = '';
    if (!searchQuery.value) {
      clearSearch();
      return;
    }
    searching.value = true;
    try {
      searchResults.value = await api.students.list(searchQuery.value);
      hasSearched.value = true;
    } catch (err) {
      searchError.value = err.message;
      throw err;
    } finally {
      searching.value = false;
    }
  }

  function clearSearch() {
    searchQuery.value = '';
    searchResults.value = [];
    hasSearched.value = false;
    searchError.value = '';
  }

  async function addStudent(payload) {
    const result = await api.students.create(payload);
    students.value = [...students.value, result.student].sort(byName);
    if (hasSearched.value) await search(searchQuery.value).catch(() => {});
    return result;
  }

  async function deleteStudent(student) {
    const result = await api.students.remove(student.studentId);
    students.value = students.value.filter((s) => s.studentId !== student.studentId);
    searchResults.value = searchResults.value.filter((s) => s.studentId !== student.studentId);
    if (selected.value?.studentId === student.studentId) selected.value = null;

    // Keep the other stores consistent with the cascading delete on the server.
    useEnrollmentStore().handleStudentDeleted(student.id);
    useCourseStore().refreshInBackground();
    return result;
  }

  async function loadDetails(studentId) {
    detailsLoading.value = true;
    detailsError.value = '';
    try {
      selected.value = await api.students.get(studentId);
    } catch (err) {
      detailsError.value = err.message;
      selected.value = null;
    } finally {
      detailsLoading.value = false;
    }
  }

  function closeDetails() {
    selected.value = null;
    detailsError.value = '';
  }

  return {
    students, loading, loaded, error,
    searchQuery, searchResults, searching, hasSearched, searchError,
    selected, detailsLoading, detailsError,
    count, visibleStudents, studentOptions,
    fetchStudents, search, clearSearch, addStudent, deleteStudent, loadDetails, closeDetails,
  };
});
