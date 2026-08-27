// FILE: frontend/js/auth.js
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const passwordInput = document.getElementById('adminPassword');
  const togglePasswordBtn = document.getElementById('togglePasswordBtn');
  const errorAlert = document.getElementById('errorAlert');

  const API_BASE = window.API_BASE || 'http://localhost:5000/api';

  if (togglePasswordBtn && passwordInput) {
    togglePasswordBtn.addEventListener('click', () => {
      const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      passwordInput.setAttribute('type', type);
      togglePasswordBtn.textContent = type === 'password' ? 'Show' : 'Hide';
    });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const enteredPassword = passwordInput.value.trim();

      if (errorAlert) {
        errorAlert.style.display = 'none';
      }

      try {
        const response = await fetch(`${API_BASE}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include', // Required to receive and store HttpOnly cookie
          body: JSON.stringify({
            username: 'admin',
            password: enteredPassword
          })
        });

        const data = await response.json();

        if (response.ok && data.success) {
          sessionStorage.setItem('sfcc_auth', 'true');
          window.location.href = 'dashboard.html';
        } else {
          if (errorAlert) {
            errorAlert.style.display = 'block';
            errorAlert.textContent = data.message || 'Invalid administrator credentials.';
          }
        }
      } catch (err) {
        console.error('Network or server connection error:', err);
        if (errorAlert) {
          errorAlert.style.display = 'block';
          errorAlert.textContent = 'Unable to connect to the server. Please check your network.';
        }
      }
    });
  }
});