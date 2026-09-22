'use strict';
document.querySelector('#login-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const button = form.querySelector('button');
  const message = form.querySelector('.message');
  button.disabled = true; message.textContent = '';
  try {
    const response = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(form))) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error);
    location.href = '/admin';
  } catch (error) { message.textContent = error.message || 'Kirjautuminen epäonnistui.'; button.disabled = false; }
});
