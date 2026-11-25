<script setup>
import { nextTick, ref, watch } from 'vue';
import { useConfirmStore } from '@/stores/confirm';

const confirm = useConfirmStore();
const dialogRef = ref(null);
const cancelRef = ref(null);
let returnFocusTo = null;

// Open/close the native <dialog> (focus trap + Esc handling built in) when the store changes.
watch(
  () => confirm.open,
  async (open) => {
    const dialog = dialogRef.value;
    if (!dialog) return;
    if (open && !dialog.open) {
      returnFocusTo = document.activeElement;
      dialog.showModal();
      await nextTick();
      cancelRef.value?.focus(); // safest default for destructive actions
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }
);

function onClose() {
  if (confirm.open) confirm.respond(false); // closed with Esc
  if (returnFocusTo && typeof returnFocusTo.focus === 'function' && document.contains(returnFocusTo)) {
    returnFocusTo.focus();
  }
  returnFocusTo = null;
}

function onBackdropClick(event) {
  if (event.target === dialogRef.value) confirm.respond(false);
}
</script>

<template>
  <dialog
    ref="dialogRef"
    class="dialog"
    aria-labelledby="confirm-title"
    aria-describedby="confirm-message"
    @close="onClose"
    @click="onBackdropClick"
  >
    <div class="dialog__body">
      <h2 id="confirm-title" class="dialog__title">{{ confirm.title }}</h2>
      <p id="confirm-message" class="dialog__message">{{ confirm.message }}</p>
      <div class="dialog__actions">
        <button ref="cancelRef" type="button" class="btn btn--secondary" @click="confirm.respond(false)">Cancel</button>
        <button
          type="button"
          class="btn"
          :class="confirm.danger ? 'btn--danger' : 'btn--primary'"
          @click="confirm.respond(true)"
        >
          {{ confirm.confirmLabel }}
        </button>
      </div>
    </div>
  </dialog>
</template>
