import { ref } from 'vue';
import { defineStore } from 'pinia';

let nextId = 1;

/** Global toast notifications used by every view for success / error feedback. */
export const useNotificationStore = defineStore('notifications', () => {
  const toasts = ref([]);

  function dismiss(id) {
    toasts.value = toasts.value.filter((toast) => toast.id !== id);
  }

  function notify(type, message, timeout) {
    const id = nextId++;
    toasts.value.push({ id, type, message });
    if (toasts.value.length > 4) toasts.value.shift();
    if (timeout > 0) setTimeout(() => dismiss(id), timeout);
    return id;
  }

  const success = (message) => notify('success', message, 4500);
  const error = (message) => notify('error', message, 8000);
  const info = (message) => notify('info', message, 4500);

  return { toasts, notify, success, error, info, dismiss };
});
