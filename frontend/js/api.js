// API configuration utility layer connected to backend
const API_BASE_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') 
  ? 'http://127.0.0.1:5000/api' 
  : '/api';

const apiClient = {
  async get(endpoint) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (response.status === 401) {
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
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      if (response.status === 401) {
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