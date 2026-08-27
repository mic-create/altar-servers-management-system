// FILE: frontend/js/auth.js
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const passwordInput = document.getElementById('adminPassword');
  const togglePasswordBtn = document.getElementById('togglePasswordBtn');
  const errorAlert = document.getElementById('errorAlert');

  // Use the centralized global API base or fallback safely
  const API_BASE = window.API_BASE || ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') 
    ? 'http://127.0.0.1:5000/api' 
    : 'https://altar-servers-management-system.onrender.com/api');

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
      const enteredPassword = passwordInput.value ? passwordInput.value.trim() : '';

      if (errorAlert) {
        errorAlert.style.display = 'none';
        errorAlert.textContent = '';
      }

      if (!enteredPassword) {
        if (errorAlert) {
          errorAlert.style.display = 'block';
          errorAlert.textContent = 'Please enter the administrator password.';
        }
        return;
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

        if (response.ok && data.success) {
          // Extract token from standard properties returned by backend
          const token = data.token || data.accessToken || (data.data && data.data.token);

          if (!token || typeof token !== 'string' || token.split('.').length !== 3) {
            console.error('Login succeeded but token format is invalid or missing:', data);
            if (errorAlert) {
              errorAlert.style.display = 'block';
              errorAlert.textContent = 'Authentication succeeded, but the server returned an invalid token structure.';
            }
            return;
          }

          // Store token using ONE consistent key across the entire application
          localStorage.setItem('sfcc_auth_token', token);
          sessionStorage.setItem('sfcc_auth', 'true');

          // Explicit redirect to dashboard
          window.location.replace('dashboard.html');
        } else {
          if (errorAlert) {
            errorAlert.style.display = 'block';
            errorAlert.textContent = data.message || 'Invalid administrator credentials.';
          }
        }
      } catch (err) {
        console.error('Network or server connection error during login:', err);
        if (errorAlert) {
          errorAlert.style.display = 'block';
          errorAlert.textContent = 'Unable to connect to the server. Please check your network connection.';
        }
      }
    });
  }
});