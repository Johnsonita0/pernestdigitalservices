export const notifyToast = (message, tone = 'info') => {
  window.dispatchEvent(new CustomEvent('trophy:toast', {
    detail: { message, tone },
  }))
}