// FILE: frontend/js/config.js
const getApiBaseUrl = () => {
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:5000/api';
  }
  // Production Render Backend URL
  return 'https://altar-servers-management-system.onrender.com/api';
};

window.API_BASE = getApiBaseUrl();