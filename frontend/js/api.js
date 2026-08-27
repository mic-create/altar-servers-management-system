// FILE: frontend/js/api.js
const API_BASE_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') 
  ? 'http://127.0.0.1:5000/api' 
  : 'https://altar-servers-management-system.onrender.com/api';

const getValidToken = () => {
  const token = localStorage.getItem('sfcc_auth_token') || sessionStorage.getItem('sfcc_auth');
  if (!token || token === 'undefined' || token === 'null' || token === '[object Object]') {
    return null;
  }
  return token;
};

const handleUnauthorized = () => {
  localStorage.removeItem('sfcc_auth_token');
  sessionStorage.removeItem('sfcc_auth');
  window.location.href = 'index.html';
};

const apiClient = {
  async get(endpoint) {
    try {
      const token = getValidToken();
      if (!token) {
        handleUnauthorized();
        return;
      }
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.status === 401) {
        handleUnauthorized();
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
      if (!token) {
        handleUnauthorized();
        return;
      }
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      if (response.status === 401) {
        handleUnauthorized();
        return;
      }
      return await response.json();
    } catch (err) {
      console.error('API POST error:', err);
      throw err;
    }
  },

  async put(endpoint, data) {
    try {
      const token = getValidToken();
      if (!token) {
        handleUnauthorized();
        return;
      }
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      if (response.status === 401) {
        handleUnauthorized();
        return;
      }
      return await response.json();
    } catch (err) {
      console.error('API PUT error:', err);
      throw err;
    }
  },

  async patch(endpoint, data) {
    try {
      const token = getValidToken();
      if (!token) {
        handleUnauthorized();
        return;
      }
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      if (response.status === 401) {
        handleUnauthorized();
        return;
      }
      return await response.json();
    } catch (err) {
      console.error('API PATCH error:', err);
      throw err;
    }
  }
};