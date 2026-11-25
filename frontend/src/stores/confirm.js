import { ref } from 'vue';
import { defineStore } from 'pinia';

/**
 * Shared confirmation dialog. Any component can `await confirm.ask({...})`
 * and get `true` / `false`; <ConfirmDialog> (mounted once in App.vue) renders it.
 */
export const useConfirmStore = defineStore('confirm', () => {
  const open = ref(false);
  const title = ref('');
  const message = ref('');
  const confirmLabel = ref('Confirm');
  const danger = ref(false);
  let resolver = null;

  function ask(options) {
    if (resolver) resolver(false); // close any dialog that is still pending
    title.value = options.title || 'Are you sure?';
    message.value = options.message || '';
    confirmLabel.value = options.confirmLabel || 'Confirm';
    danger.value = Boolean(options.danger);
    open.value = true;
    return new Promise((resolve) => {
      resolver = resolve;
    });
  }

  function respond(answer) {
    open.value = false;
    if (resolver) resolver(answer);
    resolver = null;
  }

  return { open, title, message, confirmLabel, danger, ask, respond };
});
