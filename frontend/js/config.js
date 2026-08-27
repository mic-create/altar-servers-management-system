// FILE: frontend/js/config.js
const getApiBaseUrl = () => {
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:5000/api';
  }
  // Replace with your actual Render backend URL or inject via deployment build variables
  return 'https://your-backend-name.onrender.com/api';
};

window.API_BASE = getApiBaseUrl();