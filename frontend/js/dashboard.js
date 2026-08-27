// FILE: frontend/js/dashboard.js
document.addEventListener('DOMContentLoaded', () => {
  // Enforce frontend authentication state check
  const isAuthed = sessionStorage.getItem('sfcc_auth');
  if (!isAuthed) {
    window.location.href = 'index.html';
    return;
  }

  const API_BASE = window.API_BASE || 'http://localhost:5000/api';

  // Handle Logout Action
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        await fetch(`${API_BASE}/auth/logout`, {
          method: 'POST',
          credentials: 'include'
        });
      } catch (err) {
        console.error('Logout error:', err);
      } finally {
        sessionStorage.removeItem('sfcc_auth');
        window.location.href = 'index.html';
      }
    });
  }
});