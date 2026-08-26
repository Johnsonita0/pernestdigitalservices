const EDIT_SESSION_KEY = 'pernestdigitalservices_application_edit';

export function saveApplicationEditSession(application, applicationType) {
  window.sessionStorage.setItem(EDIT_SESSION_KEY, JSON.stringify({ application, applicationType }));
}

export function readApplicationEditSession() {
  try {
    const value = window.sessionStorage.getItem(EDIT_SESSION_KEY);
    const parsed = value ? JSON.parse(value) : null;
    return parsed?.application ? parsed : parsed ? { application: parsed } : null;
  } catch {
    return null;
  }
}

export function clearApplicationEditSession() {
  window.sessionStorage.removeItem(EDIT_SESSION_KEY);
}
