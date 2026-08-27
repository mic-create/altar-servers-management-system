// FILE: frontend/js/auth.js
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const passwordInput = document.getElementById('adminPassword');
  const togglePasswordBtn = document.getElementById('togglePasswordBtn');
  const errorAlert = document.getElementById('errorAlert');

  const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') 
    ? 'http://127.0.0.1:5000/api' 
    : 'https://altar-servers-management-system.onrender.com/api';

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
          credentials: 'include',
          body: JSON.stringify({
            username: 'admin',
            password: enteredPassword
          })
        });

        const data = await response.json();

        if (response.ok && data.success && typeof data.token === 'string') {
          localStorage.setItem('sfcc_auth_token', data.token);
          sessionStorage.setItem('sfcc_auth', 'true');
          window.location.href = 'dashboard.html';
        } else {
          if (errorAlert) {
            errorAlert.style.display = 'block';
            errorAlert.textContent = data.message || 'Invalid administrator credentials or token format.';
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