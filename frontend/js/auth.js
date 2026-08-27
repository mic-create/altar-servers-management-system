// FILE: frontend/js/auth.js
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  if (!loginForm) return;

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const emailInput = document.getElementById('email') || document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const errorDiv = document.getElementById('error-message') || document.getElementById('loginError');

    if (!emailInput || !passwordInput) return;

    const credentials = {
      email: emailInput.value.trim(),
      password: passwordInput.value
    };

    const API_BASE_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') 
      ? 'http://127.0.0.1:5000/api' 
      : 'https://altar-servers-management-system.onrender.com/api';

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Login failed');
      }

      // Robustly resolve token across different common backend response keys
      const token = data.token || data.accessToken || data.access_token || (data.data && data.data.token);

      if (!token) {
        throw new Error('Authentication token missing from server response payload');
      }

      // Persist token safely
      localStorage.setItem('sfcc_auth_token', token);
      sessionStorage.setItem('sfcc_auth', 'true');

      // Redirect to dashboard
      window.location.href = 'dashboard.html';

    } catch (err) {
      console.error('Login error:', err);
      if (errorDiv) {
        errorDiv.textContent = err.message || 'Invalid credentials. Please try again.';
        errorDiv.style.display = 'block';
      }
    }
  });
});