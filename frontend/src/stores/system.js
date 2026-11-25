import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { api } from '@/services/api';

const RETRY_MS = 8000;

/** Tracks whether the backend and MongoDB are reachable, for the status banner. */
export const useSystemStore = defineStore('system', () => {
  const status = ref('unknown'); // 'unknown' | 'connected' | 'unavailable' | 'offline'
  const checking = ref(false);
  let timer = null;

  const isHealthy = computed(() => status.value === 'connected');
  const hasProblem = computed(() => status.value === 'unavailable' || status.value === 'offline');

  async function checkHealth() {
    checking.value = true;
    const result = await api.health();
    checking.value = false;
    const previous = status.value;
    status.value = result.status === 'offline' ? 'offline' : result.database === 'connected' ? 'connected' : 'unavailable';

    clearTimeout(timer);
    if (status.value !== 'connected') timer = setTimeout(checkHealth, RETRY_MS);
    return { previous, current: status.value };
  }

  function markUnavailable() {
    if (status.value === 'connected' || status.value === 'unknown') {
      status.value = 'unavailable';
      clearTimeout(timer);
      timer = setTimeout(checkHealth, RETRY_MS);
    }
  }

  return { status, checking, isHealthy, hasProblem, checkHealth, markUnavailable };
});
