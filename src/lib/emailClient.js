export async function sendInternshipEmail(payload) {
  const response = await fetch('/api/internship-email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(result?.error || 'Unable to send email right now.');
  }

  return result;
}
