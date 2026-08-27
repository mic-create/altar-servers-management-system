document.addEventListener('DOMContentLoaded', () => {
  // Enforce frontend authentication state check
  const isAuthed = sessionStorage.getItem('sfcc_auth');
  if (!isAuthed) {
    window.location.href = 'index.html';
    return;
  }

  // Handle Logout Action
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        await fetch('http://localhost:5000/api/auth/logout', {
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