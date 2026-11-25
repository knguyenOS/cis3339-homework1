import { computed, reactive, ref, watch } from 'vue';

/**
 * Reusable form state for the Composition API.
 *
 * @param {Record<string, string>} initialValues
 * @param {Record<string, (value: string, values: object) => string>} rules
 */
export function useForm(initialValues, rules = {}) {
  const values = reactive({ ...initialValues });
  const errors = reactive({});
  const touched = reactive({});
  const submitting = ref(false);
  const formError = ref('');

  function validateField(field) {
    const rule = rules[field];
    errors[field] = rule ? rule(values[field], values) : '';
    return !errors[field];
  }

  function validateAll() {
    Object.keys(initialValues).forEach((field) => {
      touched[field] = true;
      validateField(field);
    });
    return Object.keys(initialValues).every((field) => !errors[field]);
  }

  /** Validate on blur so users are not shown errors while still typing. */
  function onBlur(field) {
    // Don't flag an empty field the user merely tabbed through; submit still validates it.
    if (!touched[field] && !String(values[field] ?? '').trim()) return;
    touched[field] = true;
    validateField(field);
  }

  /** Re-validate as the user types once a field has been touched. */
  function onInput(field) {
    if (touched[field]) validateField(field);
    formError.value = '';
  }

  Object.keys(initialValues).forEach((field) => {
    watch(
      () => values[field],
      () => onInput(field)
    );
  });

  /** Show field errors returned by the API (`details`) next to the inputs. */
  function applyServerErrors(error) {
    formError.value = error?.message || 'Something went wrong.';
    if (error?.details) {
      Object.entries(error.details).forEach(([field, message]) => {
        if (field in values) {
          errors[field] = message;
          touched[field] = true;
        }
      });
    }
  }

  function reset() {
    Object.assign(values, initialValues);
    Object.keys(initialValues).forEach((field) => {
      errors[field] = '';
      touched[field] = false;
    });
    formError.value = '';
  }

  const hasErrors = computed(() => Object.values(errors).some(Boolean));

  return { values, errors, touched, submitting, formError, hasErrors, validateField, validateAll, onBlur, onInput, applyServerErrors, reset };
}
