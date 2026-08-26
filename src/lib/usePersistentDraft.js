import { useEffect, useState } from 'react';
import { readApplicationEditSession } from './applicationEditSession';

function toFormKeys(value) {
  if (Array.isArray(value)) return value.map(toFormKeys);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key.replace(/_([a-z])/g, (_, character) => character.toUpperCase()), toFormKeys(item)]));
}

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
  const [editSession] = useState(() => readApplicationEditSession());
  const editForm = editSession?.application ? toFormKeys(editSession.application) : null;
  const [form, setForm] = useState(() => editForm || draft?.form || initialForm);
  const [step, setStep] = useState(() => draft?.step || initialStep);

  useEffect(() => {
    const persistTimer = window.setTimeout(() => {
      try {
        window.localStorage.setItem(key, JSON.stringify({ form, step }));
      } catch (error) {
        // Large file previews can exceed localStorage limits; keep the form usable.
      }
    }, 350);

    return () => window.clearTimeout(persistTimer);
  }, [form, key, step]);

  const clearDraft = () => {
    window.localStorage.removeItem(key);
  };

  return { form, setForm, step, setStep, clearDraft };
}
