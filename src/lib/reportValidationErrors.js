export function reportValidationErrors(errors, fallbackMessage = 'Please complete the required fields.') {
  const messages = Object.values(errors || {}).filter(Boolean);
  const message = messages[0] || fallbackMessage;

  window.dispatchEvent(new CustomEvent('app:toast', {
    detail: {
      message,
      type: 'error',
      duration: 4000,
    },
  }));

  window.setTimeout(() => {
    const errorElement = document.querySelector('.form-error, .company-error, .business-error, .scuml-error, .nin-error');
    const field = errorElement?.closest('label')?.querySelector('input, select, textarea')
      || document.querySelector('form input:not([type="file"]):not([type="submit"]), form select, form textarea');

    if (!field) return;
    field.focus({ preventScroll: true });
    field.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 0);
}
