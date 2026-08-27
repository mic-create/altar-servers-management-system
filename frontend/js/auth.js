document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const passwordInput = document.getElementById('adminPassword');
  const togglePasswordBtn = document.getElementById('togglePasswordBtn');
  const errorAlert = document.getElementById('errorAlert');

  // Determine base API endpoint
  const API_BASE =
    window.API_BASE ||
    (['localhost', '127.0.0.1'].includes(window.location.hostname)
      ? 'http://127.0.0.1:5000/api'
      : 'https://altar-servers-management-system.onrender.com/api');

  // Setup UI Helpers
  const showError = (message) => {
    if (errorAlert) {
      errorAlert.style.display = 'block';
      errorAlert.textContent = message;
    }
  };

  const hideError = () => {
    if (errorAlert) {
      errorAlert.style.display = 'none';
      errorAlert.textContent = '';
    }
  };

  // Password Visibility Toggle Listener
  if (togglePasswordBtn && passwordInput) {
    togglePasswordBtn.addEventListener('click', () => {
      const isPassword = passwordInput.getAttribute('type') === 'password';
      passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
      togglePasswordBtn.textContent = isPassword ? 'Hide' : 'Show';
    });
  }

  // Guard clause if form is missing
  if (!loginForm) {
    console.error('Login form #loginForm was not found.');
    return;
  }

  // Handle Form Submission
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();

    const enteredPassword = passwordInput?.value?.trim() || '';

    if (!enteredPassword) {
      showError('Please enter the administrator password.');
      return;
    }

    try {
      console.log('Attempting login...');
      console.log('API:', `${API_BASE}/auth/login`);

      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          username: 'admin',
          password: enteredPassword
        })
      });

      const data = await response.json();
      console.log('Login HTTP status:', response.status);

      if (!response.ok || !data.success) {
        showError(data.message || 'Invalid administrator credentials.');
        return;
      }

      // Extract access token from potential response shapes
      const token =
        data?.token ||
        data?.accessToken ||
        data?.data?.token ||
        data?.data?.accessToken;

      if (!token || typeof token !== 'string') {
        console.error('Authentication succeeded, but no string token was found.', data);
        showError('Authentication succeeded, but no valid token was returned by the server.');
        return;
      }

      // Verify basic JWT shape (header.payload.signature)
      if (token.split('.').length !== 3) {
        console.error('Returned token is not a standard JWT format.');
        showError('Authentication succeeded, but the returned token format is invalid.');
        return;
      }

      // Save credentials & redirect
      localStorage.setItem('sfcc_auth_token', token);
      sessionStorage.setItem('sfcc_auth', 'true');
      console.log('Authentication token stored successfully.');

      window.location.href = './dashboard.html';
    } catch (err) {
      console.error('Network or server connection error during login:', err);
      showError('Unable to connect to the server. Please check your network connection.');
    }
  });
});