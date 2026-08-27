// FILE: frontend/js/dashboard.js
document.addEventListener('DOMContentLoaded', () => {
  // Enforce consistent frontend authentication state check across storage layers
  const token = localStorage.getItem('sfcc_auth_token') || sessionStorage.getItem('sfcc_auth');
  if (!token) {
    window.location.href = 'index.html';
    return;
  }

  const API_BASE = window.API_BASE || ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') 
    ? 'http://127.0.0.1:5000/api' 
    : 'https://altar-servers-management-system.onrender.com/api');

  // Handle Logout Action
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        await fetch(`${API_BASE}/auth/logout`, {
          method: 'POST',
          headers: { 
            ...(localStorage.getItem('sfcc_auth_token') ? { 'Authorization': `Bearer ${localStorage.getItem('sfcc_auth_token')}` } : {})
          },
          credentials: 'include'
        });
      } catch (err) {
        console.error('Logout error:', err);
      } finally {
        localStorage.removeItem('sfcc_auth_token');
        sessionStorage.removeItem('sfcc_auth');
        window.location.href = 'index.html';
      }
    });
  }
});