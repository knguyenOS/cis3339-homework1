import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { api } from '@/services/api';
import { useCourseStore } from './courses';

/** Enrollments and the currently displayed course roster. */
export const useEnrollmentStore = defineStore('enrollments', () => {
  const enrollments = ref([]);
  const loading = ref(false);
  const loaded = ref(false);
  const error = ref('');

  const rosterCourseId = ref('');
  const roster = ref(null); // { course, students }
  const rosterLoading = ref(false);
  const rosterError = ref('');

  const count = computed(() => enrollments.value.length);
  const rosterCount = computed(() => roster.value?.students.length ?? 0);

  async function fetchEnrollments({ force = false } = {}) {
    if (loaded.value && !force) return;
    loading.value = true;
    error.value = '';
    try {
      enrollments.value = await api.enrollments.list();
      loaded.value = true;
    } catch (err) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  }

  async function fetchRoster(courseId) {
    rosterCourseId.value = courseId;
    rosterError.value = '';
    if (!courseId) {
      roster.value = null;
      return;
    }
    if (roster.value && roster.value.course.courseId !== courseId) roster.value = null;
    rosterLoading.value = true;
    try {
      const result = await api.courses.roster(courseId);
      if (rosterCourseId.value === courseId) roster.value = result; // ignore stale responses
    } catch (err) {
      if (rosterCourseId.value === courseId) {
        roster.value = null;
        rosterError.value = err.message;
      }
    } finally {
      if (rosterCourseId.value === courseId) rosterLoading.value = false;
    }
  }

  async function enroll(studentId, courseId) {
    const result = await api.enrollments.create(studentId, courseId);
    enrollments.value = [result.enrollment, ...enrollments.value];
    useCourseStore().adjustEnrollmentCount(courseId, 1);
    if (rosterCourseId.value === courseId) await fetchRoster(courseId);
    return result;
  }

  async function unenroll(enrollmentId) {
    const result = await api.enrollments.remove(enrollmentId);
    enrollments.value = enrollments.value.filter((e) => e.id !== enrollmentId);
    if (roster.value) {
      roster.value = { ...roster.value, students: roster.value.students.filter((s) => s.enrollmentId !== enrollmentId) };
    }
    if (result.enrollment?.course) useCourseStore().adjustEnrollmentCount(result.enrollment.course.courseId, -1);
    return result;
  }

  /** Mirror the server's cascading delete in local state. */
  function handleStudentDeleted(studentDbId) {
    enrollments.value = enrollments.value.filter((e) => e.student?.id !== studentDbId);
    if (roster.value) {
      roster.value = { ...roster.value, students: roster.value.students.filter((s) => s.id !== studentDbId) };
    }
  }

  function handleCourseDeleted(course) {
    enrollments.value = enrollments.value.filter((e) => e.course?.id !== course.id);
    if (rosterCourseId.value === course.courseId) {
      rosterCourseId.value = '';
      roster.value = null;
    }
  }

  return {
    enrollments, loading, loaded, error, count,
    rosterCourseId, roster, rosterLoading, rosterError, rosterCount,
    fetchEnrollments, fetchRoster, enroll, unenroll, handleStudentDeleted, handleCourseDeleted,
  };
});
