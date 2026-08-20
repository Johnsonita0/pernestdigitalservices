import { useEffect, useState } from 'react';

function readDraft(key) {
  if (typeof window === 'undefined') return null;
  try {
    const stored = window.localStorage.getItem(key);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    window.localStorage.removeItem(key);
    return null;
  }
}

export function usePersistentDraft(key, initialForm, initialStep = 1) {
  const [draft] = useState(() => readDraft(key));
  const [form, setForm] = useState(() => draft?.form || initialForm);
  const [step, setStep] = useState(() => draft?.step || initialStep);

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify({ form, step }));
    } catch (error) {
      // Large file previews can exceed localStorage limits; keep the form usable.
    }
  }, [form, key, step]);

  const clearDraft = () => {
    window.localStorage.removeItem(key);
  };

  return { form, setForm, step, setStep, clearDraft };
}
