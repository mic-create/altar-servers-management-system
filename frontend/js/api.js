// FILE: frontend/js/api.js
const API_BASE_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') 
  ? 'http://127.0.0.1:5000/api' 
  : 'https://altar-servers-management-system.onrender.com/api';

const getValidToken = () => {
  const token = localStorage.getItem('sfcc_auth_token');
  if (!token || token === 'undefined' || token === 'null' || token === '[object Object]' || token.split('.').length !== 3) {
    return null;
  }
  return token;
};

const apiClient = {
  async get(endpoint) {
    try {
      const token = getValidToken();
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        credentials: 'include',
        headers
      });
      if (response.status === 401) {
        localStorage.removeItem('sfcc_auth_token');
        sessionStorage.removeItem('sfcc_auth');
        window.location.href = 'index.html';
        return;
      }
      return await response.json();
    } catch (err) {
      console.error('API GET error:', err);
      throw err;
    }
  },

  async post(endpoint, data) {
    try {
      const token = getValidToken();
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify(data)
      });
      if (response.status === 401) {
        localStorage.removeItem('sfcc_auth_token');
        sessionStorage.removeItem('sfcc_auth');
        window.location.href = 'index.html';
        return;
      }
      return await response.json();
    } catch (err) {
      console.error('API POST error:', err);
      throw err;
    }
  }
};