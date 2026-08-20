export function reportValidationErrors(errors, fallbackMessage = 'Please complete the required fields.') {
  const firstKey = Object.keys(errors || {}).find((key) => errors[key]);
  const message = firstKey ? errors[firstKey] : fallbackMessage;

  window.setTimeout(() => {
    const escapedKey = window.CSS?.escape ? window.CSS.escape(firstKey || '') : firstKey;
    const fieldLabel = escapedKey ? document.querySelector(`[data-validation-key="${escapedKey}"]`) : null;
    const errorElement = document.querySelector('.form-error, .company-error, .business-error, .scuml-error, .nin-error');
    const target = fieldLabel || errorElement?.closest('label');
    const field = target?.matches('input, select, textarea')
      ? target
      : target?.querySelector('input, select, textarea')
        || document.querySelector('form input:not([type="file"]):not([type="submit"]), form select, form textarea');

    const label = field?.closest('label');
    const labelText = label?.firstChild?.textContent?.replace('*', '').trim();
    window.dispatchEvent(new CustomEvent('app:toast', {
      detail: { message: labelText ? `${labelText} is required.` : message, type: 'error', duration: 4000 },
    }));

    if (!field) return;
    field.focus({ preventScroll: true });
    label?.scrollIntoView({ behavior: 'smooth', block: 'center' }) || field.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 0);
}
