import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { api } from '@/services/api';
import { useEnrollmentStore } from './enrollments';

/** Courses are shared by the Courses view, both Enrollment dropdowns, and the dashboard. */
export const useCourseStore = defineStore('courses', () => {
  const courses = ref([]);
  const loading = ref(false);
  const loaded = ref(false);
  const error = ref('');

  const count = computed(() => courses.value.length);
  const courseOptions = computed(() =>
    courses.value.map((c) => ({ value: c.courseId, label: `${c.name} (${c.courseId})` }))
  );

  function findByCourseId(courseId) {
    return courses.value.find((c) => c.courseId === courseId) || null;
  }

  async function fetchCourses({ force = false } = {}) {
    if (loaded.value && !force) return;
    loading.value = true;
    error.value = '';
    try {
      courses.value = await api.courses.list();
      loaded.value = true;
    } catch (err) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  }

  /** Refresh enrollment counts without showing a loading state. */
  async function refreshInBackground() {
    if (!loaded.value) return;
    try {
      courses.value = await api.courses.list();
    } catch {
      /* the next explicit load will surface the error */
    }
  }

  async function addCourse(payload) {
    const result = await api.courses.create(payload);
    courses.value = [...courses.value, { ...result.course, enrollmentCount: 0 }].sort((a, b) =>
      a.courseId.localeCompare(b.courseId)
    );
    return result;
  }

  async function deleteCourse(course) {
    const result = await api.courses.remove(course.courseId);
    courses.value = courses.value.filter((c) => c.courseId !== course.courseId);
    useEnrollmentStore().handleCourseDeleted(course);
    return result;
  }

  function adjustEnrollmentCount(courseId, delta) {
    const course = findByCourseId(courseId);
    if (course) course.enrollmentCount = Math.max(0, (course.enrollmentCount || 0) + delta);
  }

  return {
    courses, loading, loaded, error, count, courseOptions,
    findByCourseId, fetchCourses, refreshInBackground, addCourse, deleteCourse, adjustEnrollmentCount,
  };
});
