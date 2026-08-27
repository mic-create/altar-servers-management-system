// FILE: frontend/js/members.js
document.addEventListener('DOMContentLoaded', () => {
  if (!sessionStorage.getItem('sfcc_auth')) {
    window.location.href = 'index.html';
    return;
  }

  const API_BASE = window.API_BASE || 'https://altar-servers-management-system.onrender.com/api';

  let currentStatusFilter = 'active';
  let currentSearchQuery = '';
  let confirmActionCallback = null;

  const memberTableBody = document.getElementById('memberTableBody');
  const loadingState = document.getElementById('loadingState');
  const emptyState = document.getElementById('emptyState');
  const searchInput = document.getElementById('searchInput');
  const filterTabs = document.querySelectorAll('.filter-tab');
  
  const statTotal = document.getElementById('statTotal');
  const statActive = document.getElementById('statActive');
  const statInactive = document.getElementById('statInactive');

  const memberModal = document.getElementById('memberModal');
  const modalTitle = document.getElementById('modalTitle');
  const memberForm = document.getElementById('memberForm');
  const editMemberId = document.getElementById('editMemberId');
  const memberNameInput = document.getElementById('memberNameInput');
  const openAddModalBtn = document.getElementById('openAddModalBtn');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const modalError = document.getElementById('modalError');

  const confirmModal = document.getElementById('confirmModal');
  const confirmTitle = document.getElementById('confirmTitle');
  const confirmMessage = document.getElementById('confirmMessage');
  const cancelConfirmBtn = document.getElementById('cancelConfirmBtn');
  const proceedConfirmBtn = document.getElementById('proceedConfirmBtn');

  const toast = document.getElementById('toast');
  const logoutBtn = document.getElementById('logoutBtn');

  fetchMembers();
  fetchStatistics();

  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        await fetch(`${API_BASE}/auth/logout`, { method: 'POST', credentials: 'include' });
      } catch (err) {
        console.error('Logout error:', err);
      } finally {
        sessionStorage.removeItem('sfcc_auth');
        window.location.href = 'index.html';
      }
    });
  }

  async function fetchStatistics() {
    try {
      const res = await fetch(`${API_BASE}/members?status=all`, { credentials: 'include' });
      if (res.status === 401) {
        sessionStorage.removeItem('sfcc_auth');
        window.location.href = 'index.html';
        return;
      }
      const json = await res.json();
      if (json.success) {
        const members = json.data;
        statTotal.textContent = members.length;
        statActive.textContent = members.filter(m => m.status === 'active').length;
        statInactive.textContent = members.filter(m => m.status === 'inactive').length;
      }
    } catch (err) {
      console.error('Failed to fetch statistics:', err);
    }
  }

  async function fetchMembers() {
    loadingState.style.display = 'block';
    memberTableBody.innerHTML = '';
    emptyState.style.display = 'none';

    try {
      let url = `${API_BASE}/members?status=${currentStatusFilter}`;
      if (currentSearchQuery.trim() !== '') {
        url += `&search=${encodeURIComponent(currentSearchQuery.trim())}`;
      }

      const res = await fetch(url, { credentials: 'include' });
      
      if (res.status === 401) {
        sessionStorage.removeItem('sfcc_auth');
        window.location.href = 'index.html';
        return;
      }

      const json = await res.json();
      loadingState.style.display = 'none';

      if (json.success) {
        renderTable(json.data);
      } else {
        showToast(json.message || 'Failed to load members', 'error');
      }
    } catch (err) {
      loadingState.style.display = 'none';
      console.error('Error connecting to API:', err);
      showToast('Unable to connect to the server.', 'error');
    }
  }

  function renderTable(members) {
    memberTableBody.innerHTML = '';

    if (!members || members.length === 0) {
      emptyState.style.display = 'block';
      return;
    }

    emptyState.style.display = 'none';

    members.forEach((member, index) => {
      const tr = document.createElement('tr');
      const formattedDate = new Date(member.created_at).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });

      const isActive = member.status === 'active';
      const statusBadgeClass = isActive ? 'badge-active' : 'badge-inactive';
      const statusLabel = isActive ? 'Active' : 'Inactive';
      const toggleActionLabel = isActive ? 'Deactivate' : 'Reactivate';
      
      const editIcon = `<svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>`;
      const toggleIcon = isActive 
        ? `<svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>`
        : `<svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;

      tr.innerHTML = `
        <td>${index + 1}</td>
        <td class="member-name">${escapeHtml(member.full_name)}</td>
        <td><span class="status-badge ${statusBadgeClass}">${statusLabel}</span></td>
        <td>${formattedDate}</td>
        <td class="text-right">
          <div class="action-buttons">
            <button class="action-btn edit-btn" onclick="openEditModal(${member.id}, '${escapeHtml(member.full_name)}')">
              ${editIcon}
              <span>Edit</span>
            </button>
            <button class="action-btn toggle-btn" onclick="promptToggleStatus(${member.id}, '${escapeHtml(member.full_name)}', '${member.status}')">
              ${toggleIcon}
              <span>${toggleActionLabel}</span>
            </button>
          </div>
        </td>
      `;
      memberTableBody.appendChild(tr);
    });
  }

  let searchTimeout;
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      currentSearchQuery = e.target.value;
      searchTimeout = setTimeout(() => {
        fetchMembers();
      }, 300);
    });
  }

  filterTabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      filterTabs.forEach(t => t.classList.remove('active'));
      e.target.classList.add('active');
      currentStatusFilter = e.target.getAttribute('data-status');
      fetchMembers();
    });
  });

  if (openAddModalBtn) {
    openAddModalBtn.addEventListener('click', () => {
      modalTitle.textContent = 'Add New Altar Server';
      editMemberId.value = '';
      memberNameInput.value = '';
      modalError.style.display = 'none';
      memberModal.style.display = 'flex';
      memberNameInput.focus();
    });
  }

  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
      memberModal.style.display = 'none';
    });
  }

  window.openEditModal = (id, fullName) => {
    modalTitle.textContent = 'Edit Altar Server';
    editMemberId.value = id;
    memberNameInput.value = fullName;
    modalError.style.display = 'none';
    memberModal.style.display = 'flex';
    memberNameInput.focus();
  };

  if (memberForm) {
    memberForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = editMemberId.value;
      const fullName = memberNameInput.value.trim();

      if (!fullName) return;

      const isEdit = Boolean(id);
      const endpoint = isEdit ? `${API_BASE}/members/${id}` : `${API_BASE}/members`;
      const method = isEdit ? 'PUT' : 'POST';

      try {
        const res = await fetch(endpoint, {
          method: method,
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ full_name: fullName })
        });

        if (res.status === 401) {
          sessionStorage.removeItem('sfcc_auth');
          window.location.href = 'index.html';
          return;
        }

        const json = await res.json();

        if (res.ok && json.success) {
          memberModal.style.display = 'none';
          showToast(json.message || 'Saved successfully', 'success');
          fetchMembers();
          fetchStatistics();
        } else {
          modalError.style.display = 'block';
          modalError.textContent = json.message || 'An error occurred.';
        }
      } catch (err) {
        console.error('Submit error:', err);
        modalError.style.display = 'block';
        modalError.textContent = 'Unable to complete request.';
      }
    });
  }

  window.promptToggleStatus = (id, fullName, currentStatus) => {
    const isActivating = currentStatus === 'inactive';
    const actionText = isActivating ? 'Reactivate' : 'Deactivate';
    
    confirmTitle.textContent = `${actionText} Altar Server?`;
    confirmMessage.textContent = isActivating 
      ? `Reactivate ${fullName}?` 
      : `Deactivate ${fullName}? Previous attendance records will be preserved.`;
    proceedConfirmBtn.className = isActivating ? 'btn btn-primary' : 'btn btn-danger';

    confirmActionCallback = async () => {
      const newStatus = isActivating ? 'active' : 'inactive';
      try {
        const res = await fetch(`${API_BASE}/members/${id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ status: newStatus })
        });
        
        if (res.status === 401) {
          sessionStorage.removeItem('sfcc_auth');
          window.location.href = 'index.html';
          return;
        }

        const json = await res.json();
        if (res.ok && json.success) {
          showToast(json.message, 'success');
          fetchMembers();
          fetchStatistics();
        } else {
          showToast(json.message || 'Failed to update status', 'error');
        }
      } catch (err) {
        console.error('Status toggle error:', err);
        showToast('Unable to complete the request.', 'error');
      }
      confirmModal.style.display = 'none';
    };

    confirmModal.style.display = 'flex';
  };

  if (proceedConfirmBtn) {
    proceedConfirmBtn.addEventListener('click', () => {
      if (confirmActionCallback) confirmActionCallback();
    });
  }

  if (cancelConfirmBtn) {
    cancelConfirmBtn.addEventListener('click', () => {
      confirmModal.style.display = 'none';
    });
  }

  function showToast(message, type = 'success') {
    if (!toast) return;
    toast.textContent = message;
    toast.className = `toast toast-${type}`;
    toast.style.display = 'block';
    setTimeout(() => { toast.style.display = 'none'; }, 4000);
  }

  function escapeHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }
});